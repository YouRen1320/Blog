import { Test } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
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
  let prismaMock: {
    user: { findUnique: jest.Mock; update: jest.Mock };
  };
  let jwtMock: { signAsync: jest.Mock };

  beforeEach(async () => {
    prismaMock = { user: { findUnique: jest.fn(), update: jest.fn() } };
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
    expect(res.user).toMatchObject({
      id: 'u1',
      email: 'a@b.com',
      role: 'ADMIN',
    });
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
    await expect(service.login('a@b.com', 'wrong-pwd')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('不存在的邮箱 → 抛同一个错误,不暴露存在性', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(service.login('nobody@b.com', 'whatever')).rejects.toThrow(
      '邮箱或密码错误',
    );
  });

  describe('changePassword', () => {
    it('当前密码对 → 新 hash 写入,返回 ok=true', async () => {
      const passwordHash = await bcrypt.hash('old-pwd-1234', 10);
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash });
      prismaMock.user.update.mockResolvedValue({ id: 'u1' });

      const res = await service.changePassword(
        'u1',
        'old-pwd-1234',
        'new-pwd-5678',
      );

      expect(res).toEqual({ ok: true });
      const updateCall = prismaMock.user.update.mock.calls[0][0] as {
        where: { id: string };
        data: { passwordHash: string };
      };
      expect(updateCall.where).toEqual({ id: 'u1' });
      // 写入的不是明文,且能被 bcrypt.compare 反验
      expect(updateCall.data.passwordHash).not.toBe('new-pwd-5678');
      expect(
        await bcrypt.compare('new-pwd-5678', updateCall.data.passwordHash),
      ).toBe(true);
    });

    it('当前密码错 → 401 + 不写库', async () => {
      const passwordHash = await bcrypt.hash('old-pwd-1234', 10);
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash });

      await expect(
        service.changePassword('u1', 'wrong-pwd-xx', 'new-pwd-5678'),
      ).rejects.toThrow(UnauthorizedException);
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('新旧密码相同 → 400,不查库不写库', async () => {
      await expect(
        service.changePassword('u1', 'same-pwd-1234', 'same-pwd-1234'),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });
});
