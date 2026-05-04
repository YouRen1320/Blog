import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArticleStatus } from '@prisma/client';
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
   * 调用 Python ai-service 生成草稿,然后写入 articles 表。
   * 整个过程在一个事务里:LLM 返回的标签 / 分类如不存在时自动创建,
   * 避免半生不熟的状态(文章建了但标签关联失败)。
   */
  async createDraft(authorId: string, dto: CreateAiDraftDto) {
    const draft = await this.callAiService(dto);

    return this.prisma.$transaction(async (tx) => {
      // 1. 处理分类(可选)
      let categoryId: string | undefined;
      if (draft.category_slug) {
        const cat = await tx.category.findUnique({ where: { slug: draft.category_slug } });
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

      // 4. 落库
      return tx.article.create({
        data: {
          title: draft.title,
          slug,
          summary: draft.summary,
          content: draft.content,
          status: ArticleStatus.DRAFT,
          authorId,
          categoryId,
          tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
        },
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      });
    });
  }

  /**
   * HTTP 调 Python 服务。出错时抛 503,前端会得到清晰的错误。
   * 用 Node 18+ 自带 fetch,不依赖 axios / @nestjs/axios。
   */
  private async callAiService(dto: CreateAiDraftDto): Promise<AiServiceDraft> {
    const baseUrl = this.config.get<string>('AI_SERVICE_BASE_URL') ?? 'http://127.0.0.1:8001';
    this.logger.log(`calling ai-service ${baseUrl}/generate/article (prompt=${dto.prompt.slice(0, 40)}…)`);
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/generate/article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: dto.prompt,
          tone: dto.tone ?? 'technical',
          length: dto.length ?? 'medium',
        }),
      });
    } catch (err) {
      this.logger.error('ai-service unreachable', err as Error);
      throw new ServiceUnavailableException('AI 服务不可用,请稍后再试');
    }
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`ai-service ${res.status}: ${body.slice(0, 200)}`);
      throw new ServiceUnavailableException(`AI 服务返回 ${res.status}`);
    }
    return (await res.json()) as AiServiceDraft;
  }
}
