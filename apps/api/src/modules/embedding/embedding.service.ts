import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 文章 embedding 服务。
 *
 * 在文章**发布时**调一次:把 title + summary + content 转成 512 维向量,
 * 存到 articles.embedding 字段(pgvector 类型)。
 *
 * 失败不阻塞发布(降级,后台任务可补)。
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** 把 article 的当前内容算出 embedding 并写回 DB。失败时只 warn,不抛。 */
  async embedArticle(articleId: string): Promise<void> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, title: true, summary: true, content: true },
    });
    if (!article) {
      this.logger.warn(`embedArticle: article ${articleId} not found`);
      return;
    }
    // 把所有可读字段拼起来 embed,首选信号是 title,长度截到 8000 防爆
    const text = [article.title, article.summary ?? '', article.content].join('\n\n').slice(0, 8000);

    let vector: number[];
    try {
      vector = await this.callEmbedService(text);
    } catch (e) {
      this.logger.warn(`embedArticle: ai-service failed, leaving embedding NULL: ${(e as Error).message}`);
      return;
    }

    // pgvector 接受 '[0.1,0.2,...]' 字符串,业务层 cast 即可
    const literal = `[${vector.join(',')}]`;
    await this.prisma.$executeRaw`
      UPDATE articles SET embedding = ${literal}::vector(512) WHERE id = ${articleId}
    `;
    this.logger.log(`embedded article ${articleId} (${vector.length} dim, source len=${text.length})`);
  }

  private async callEmbedService(text: string): Promise<number[]> {
    const baseUrl = this.config.get<string>('AI_SERVICE_BASE_URL') ?? 'http://127.0.0.1:8001';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch(`${baseUrl}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        throw new Error(`ai-service /embed returned ${res.status}`);
      }
      const body = (await res.json()) as { vector: number[]; dim: number };
      return body.vector;
    } finally {
      clearTimeout(timer);
    }
  }
}
