import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(6, { message: '当前密码至少 6 位' })
  currentPassword!: string;

  @IsString()
  @MinLength(8, { message: '新密码至少 8 位' })
  newPassword!: string;
}
