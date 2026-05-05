import { Injectable, NotFoundException } from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';
import { makeSlug } from '../../common/utils/slug';
import { EmbeddingService } from '../embedding/embedding.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleQueryDto } from './dto/article-query.dto';

/**
 * 文章包含的关联字段在多个查询里要复用,统一定义。
 * 用 satisfies 让 TS 既知道这是 ArticleInclude,又能记下精确的字段集合,
 * 后续 service 方法返回类型会自动推导出关联字段。
 */
const articleInclude = {
  author: { select: { id: true, username: true, email: true } },
  category: { select: { id: true, name: true, slug: true } },
  tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
} satisfies Prisma.ArticleInclude;

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
  ) {}

  async listAdmin(query: ArticleQueryDto) {
    const { page, pageSize, status, source } = query;
    const where: Prisma.ArticleWhereInput = {
      ...(status ? { status } : {}),
      ...(source ? { source } : {}),
    };
    const [total, data] = await this.prisma.$transaction([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        include: articleInclude,
        orderBy: [{ updatedAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async findById(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: articleInclude,
    });
    if (!article) throw new NotFoundException('文章不存在');
    return article;
  }

  async create(authorId: string, dto: CreateArticleDto) {
    const slug = dto.slug ?? makeSlug(dto.title);
    return this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        summary: dto.summary,
        content: dto.content,
        cover: dto.cover,
        authorId,
        categoryId: dto.categoryId,
        tags: dto.tagIds?.length
          ? { create: dto.tagIds.map((tagId) => ({ tagId })) }
          : undefined,
      },
      include: articleInclude,
    });
  }

  async update(id: string, dto: UpdateArticleDto) {
    await this.findById(id);
    return this.prisma.$transaction(async (tx) => {
      // tagIds 出现在 dto 里说明要全量替换;不出现就保留原状
      if (dto.tagIds !== undefined) {
        await tx.articleTag.deleteMany({ where: { articleId: id } });
        if (dto.tagIds.length > 0) {
          await tx.articleTag.createMany({
            data: dto.tagIds.map((tagId) => ({ articleId: id, tagId })),
          });
        }
      }
      return tx.article.update({
        where: { id },
        data: {
          title: dto.title,
          slug: dto.slug,
          summary: dto.summary,
          content: dto.content,
          cover: dto.cover,
          categoryId: dto.categoryId,
        },
        include: articleInclude,
      });
    });
  }

  async remove(id: string) {
    await this.findById(id);
    // article_tags 通过 schema 上的 Cascade 自动清掉
    return this.prisma.article.delete({ where: { id } });
  }

  async publish(id: string) {
    const article = await this.findById(id);
    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        status: ArticleStatus.PUBLISHED,
        // 第一次发布时打时间戳;再次发布(归档→重发)保持原时间
        publishedAt: article.publishedAt ?? new Date(),
      },
      include: articleInclude,
    });
    // 发布后异步算 embedding,不让 RAG 索引拖慢用户的 publish 响应
    void this.embedding.embedArticle(id);
    return updated;
  }

  async unpublish(id: string) {
    await this.findById(id);
    return this.prisma.article.update({
      where: { id },
      data: { status: ArticleStatus.DRAFT, publishedAt: null },
      include: articleInclude,
    });
  }
}
