# 项目路线图

记录目标是"做一个能上线的全栈博客 + AI 内容生产系统",分 5 个版本推进。

## 版本概览

> **2026-05-05 调整**:用户决定先把所有功能(web / admin / mobile / 后端 / AI)开发完整再上线,把 V2 部署挪到最后。原 V1→V2→V3 顺序变成 V1→V3→V4→Final→V2。

| 版本 | 状态 | 范围 | 验收标准 |
|------|------|------|----------|
| **V1** —— 本地闭环 | ✅ 完成 (v0.1.0) | DB + Prisma + auth + 文章/分类/标签 CRUD + 发布 + Admin 全功能 + Web 接 API + 种子数据 | 本地 `docker compose up` 后,登录后台 → 写文章 → 发布 → web 能看到 |
| **V3** —— 移动端 | ✅ 完成 (v0.3.0) | Flutter 登录 / 文章列表 / 详情 / 草稿 CRUD / 文本+语音创作入口(语音占位) | flutter analyze 全绿,APK 可构建,登录看草稿主链路通 |
| **V4** —— AI 生产 | ✅ 完成 (v0.4.0) | Python ai-service(FastAPI) + 小米 MiMo 模型 + 结构化输出 + NestJS `/ai/*` 接入 + 草稿审核流 | mock 模式全链路通,真模式待小米 MiMo endpoint 验证 |
| **Final** —— 生产化 | ✅ 完成 (v0.5.0) | 速率限制 + ArticleSource 字段 + ai-service 测试 + 结构化日志 + 全栈 Dockerfile | 41 个测试全绿,Dockerfile + Caddyfile + compose.prod 就绪 |
| **V2** —— 真上线 | ✅ 完成 (v1.0.0) | 服务器初始化 + Caddy 自动 HTTPS + 域名解析 + 生产 docker-compose + GitHub Actions workflow + 每日备份 + 全栈健康检查 | https://www.iyouren.top 可访问,6 容器全部 Up,首次自动备份成功 |
| **AI2** —— RAG + LangGraph | ✅ 完成 (v1.1.1) | pgvector + BGE 本地 embedding + LangGraph(retrieve→generate)+ NestJS 发布时异步 embed + MiMo OpenAI SDK | 真 LLM 生产端到端通,RAG 命中"第一灯"+ 草稿引用风格 |
| **V1.2** —— 后台增强 + 可观测性 | ✅ 完成 (v1.2.0) | 改密码 endpoint + 批量回填 embedding 按钮 + LangSmith tracing 环境变量接线 | 16 个 jest 全绿、改密码 401/400/200 路径生产验证、backfill 真路径 1/1 processed |
| **V1.3** —— SEO + 站点设置 + 评论 | ✅ 完成 (v1.3.0) | sitemap.xml + RSS feed(Nuxt server route)+ SiteSetting 单表 + 完整评论系统(后端 + admin 审核 + web 公开) | 生产 sitemap/feed XML 输出 + admin /comments 列表 + 评论 PENDING→APPROVED 全流程通 |
| **V1.4** —— AI-Native 工程化补完 | ✅ 完成 (v1.4.0) | 流式 SSE UI + 编辑器内联 AI(5 action)+ LiteLLM 多模型路由 + BGE-reranker + LangFuse + Promptfoo eval + OpenTelemetry + LangGraph checkpoint + Playwright e2e 11 个 | 16 jest + 5 pytest + 11 e2e + LiteLLM 真调 MiMo 验证 + promptfoo 配置通过 |
| **V1.5** —— 产品落地补完 | ✅ 完成 (v1.5.0) | 图床/封面上传 + Whisper 语音 + OpenAPI/Swagger + 评论 AI 辅助 + web APK 下载入口 | 16 jest + 5 pytest + admin/web/mobile build 全过 + GH Actions APK auto-build |
| **V1.6** —— 多用户 + 响应式 | ✅ 完成 (v1.6.0) | POST /auth/register + 文章 authorId 隔离(USER 只看自己)+ admin sidebar 改顶栏 + web 关键页 < 720/480 适配 | 17 jest + 公开注册返 USER role + 6 容器 healthy(磁盘 99% → 30%) |
| **V1.7** —— 评论嵌套 + Gravatar | ✅ 完成 (v1.7.0) | parentId 树状渲染 + email md5 头像(authorEmailHash 不返原 email) | 7 凌晨夜班连续 7 个 minor tag 之 1 |
| **V1.8** —— 博客统计 dashboard | ✅ 完成 (v1.8.0) | StatsModule 一次 endpoint 11 条聚合 + admin Dashboard 重写 7 metric | 待审 PENDING 跳转 + Today 卡 |
| **V1.9** —— /about admin 可编辑 | ✅ 完成 (v1.9.0) | SiteSetting 加 aboutMarkdown + admin Settings textarea + web markdown-it 渲染 | 替换原硬编码 |
| **V1.10** —— AI 起标签 | ✅ 完成 (v1.10.0) | InlineAction 加 'tags',编辑器流末 split 匹配 / 自动勾选 / 新词建议 | LLM 输出"逗号分隔" |
| **V1.11** —— 用户管理 | ✅ 完成 (v1.11.0) | /admin/users 列表 + 升降级 + 删除,自我保护(防自删 / 防最后一个 ADMIN) | 配合 V1.6 多用户 |
| **V1.12** —— 编辑器拖拽图片 | ✅ 完成 (v1.12.0) | content textarea paste/drop 监听,串行上传 + 光标处插 markdown | 写文章不用先去图床 |
| **V1.13** —— 全文搜索 | ✅ 完成 (v1.13.0) | ILIKE %q% on title/summary/content + 命中权重 + /search 页 + 关键词高亮 | footer 加 🔍 入口 |

