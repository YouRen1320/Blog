# Blog 全栈项目
- 展示页：Nuxt 4（TypeScript）
- 管理后台：Vue 3（TypeScript）
- 移动端：Flutter（Dart + Riverpod）
- 主业务后端：NestJS（TypeScript）
- AI 服务：Python（LLM / RAG / Agent）
- 数据库：PostgreSQL（Docker）
- ORM：Prisma
- 包管理：pnpm

这是一个以博客为载体的全栈练习项目。

核心目标不是只做一个传统博客，而是完成一套完整的内容生产系统：
- Nuxt 负责内容展示
- Vue 负责后台管理
- NestJS 负责用户、文章、权限、发布等核心业务
- Flutter 负责移动端内容输入
- Python AI Service 负责文章生成、RAG、Agent 编排等智能能力

---

## 架构方案

**NestJS 主后端 + Python AI 微服务**

职责划分：
- **NestJS**：用户系统、文章系统、分类标签、权限控制、发布流程、数据库读写
- **Python AI Service**：大模型调用、提示词编排、知识库检索、文章生成、Agent 工作流
- **Flutter App**：语音输入 / 文本输入，作为 AI 内容生产入口
- **Nuxt 展示页**：文章展示、SEO、公开访问
- **Vue 管理后台**：文章审核、编辑、发布、内容管理

---

## 目标场景

目标是实现这样一条链路：

1. 用户在 App 中通过语音或文本输入创作需求
2. Flutter 将内容提交给后端
3. NestJS 调用 Python AI Service
4. AI 生成标题、摘要、正文、标签等草稿内容
5. 草稿进入后台管理系统审核/编辑
6. 审核通过后发布到 Nuxt 展示页

这是一个“传统博客系统 + AI 内容生产能力”的组合项目。

---

## 系统架构图（文字版）

```text
                ┌────────────────────┐
                │      Flutter App    │
                │  语音输入 / 文本输入  │
                └─────────┬──────────┘
                          │
                          │ HTTP / API
                          ▼
┌────────────────────────────────────────────────────┐
│                    NestJS API                      │
│ 用户 / 权限 / 文章 / 分类标签 / 草稿 / 发布流程      │
└───────────────┬───────────────────────┬────────────┘
                │                       │
                │ Prisma                │ HTTP
                ▼                       ▼
      ┌──────────────────┐     ┌────────────────────┐
      │   PostgreSQL     │     │ Python AI Service  │
      │ 用户 / 文章 / 标签 │     │ LLM / RAG / Agent │
      └──────────────────┘     └────────────────────┘
                ▲
                │
      ┌─────────┴─────────┐
      │                   │
      ▼                   ▼
┌───────────────┐   ┌────────────────┐
│   Nuxt Web    │   │ Vue Admin      │
│ 文章展示 / SEO │   │ 审核 / 编辑 / 发布 │
└───────────────┘   └────────────────┘
```

数据流说明：
- **公开内容流**：Nuxt 从 NestJS 获取已发布文章并渲染展示
- **管理流**：Vue Admin 通过 NestJS 管理文章、分类、标签和发布状态
- **AI 生成流**：Flutter 提交创作请求，NestJS 调用 Python AI Service 生成草稿，再写入数据库
- **发布流**：后台审核草稿后，由 NestJS 将文章状态更新为已发布，Nuxt 展示最新内容

---

## 开发阶段建议

### 第一阶段：传统博客闭环
先完成基础业务能力：
- 用户登录/注册
- 文章管理
- 分类/标签
- 草稿/发布
- 后台管理
- 展示页渲染
- 权限控制

#### 第一阶段功能清单

**1. 用户与权限**
- 管理员登录
- 基础鉴权（JWT / Session 二选一）
- 角色区分（至少管理员 / 普通用户）
- 路由鉴权与接口鉴权

**2. 文章系统**
- 创建文章
- 编辑文章
- 删除文章
- 保存草稿
- 发布文章
- 下线文章
- 文章列表分页
- 文章详情查询

**3. 分类与标签**
- 分类增删改查
- 标签增删改查
- 文章绑定分类
- 文章绑定多个标签

