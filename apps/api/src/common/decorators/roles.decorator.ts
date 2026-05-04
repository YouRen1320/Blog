import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

/**
 * 标记某接口需要哪些角色才能访问。
 * 与 RolesGuard 配合使用,例如:@Roles('ADMIN')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
