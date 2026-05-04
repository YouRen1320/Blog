import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * AuthService 是 V1 里最敏感的一块。重点测:
 * - 能用对的密码登录
 * - 错密码 / 不存在的邮箱都抛同一个 UnauthorizedException(无侧信道)
 *
 * Prisma 用最简单的对象 mock,只提供本测试用到的方法。
 */
describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: { user: { findUnique: jest.Mock } };
  let jwtMock: { signAsync: jest.Mock };

  beforeEach(async () => {
    prismaMock = { user: { findUnique: jest.fn() } };
    jwtMock = { signAsync: jest.fn().mockResolvedValue('signed-token') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('对的密码 → 返回 token + user', async () => {
    const passwordHash = await bcrypt.hash('correct-pwd', 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      username: 'admin',
      email: 'a@b.com',
      passwordHash,
      role: 'ADMIN',
    });

    const res = await service.login('a@b.com', 'correct-pwd');

    expect(res.accessToken).toBe('signed-token');
    expect(res.user).toMatchObject({ id: 'u1', email: 'a@b.com', role: 'ADMIN' });
    expect(jwtMock.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: 'u1', email: 'a@b.com', role: 'ADMIN' }),
    );
  });

  it('错的密码 → 401 通用错误', async () => {
    const passwordHash = await bcrypt.hash('correct-pwd', 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      username: 'admin',
      email: 'a@b.com',
      passwordHash,
      role: 'ADMIN',
    });
    await expect(service.login('a@b.com', 'wrong-pwd')).rejects.toThrow(UnauthorizedException);
  });

  it('不存在的邮箱 → 抛同一个错误,不暴露存在性', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(service.login('nobody@b.com', 'whatever')).rejects.toThrow('邮箱或密码错误');
  });
});