**4. 内容展示**
- 首页文章列表
- 文章详情页
- 分类页
- 标签页
- 文章发布时间展示
- SEO 基础支持（title / description / slug）

**5. 管理后台**
- 登录页
- 仪表盘首页
- 文章管理页
- 分类管理页
- 标签管理页
- 草稿与发布状态管理

**6. 数据库设计**
建议第一阶段至少包含这些核心表：
- users
- articles
- categories
- tags
- article_tags

**7. 第一阶段完成标准**
满足以下条件即可认为第一阶段闭环完成：
- 管理员可以登录后台
- 可以创建、编辑、保存、发布文章
- Nuxt 展示页可以正确渲染已发布文章
- 分类、标签可以正常关联文章
- 基础权限控制可用

### 第二阶段：移动端接入
逐步补齐 Flutter 端能力：
- 登录
- 文章列表 / 详情
- 草稿查看
- 文本创作入口
- 语音输入入口

### 第三阶段：AI 能力接入
最后再引入智能能力：
- LLM 生成文章草稿
- RAG 增强生成质量
- Agent 自动完成内容生产流程

---

## 数据库表结构初稿

第一阶段建议先保持精简，只围绕“用户、文章、分类、标签、发布状态”建立核心模型。

### 1. users
用于后台登录和权限控制。

建议字段：
- `id`
- `username`
- `email`
- `password_hash`
- `role`
- `created_at`
- `updated_at`

### 2. articles
文章核心表。

建议字段：
- `id`
- `title`
- `slug`
- `summary`
- `content`
- `cover`
- `status`（draft / published / archived）
- `author_id`
- `category_id`
- `published_at`
- `created_at`
- `updated_at`

### 3. categories
文章分类表。

建议字段：
- `id`
- `name`
- `slug`
- `description`
- `created_at`
- `updated_at`

### 4. tags
文章标签表。

建议字段：
- `id`
- `name`
- `slug`
- `created_at`
- `updated_at`

### 5. article_tags
文章和标签的多对多关联表。

建议字段：
- `article_id`
- `tag_id`

### 推荐关系
- 一个 `user` 可以创建多篇 `article`
- 一个 `category` 可以对应多篇 `article`
- 一篇 `article` 可以绑定多个 `tag`
- 一个 `tag` 可以被多篇 `article` 使用

### 第二阶段后可追加的表
等基础系统稳定后，再考虑增加：
- `comments`
- `favorites`
- `article_views`
- `draft_histories`
- `ai_generation_tasks`
- `knowledge_bases`

---

## 目录结构落地方案

建议按“应用层 + 共享层”来拆：

```text
Blog/
  apps/
    web/                # Nuxt 展示页
    admin/              # Vue 管理后台
    api/                # NestJS 主业务后端
    app/                # Flutter 移动端
    ai-service/         # Python AI 服务
  packages/
    shared/             # 多端共享常量、类型、接口定义
  infra/
    docker/             # Docker 相关配置
    scripts/            # 启动、构建、部署辅助脚本
  docs/                 # 后期可放接口文档、架构文档（可选）
  README.md
```

### NestJS 建议结构

```text
apps/api/src/
  modules/
    auth/
    users/
    articles/
    categories/
    tags/
  common/
    guards/
    decorators/
    interceptors/
  prisma/
  main.ts
  app.module.ts
```

### Vue Admin 建议结构

```text
apps/admin/src/
  pages/
  components/
  layouts/
  router/
  stores/
  api/
  utils/
```

### Nuxt Web 建议结构

```text
apps/web/
  pages/
  components/
  layouts/
  composables/
  utils/
  server/
```

### Flutter App 建议结构

```text
apps/app/lib/
  pages/
  features/
  services/
  models/
  providers/
  router/
```

### Python AI Service 建议结构

```text
apps/ai-service/
  app/
    api/
    services/
    prompts/
    rag/
    agents/
    schemas/
  main.py
  requirements.txt
```

这样拆的目标是：
- 前端、后台、移动端、后端、AI 服务边界清晰
- 每个应用都能独立开发
- 后续接入 AI 时不会污染主业务结构

