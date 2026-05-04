# V1 完成报告 —— 本地闭环

**日期**:2026-05-05
**分支**:main
**Tag**:v0.1.0

## 范围

V1 的目标:在本地把"写文章 → 发布 → 公开访问"的主链路从零打通。**不上线**,**不接 AI**,**不做移动端**。

## 完成清单(对照 README §1002 验收标准)

### 基础工程
- [x] monorepo + pnpm workspace
- [x] PostgreSQL Docker(健康检查、参数化凭据)
- [x] Prisma 6 接入 + dotenv-cli 注入根 `.env`
- [x] `packages/shared` 占位

### 数据库
- [x] Prisma schema(User / Article / Category / Tag / ArticleTag + 2 enum)
- [x] 初始 migration `20260504183321_init`
- [x] seed 脚本(幂等 upsert,1 admin + 3 分类 + 5 标签 + 2 文章)

### NestJS API
- [x] 全局 ConfigModule(启动期校验 .env)
- [x] PrismaModule + PrismaService 生命周期接入
- [x] AuthModule:`POST /auth/login`、`GET /auth/profile`(JWT + Passport)
- [x] UsersModule:`GET /users/me`
- [x] ArticlesModule:`/admin/articles` 完整 CRUD + publish/unpublish + 分页
- [x] CategoriesModule:`/admin/categories` CRUD
- [x] TagsModule:`/admin/tags` CRUD
- [x] PublicModule:`/articles`、`/articles/:slug`、`/categories/:slug/articles`、`/tags/:slug/articles`
- [x] 全局 JwtAuthGuard + RolesGuard(默认拒绝,@Public 显式开口)
- [x] 全局 ValidationPipe(白名单 + 拒绝额外字段)
- [x] 全局 AllExceptionsFilter(Prisma P2002→409 / P2025→404 等)
- [x] helmet + CORS

### Vue Admin
- [x] axios 客户端 + 拦截器(Authorization 头、401 自动登出)
- [x] Pinia auth store(token + user 持久化到 localStorage)
- [x] 登录页(对接真实 API,显示后端 message)
- [x] 路由守卫(meta.requiresAuth + 已登录跳 dashboard)
- [x] Dashboard(已发布 / 草稿 / 分类 / 标签 计数 + 最近 5 篇)
- [x] Articles 列表页(状态筛选 + 分页 + 行内操作)
- [x] Editor(/editor 新建 + /editor/:id 编辑 + 分类/标签选择 + 保存/发布/下线/删除)
- [x] Categories CRUD(内联表单 + 行内编辑)
- [x] Tags CRUD(同上)

### Nuxt Web
- [x] composables `useArticles`(useArticleList / useArticleBySlug / useArticlesByCategory / useArticlesByTag)
- [x] 首页文章网格接 API(最新 6 篇)
- [x] /writing 文章存档(按年份分组)
- [x] /writing/:slug 详情(markdown-it 渲染 + SEO meta + 404 真状态码)
- [x] /categories/:slug、/tags/:slug 筛选
- [x] runtimeConfig.public.apiBase + 显式 IPv4(127.0.0.1)
- [x] 端口固定 3100

### 测试
- [x] API unit:**13 tests** 跨 Auth / Articles / Categories / Public services
- [x] API e2e:**20 tests** 跨 auth / articles / public 主链路
- [x] 跨栈 Playwright:**3 tests** 完整发布主链路 + 访问控制 + seed 数据可见

**全部 36 项测试 0 失败**。

### 文档
- [x] `docs/README.md` —— docs 目录哲学
- [x] `docs/00-roadmap.md` —— V1-V4 + Final 路线图
- [x] `docs/decisions/0001-versioning-strategy.md` —— 版本切片 ADR
- [x] `docs/decisions/0002-prisma-version-choice.md` —— Prisma 6 vs 7 ADR
- [x] `docs/journal/V1-01 ~ V1-09` —— 9 篇任务日志
- [x] `docs/V1-REPORT.md` —— 本文件

## 端口与环境约定

| 服务 | 本地端口 | 启动命令 |
|------|---------|---------|
| Postgres | 5432 | `pnpm db:up` |
| API (NestJS) | 3000 | `pnpm dev:api` |
| Admin (Vite) | 5174 | `pnpm dev:admin` |
| Web (Nuxt) | 3100 | `pnpm dev:web` |

环境变量见 `.env.example`。`.env` 是本地实际值,gitignored。

## 关键技术决策

记忆点:
- **Prisma 6 而非 7**:driver adapter 复杂度对当前阶段无价值([ADR-0002](decisions/0002-prisma-version-choice.md))
- **JWT + Bearer**:跨域和移动端友好,localStorage 存储够用
- **路径前缀分流**:`/admin/*` 强制 ADMIN 角色,公开接口 `@Public()`
- **状态 select 而非 include**:公开接口字段白名单,避免泄漏
- **e2e 用 conditional render 等待**:不等"文本出现",等"按钮变成另一个文本"

## 已知局限(技术债务清单)

留给后续版本处理:

1. **slug 不支持中文**:slugify(strict) 把中文吃了。需要前端调用 pinyin 或后端处理。
2. **packages/shared 是空的**:前后端类型各维护一份,改 schema 时要同步两边。
3. **e2e 没自动清理数据**:每次跑会留下 `e2e-test-*` 行,需 `db:clean-e2e` 脚本。
4. **没有图床 / cover 上传**:Article.cover 字段可填 URL 但没 UI 上传组件。
5. **没有评论 / 浏览数**:V2 之后表设计扩展。
6. **dev server IPC 偶发抽风**:Nuxt 4.4 的已知问题,production preview 稳定。

## 下一步(自动衔接 V2)

V2 范围:
- 阿里云 ECS Docker-wuob 服务器初始化
- SSH 密钥替换 root 密码登录
- Caddy 自动 HTTPS
- 生产 docker-compose(api + postgres + caddy)
- GitHub Actions CI/CD(push main → SSH 部署)
- 数据库自动备份
- 健康检查与 healthcheck 探针

域名:www.iyouren.top → 47.97.17.43

V2 完成后停下等用户验收,**不会自动进 V3/V4**(iOS / AI 调用需要用户介入)。

## 启动指南(供未来你重新进项目)

```bash
# 1. 装依赖
pnpm install

# 2. 起数据库(Docker Postgres + healthcheck)
pnpm db:up

# 3. 跑迁移 + seed
pnpm --filter api db:migrate
pnpm --filter api db:seed

# 4. 全部 dev 服务一起跑
pnpm dev
# 或者各起各的
pnpm dev:api      # http://localhost:3000
pnpm dev:admin    # http://localhost:5174
pnpm dev:web      # http://localhost:3100

# 5. 登录后台
# email:    admin@iyouren.top
# password: admin12345

# 6. 跑测试
pnpm --filter api test          # unit
pnpm --filter api test:e2e      # api e2e
pnpm e2e                        # 跨栈 Playwright(需先起 3 个服务)
```
