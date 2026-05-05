import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * 公开注册 DTO。
 * - username 限 3-30 字符,只允许字母 / 数字 / 下划线 / 连字符,避免 URL 转义和注入
 * - email 用邮箱格式 + 唯一(service 层 unique 校验)
 * - password 8-72(bcrypt 上限 72 byte)
 *
 * 不暴露 role 字段:public 注册一律 USER,ADMIN 由现有 ADMIN 在后台升级。
 */
export class RegisterDto {
  @IsString()
  @MinLength(3, { message: '用户名至少 3 个字符' })
  @MaxLength(30, { message: '用户名不超过 30 字符' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: '用户名只能包含字母 / 数字 / 下划线 / 连字符' })
  username!: string;

  @IsEmail({}, { message: 'email 格式不正确' })
  email!: string;

  @IsString()
  @MinLength(8, { message: '密码至少 8 位' })
  @MaxLength(72, { message: '密码最长 72 字符(bcrypt 上限)' })
  password!: string;
}
