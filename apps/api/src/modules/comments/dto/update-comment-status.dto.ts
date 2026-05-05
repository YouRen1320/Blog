import { IsEnum, IsOptional } from 'class-validator';
import { CommentStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class UpdateCommentStatusDto {
  @IsEnum(CommentStatus, { message: 'status 必须是 PENDING / APPROVED / REJECTED' })
  status!: CommentStatus;
}

/**
 * admin 列表查询:扩展 PaginationQueryDto 加 status 过滤。
 * 必须用 class extends 而不是 type intersection,
 * 否则 NestJS reflect 拿不到 metadata,@Type(() => Number) 不会执行,
 * page/pageSize 仍然是字符串/undefined → Prisma 报 skip missing。
 */
export class CommentListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(CommentStatus, { message: 'status 必须是 PENDING / APPROVED / REJECTED' })
  status?: CommentStatus;
}
