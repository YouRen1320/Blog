import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PublicService } from './public.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * PublicService 关键约束:
 * - listArticles 永远把 status: PUBLISHED 加到 where 里
 * - findArticleBySlug 找不到或非 PUBLISHED 抛 404
 */
describe('PublicService', () => {
  let service: PublicService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      article: { count: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
      category: { findUnique: jest.fn() },
      tag: { findUnique: jest.fn() },
      $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [PublicService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = moduleRef.get(PublicService);
  });

  it('listArticles 强制注入 status=PUBLISHED', async () => {
    prismaMock.article.count.mockResolvedValue(0);
    prismaMock.article.findMany.mockResolvedValue([]);
    await service.listArticles({ page: 1, pageSize: 20 }, { categoryId: 'c1' });

    const findArgs = prismaMock.article.findMany.mock.calls[0][0];
    expect(findArgs.where).toMatchObject({ status: 'PUBLISHED', categoryId: 'c1' });
  });

  it('findArticleBySlug 草稿返回 404', async () => {
    prismaMock.article.findFirst.mockResolvedValue(null);
    await expect(service.findArticleBySlug('any-slug')).rejects.toThrow(NotFoundException);
    // 验证 findFirst 的 where 包含 status: PUBLISHED
    expect(prismaMock.article.findFirst.mock.calls[0][0].where).toMatchObject({ status: 'PUBLISHED' });
  });

  it('listByCategory 不存在的 slug 抛 404', async () => {
    prismaMock.category.findUnique.mockResolvedValue(null);
    await expect(service.listByCategory('not-found', { page: 1, pageSize: 20 })).rejects.toThrow(NotFoundException);
  });
});
