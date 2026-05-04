# V4 完成报告 —— AI 内容生产

**日期**:2026-05-05
**Tag**:v0.4.0
**前置版本**:v0.3.0(V3 移动端)

## 范围

V4 引入 Python `apps/ai-service` 微服务 + NestJS 中转 + 端到端 AI 草稿生产链路。

## 完成清单

### Python ai-service
- [x] FastAPI scaffold(pyproject.toml / hatchling)
- [x] pydantic-settings 集中配置 + .env / .env.example
- [x] AsyncAnthropic 客户端,支持 base_url override(指向小米 MiMo)
- [x] POST `/generate/article` 接口
- [x] tool_use 强制 JSON 结构化输出
- [x] USE_MOCK_LLM=true 默认 mock 模式,不耗 quota
- [x] /healthz 健康检查

### NestJS AiModule
- [x] `POST /admin/ai/drafts`(ADMIN-only)
- [x] HTTP 调 ai-service(Node 18+ 自带 fetch)
- [x] 落库到 articles 表(status=DRAFT)
- [x] 标签 upsert by slug(LLM 输出的标签自动建)
- [x] 分类按 slug lookup(找不到留空)
- [x] slug 冲突自动加时间戳后缀
- [x] env validation 加 AI_SERVICE_BASE_URL

### Admin AIInbox
- [x] /inbox 改写:列表显示真实 DRAFT 文章
- [x] 顶部 prompt + tone + length + 生成按钮
- [x] 选中草稿预览 → 编辑器审核

### Mobile
- [x] ai_service.dart + ai_provider.dart
- [x] /create 真接 `/admin/ai/drafts`(60s/90s timeout)
- [x] 成功后跳 /drafts 列表

### 文档
- [x] `docs/journal/V4-ai.md`
- [x] `docs/V4-REPORT.md`(本文件)
- [x] `.gitignore` 加 Python 产物

## 启动顺序(本地完整链路)

```bash
# 1. Postgres
pnpm db:up

# 2. ai-service
cd apps/ai-service
python3 -m venv .venv && .venv/bin/pip install -e .
.venv/bin/uvicorn main:app --port 8001 --reload

# 3. NestJS
pnpm --filter api start:prod   # 端口 3000

# 4. Admin
pnpm --filter admin dev        # 端口 5174

# 5. Mobile(可选,实机测试)
cd apps/mobile && flutter run -d <device>
```

## 验收(已自动通过)

```
$ curl http://127.0.0.1:8001/healthz                                  → {"status":"ok"}
$ curl -X POST http://127.0.0.1:8001/generate/article -d '{...}'      → 200 mock draft
$ curl -X POST http://127.0.0.1:3000/admin/ai/drafts -H Bearer $TOKEN
   -d '{"prompt":"...","tone":"technical","length":"medium"}'         → 201 article DRAFT
$ DB query                                                            → 1 row
$ pnpm --filter api test                                              → 13/13 unit pass
$ pnpm --filter admin build                                           → ok
$ pnpm --filter web build                                             → ok
$ flutter analyze (mobile)                                            → no issues
```

## 切换到真实 LLM

当前 USE_MOCK_LLM=true。验证小米 MiMo:

```bash
# 1. 确认 .env(根目录)的 XIAOMI_MIMO_BASE_URL 是真实端点
#    我猜的是 https://platform.xiaomimimo.com/anthropic,需在控制台确认

# 2. 切到真实模式
sed -i '' 's/USE_MOCK_LLM=true/USE_MOCK_LLM=false/' apps/ai-service/.env

# 3. 重启 ai-service,再发一次请求
#    第一次会真调外部 API,消耗 1 次 quota
```

如果 endpoint 错,会得到 401 / 404 / DNS 错误。改 base_url 重试即可,**业务代码不变**。

## 已知技术债

1. **真实 endpoint 待用户验证**:base_url 是猜的
2. **没有 SSE 流式输出**:用户等 30 秒看不到中间状态。Final 阶段加
3. **没有 retry / 限流 / 配额追踪**:Final 阶段加
4. **AI 草稿没标记**:articles 表里看不出哪些是 AI 生成。Final 阶段加 source 字段
5. **没有 RAG**:V5/V6 才做(原 README 第三阶段第 3-4 步)
6. **fetch 无 timeout**:NestJS 调 ai-service 没设 AbortController,卡死时会一直挂

## 下一步:Final 生产化

V4 完成后直接进 Final:
- 日志聚合(loki / grafana)
- 监控 + 健康检查全套
- API rate limit + 防爆破
- 测试覆盖率提升(ai 服务 / 模块测试)
- 性能 profiling
- 可观测性 dashboard

之后才进 V2 部署到阿里云 ECS。
