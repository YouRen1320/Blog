import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CommentStatus } from '@prisma/client';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  UpdateCommentStatusDto,
  CommentListQueryDto,
} from './dto/update-comment-status.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

/**
 * 公开端 —— 列出已审核评论 + 提交新评论。
 * 提交走 strict 限流(5/min),防止刷评论。
 */
@Controller('articles/:slug/comments')
export class PublicCommentsController {
  constructor(private readonly service: CommentsService) {}

  @Public()
  @Get()
  list(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    return this.service.listPublicByArticleSlug(slug, query);
  }

  @Public()
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(
    @Param('slug') slug: string,
    @Body() dto: CreateCommentDto,
    @Req() req: Request,
  ) {
    // 取客户端真实 IP:Caddy 反代会写 X-Forwarded-For,Express 已开 trust proxy
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? null;
    return this.service.createPublic(slug, dto, ip);
  }
}

/**
 * 管理员 —— 列表(支持按 status 过滤)、改 status、删除。
 */
@Controller('admin/comments')
@Roles('ADMIN')
export class AdminCommentsController {
  constructor(
    private readonly service: CommentsService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  list(@Query() query: CommentListQueryDto) {
    return this.service.listAdmin(query);
  }

  /**
   * 评论 AI 辅助审核 —— 给当前评论拿一个 0-10 分 + 建议 + 一句理由。
   * 不自动 approve/reject,只给参考意见,ADMIN 看完自己决定。
   * ai 档限流 10/min(调一次 LLM call,跟正文生成共享 quota)。
   */
  @Post(':id/ai-review')
  aiReview(@Param('id') id: string) {
    return this.service.aiReview(id, this.config);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateCommentStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
