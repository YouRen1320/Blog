import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'email 格式不正确' })
  email!: string;

  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  password!: string;
}
