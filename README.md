# Blog —— 全栈博客 + AI 内容生产

一个个人博客 vibe coding 项目。从空仓库开始,做完一整套**前后端 + 移动端 + AI 生成 + RAG 检索 + 生产部署**。

**当前版本**:`v1.20.0` · **生产环境已上线**

---

## 在线访问

| 入口 | 地址 | 说明 |
| --- | --- | --- |
| 公开博客 | <https://www.iyouren.top> | Nuxt SSR,所有人可访问 |
| 后台管理 | <https://admin.iyouren.top> | 登录后管理文章 / 草稿 / 评论 / 用户 / 设置 |
| API 接口 | <https://www.iyouren.top/api> | NestJS,Caddy 反代 `/api/*` 到 3000 |
| API 文档 | <https://www.iyouren.top/api/docs-ui> | OpenAPI / Swagger 交互式 |
| 全文搜索 | <https://www.iyouren.top/search> | ILIKE on title/summary/content |
| 关于页 | <https://www.iyouren.top/about> | 后台 admin 可编辑 |
| sitemap | <https://www.iyouren.top/sitemap.xml> | 给搜索引擎 |
| RSS feed | <https://www.iyouren.top/feed.xml> | 订阅源 |
| Android APK | <https://github.com/YouRen1320/Blog/releases/latest/download/app-release.apk> | latest tag 自动出包 |

### 管理员初始化

项目不提供默认管理员凭据。复制 `.env.example` 为未跟踪的 `.env`，显式设置
`ADMIN_EMAIL`、`ADMIN_USERNAME` 和 `ADMIN_PASSWORD`，完成迁移后运行：

```bash
pnpm --filter api admin:create
```

密码至少 12 个字符且不超过 bcrypt 的 72 字节限制。命令只负责首次创建；如果
邮箱已属于管理员，它不会修改密码；如果邮箱属于普通用户，它会安全失败。

---

## 项目结构

monorepo,五个独立可发布的应用 + 一个文档目录:

```
Blog/
├── apps/
│   ├── api/           # NestJS 主后端(用户/文章/分类/标签/评论/AI 调用代理)
│   ├── admin/         # Vue 3 后台(纯手写 CSS,无组件库)
│   ├── web/           # Nuxt 4 公开站(SSR + 主题)
│   ├── mobile/        # Flutter(Riverpod + go_router + dio)
│   └── ai-service/    # Python FastAPI(LLM + LangGraph Agent + BGE 本地 embedding)
├── docs/              # 决策日志 / 任务 journal / 各版本完成报告
├── scripts/           # 部署 / DB 备份 / 服务器初始化
├── docker-compose.yml         # 本地开发(只起 postgres)
├── docker-compose.prod.yml    # 生产 6 容器编排
└── Caddyfile                  # 自动 HTTPS 反代规则
```

每个 app 有自己的 README,**那里有具体功能说明 + 默认配置 + 本地开发命令**:

- [apps/api/README.md](apps/api/README.md) — NestJS API + Prisma + JWT + 速率限制 + 结构化日志
- [apps/admin/README.md](apps/admin/README.md) — Vue 3 后台 + 默认账号 + 全部业务页面
- [apps/web/README.md](apps/web/README.md) — Nuxt 4 SSR + RSS / sitemap
- [apps/mobile/README.md](apps/mobile/README.md) — Flutter 移动端,文章浏览 + 草稿提交
- [apps/ai-service/README.md](apps/ai-service/README.md) — Python AI 服务(MiMo OpenAI 协议)+ LangGraph + RAG

---

## 关键技术 / 设计决策

| 主题 | 选型 | 为什么 |
| --- | --- | --- |
| 后端框架 | NestJS + Prisma | 模块边界清晰,Prisma 类型推导贴合 TS 生态 |
| 公开站 | Nuxt 4 SSR | SEO 友好,server route 写 sitemap/feed 自然 |
| 后台 | Vue 3 + 手写 CSS | 文学风设计,UI 库 lock-in 太重 |
| 移动端 | Flutter + Riverpod | 一份代码出 iOS+Android,Riverpod 比 Provider 更可测 |
| AI 协议 | OpenAI 协议(小米 MiMo) | 之前误以为是 Anthropic 协议踩了坑(见 v1.1.1) |
| Agent 编排 | LangGraph(无 LangChain 主仓库) | 状态图比 chain 更可观测 + retry 友好 |
| Embedding | fastembed + BGE-small-zh-v1.5 | 中文好,本地 ONNX,~100ms,不烧 quota |
| 向量存储 | pgvector(同一个 Postgres) | 不引新组件,raw SQL `<=>` 操作符够用 |
| HTTPS | Caddy 自动 ACME | 0 配置,Let's Encrypt 自动续期 |
| 日志 | nestjs-pino + Loki(可选) | 生产 JSON,开发 pretty |
| 速率限制 | nestjs throttler 三档 | default/strict/ai,登录走 strict 5/min |
| 可观测性 | LangSmith tracing | env 驱动,代码 0 侵入 |

