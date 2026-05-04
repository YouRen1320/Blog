import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Controller 方法参数装饰器,直接拿到 JWT 解析出来的用户信息。
 * 用法:findMe(@CurrentUser() user: AuthUser)
 *
 * AuthUser 的形状由 JwtStrategy.validate() 决定。
 */
export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const req = ctx.switchToHttp().getRequest();
  return req.user;
});