---

## 第一阶段开发顺序清单

建议按“先后端，后后台，再展示页”的顺序推进。

### Step 1：初始化基础工程
- 初始化 monorepo
- 创建 `web` / `admin` / `api` 基础项目
- 配置 pnpm workspace
- 配置 Docker PostgreSQL
- 接入 Prisma

### Step 2：完成数据库建模
- 建立 `users`
- 建立 `articles`
- 建立 `categories`
- 建立 `tags`
- 建立 `article_tags`
- 执行迁移并初始化种子数据

### Step 3：先做 NestJS 核心 API
优先完成：
- 登录接口
- 用户鉴权
- 文章 CRUD
- 分类 CRUD
- 标签 CRUD
- 发布 / 下线接口
- 公开文章列表接口
- 公开文章详情接口

### Step 4：完成 Vue Admin 后台
优先页面：
- 登录页
- 文章管理页
- 分类管理页
- 标签管理页
- 草稿 / 发布状态操作

目标是先让后台具备实际管理能力。

### Step 5：完成 Nuxt 展示页
优先页面：
- 首页
- 文章详情页
- 分类页
- 标签页
- 404 页面

目标是让已发布内容形成完整访问链路。

### Step 6：补权限与体验细节
- 登录态持久化
- 接口鉴权守卫
- 页面路由守卫
- slug 生成规则
- SEO 基础字段处理

### Step 7：完成第一阶段验收
验收标准：
- 后台能完整管理文章
- 前台能正常展示已发布文章
- 数据关系正确
- 登录与权限正常工作
- 整个博客主链路跑通

---

## 快速开始

在仓库根目录：

1）安装依赖：
- `pnpm install`

2）启动数据库（PostgreSQL）：
- `docker compose up -d`
- 查看日志：`pnpm db:logs`

3）启动前后端：
- `pnpm dev`
  - 仅前端：`pnpm dev:web`
  - 仅后端：`pnpm dev:api`

> 依赖新增/升级都建议在根目录用 filter：
>
> - 前端：`pnpm --filter web add <pkg>`
> - 后端：`pnpm --filter api add <pkg>`

---

## 仓库结构（Monorepo）

```text
Blog/
  apps/
    web/          # Nuxt 展示页
    admin/        # Vue 管理后台
    api/          # NestJS 主业务后端
    app/          # Flutter 移动端
    ai-service/   # Python AI 服务（LLM / RAG / Agent）
  packages/
    shared/       # 多端共享 types / 常量
  docker/
    postgres/     # 数据库初始化脚本
  docker-compose.yml
  pnpm-workspace.yaml
  .env           # 本地开发环境变量
  README.md
```

---

## 项目定位

这个项目不以商业化为主要目标，更偏向于系统化训练以下能力：
- 全栈开发
- 多端协作
- 工程化能力
- AI 应用落地
- 从传统业务系统到智能工作流的整合能力

---

## 第一阶段接口清单（建议）

以下接口以“先够用、先跑通主链路”为目标。

### Auth
- `POST /auth/login`：管理员登录
- `GET /auth/profile`：获取当前用户信息

### Users
- `GET /users/me`：获取当前登录用户

### Articles（后台）
- `GET /admin/articles`：文章列表（支持分页 / 状态筛选）
- `GET /admin/articles/:id`：文章详情
- `POST /admin/articles`：创建文章
- `PATCH /admin/articles/:id`：更新文章
- `DELETE /admin/articles/:id`：删除文章
- `PATCH /admin/articles/:id/publish`：发布文章
- `PATCH /admin/articles/:id/unpublish`：下线文章

### Categories（后台）
- `GET /admin/categories`
- `POST /admin/categories`
- `PATCH /admin/categories/:id`
- `DELETE /admin/categories/:id`

### Tags（后台）
- `GET /admin/tags`
- `POST /admin/tags`
- `PATCH /admin/tags/:id`
- `DELETE /admin/tags/:id`

### Public Articles（前台）
- `GET /articles`：已发布文章列表
- `GET /articles/:slug`：已发布文章详情
- `GET /categories/:slug/articles`：分类下文章列表
- `GET /tags/:slug/articles`：标签下文章列表

