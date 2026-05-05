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

import { IsArray, IsString, ArrayMaxSize, ArrayMinSize } from 'class-validator';

/**
 * 批量改 status。一次最多 50 条,防止 admin 误操作把全部 PENDING 一次拒了。
 */
export class BatchUpdateStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50, { message: '一次最多 50 条' })
  @IsString({ each: true })
  ids!: string[];

  @IsEnum(CommentStatus, { message: 'status 必须是 PENDING / APPROVED / REJECTED' })
  status!: CommentStatus;
}
