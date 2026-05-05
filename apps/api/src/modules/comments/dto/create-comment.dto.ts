import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * 公开评论提交 DTO。authorEmail 必填但永不在响应中返回(只用于通知 + 反垃圾)。
 * parentId 预留,前端目前不使用嵌套。
 */
export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40, { message: '昵称不超过 40 字' })
  authorName!: string;

  @IsEmail({}, { message: 'email 格式不正确' })
  authorEmail!: string;

  @IsString()
  @MinLength(1, { message: '评论不能为空' })
  @MaxLength(1000, { message: '评论不超过 1000 字' })
  content!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