### 第二阶段 App 接口
- `POST /app/auth/login`
- `GET /app/articles`
- `GET /app/articles/:id`
- `POST /app/drafts`

### 第三阶段 AI 接口
- `POST /ai/generate/article`：生成文章草稿
- `POST /ai/generate/outline`：生成文章大纲
- `POST /ai/generate/tags`：生成标签建议
- `POST /ai/rag/search`：知识库检索

---

## 第二阶段规划细化（Flutter App）

第二阶段的重点不是把移动端做成完整后台，而是把它做成一个轻量内容入口。

### 目标
- 让用户可以在移动端查看文章
- 让用户可以从移动端提交创作需求
- 为第三阶段 AI 生成打通入口

### 推荐功能范围

**1. 基础能力**
- 登录
- Token 持久化
- 路由管理
- 请求封装

**2. 内容消费**
- 文章列表页
- 文章详情页
- 分类浏览
- 标签浏览

**3. 内容创作入口**
- 文本输入创作页
- 草稿列表页
- 创建草稿
- 编辑草稿

**4. 为 AI 做准备**
- 语音输入入口
- 创作需求表单
- AI 生成结果预览页

### 第二阶段完成标准
- App 可完成登录
- 可查看文章内容
- 可提交草稿或创作请求
- 为 AI 接入保留清晰入口

---

## 第三阶段规划细化（AI Service）

第三阶段重点是把 AI 做成“辅助内容生产系统”，不是单纯接一个聊天接口。

### 目标
- 接收用户创作意图
- 调用模型生成结构化文章草稿
- 将结果回写到 NestJS 业务系统
- 后续逐步引入 RAG 和 Agent

### 推荐演进顺序

**Step 1：先做最小可行版本**
输入一段需求，例如：
- “帮我写一篇关于 NestJS 模块化设计的入门文章”

输出：
- 标题
- 摘要
- 正文
- 标签建议

**Step 2：增加结构化输出**
要求模型返回固定结构：
- `title`
- `summary`
- `content`
- `tags`
- `category`

这样更方便直接落库。

**Step 3：加入 RAG**
检索内容可来自：
- 你已有文章
- 固定写作规范
- 个人知识笔记
- 项目内沉淀的资料

**Step 4：再引入 Agent**
让 Agent 负责串联：
- 理解需求
- 检索资料
- 生成草稿
- 生成标签
- 生成摘要
- 推送到草稿箱

### 第三阶段完成标准
- Flutter 可提交创作请求
- NestJS 能调用 Python AI Service
- AI 能返回结构化草稿
- 草稿能进入后台待审核状态

---

## 开发规范

### 通用原则
- 先完成主链路，再扩展功能
- 先做够用版本，不追求一步到位
- 保持模块边界清晰，避免前期过度抽象

### 命名建议
- 表名、接口路径、DTO 字段尽量统一
- 前后端统一使用英文标识
- slug 字段用于公开访问路径

### Git 提交建议
- `feat:` 新功能
- `fix:` 修复问题
- `refactor:` 重构
- `docs:` 文档修改
- `style:` 样式调整

### 分支建议
- `main`：稳定分支
- `feat/*`：功能开发分支
- `fix/*`：修复分支

### 接口设计建议
- 后台接口与公开接口分开
- 后台接口统一加 `/admin`
- App 接口可单独加 `/app`
- AI 能力接口单独加 `/ai`

---

## 项目里程碑

### Milestone 1：博客基础闭环
- 完成数据库设计
- 完成 NestJS 核心 API
- 完成 Vue Admin 基础管理
- 完成 Nuxt 展示页

### Milestone 2：移动端接入
- 完成 Flutter 基础框架
- 完成文章浏览能力
- 完成草稿创建入口

### Milestone 3：AI 文章生成
- 打通 NestJS 与 Python AI Service
- 实现文章草稿自动生成
- 后台可审核 AI 草稿

### Milestone 4：RAG / Agent 增强
- 引入知识库检索
- 优化生成质量
- 将内容生产流程自动化

---

