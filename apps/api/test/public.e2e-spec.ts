import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { bootstrapTestApp, resetDb, ensureAdmin, TEST_ADMIN } from './helpers';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Public articles (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let token: string;
  let backendCatId: string;
  let frontendCatId: string;
  let nestTagId: string;
  let vueTagId: string;

  beforeAll(async () => {
    ({ app, prisma } = await bootstrapTestApp());
    server = app.getHttpServer();

    await resetDb(prisma);
    await ensureAdmin(prisma);
    const login = await request(server)
      .post('/auth/login')
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });
    token = login.body.accessToken;

    const cb = await request(server)
      .post('/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Backend', slug: 'backend' });
    const cf = await request(server)
      .post('/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Frontend', slug: 'frontend' });
    backendCatId = cb.body.id;
    frontendCatId = cf.body.id;

    const tn = await request(server)
      .post('/admin/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nest', slug: 'nest' });
    const tv = await request(server)
      .post('/admin/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Vue', slug: 'vue' });
    nestTagId = tn.body.id;
    vueTagId = tv.body.id;

    // 两篇 published(后端 nest + 前端 vue),一篇 draft
    const make = async (
      title: string,
      slug: string,
      catId: string,
      tagIds: string[],
      publish: boolean,
    ) => {
      const a = await request(server)
        .post('/admin/articles')
        .set('Authorization', `Bearer ${token}`)
        .send({ title, slug, content: 'x', categoryId: catId, tagIds });
      if (publish) {
        await request(server)
          .patch(`/admin/articles/${a.body.id}/publish`)
          .set('Authorization', `Bearer ${token}`);
      }
      return a.body.id;
    };
    await make('Backend Pub', 'backend-pub', backendCatId, [nestTagId], true);
    await make('Frontend Pub', 'frontend-pub', frontendCatId, [vueTagId], true);
    await make(
      'Draft Hidden',
      'draft-hidden',
      backendCatId,
      [nestTagId],
      false,
    );
  });

  afterAll(async () => {
    await resetDb(prisma);
    await app.close();
  });

  it('GET /articles 只返回已发布,不含 content 字段', async () => {
    const res = await request(server).get('/articles').expect(200);
    expect(res.body.meta.total).toBe(2);
    for (const a of res.body.data) {
      expect(a.content).toBeUndefined();
      expect(a.publishedAt).not.toBeNull();
    }
  });

  it('GET /articles/:slug 返回详情包含 content', async () => {
    const res = await request(server).get('/articles/backend-pub').expect(200);
    expect(res.body.content).toBe('x');
    expect(res.body.author).toMatchObject({ username: TEST_ADMIN.username });
  });

  it('GET /articles/:slug 草稿返回 404', async () => {
    await request(server).get('/articles/draft-hidden').expect(404);
  });

  it('GET /categories/:slug/articles 按分类筛选', async () => {
    const be = await request(server)
      .get('/categories/backend/articles')
      .expect(200);
    expect(be.body.meta.total).toBe(1);
    expect(be.body.data[0].slug).toBe('backend-pub');

    const fe = await request(server)
      .get('/categories/frontend/articles')
      .expect(200);
    expect(fe.body.meta.total).toBe(1);
    expect(fe.body.data[0].slug).toBe('frontend-pub');
  });

  it('GET /tags/:slug/articles 按标签筛选', async () => {
    const nest = await request(server).get('/tags/nest/articles').expect(200);
    expect(nest.body.meta.total).toBe(1);
    expect(nest.body.data[0].slug).toBe('backend-pub');
  });

  it('未知分类 / 标签返回 404', async () => {
    await request(server).get('/categories/not-found/articles').expect(404);
    await request(server).get('/tags/not-found/articles').expect(404);
  });

  it('分页参数生效', async () => {
    const res = await request(server)
      .get('/articles?page=1&pageSize=1')
      .expect(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({
      page: 1,
      pageSize: 1,
      total: 2,
      totalPages: 2,
    });
  });
});
