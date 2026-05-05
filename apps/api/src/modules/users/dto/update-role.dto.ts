import { IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateRoleDto {
  @IsEnum(UserRole, { message: 'role 必须是 ADMIN / USER' })
  role!: UserRole;
}
