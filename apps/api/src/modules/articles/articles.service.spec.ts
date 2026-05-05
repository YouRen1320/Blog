import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingService } from '../embedding/embedding.service';

/**
 * 重点测发布状态机的"重发不刷时间"逻辑(容易被改坏)和 NotFound 路径。
 * 复杂的 CRUD + 关联表逻辑放 e2e 验证更值。
 */
describe('ArticlesService', () => {
  let service: ArticlesService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      article: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: EmbeddingService, useValue: { embedArticle: jest.fn() } },
      ],
    }).compile();
    service = moduleRef.get(ArticlesService);
  });

  it('publish:首次发布打 publishedAt 时间戳', async () => {
    prismaMock.article.findUnique.mockResolvedValue({
      id: 'a1',
      publishedAt: null,
    });
    prismaMock.article.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'a1', ...data }),
    );

    await service.publish('a1');

    const updateCall = prismaMock.article.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe('PUBLISHED');
    expect(updateCall.data.publishedAt).toBeInstanceOf(Date);
  });

  it('publish:重发(原本就有 publishedAt)→ 保留旧时间戳', async () => {
    const original = new Date('2026-01-01T00:00:00Z');
    prismaMock.article.findUnique.mockResolvedValue({
      id: 'a1',
      publishedAt: original,
    });
    prismaMock.article.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: 'a1', ...data }),
    );

    await service.publish('a1');

    expect(prismaMock.article.update.mock.calls[0][0].data.publishedAt).toBe(
      original,
    );
  });

  it('unpublish:清掉 publishedAt 并改回 DRAFT', async () => {
    prismaMock.article.findUnique.mockResolvedValue({
      id: 'a1',
      publishedAt: new Date(),
    });
    prismaMock.article.update.mockImplementation(({ data }: any) =>
      Promise.resolve(data),
    );

    await service.unpublish('a1');

    const data = prismaMock.article.update.mock.calls[0][0].data;
    expect(data.status).toBe('DRAFT');
    expect(data.publishedAt).toBeNull();
  });

  it('findById:不存在时抛 NotFoundException', async () => {
    prismaMock.article.findUnique.mockResolvedValue(null);
    await expect(service.findById('does-not-exist')).rejects.toThrow(
      NotFoundException,
    );
  });
});
