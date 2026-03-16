# Blog（Vue + NestJS）个人博客全栈项目

这是一个用于练习和落地的个人全栈博客项目。

- 前端：Vue 3（Vite + TypeScript）
- 后端：NestJS（TypeScript）
- 数据库：PostgreSQL（Docker）
- ORM：Prisma
- 包管理：pnpm

---

## 快速开始（本仓库当前用法）

在仓库根目录：

1）安装依赖：

- `pnpm install`

2）启动数据库（PostgreSQL）：

- `pnpm db:up`
- 查看日志：`pnpm db:logs`
- 停止：`pnpm db:down`

3）启动前后端（并行）：

- `pnpm dev`
  - 仅前端：`pnpm dev:web`
  - 仅后端：`pnpm dev:api`

> 依赖新增/升级都建议在根目录用 filter：
>
>- 前端：`pnpm --filter web add <pkg>`
>- 后端：`pnpm --filter api add <pkg>`

---

## 0. 你要先想清楚的目标（MVP）

第一次做全栈，建议先做一个 **最小可用版本（MVP）**，功能别贪多：

- 文章列表（分页）
- 文章详情（Markdown 渲染）
- 标签（可选）
- 管理端：登录 + 新建/编辑/发布文章

先把“端到端链路”打通：**前端页面 → 调用 API → 数据库落库 → 返回渲染**。

---

## 1. 规划仓库结构（推荐：Monorepo）

建议在同一个仓库里放前后端，方便统一依赖、统一脚本。

推荐结构：

```
Blog/
  apps/
    web/          # Vue 前端
    api/          # NestJS 后端
  packages/
    shared/       # 前后端共享 types / 工具（后面再加）
  docker/
    postgres/     # 可选：放数据库初始化脚本
  docker-compose.yml
  pnpm-workspace.yaml
  .env            # 本地开发环境变量（不要提交）
  README.md
```

如果你想先简单点，也可以先做两个独立项目：`web/` 和 `api/`，但后期大概率还是会合并到 monorepo。

---

## 2. 初始化项目（一步步）

### 2.1 初始化 pnpm workspace

1）在仓库根目录执行：

- 初始化 package.json
- 创建 workspace 配置

你将会得到：
- `pnpm-workspace.yaml`
- 根 `package.json`

`pnpm-workspace.yaml` 建议内容：

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

根 `package.json`（示例）：

```json
{
  "name": "blog",
  "private": true,
  "packageManager": "pnpm@latest",
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:api": "pnpm --filter api dev",
    "dev": "pnpm -r --parallel dev"
  }
}
```

> 先不追求脚本很完美，能跑起来最重要。

---

### 2.2 创建前端（Vue 3 + Vite）

在 `apps/` 下创建：

- 项目名建议：`web`
- 选择：Vue + TypeScript

完成后你会有：`apps/web/`。

接着建议加入：

- vue-router（页面路由）
- pinia（状态管理）
- axios（请求）

页面（先做骨架）：

- `/` 首页文章列表
- `/post/:id` 文章详情
- `/admin/login` 管理员登录
- `/admin/posts` 管理文章列表
- `/admin/posts/new` 新建文章
- `/admin/posts/:id/edit` 编辑文章

---

### 2.3 创建后端（NestJS）

在 `apps/` 下创建：

- 项目名建议：`api`

建议安装/启用：

- `@nestjs/config`（环境变量）
- `class-validator` + `class-transformer`（DTO 校验）
- Swagger（API 文档，方便联调）

模块建议拆分（最少）：

- `auth`：登录（先简单用管理员账号）
- `posts`：文章 CRUD

---

### 2.4 准备数据库（PostgreSQL + Docker Compose）

本仓库根目录已经提供了 `docker-compose.yml`（与当前配置一致，Compose v2 不需要 `version:` 字段）。

启动数据库（推荐用根脚本）：