## Prisma Schema 草稿（第一阶段）

下面是一版偏实用的 Prisma 数据模型草稿，可作为第一阶段建模参考：

```prisma
enum UserRole {
  ADMIN
  USER
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model User {
  id           String    @id @default(cuid())
  username     String    @unique
  email        String    @unique
  passwordHash String
  role         UserRole  @default(USER)
  articles     Article[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Article {
  id          String         @id @default(cuid())
  title       String
  slug        String         @unique
  summary     String?
  content     String
  cover       String?
  status      ArticleStatus  @default(DRAFT)
  authorId    String
  categoryId  String?
  publishedAt DateTime?
  author      User           @relation(fields: [authorId], references: [id])
  category    Category?      @relation(fields: [categoryId], references: [id])
  tags        ArticleTag[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?
  articles    Article[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Tag {
  id        String       @id @default(cuid())
  name      String       @unique
  slug      String       @unique
  articles  ArticleTag[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}

model ArticleTag {
  articleId String
  tagId     String
  article   Article @relation(fields: [articleId], references: [id])
  tag       Tag     @relation(fields: [tagId], references: [id])

  @@id([articleId, tagId])
}
```

说明：
- 第一阶段不必把模型做太重，先支撑文章管理主链路
- `summary`、`cover`、`categoryId` 可以先设为可选
- `ArticleTag` 用中间表处理多对多关系，更适合后期扩展

---

## 接口请求 / 响应示例

### 1. 管理员登录

**Request**

