import { Injectable } from '@nestjs/common';
import { ArticleStatus, CommentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 后台 dashboard 用的聚合统计。一次性把所有数字算出来,
 * 前端拉 1 次 endpoint 渲染所有卡片(避免 N 个 endpoint 拉浪费往返)。
 *
 * 单查询并发跑(Promise.all),压力比 $transaction batch 小。
 */
@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      articleCount,
      publishedCount,
      draftCount,
      archivedCount,
      commentApproved,
      commentPending,
      commentRejected,
      userCount,
      todayPublished,
      todayCommented,
      // raw SUM(LENGTH(content)) 精确字数,Prisma `aggregate` 不支持 LENGTH
      totalContentLength,
    ] = await Promise.all([
      this.prisma.article.count(),
      this.prisma.article.count({ where: { status: ArticleStatus.PUBLISHED } }),
      this.prisma.article.count({ where: { status: ArticleStatus.DRAFT } }),
      this.prisma.article.count({ where: { status: ArticleStatus.ARCHIVED } }),
      this.prisma.comment.count({ where: { status: CommentStatus.APPROVED } }),
      this.prisma.comment.count({ where: { status: CommentStatus.PENDING } }),
      this.prisma.comment.count({ where: { status: CommentStatus.REJECTED } }),
      this.prisma.user.count(),
      this.prisma.article.count({
        where: {
          status: ArticleStatus.PUBLISHED,
          publishedAt: { gte: todayStart },
        },
      }),
      this.prisma.comment.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COALESCE(SUM(LENGTH(content)), 0)::bigint AS total FROM articles
      `,
    ]);

    return {
      articles: {
        total: articleCount,
        published: publishedCount,
        draft: draftCount,
        archived: archivedCount,
      },
      comments: {
        approved: commentApproved,
        pending: commentPending,
        rejected: commentRejected,
      },
      users: { total: userCount },
      today: {
        published: todayPublished,
        commented: todayCommented,
      },
      content: {
        // SUM(LENGTH) 是字符数(Postgres 默认 utf-8),近似中文字数
        totalChars: Number(totalContentLength[0]?.total ?? 0n),
      },
    };
  }
}