---

## V1:本地闭环(当前进行中)

| 任务 | 标题 | 关键产出 |
|------|------|----------|
| V1-01 | 工程基建 | `.env` 体系、根 `pnpm` 脚本、`packages/shared` |
| V1-02 | 数据库建模 | Prisma schema + migration + seed |
| V1-03 | NestJS 基础设施 | PrismaModule + ConfigModule + Auth + JWT + Guards |
| V1-04 | 业务接口 | Articles/Categories/Tags + 公开接口 |
| V1-05 | API 测试 | 单测 + e2e |
| V1-06 | Admin 基础 | API 客户端、auth store、登录页、路由守卫 |
| V1-07 | Admin 业务页面 | Dashboard + 文章/分类/标签管理 + 编辑器 |
| V1-08 | Web 接 API | composables + 内容页 + SEO |
| V1-09 | 端到端测试 | Playwright 跨 admin+web 主链路 |
| V1-10 | V1 验收 | 报告 + tag v0.1.0 |

---

## V2:真上线(规划中)

后续展开。关键点:
- 选 Caddy 而非 Nginx,因为零配置自动 HTTPS([见 ADR](decisions/0002-https-caddy-vs-nginx.md) 待写)
- GitHub Actions push 触发服务器拉镜像 + 重启
- Postgres 数据卷自动备份(每日 cron + 异地存储)
- 服务器先把 root 密码登录关掉,改 SSH 密钥

---

## V3:移动端(规划中)

- Flutter + Riverpod
- 同一份代码出 iOS + Android
- iOS 编译需要 Mac + Apple ID,作者本地处理
- Android 直接出 APK

---

## V4:AI 生产(规划中)

- Python FastAPI 单独服务
- 小米 MiMo 模型(Claude API 兼容协议,API key 走环境变量)
- 草稿落库到 articles 表,status=DRAFT
- AI **不直接发布**,审核权一定在 admin 手里

---

## Final:生产化(规划中)

- Loki + Promtail + Grafana(或 Uptime Kuma)
- API rate limit + 防爆破
- 测试覆盖率达标
- 性能 profiling
- 完善公开文档

---

## 维护约定

- 每个任务完成后,在 `docs/journal/` 新增一篇日志
- 每个跨版本/跨任务的重大决策,在 `docs/decisions/` 新增一份 ADR
- 这份 roadmap 随进度更新,不删旧版,但用 ✅ 标完成
