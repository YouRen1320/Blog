# apps/api —— NestJS 主后端

NestJS 10 + Prisma 6 + Postgres + JWT。负责所有用户/业务/AI 调用代理。

**生产地址**:<https://www.iyouren.top/api>(经 Caddy 反代)
**端口**:`3000`(生产容器内,公开走 Caddy 443)

---

## 模块概览

| 模块 | 路径 | 职责 |
| --- | --- | --- |
| `AuthModule` | `/auth/*` | JWT 登录 / profile / **改密码** |
| `UsersModule` | `/users/me` | 当前用户信息 |
| `ArticlesModule` | `/admin/articles/*` | 文章 CRUD + 发布 / 下线 + **批量回填 embedding** |
| `CategoriesModule` | `/admin/categories/*` | 分类 CRUD |
| `TagsModule` | `/admin/tags/*` | 标签 CRUD |
| `PublicModule` | `/articles`, `/categories/:slug`, `/tags/:slug` | web 端公开读 |
| `CommentsModule` | `/articles/:slug/comments`, `/admin/comments/*` | 匿名评论 + 后台审核 |
| `SettingsModule` | `/settings`, `/admin/settings` | 站点设置(公开 / admin 双 endpoint) |
| `AiModule` | `/admin/ai/drafts` | 调 ai-service 生成草稿 |
| `EmbeddingModule` | (内部) | 文章发布时异步 embed,backfill 入口 |

## 关键 endpoint(常用)

```
# 公开
POST   /auth/login                          (strict 5/min)
GET    /articles
GET    /articles/:slug
GET    /articles/:slug/comments
POST   /articles/:slug/comments             (strict 5/min)
GET    /settings
GET    /categories/:slug
GET    /tags/:slug

# 已登录
GET    /auth/profile
GET    /users/me
PATCH  /auth/password                       (strict 5/min)

# admin 角色
*      /admin/articles/*
*      /admin/comments/*
GET    /admin/settings
PATCH  /admin/settings
POST   /admin/articles/backfill-embeddings
POST   /admin/ai/drafts                     (ai 10/min)
```

完整列表看启动日志(`RouterExplorer Mapped {...}`)或者后续接 `@nestjs/swagger`。

---

## 技术栈

- **NestJS 10**(模块化,APP_GUARD 链:Throttler → JwtAuth → Roles)
- **Prisma 6.19** + PostgreSQL 16(pgvector 扩展用于 embedding)
- **JWT** 鉴权(7 天过期),`@Public()` 装饰器跳过 guard
- **class-validator + class-transformer**:全局 `ValidationPipe(whitelist + transform)`
- **bcryptjs** 密码 hash(rounds=10)
- **nestjs-pino**:生产 JSON / 开发 pretty,自动 reqId
- **@nestjs/throttler**:三档限流(default 60 / strict 5 / ai 10 per min)
- **@nestjs/jwt** + **passport-jwt**

## 数据模型(Prisma schema)

- `User` (id / username / email / passwordHash / role)
- `Article` (status / source / authorId / categoryId / publishedAt / **embedding vector(512)**)
- `Category` / `Tag` / `ArticleTag`
- `Comment` (articleId / parentId 自指 / status / authorEmail / ipAddress)
- `SiteSetting` (singleton 单行,id="singleton")

详细字段见 [`prisma/schema.prisma`](prisma/schema.prisma)。

## 默认账号 + seed

```
admin@iyouren.top / admin12345
```

种子在 `prisma/seed.ts`,通过 `pnpm prisma db seed` 执行。生产首次部署后由 V2 阶段插入了一篇「第一灯」文章。

---

## 本地开发

```bash
# 1. 起 Postgres(已含 pgvector)
docker compose up -d
pnpm db:logs

# 2. 安装 + migrate + seed
pnpm install
cd apps/api
pnpm prisma migrate deploy
pnpm prisma db seed

# 3. 启动
pnpm dev:api          # :3000

# 4. 测试
pnpm --filter api test          # 16/16 unit
pnpm --filter api test:e2e      # auth + public 各几条
```

环境变量从根 `.env` 读(`@Module ConfigModule.forRoot envFilePath: ['../../.env']`):

```env
DATABASE_URL=postgresql://blog:blog@localhost:5432/blog
JWT_SECRET=<random-string>
JWT_EXPIRES_IN=7d
AI_SERVICE_BASE_URL=http://127.0.0.1:8001
```

---

## 生产部署

容器入口:

```sh
node node_modules/prisma/build/index.js migrate deploy && node dist/main.js
```

启动时**自动跑 prisma migrate deploy**,所以 schema 改动只要文件同步过去 + 重启容器就生效。无需手动执行 migration。

健康检查:`GET /healthz`(无认证),docker-compose 用它做 healthcheck。

```bash
# 服务器侧
ssh blog-deploy
cd /opt/blog
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build api
sudo docker logs blog-api-1 --tail 30
```

---

## 常见任务

### 改 schema

1. 改 `prisma/schema.prisma`
2. 手写 migration SQL(本仓库不用 `prisma migrate dev`,见 `docs/journal/V1.1-*` 解释)
3. 本地 `docker exec blog-postgres-1 psql -U blog -d blog -f migration.sql` 应用
4. `INSERT INTO _prisma_migrations` 注册一行
5. `pnpm prisma generate`
6. 部署时容器自动 `prisma migrate deploy`

### 加新模块

1. 新建 `src/modules/<name>/` 包含 `*.module.ts`、`*.controller.ts`、`*.service.ts`
2. `app.module.ts` import 加进去
3. 根据用途用 `@Public()` / `@Roles('ADMIN')` / 默认认证
4. 速率限制写 `@Throttle({ strict: { limit, ttl } })`

详细各阶段决策见:

- [`docs/journal/V1-03-nestjs-foundation.md`](../../docs/journal/V1-03-nestjs-foundation.md)
- [`docs/journal/V1-04-business-endpoints.md`](../../docs/journal/V1-04-business-endpoints.md)
- [`docs/journal/V1-05-api-tests.md`](../../docs/journal/V1-05-api-tests.md)
- [`docs/journal/Final-hardening.md`](../../docs/journal/Final-hardening.md)
- [`docs/journal/AI2-rag-agent.md`](../../docs/journal/AI2-rag-agent.md)
