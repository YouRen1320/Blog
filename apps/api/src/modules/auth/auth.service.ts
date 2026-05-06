import {
  BadRequestException,
  // ConflictException,  // 关掉公开注册后暂未使用,日后恢复 register() 时一并恢复
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * 公开注册(单作者模式下整体关闭) —— 控制器已注释,这里 service 一并注释,
   * 做 defense-in-depth,防止以后有人取消注释 controller 但忘了这块也跟着活。
   * 日后开放注册时同步取消下面的注释即可,逻辑不用重写。
   */
  // async register(username: string, email: string, password: string) {
  //   const exists = await this.prisma.user.findFirst({
  //     where: { OR: [{ email }, { username }] },
  //     select: { email: true, username: true },
  //   });
  //   if (exists) {
  //     throw new ConflictException(
  //       exists.email === email ? '该邮箱已被注册' : '该用户名已被使用',
  //     );
  //   }
  //   const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  //   const user = await this.prisma.user.create({
  //     data: { username, email, passwordHash, role: 'USER' },
  //   });
  //   const accessToken = await this.jwt.signAsync({
  //     sub: user.id,
  //     email: user.email,
  //     role: user.role,
  //   });
  //   return {
  //     accessToken,
  //     user: {
  //       id: user.id,
  //       username: user.username,
  //       email: user.email,
  //       role: user.role,
  //     },
  //   };
  // }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // 故意返回相同错误,避免暴露"邮箱是否存在"这种侧信道
      throw new UnauthorizedException('邮箱或密码错误');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('邮箱或密码错误');
    }
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * 改密码:校验当前密码 → hash 新密码 → 更新 passwordHash。
   * 密码不变(currentPassword == newPassword)直接拒绝,避免无意义写库。
   * 注意:不要换发新 JWT —— 当前 token 仍有效,前端可提示用户重新登录。
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (currentPassword === newPassword) {
      throw new BadRequestException('新密码不能与当前密码相同');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('当前密码不正确');
    }
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { ok: true };
  }
}
