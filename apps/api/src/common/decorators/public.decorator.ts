import { SetMetadata } from '@nestjs/common';

/**
 * 给路由打 @Public() 标记,JwtAuthGuard 看到这个标就放行。
 * 用法:登录接口、健康检查、公开文章列表等不需要鉴权的端点。
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
