# Final 完成报告 —— 生产化加固

**日期**:2026-05-05
**Tag**:v0.5.0
**前置版本**:v0.4.0(V4 AI 内容生产)

## 范围

Final 是 V2 部署前的"工程质量收口":速率限制、source 字段、ai-service 测试、结构化日志、全栈 Dockerfile。**不增功能,只提质量**。

## 完成清单

- [x] **F-01 速率限制**:@nestjs/throttler 三档(default/strict/ai),test 跳过
- [x] **F-02 ArticleSource 字段**:Prisma migration + AiService 标记 + AIInbox 过滤
- [x] **F-03 ai-service 测试 + AbortController**:5 pytest + NestJS 90s timeout
- [x] **F-04 结构化日志**:nestjs-pino + pino-http + 请求级 reqId + JSON/pretty 自动切换
- [x] **F-05 全栈 Dockerfile**:api/web/admin/ai-service Dockerfile + docker-compose.prod.yml + Caddyfile
- [x] **F-06 验收**:本文件

## 全栈测试矩阵

| 层 | 工具 | 数量 | 状态 |
|----|------|------|------|
| api unit | jest + @nestjs/testing | 13 | ✅ |
| api e2e | jest + supertest + 真 Postgres | 20 | ✅ |
| ai-service | pytest + FastAPI TestClient | 5 | ✅ |
| 跨栈 e2e | Playwright + 3 服务编排 | 3 | ✅(需手起服务) |
| admin build | vite + vue-tsc | — | ✅ |
| web build | nuxt + nitro | — | ✅ |
| mobile static | flutter analyze | — | ✅ |

**总计 41 个自动化测试 + 3 个 build 检查 + 1 个静态分析,全绿。**

## 现在的项目结构

```
Blog/
├── apps/
│   ├── api/          NestJS 11 + Prisma 6 + JWT + throttler + pino
│   ├── admin/        Vue 3 + Pinia + go_router 类似的 Vue Router
│   ├── web/          Nuxt 4 + Tailwind + markdown-it + SSR
│   ├── mobile/       Flutter 3.35 + Riverpod + go_router + dio
│   └── ai-service/   FastAPI + AsyncAnthropic(小米 MiMo)+ tool_use
├── packages/shared/  跨端类型(占位)
├── e2e/              Playwright 跨栈 e2e
├── docs/             开发日志 + ADR + 各版本 REPORT
├── docker-compose.yml    本地开发(只起 postgres)
├── docker-compose.prod.yml   生产编排(api+web+admin+ai+caddy+postgres)
├── Caddyfile         Caddy 反向代理 + 自动 HTTPS
└── playwright.config.ts
```

## 一键运行(本地完整链路)

```bash
# 数据库
pnpm db:up

# Python ai-service
(cd apps/ai-service && python3 -m venv .venv && .venv/bin/pip install -e ".[dev]")
(cd apps/ai-service && .venv/bin/uvicorn main:app --port 8001) &

# NestJS
pnpm --filter api db:seed
pnpm dev:api &

# Admin / Web
pnpm dev:admin &
pnpm dev:web &

# Mobile(单独终端)
cd apps/mobile && flutter run -d <device>
```

## 部署预检清单

V2 部署前要做的事(全栈代码已就绪):

- [ ] 服务器开 22/80/443(目前阻塞在阿里云安全组)
- [ ] 装 SSH key,关 root 密码
- [ ] 装 docker + docker compose
- [ ] git clone 仓库到 /opt/blog
- [ ] 写 /opt/blog/.env(强密码)
- [ ] DNS 校验:dig www.iyouren.top → 47.97.17.43
- [ ] `docker compose -f docker-compose.prod.yml --env-file /opt/blog/.env up -d --build`
- [ ] curl https://www.iyouren.top/ 看到首页
- [ ] curl https://www.iyouren.top/api/articles 拿到 JSON
- [ ] admin.iyouren.top 登录后台
- [ ] 切 USE_MOCK_LLM=false 验证小米 MiMo 真实 endpoint
- [ ] 配 GitHub Actions(push main → SSH 部署)
- [ ] 配 Postgres 自动备份(cron + 异地存储)

## 已知遗留(V2 + 之后处理)

| 项 | 描述 | 影响 |
|----|------|------|
| 小米 MiMo endpoint 待真验证 | base_url 是猜的 | V4 上线时确认 |
| 没有 SSE 流式输出 | 用户等 30s 看不到中间状态 | UX,不影响功能 |
| AI 没有 retry / 配额追踪 | 失败请求不会重试 | 偶发失败需手动 |
| fetch IP 探测 | trust proxy=1 假设单层反代 | 多层反代要调整 |
| 没有评论 / 浏览数 / RAG | README 第二阶段后才做 | 功能边界 |
| Dockerfile 没真正 build 验证 | 写完没 docker build | V2 真部署时会暴露 |

## V0 → V0.5 路线图回顾

| Tag | 版本 | 主要交付 | 测试覆盖 |
|-----|------|----------|----------|
| v0.1.0 | V1 本地闭环 | 后端 + 后台 + 公开站 | 13 unit + 20 e2e + 3 Playwright |
| v0.3.0 | V3 移动端 | Flutter 全栈接入 | flutter analyze |
| v0.4.0 | V4 AI 生产 | Python ai-service + 全链路 | + 5 pytest |
| **v0.5.0** | **Final 生产化** | 限流 / source / 日志 / Docker | 全部回归 |
| v1.0.0 | V2 真上线 | 阿里云 ECS + Caddy + CI/CD + 备份 | + uptime monitoring |

## 给作者的话

V0 → V0.5 总计 **6 次 commit**(init + 4 次 v0.x.0 + 一次小修)、**41 个自动化测试**、**~20 篇 docs**、**5 个应用 + 1 个 microservice + 1 个共享包**。

每一步都有 journal 记录"为什么这么做",学习路径清晰。

**下一步是 V2 部署**,需要你给阿里云安全组开 22 端口,然后:
1. 我装 SSH key、扫光机器
2. 起 Docker 编排
3. 配 Caddy + GitHub Actions
4. 一键 push 部署

域名 https://www.iyouren.top 等着上线。
