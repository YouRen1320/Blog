import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArticleStatus, CommentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentListQueryDto } from './dto/update-comment-status.dto';

/**
 * 评论 service。
 *
 * - 公开端只能 CREATE 和 LIST APPROVED;
 *   ipAddress / authorEmail 永远不在公开响应中返回
 * - admin 端可以列出所有状态、改 status、删除
 *
 * 反垃圾策略(当前最简):
 * - 后端 strict 限流(在 controller 上 @Throttle 标)
 * - DTO 长度校验 1-1000 字
 * - 默认 PENDING,人工审核
 * 后续若垃圾增多再加 keyword 黑名单 / 蜜罐字段 / captcha。
 */

const publicCommentSelect = {
  id: true,
  parentId: true,
  authorName: true,
  content: true,
  createdAt: true,
} satisfies Prisma.CommentSelect;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 公开端按 article slug 取已审核评论(平铺,前端自己组装嵌套)。
   * 文章不存在或未发布 → 404。
   */
  async listPublicByArticleSlug(slug: string, query: PaginationQueryDto) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: ArticleStatus.PUBLISHED },
      select: { id: true },
    });
    if (!article) throw new NotFoundException('文章不存在或未发布');

    const { page, pageSize } = query;
    const where: Prisma.CommentWhereInput = {
      articleId: article.id,
      status: CommentStatus.APPROVED,
    };
    // 同 listAdmin,避开 $transaction batch + self-relation 的 Prisma 6.19 bug
    const total = await this.prisma.comment.count({ where });
    const data = await this.prisma.comment.findMany({
      where,
      select: publicCommentSelect,
      orderBy: { createdAt: 'asc' }, // 旧 → 新,符合时间叙事
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return paginate(data, total, page, pageSize);
  }

  /**
   * 公开端创建评论。落库为 PENDING,等管理员审核。
   * parentId 必须属于同一篇文章 + 已 APPROVED,否则拒绝(防伪造嵌套)。
   */
  async createPublic(
    slug: string,
    dto: CreateCommentDto,
    ipAddress: string | null,
  ) {
    const article = await this.prisma.article.findFirst({
      where: { slug, status: ArticleStatus.PUBLISHED },
      select: { id: true },
    });
    if (!article) throw new NotFoundException('文章不存在或未发布');

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { articleId: true, status: true },
      });
      if (
        !parent ||
        parent.articleId !== article.id ||
        parent.status !== CommentStatus.APPROVED
      ) {
        throw new BadRequestException('parentId 无效');
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        articleId: article.id,
        parentId: dto.parentId ?? null,
        authorName: dto.authorName,
        authorEmail: dto.authorEmail,
        content: dto.content,
        ipAddress,
      },
      select: publicCommentSelect,
    });
    // 公开端不告诉用户 PENDING 状态,直接返回评论本体 + status hint
    return {
      ...comment,
      pending: true,
      message: '评论已提交,审核通过后将公开显示。',
    };
  }

  // ─── admin 端 ───────────────────────────────

  /**
   * 评论 AI 辅助审核 —— 调 ai-service /moderate 拿 score + recommend + reason。
   * 不自动改 status,前端拿到结果后由 ADMIN 手动决定。
   */
  async aiReview(
    commentId: string,
    config: ConfigService,
  ): Promise<{
    score: number;
    recommend: 'approve' | 'review' | 'reject';
    reason: string;
  }> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { article: { select: { title: true } } },
    });
    if (!comment) throw new NotFoundException('评论不存在');

    const baseUrl =
      config.get<string>('AI_SERVICE_BASE_URL') ?? 'http://127.0.0.1:8001';
    const res = await fetch(`${baseUrl}/moderate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: comment.content,
        author_name: comment.authorName,
        article_title: comment.article.title,
      }),
    });
    if (!res.ok) {
      throw new ServiceUnavailableException(`AI 评估失败:${res.status}`);
    }
    return (await res.json()) as {
      score: number;
      recommend: 'approve' | 'review' | 'reject';
      reason: string;
    };
  }

  async listAdmin(query: CommentListQueryDto) {
    const { page, pageSize, status } = query;
    const where: Prisma.CommentWhereInput = status ? { status } : {};
    // 不用 $transaction([count, findMany]) 的 batch 模式 ——
    // Prisma 6.19 在含 self-relation(Comment.parent) 的 model 上跑这个 batch 时,
    // 偶发把 findMany 的 skip 参数误判到 count 的 schema 上,报
    // "Argument `skip` is missing" 假错误。改成顺序两次 await 避开
    const total = await this.prisma.comment.count({ where });
    const data = await this.prisma.comment.findMany({
      where,
      include: {
        article: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' }, // 新 → 旧,审核优先级
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return paginate(data, total, page, pageSize);
  }

  async updateStatus(id: string, status: CommentStatus) {
    const exists = await this.prisma.comment.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('评论不存在');
    return this.prisma.comment.update({ where: { id }, data: { status } });
  }

  async remove(id: string) {
    const exists = await this.prisma.comment.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('评论不存在');
    // 子回复通过 onDelete: Cascade 自动删
    await this.prisma.comment.delete({ where: { id } });
  }
}
