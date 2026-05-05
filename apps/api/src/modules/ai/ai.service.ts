import type { Response as ExpressResponse } from 'express';
import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArticleSource, ArticleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { makeSlug } from '../../common/utils/slug';
import { CreateAiDraftDto } from './dto/create-draft.dto';

/** Python ai-service /generate/article 的响应。 */
interface AiServiceDraft {
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags: string[];
  category_slug: string | null;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 把 ai-service 返回的结构化草稿落库。
   * 抽离出来,流式 / 非流式两条路径都能复用。
   */
  private async persistDraft(authorId: string, draft: AiServiceDraft) {
    return this.prisma.$transaction(async (tx) => {
      // 1. 处理分类(可选)
      let categoryId: string | undefined;
      if (draft.category_slug) {
        const cat = await tx.category.findUnique({
          where: { slug: draft.category_slug },
        });
        if (cat) categoryId = cat.id;
        // 找不到就 silent skip:分类需要后台管理员把控,LLM 不能凭空建
      }

      // 2. 处理标签:按 slug 查,不存在则创建
      const tagIds: string[] = [];
      for (const name of draft.tags) {
        const slug = makeSlug(name) || name;
        const tag = await tx.tag.upsert({
          where: { slug },
          update: {},
          create: { name, slug },
        });
        tagIds.push(tag.id);
      }

      // 3. 解决 slug 冲突:如已存在,加时间戳后缀
      let slug = draft.slug;
      const exists = await tx.article.findUnique({ where: { slug } });
      if (exists) slug = `${slug}-${Date.now().toString(36)}`;

      // 4. 落库,标记 source=AI
      return tx.article.create({
        data: {
          title: draft.title,
          slug,
          summary: draft.summary,
          content: draft.content,
          status: ArticleStatus.DRAFT,
          source: ArticleSource.AI,
          authorId,
          categoryId,
          tags: tagIds.length
            ? { create: tagIds.map((tagId) => ({ tagId })) }
            : undefined,
        },
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      });
    });
  }

  /**
   * 非流式入口:同步调 ai-service,拿到完整草稿后落库。
   */
  async createDraft(authorId: string, dto: CreateAiDraftDto) {
    const draft = await this.callAiService(dto);
    return this.persistDraft(authorId, draft);
  }

