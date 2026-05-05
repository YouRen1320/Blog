import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      category: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(CategoriesService);
  });

  it('create:无 slug 时自动从 name 生成', async () => {
    prismaMock.category.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'c1', ...data }),
    );
    await service.create({ name: 'Hello World' });
    expect(prismaMock.category.create.mock.calls[0][0].data.slug).toBe(
      'hello-world',
    );
  });

  it('create:显式给的 slug 优先', async () => {
    prismaMock.category.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'c1', ...data }),
    );
    await service.create({ name: 'Anything', slug: 'custom' });
    expect(prismaMock.category.create.mock.calls[0][0].data.slug).toBe(
      'custom',
    );
  });

  it('update:不存在时抛 NotFoundException', async () => {
    prismaMock.category.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { name: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
