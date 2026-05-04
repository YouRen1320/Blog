import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { bootstrapTestApp, resetDb, ensureAdmin, TEST_ADMIN } from './helpers';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Articles admin flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let token: string;
  let categoryId: string;
  let tagId: string;

  beforeAll(async () => {
    ({ app, prisma } = await bootstrapTestApp());
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await resetDb(prisma);
    await ensureAdmin(prisma);
    const login = await request(server)
      .post('/auth/login')
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });
    token = login.body.accessToken;
    const cat = await request(server)
      .post('/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '测试分类', slug: 'test-cat' });
    categoryId = cat.body.id;
    const tag = await request(server)
      .post('/admin/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '测试标签', slug: 'test-tag' });
    tagId = tag.body.id;
  });

  afterAll(async () => {
    await resetDb(prisma);
    await app.close();
  });

  it('完整 CRUD + 发布/下线生命周期', async () => {
    // create
    const create = await request(server)
      .post('/admin/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'NestJS 入门',
        slug: 'nestjs-intro',
        content: '# NestJS\n模块化的 Node 框架',
        categoryId,
        tagIds: [tagId],
      })
      .expect(201);
    expect(create.body).toMatchObject({ status: 'DRAFT', publishedAt: null });
    const id = create.body.id;

    // publish
    const pub = await request(server)
      .patch(`/admin/articles/${id}/publish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(pub.body.status).toBe('PUBLISHED');
    expect(pub.body.publishedAt).not.toBeNull();

    // public list now shows it
    const pubList = await request(server).get('/articles').expect(200);
    expect(pubList.body.meta.total).toBe(1);
    expect(pubList.body.data[0].slug).toBe('nestjs-intro');

    // unpublish
    const unpub = await request(server)
      .patch(`/admin/articles/${id}/unpublish`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(unpub.body.status).toBe('DRAFT');
    expect(unpub.body.publishedAt).toBeNull();

    // public list now empty again
    const pubList2 = await request(server).get('/articles').expect(200);
    expect(pubList2.body.meta.total).toBe(0);

    // update tags(全量替换:清空)
    const newTag = await request(server)
      .post('/admin/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '另一标签', slug: 'another-tag' });
    const upd = await request(server)
      .patch(`/admin/articles/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ tagIds: [newTag.body.id] })
      .expect(200);
    expect(upd.body.tags).toHaveLength(1);
    expect(upd.body.tags[0].tag.slug).toBe('another-tag');

    // delete
    await request(server)
      .delete(`/admin/articles/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(server)
      .get(`/admin/articles/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('admin 列表支持按 status 筛选', async () => {
    const a1 = await request(server)
      .post('/admin/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'A1', slug: 'a-1', content: '...' });
    const a2 = await request(server)
      .post('/admin/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'A2', slug: 'a-2', content: '...' });
    await request(server)
      .patch(`/admin/articles/${a2.body.id}/publish`)
      .set('Authorization', `Bearer ${token}`);

    const drafts = await request(server)
      .get('/admin/articles?status=DRAFT')
      .set('Authorization', `Bearer ${token}`);
    const published = await request(server)
      .get('/admin/articles?status=PUBLISHED')
      .set('Authorization', `Bearer ${token}`);
    expect(drafts.body.meta.total).toBe(1);
    expect(published.body.meta.total).toBe(1);
  });

  it('未授权访问 admin 接口返回 401', async () => {
    await request(server).get('/admin/articles').expect(401);
    await request(server).post('/admin/articles').send({}).expect(401);
  });

  it('普通用户访问 admin 接口返回 403', async () => {
    const hash = await bcrypt.hash('userpass', 10);
    await prisma.user.create({
      data: {
        email: 'user@iyouren.top',
        username: 'user',
        passwordHash: hash,
        role: 'USER',
      },
    });
    const login = await request(server)
      .post('/auth/login')
      .send({ email: 'user@iyouren.top', password: 'userpass' })
      .expect(200);
    const userToken = login.body.accessToken;
    await request(server)
      .get('/admin/articles')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('唯一约束冲突映射为 409', async () => {
    await request(server)
      .post('/admin/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Same', slug: 'same-slug', content: '...' })
      .expect(201);
    await request(server)
      .post('/admin/articles')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Different', slug: 'same-slug', content: '...' })
      .expect(409);
  });
});
