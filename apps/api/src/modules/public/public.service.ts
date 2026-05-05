import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, CommentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginationQueryDto } from '../../common/dto/pagination.dto';

// V1.19:列表加 _count.comments(只算 APPROVED),前端展示评论数
const publicArticleSelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  cover: true,
  publishedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
  _count: { select: { comments: { where: { status: CommentStatus.APPROVED } } } },
} satisfies Prisma.ArticleSelect;

const publicArticleDetailSelect = {
  ...publicArticleSelect,
  content: true,
  author: { select: { id: true, username: true } },
} satisfies Prisma.ArticleSelect;

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async listArticles(
    query: PaginationQueryDto,
    where: Prisma.ArticleWhereInput = {},
  ) {
    const { page, pageSize } = query;
    const finalWhere: Prisma.ArticleWhereInput = {
      ...where,
      status: ArticleStatus.PUBLISHED,
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.article.count({ where: finalWhere }),
      this.prisma.article.findMany({
        where: finalWhere,
        select: publicArticleSelect,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async findArticleBySlug(slug: string) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: ArticleStatus.PUBLISHED },
      select: publicArticleDetailSelect,
    });
    if (!article) throw new NotFoundException('文章不存在或未发布');
    return article;
  }

  async listByCategory(slug: string, query: PaginationQueryDto) {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) throw new NotFoundException('分类不存在');
    return this.listArticles(query, { categoryId: category.id });
  }

  async listByTag(slug: string, query: PaginationQueryDto) {
    const tag = await this.prisma.tag.findUnique({ where: { slug } });
    if (!tag) throw new NotFoundException('标签不存在');
    return this.listArticles(query, { tags: { some: { tagId: tag.id } } });
  }

  /**
   * 全文搜索(简版):title/summary/content ILIKE %q%。
   * - 按命中位置近似排序:title contains > summary contains > content contains
   * - 实现走 OR + Prisma orderBy 不够,用 raw $queryRaw 拿 score
   * - 文章数 < 1000 时 ILIKE 性能完全够,无需 pg_jieba 中文分词
   * - 上限 20 条,避免 q='a' 拉爆
   */
  async search(rawQ: string) {
    const q = rawQ.trim();
    if (q.length < 1) return { data: [], q };
    if (q.length > 80) return { data: [], q };
    const pattern = `%${q}%`;
    // raw 查询:title score = 3,summary = 2,content = 1。最高分排前面
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        slug: string;
        summary: string | null;
        cover: string | null;
        publishedAt: Date | null;
        score: number;
      }>
    >`
      SELECT id, title, slug, summary, cover, "publishedAt",
        (CASE WHEN title    ILIKE ${pattern} THEN 3 ELSE 0 END
       + CASE WHEN summary  ILIKE ${pattern} THEN 2 ELSE 0 END
       + CASE WHEN content  ILIKE ${pattern} THEN 1 ELSE 0 END) AS score
      FROM articles
      WHERE status = 'PUBLISHED'
        AND (title ILIKE ${pattern} OR summary ILIKE ${pattern} OR content ILIKE ${pattern})
      ORDER BY score DESC, "publishedAt" DESC NULLS LAST
      LIMIT 20
    `;
    return { data: rows, q };
  }
}