详见 `docs/decisions/` ADR 和各版本 `docs/V*-REPORT.md`。

---

## 本地开发

> 前置:Node 22 / pnpm 10 / Python 3.12 / Docker / Flutter 3.35。

```bash
# 1. 装依赖
pnpm install
cd apps/ai-service && python3.12 -m venv .venv && source .venv/bin/activate && pip install -e ".[dev]"

# 2. 起本地 Postgres(已含 pgvector 扩展)
docker compose up -d
pnpm db:logs           # 看启动日志,等 ready
pnpm --filter api db:migrate:deploy
pnpm --filter api seed:demo

# 3. 起所有服务(各开一个终端)
pnpm dev:api           # NestJS    :3000
pnpm dev:web           # Nuxt      :3100
pnpm dev:admin         # Vue Admin :5174
cd apps/ai-service && uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# 4. 移动端(可选)
cd apps/mobile && flutter pub get && flutter run
```

本地 demo seed 使用 `.env.example` 中独立的 `example.test` E2E 账号。它在
`NODE_ENV=production` 时会在连接数据库前拒绝执行。AI 生成默认走
`USE_MOCK_LLM=true`，要调用真实模型再显式配置 provider key。

---

## 生产部署

服务器是阿里云 ECS,运行 Aliyun Linux 3 + Docker。生产用 6 个容器编排:

```
┌────────── Caddy (80/443) — 自动 HTTPS ──────────┐
│   www.iyouren.top   →  web :3000  (Nuxt SSR)     │
│   www.iyouren.top/api → api :3000  (NestJS)       │
│   admin.iyouren.top → admin :3000 (Vue SPA)       │
└──────────────────────────────────────────────────┘
        │                  │                   │
   ┌────┴────┐    ┌───────┴───────┐    ┌──────┴──────┐
   │ web     │    │ api (NestJS)  │    │ admin       │
   │ Nuxt 4  │    │ Prisma + JWT  │    │ Vue 3 SPA   │
   └─────────┘    └───────┬───────┘    └─────────────┘
                          │
                          │ HTTP 内网调用
                          ↓
   ┌─────────────┐   ┌──────────────────────────┐
   │ postgres    │   │ ai-service (FastAPI)     │
   │ pgvector    │←──│ MiMo OpenAI 协议          │
   │ 数据 + 向量 │   │ LangGraph + BGE embedding │
   └─────────────┘   └──────────────────────────┘
```

### 自动化检查与部署

Pull Request 会在隔离的 pgvector 数据库上执行迁移、API 测试以及 API、Admin、
Web 构建，并保存以 commit SHA 命名的 Nuxt `.output` 产物。Pull Request 不会读取
生产 Secret，也不会部署。

只有 `main` 的 push 且所有检查通过后才会部署。部署任务下载同一次运行生成的 Web
产物，校验 SHA-256，通过已验证主机指纹的 SSH 传输；服务器随后检出同一个 commit，
拒绝覆盖未提交的已跟踪改动，并等待 Compose 服务进入健康状态。

GitHub 的 `production` Environment 需要配置：

- `SERVER_HOST`：服务器地址
- `SERVER_USER`：非 root 部署用户
- `SSH_PRIVATE_KEY`：权限受限的部署私钥
- `SERVER_DEPLOY_DIR`：服务器仓库目录，例如 `/opt/blog`
- `SERVER_SSH_FINGERPRINT`：从云厂商控制台或其他可信通道取得的 SSH 主机公钥 SHA-256 指纹

首次启用前还需确认服务器的 Docker Compose 支持 `up --wait`，且部署用户可写
`SERVER_DEPLOY_DIR`。原来的手动 `workflow_dispatch` 入口已移除，避免绕过“main push
对应唯一构建产物”的约束。

回滚时优先在 GitHub 上 revert 问题提交并推送到 `main`，让同一流水线重新构建和部署。
服务器会保留上一次 `.output.previous` 和按 SHA 存放的传输产物，供流水线不可用时人工
恢复；数据库迁移不承诺可逆，涉及数据库变更时仍需先按现有备份流程验证恢复。