  /**
   * 流式入口:把 ai-service SSE 边转发给前端,边在内存累积 draft event,
   * stream 结束后落库,最后再发一个 `event: saved` 带 articleId 的事件。
   */
  async streamDraft(authorId: string, dto: CreateAiDraftDto, res: ExpressResponse) {
    const baseUrl =
      this.config.get<string>('AI_SERVICE_BASE_URL') ?? 'http://127.0.0.1:8001';
    this.logger.log(
      `streaming ai-service ${baseUrl}/generate/article/stream (prompt=${dto.prompt.slice(0, 40)}…)`,
    );

    // SSE 通用响应头
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const sendSse = (event: string, data: unknown) => {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      res.write(`event: ${event}\ndata: ${payload}\n\n`);
    };

    try {
      const upstreamRes = await fetch(`${baseUrl}/generate/article/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: dto.prompt,
          tone: dto.tone ?? 'technical',
          length: dto.length ?? 'medium',
        }),
      });
      if (!upstreamRes.ok || !upstreamRes.body) {
        sendSse('error', {
          message: `ai-service /stream returned ${upstreamRes.status}`,
        });
        res.end();
        return;
      }

      // 边读上游 SSE,边按 \n\n 切事件,识别 draft 事件留作落库
      const reader = upstreamRes.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let parsedDraft: AiServiceDraft | undefined;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        buffer += text;
        // 直接把原始字节透传给前端,不做 reformat
        res.write(text);

        // 同步在 buffer 里找完整事件(\n\n 分隔)
        let idx: number;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const eventBlock = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          // 识别 event: draft + data: {...} 格式
          const lines = eventBlock.split('\n');
          let eventName = '';
          let eventData = '';
          for (const line of lines) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            else if (line.startsWith('data:'))
              eventData += line.slice(5).trim();
          }
          if (eventName === 'draft' && eventData) {
            try {
              parsedDraft = JSON.parse(eventData) as AiServiceDraft;
            } catch (e) {
              this.logger.warn(
                `failed to parse draft event: ${(e as Error).message}`,
              );
            }
          }
        }
      }

      if (parsedDraft) {
        try {
          const article = await this.persistDraft(authorId, parsedDraft);
          sendSse('saved', { articleId: article.id });
        } catch (e) {
          this.logger.error('persist draft failed', e as Error);
          sendSse('error', { message: `落库失败: ${(e as Error).message}` });
        }
      }
    } catch (err) {
      const e = err as Error;
      this.logger.error('streamDraft failed', e);
      sendSse('error', { message: `ai-service 流式失败: ${e.message}` });
    } finally {
      res.end();
    }
  }

  /**
   * 语音 → 文字。透传给 ai-service /transcribe(multipart/form-data)。
   * Node 18+ FormData / Blob 都是 globals,直接用。
   */
  async transcribe(file: Express.Multer.File): Promise<{ text: string }> {
    if (!file) throw new BadRequestException('未收到文件,字段名应为 file');
    const baseUrl =
      this.config.get<string>('AI_SERVICE_BASE_URL') ?? 'http://127.0.0.1:8001';
    const form = new FormData();
    // Node 22 的 Blob 接受 Uint8Array,Buffer 是 Uint8Array 子类型但 lib.dom 类型不兼容
    form.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
      file.originalname || 'audio.m4a',
    );
    const res = await fetch(`${baseUrl}/transcribe/`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.warn(`/transcribe upstream ${res.status}: ${body.slice(0, 200)}`);
      throw new ServiceUnavailableException(
        res.status === 503 ? '语音转写未配置(WHISPER_API_KEY)' : 'AI 转写失败',
      );
    }
    return (await res.json()) as { text: string };
  }

  /**
   * 编辑器内联 AI 流式透传:不落库,只把 ai-service 的 SSE 字节 pipe 给前端。
   * 前端自己决定怎么把流式文本塞到 textarea(替换选区 / 追加光标 / 写到 title 字段)。
   */
  async streamInline(body: unknown, res: ExpressResponse) {
    const baseUrl =
      this.config.get<string>('AI_SERVICE_BASE_URL') ?? 'http://127.0.0.1:8001';

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    try {
      const upstream = await fetch(`${baseUrl}/generate/inline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!upstream.ok || !upstream.body) {
        res.write(
          `event: error\ndata: ${JSON.stringify({
            message: `ai-service /inline returned ${upstream.status}`,
          })}\n\n`,
        );
        res.end();
        return;
      }
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder('utf-8');
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      const e = err as Error;
      this.logger.error('streamInline failed', e);
      res.write(
        `event: error\ndata: ${JSON.stringify({ message: `ai-service 不可用: ${e.message}` })}\n\n`,
      );
    } finally {
      res.end();
    }
  }

  /**
   * HTTP 调 Python 服务。
   * - 用 Node 18+ 自带 fetch + AbortController 防止 LLM 慢导致请求挂死
   * - 90s 上限(LLM 长内容生成 30-60s 常见,留余量)
   * - 出错时抛 503,前端拿到清晰 message
   */
  private async callAiService(dto: CreateAiDraftDto): Promise<AiServiceDraft> {
    const baseUrl =
      this.config.get<string>('AI_SERVICE_BASE_URL') ?? 'http://127.0.0.1:8001';
    this.logger.log(
      `calling ai-service ${baseUrl}/generate/article (prompt=${dto.prompt.slice(0, 40)}…)`,
    );

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/generate/article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: dto.prompt,
          tone: dto.tone ?? 'technical',
          length: dto.length ?? 'medium',
        }),
      });
    } catch (err) {
      const e = err as Error;
      if (e.name === 'AbortError') {
        this.logger.error('ai-service timeout after 90s');
        throw new ServiceUnavailableException('AI 生成超时(>90s),请稍后再试');
      }
      this.logger.error('ai-service unreachable', e);
      throw new ServiceUnavailableException('AI 服务不可用,请稍后再试');
    } finally {
      clearTimeout(timer);
    }
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`ai-service ${res.status}: ${body.slice(0, 200)}`);
      throw new ServiceUnavailableException(`AI 服务返回 ${res.status}`);
    }
    return (await res.json()) as AiServiceDraft;
  }
}
