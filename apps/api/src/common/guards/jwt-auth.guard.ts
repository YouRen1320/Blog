import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * 全局 JWT 守卫:默认所有路由要带有效 token,
 * 除非该路由用 @Public() 标记 / 或属于公开静态资源前缀(/uploads, /healthz)。
 *
 * 静态文件(ServeStaticModule)没有 handler 元数据,reflector 拿不到 IS_PUBLIC_KEY,
 * 所以单独按 path 前缀放行。
 */
const PUBLIC_PATH_PREFIXES = ['/uploads/', '/healthz'];

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 静态资源 / 健康检查直接放行,不走 passport
    const req = context.switchToHttp().getRequest<Request>();
    if (PUBLIC_PATH_PREFIXES.some((p) => req.url.startsWith(p))) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
