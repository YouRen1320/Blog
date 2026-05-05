import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string; // user id
  email: string;
  role: 'ADMIN' | 'USER';
}

/**
 * JWT 校验策略。
 *
 * - 从 Authorization: Bearer <token> 头部提取 token
 * - 用 JWT_SECRET 验签
 * - 验签通过后再去数据库 reload 一次用户,避免 token 还在但用户已被删/降权时仍然放行
 *
 * validate() 的返回值会被 Passport 挂到 request.user 上,
 * 进而被 @CurrentUser() 装饰器读到。
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在或已被删除');
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
