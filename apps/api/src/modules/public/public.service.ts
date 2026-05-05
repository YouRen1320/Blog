import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginationQueryDto } from '../../common/dto/pagination.dto';

const publicArticleSelect = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  cover: true,
  publishedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
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
}