- `pnpm db:up`
- 查看日志：`pnpm db:logs`
- 停止：`pnpm db:down`

（你也可以直接用：`docker compose up -d`）

---

## 3. 后端先跑通：Prisma + Posts CRUD

### 3.1 Prisma 初始化

在 `apps/api`：

- 初始化 Prisma
- 配置 `.env` 数据库连接

DATABASE_URL 示例：

```
postgresql://blog:blog@localhost:5432/blog
```

### 3.2 设计最小数据模型

建议从最小开始：

- Post（文章）
  - id
  - title
  - slug（可选）
  - content（markdown）
  - summary（摘要）
  - status（draft/published）
  - createdAt / updatedAt / publishedAt

等跑通后再加：

- Tag（标签）
- PostTag（多对多）
- User（管理员）
- Comment（评论，可选）

### 3.3 API 设计（建议）

公开接口：

- `GET /posts`（分页，仅返回已发布）
- `GET /posts/:id` 或 `GET /posts/slug/:slug`

管理端接口（需要登录）：

- `POST /admin/auth/login`
- `GET /admin/posts`
- `POST /admin/posts`
- `PATCH /admin/posts/:id`
- `POST /admin/posts/:id/publish`

> 先不要急着做“完美 REST”，能让前端完成页面就行。

---

## 4. 前端联调：页面 + API + 渲染

### 4.1 建立请求层

建议：

- `apps/web/src/api/`：放 axios 实例、请求函数
- 配置 `baseURL` 指向后端，例如 `http://localhost:3000`

### 4.2 文章详情渲染 Markdown

前端渲染 Markdown 你可以选一个成熟库（例如 markdown-it / marked）。

注意安全：

- 如果支持 HTML，记得做 XSS 防护（第一次做可以先禁用 HTML）。

### 4.3 管理端最小实现

先做到：

- 登录成功后保存 token（建议放内存/Pinia + localStorage）
- 新建文章（title + content）
- 草稿/发布切换

---

## 5. 登录与权限（建议第二阶段再做完善）

第一次建议简单处理：

- 先在后端写死一个管理员账号密码（或放在 .env）
- 登录返回 JWT
- 管理端接口加 Nest Guard 校验 JWT

等 MVP 跑通再升级：

- refresh token
- 多用户
- RBAC

---

## 6. 工程化与质量（第三阶段）

等你能完整发布一篇文章之后，再补：

- ESLint + Prettier
- 单元测试（api：Jest；web：Vitest）
- E2E（可选）
- OpenAPI/Swagger 完善

---

## 7. 部署（最后阶段）

建议顺序：

1. 本地 docker compose 全部跑起来（api + web + postgres）
2. 再考虑服务器部署

常见部署方式：

- 前端：静态资源（nginx / OSS / CDN）
- 后端：Node 进程（pm2）或容器
- 数据库：云数据库或自建容器

---

## 8. 你今天就可以做的 6 个小步骤（超落地）

1）确定你用不用 monorepo（我建议用）
2）创建 `apps/web`（Vue3）并跑起 `dev`
3）创建 `apps/api`（NestJS）并跑起 `start:dev`
4）用 docker compose 跑起 PostgreSQL
5）后端完成 `GET /posts` 返回一个假数据数组（先别连数据库）
6）前端首页调用 `GET /posts` 并渲染列表

当这 6 步完成，你就已经完成了“全栈闭环”。

---

## 下一步我需要你确认 3 个选择（我可以按你的选择继续带你做）

1. 前端：Vue 3 + Vite 是否 OK？（还是你想 Vue2）
2. 数据库：PostgreSQL 是否 OK？（还是 MySQL / SQLite）
3. ORM：Prisma 是否 OK？（还是 TypeORM）

你回复这 3 个选项，我就可以：

- 给你生成具体的目录结构
- 给出每一步要执行的命令
- 以及每一步完成的“验收标准”（看到什么结果算成功）
