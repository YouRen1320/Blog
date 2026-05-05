# Blog —— 全栈博客 + AI 内容生产

一个个人博客 vibe coding 项目。从空仓库开始,做完一整套**前后端 + 移动端 + AI 生成 + RAG 检索 + 生产部署**。

**当前版本**:`v1.3.0` · **生产环境已上线**

---

## 在线访问

| 入口 | 地址 | 说明 |
| --- | --- | --- |
| 公开博客 | <https://www.iyouren.top> | Nuxt SSR,所有人可访问 |
| 后台管理 | <https://admin.iyouren.top> | 登录后管理文章 / 草稿 / 评论 / 设置 |
| API 接口 | <https://www.iyouren.top/api> | NestJS,Caddy 反代 `/api/*` 到 3000 |
| sitemap | <https://www.iyouren.top/sitemap.xml> | 给搜索引擎 |
| RSS feed | <https://www.iyouren.top/feed.xml> | 订阅源 |

### 默认管理员账号

```
邮箱:admin@iyouren.top
密码:admin12345
```

> 第一次登录建议立刻去 **/settings → AUTH · 改密码** 改一个新密码。
> 数据库种子在 V1 阶段创建了这个账号,部署后没改过。

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
cd apps/api && pnpm prisma migrate deploy && pnpm prisma db seed

# 3. 起所有服务(各开一个终端)
pnpm dev:api           # NestJS    :3000
pnpm dev:web           # Nuxt      :3100
pnpm dev:admin         # Vue Admin :5174
cd apps/ai-service && uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# 4. 移动端(可选)
cd apps/mobile && flutter pub get && flutter run
```

本地登录用上面的默认账号。AI 生成默认走 `USE_MOCK_LLM=true` 不烧 quota,要真生成把 `apps/ai-service/.env` 里换成 `false` + 配 MiMo key。

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
| **v1.3.0** | **SEO + 评论** | **sitemap+RSS + 站点设置持久化 + 评论审核流** |

每个 tag 都有对应的 `docs/V?-REPORT.md` 完成报告 + `docs/journal/*.md` 决策与踩坑记录。

---

## 文档

- [`docs/00-roadmap.md`](docs/00-roadmap.md) —— 项目路线图(V1 → V1.3)
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
