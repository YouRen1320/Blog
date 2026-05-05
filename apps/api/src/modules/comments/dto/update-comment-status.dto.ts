import { IsEnum } from 'class-validator';
import { CommentStatus } from '@prisma/client';

export class UpdateCommentStatusDto {
  @IsEnum(CommentStatus, { message: 'status 必须是 PENDING / APPROVED / REJECTED' })
  status!: CommentStatus;
}