```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

**Response**

```json
{
  "accessToken": "jwt-token",
  "user": {
    "id": "u_001",
    "username": "admin",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

### 2. 创建文章

**Request**

```json
{
  "title": "NestJS 模块化设计入门",
  "slug": "nestjs-modular-design-intro",
  "summary": "介绍 NestJS 模块化设计的基本思路",
  "content": "文章正文内容",
  "categoryId": "cat_001",
  "tagIds": ["tag_001", "tag_002"]
}
```

**Response**

```json
{
  "id": "art_001",
  "title": "NestJS 模块化设计入门",
  "slug": "nestjs-modular-design-intro",
  "status": "DRAFT",
  "createdAt": "2026-04-03T10:00:00.000Z"
}
```

### 3. 获取已发布文章详情

**Response**

```json
{
  "id": "art_001",
  "title": "NestJS 模块化设计入门",
  "slug": "nestjs-modular-design-intro",
  "summary": "介绍 NestJS 模块化设计的基本思路",
  "content": "文章正文内容",
  "category": {
    "id": "cat_001",
    "name": "NestJS",
    "slug": "nestjs"
  },
  "tags": [
    { "id": "tag_001", "name": "NestJS", "slug": "nestjs" },
    { "id": "tag_002", "name": "Backend", "slug": "backend" }
  ],
  "publishedAt": "2026-04-03T12:00:00.000Z"
}
```

### 4. AI 生成文章草稿

**Request**

```json
{
  "prompt": "帮我写一篇关于 Prisma 与 NestJS 集成的入门文章",
  "tone": "technical",
  "length": "medium"
}
```

**Response**

```json
{
  "title": "Prisma 与 NestJS 集成入门",
  "summary": "介绍 Prisma 在 NestJS 项目中的基本接入方式",
  "content": "生成后的正文内容",
  "tags": ["Prisma", "NestJS", "PostgreSQL"],
  "category": "Backend"
}
```

---

## 环境变量建议

建议在根目录维护 `.env`，并按应用拆分读取。

### 通用

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blog"
JWT_SECRET="your-jwt-secret"
NODE_ENV="development"
```

### Nuxt Web

```env
NUXT_PUBLIC_API_BASE="http://localhost:3000"
```

### Vue Admin

```env
VITE_API_BASE_URL="http://localhost:3000"
```

### NestJS API

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/blog"
JWT_SECRET="your-jwt-secret"
AI_SERVICE_BASE_URL="http://localhost:8000"
```

### Python AI Service

```env
AI_SERVICE_PORT=8000
OPENAI_API_KEY="your-api-key"
MODEL_NAME="gpt-4.1"
```

说明：
- 第一阶段即使还没接 AI，也可以先保留 `AI_SERVICE_BASE_URL`
- 如果后续改用 Claude、OpenRouter 或其他模型，只需要调整 AI Service 内部配置
- 不要把真实密钥提交到仓库

---

## 数据库 ER 关系说明

第一阶段核心关系可以概括为：

```text
User (1) ────── (N) Article
Category (1) ── (N) Article
Article (1) ─── (N) ArticleTag (N) ─── (1) Tag
```

关系说明：
- 一个用户可以创建多篇文章
- 一篇文章只能属于一个分类（第一阶段先做单分类）
- 一篇文章可以绑定多个标签
- 一个标签可以被多篇文章复用

这样设计的好处：
- 结构简单，适合第一阶段快速落地
- 后续如果要支持多分类、专题、系列文章，也容易扩展
- 标签通过中间表维护，更利于查询和管理

---

## 鉴权方案说明

第一阶段建议使用 **JWT 鉴权**。

原因：
- 前后端分离项目更常见
- Vue Admin、Nuxt、Flutter 都更容易统一接入
- 开发阶段实现成本低，足够支撑当前项目

### 推荐方案
- 登录成功后，NestJS 返回 `accessToken`
- Admin 和 App 将 token 存储到本地
- 请求接口时通过 `Authorization: Bearer <token>` 传递
- NestJS 通过 Guard 校验用户身份和角色

### 第一阶段建议做到的点
- 登录接口签发 JWT
- 后台接口需要鉴权
- 管理员接口需要角色校验
- 前端页面通过路由守卫拦截未登录访问

### 后续可扩展
- refresh token
- 多端登录管理
- session 黑名单
- 更细粒度 RBAC 权限控制

---

## AI 生成链路时序说明

```text
用户(App)
  ↓
提交创作需求
  ↓
Flutter App
  ↓
POST /ai/generate/article
  ↓
NestJS API
  ↓
调用 Python AI Service
  ↓
LLM / RAG / Agent 生成结构化草稿
  ↓
Python AI Service 返回结果
  ↓
NestJS 将草稿写入 articles 表（status = DRAFT）
  ↓
Vue Admin 可查看 / 编辑 / 审核
  ↓
管理员发布文章
  ↓
Nuxt Web 展示已发布内容
```

### 关键设计点
- AI 只负责生成内容，不直接发布
- 发布动作必须经过业务系统控制
- 所有 AI 结果先进入草稿状态，避免脏数据直接上线
- 后续如果增加审核流，也可以继续沿用这条链路

---

## 第一阶段任务 Checklist

### 基础工程
- [ ] 初始化 monorepo
- [ ] 创建 `apps/web`
- [ ] 创建 `apps/admin`
- [ ] 创建 `apps/api`
- [ ] 配置 `pnpm-workspace.yaml`
- [ ] 配置 PostgreSQL Docker
- [ ] 接入 Prisma

### 数据库
- [ ] 设计 Prisma Schema
- [ ] 创建数据库迁移
- [ ] 编写 seed 数据
- [ ] 创建管理员账号

### NestJS API
- [ ] 完成登录接口
- [ ] 完成 JWT Guard
- [ ] 完成用户信息接口
- [ ] 完成文章 CRUD
- [ ] 完成分类 CRUD
- [ ] 完成标签 CRUD
- [ ] 完成文章发布 / 下线接口
- [ ] 完成公开文章列表接口
- [ ] 完成公开文章详情接口

### Vue Admin
- [ ] 完成登录页
- [ ] 完成登录态管理
- [ ] 完成文章管理页
- [ ] 完成分类管理页
- [ ] 完成标签管理页
- [ ] 完成草稿 / 发布状态操作

### Nuxt Web
- [ ] 完成首页
- [ ] 完成文章详情页
- [ ] 完成分类页
- [ ] 完成标签页
- [ ] 完成 SEO 基础配置

### 验收
- [ ] 后台可正常登录
- [ ] 可创建并发布文章
- [ ] 前台可展示已发布文章
- [ ] 分类与标签关联正常
- [ ] 主链路完整跑通
