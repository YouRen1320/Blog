import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { bootstrapTestApp, resetDb, ensureAdmin, TEST_ADMIN } from './helpers';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;

  beforeAll(async () => {
    ({ app, prisma } = await bootstrapTestApp());
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await resetDb(prisma);
    await ensureAdmin(prisma);
  });

  afterAll(async () => {
    await resetDb(prisma);
    await app.close();
  });

  it('POST /auth/login 用正确凭据返回 token + user', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password })
      .expect(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      email: TEST_ADMIN.email,
      role: 'ADMIN',
    });
  });

  it('POST /auth/login 错密码返回 401,且不暴露具体原因', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send({ email: TEST_ADMIN.email, password: 'wrongpass' })
      .expect(401);
    expect(res.body.message).toBe('邮箱或密码错误');
  });

  it('POST /auth/login 不存在的邮箱也返回相同错误(避免账号枚举)', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send({ email: 'nobody@iyouren.top', password: 'anything' })
      .expect(401);
    expect(res.body.message).toBe('邮箱或密码错误');
  });

  it('POST /auth/login DTO 校验:邮箱格式错 + 密码太短', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send({ email: 'not-email', password: '1' })
      .expect(400);
    expect(res.body.message).toEqual(
      expect.arrayContaining([
        expect.stringContaining('email'),
        expect.stringContaining('密码'),
      ]),
    );
  });

  it('POST /auth/login 拒绝额外字段(forbidNonWhitelisted)', async () => {
    await request(server)
      .post('/auth/login')
      .send({
        email: TEST_ADMIN.email,
        password: TEST_ADMIN.password,
        extra: 'evil',
      })
      .expect(400);
  });

  it('GET /auth/profile 不带 token 返回 401', async () => {
    await request(server).get('/auth/profile').expect(401);
  });

  it('GET /auth/profile 带 token 返回当前用户', async () => {
    const login = await request(server)
      .post('/auth/login')
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });
    const res = await request(server)
      .get('/auth/profile')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);
    expect(res.body).toMatchObject({ email: TEST_ADMIN.email, role: 'ADMIN' });
  });

  it('GET /users/me 需要 token,带 token 返回完整 profile', async () => {
    const login = await request(server)
      .post('/auth/login')
      .send({ email: TEST_ADMIN.email, password: TEST_ADMIN.password });
    const res = await request(server)
      .get('/users/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);
    expect(res.body).toMatchObject({
      email: TEST_ADMIN.email,
      username: TEST_ADMIN.username,
      role: 'ADMIN',
    });
    expect(res.body.passwordHash).toBeUndefined();
  });
});
