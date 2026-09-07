import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  AdminBootstrapError,
  bootstrapAdmin,
  readAdminBootstrapConfig,
} from './admin-bootstrap';

const validEnv = {
  ADMIN_EMAIL: 'owner@example.test',
  ADMIN_USERNAME: 'owner',
  ADMIN_PASSWORD: 'correct-horse-battery-staple',
};

interface CreateAdminArgs {
  data: {
    email: string;
    username: string;
    passwordHash: string;
    role: UserRole;
  };
}

describe('administrator bootstrap', () => {
  describe('configuration', () => {
    it.each(['ADMIN_EMAIL', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'] as const)(
      'rejects a missing %s before database work starts',
      (name) => {
        const env = { ...validEnv };
        delete env[name];
        expect(() => readAdminBootstrapConfig(env)).toThrow(
          new AdminBootstrapError(`${name} is required`),
        );
      },
    );

    it('rejects weak passwords', () => {
      expect(() =>
        readAdminBootstrapConfig({
          ...validEnv,
          ADMIN_PASSWORD: 'too-short',
        }),
      ).toThrow('at least 12 characters');
    });

    it('rejects passwords beyond the bcrypt UTF-8 byte limit', () => {
      expect(() =>
        readAdminBootstrapConfig({
          ...validEnv,
          ADMIN_PASSWORD: '密'.repeat(25),
        }),
      ).toThrow('72 UTF-8 bytes');
    });

    it('rejects surrounding password whitespace instead of trimming silently', () => {
      expect(() =>
        readAdminBootstrapConfig({
          ...validEnv,
          ADMIN_PASSWORD: ` ${validEnv.ADMIN_PASSWORD}`,
        }),
      ).toThrow('must not start or end with whitespace');
    });
  });

  it('creates an administrator with a bcrypt hash', async () => {
    let createdData: CreateAdminArgs['data'] | undefined;
    const user = {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(({ data }: CreateAdminArgs) => {
        createdData = data;
        return Promise.resolve({ email: data.email, username: data.username });
      }),
    };
    const prisma = { user } as unknown as PrismaClient;
    const config = readAdminBootstrapConfig(validEnv);

    await expect(bootstrapAdmin(prisma, config)).resolves.toEqual({
      status: 'created',
      email: validEnv.ADMIN_EMAIL,
      username: validEnv.ADMIN_USERNAME,
    });

    expect(createdData).toBeDefined();
    expect(createdData!.passwordHash).not.toBe(validEnv.ADMIN_PASSWORD);
    await expect(
      bcrypt.compare(validEnv.ADMIN_PASSWORD, createdData!.passwordHash),
    ).resolves.toBe(true);
    expect(createdData!.role).toBe(UserRole.ADMIN);
  });

  it('leaves an existing administrator and its password unchanged', async () => {
    const user = {
      findFirst: jest.fn().mockResolvedValue({
        email: validEnv.ADMIN_EMAIL,
        username: validEnv.ADMIN_USERNAME,
        role: UserRole.ADMIN,
      }),
      create: jest.fn(),
    };
    const prisma = { user } as unknown as PrismaClient;

    await expect(
      bootstrapAdmin(prisma, readAdminBootstrapConfig(validEnv)),
    ).resolves.toEqual({
      status: 'already-exists',
      email: validEnv.ADMIN_EMAIL,
      username: validEnv.ADMIN_USERNAME,
    });
    expect(user.create).not.toHaveBeenCalled();
  });

  it('refuses to promote a normal user with the requested email', async () => {
    const user = {
      findFirst: jest.fn().mockResolvedValue({
        email: validEnv.ADMIN_EMAIL,
        username: 'reader',
        role: UserRole.USER,
      }),
      create: jest.fn(),
    };
    const prisma = { user } as unknown as PrismaClient;

    await expect(
      bootstrapAdmin(prisma, readAdminBootstrapConfig(validEnv)),
    ).rejects.toThrow('refusing to promote');
    expect(user.create).not.toHaveBeenCalled();
  });

  it('refuses to create a second administrator under a different identity', async () => {
    const user = {
      findFirst: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ email: 'existing-admin@example.test' }),
      create: jest.fn(),
    };
    const prisma = { user } as unknown as PrismaClient;

    await expect(
      bootstrapAdmin(prisma, readAdminBootstrapConfig(validEnv)),
    ).rejects.toThrow('refusing to create another');
    expect(user.create).not.toHaveBeenCalled();
  });
});