部署具体步骤、Caddyfile 模板、systemd 备份 timer 等见 [`docs/V2-REPORT.md`](docs/V2-REPORT.md) 和 [`scripts/`](scripts/)。

---

## 版本历史

| Tag | 阶段 | 关键内容 |
| --- | --- | --- |
| v0.1.0 | V1 本地闭环 | NestJS + Prisma + Vue Admin + Nuxt 全部业务 |
| v0.3.0 | V3 移动端 | Flutter + Riverpod + go_router |
| v0.4.0 | V4 AI 生产 | FastAPI + LLM 调用 + 草稿审核流 |
| v0.5.0 | Final 加固 | 速率限制 + Pino 日志 + 全栈 Dockerfile |
| v1.0.0 | V2 真上线 | 阿里云 ECS + Caddy + 6 容器 + 每日备份 |
| v1.1.0 | AI2:RAG | pgvector + BGE + LangGraph(mock 链路) |
| v1.1.1 | AI2 补丁 | OpenAI SDK + 真 LLM 端到端 |
| v1.2.0 | 后台增强 | 改密码 + 批量回填 embedding + LangSmith 接线 |
| v1.3.0 | SEO + 评论 | sitemap+RSS + 站点设置持久化 + 评论审核流 |
| v1.4.0 ~ 4 | AI-Native 工程化 | streaming / LiteLLM / reranker / LangFuse / eval / OTel / checkpoint / e2e / APK CI |
| v1.5.0 | 产品落地 | 图床上传 + Whisper + OpenAPI/Swagger + 评论 AI 辅助 |
| v1.6.0 | 多用户 + 响应式 | 公开注册 + 文章 authorId 隔离 + admin/web mobile 适配 |
| v1.7.0 | 评论嵌套 | parentId 树状 + Gravatar 头像(email md5,不泄漏邮箱) |
| v1.8.0 | dashboard | StatsModule 一次 endpoint 11 条聚合 + 7 个 metric 卡 |
| v1.9.0 | /about 可编辑 | aboutMarkdown 字段 + admin Settings textarea |
| v1.10.0 | AI 起标签 | InlineAction 加 'tags',流末 split 自动勾选 |
| v1.11.0 | 用户管理 | /admin/users 列表 + 升降级 + 删除(自我保护) |
| v1.12.0 | 编辑器拖图 | content textarea paste/drop 自动 /uploads 插 markdown |
| v1.13.0 | 全文搜索 | ILIKE + 命中权重 + 关键词高亮 + footer 入口 |
| v1.14.0~15 | admin 列表内搜 | /articles 顶部 search,本地 title/slug substring 过滤 |
| v1.16.0 | 阅读体验 | writing/[slug] 顶部 3px scaleX 进度条 + 列表/详情 <720/480 响应式 |
| v1.17.0 | 评论审核增强 | 批量通过/拒绝 + AI 评估按钮 + 列表 Gravatar |
| v1.18.0 | 多用户作者列 | admin Articles ADMIN 视角加 AUTHOR 列(@username) |
| v1.19.0 | 评论闭环 UX | AdminShell PENDING 暖红 badge + 公开列表 _count.comments + 首页 💬 N |
| **v1.20.0** | **相关文章** | **GET /articles/:slug/related 同分类最新 3 篇 + 详情页底部 RELATED 卡片** |

每个 tag 都有对应的 `docs/V?-REPORT.md` 完成报告 + `docs/journal/*.md` 决策与踩坑记录。

---

## 文档

- [`docs/00-roadmap.md`](docs/00-roadmap.md) —— 项目路线图(V1 → V1.20)
- [`docs/V*-REPORT.md`](docs/) —— 各版本完成报告
- [`docs/journal/`](docs/journal/) —— 每个任务的决策 + 踩坑日志
- [`docs/decisions/`](docs/decisions/) —— ADR(架构决策)

> 阅读建议:先看 `00-roadmap.md` 拿全貌,然后挑一个版本的 REPORT,跟着 journal 还原过程。代码告诉你做了什么,journal 告诉你为什么这么做。

---

## 项目定位

不以商业化为目标,做的是**系统化训练**:

- 全栈协作(5 个独立技术栈)
- 工程化(monorepo / 单测 / migration / 速率限制 / 结构化日志)
- AI 应用落地(RAG / Agent / 协议错判后的复盘)
- 生产部署(HTTPS / 备份 / 健康检查 / 跨域 IP 路由)
- 复盘文化(每个版本写完整 REPORT + 每个任务写 journal)

如果你也想从零做一遍,**docs/ 目录是入口**。
