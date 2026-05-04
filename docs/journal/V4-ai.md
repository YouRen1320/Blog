# V4 AI 内容生产(整体)

**日期**:2026-05-05
**任务**:#25 ~ #30(V4-01 Python 基建 → V4-06 移动端接通)
**状态**:已完成

> 跟 V3 一样合并写。V4 跨语言(Python + TS),分散写日志反而看不清链路。

## 目标

把"用户描述创作意图 → AI 生成结构化草稿 → 落进草稿箱待审"这条链路从零打通。

**完整链路**:
```
Mobile App (/create)
   ↓ POST /admin/ai/drafts (NestJS)
NestJS AiModule
   ↓ HTTP POST /generate/article (Python)
ai-service (FastAPI)
   ↓ Anthropic SDK with custom base_url
小米 MiMo (Claude API 兼容)
   ↓ structured tool_use 返回
ai-service 解析 → 返回结构化草稿
   ↓
NestJS 用 Prisma upsert tags → 创建 article (status=DRAFT)
   ↓
Admin /inbox 看到草稿 → 编辑 → 发布
   ↓
Web /writing 读者看到
```

**验收**:USE_MOCK_LLM=true 模式下,从手机或后台输入 prompt → 后台收件箱出现新草稿 → 正常进入审核 → 发布到 web。

## 关键决策

### 1. Python 微服务,不是把 AI 嵌进 NestJS
**备选**:NestJS 直接用 anthropic-typescript SDK 调小米 MiMo
**已选**:Python FastAPI 单独服务

理由:
- AI 生态在 Python 最成熟(LangChain / LlamaIndex / DSPy / unstructured)。**V4 只是入门,V5+ 加 RAG / Agent 时 Python 不可替代**
- 内容生成是慢 IO,Python async 一样能扛
- 隔离心智成本:NestJS 只管业务,Python 只管模型;改提示词不用重启 NestJS
- 部署独立:扩缩容粒度更细,出问题不连坐主后端

### 2. NestJS 中转,移动端不直接打 ai-service

**备选**:Mobile → ai-service(更短)
**已选**:Mobile → NestJS → ai-service ✅

理由:
- 鉴权:ai-service 没有自己的用户体系。NestJS 的 ADMIN 守卫已经在,直接复用
- 落库:生成的草稿立刻写 articles 表,这必须由有 DB 连接的 NestJS 做
- 速率限制 + 配额追踪未来加在 NestJS,集中控制
- 跨域:ai-service 不暴露给浏览器 / 移动端,**减少攻击面**

### 3. Anthropic SDK + base_url 复用,不裸 fetch

**备选 A**:用 httpx 自己写 HTTP 客户端
**备选 B**:用 anthropic SDK 但改 `base_url` ✅

小米 MiMo 文档 URL 含 "claudecode" 强烈暗示是 Claude API 兼容协议(同样的 /v1/messages 端点 + 同样的请求/响应 schema)。
Anthropic 官方 Python SDK 支持 `AsyncAnthropic(base_url=...)`,只要服务端协议匹配就能直接用。

**好处**:
- 不需要手写 retry / streaming / 错误码处理
- 类型完整(Message / ContentBlock / ToolUseBlock)
- 后期换真 Anthropic 只改 base_url,不改业务代码

**风险**:小米 MiMo 的 endpoint 路径可能跟 Anthropic 略不同(`/v1/messages` vs `/anthropic/v1/messages`)。`.env.example` 写的是 `https://platform.xiaomimimo.com/anthropic`,真实 endpoint 用户在控制台确认。
USE_MOCK_LLM=true 模式让我们**完整跑通骨架不耗 quota**;待用户验证 endpoint 后切换。

### 4. tool_use 强制 JSON 输出

**备选 A**:让模型自由输出,正则提 JSON
**备选 B**:tool_use(声明工具 schema,模型必须用工具)✅

我们声明了一个 `save_article_draft` 工具,把所有需要的字段(title / slug / summary / content / tags / category_slug)放进 input_schema。然后 `tool_choice={"type": "tool", "name": "save_article_draft"}` 强制模型必须调用这个工具。

**这是 LLM 结构化输出的工业级做法**。比 JSON mode 更稳:
- input_schema 可以加 description 引导
- 模型自己明白这是"调用",不是"生成假装是 JSON 的文本"
- 输出格式由模型 SDK 解析,不需要业务代码做 string parsing

### 5. 标签 / 分类的"模糊匹配"
LLM 输出:`tags: ["NestJS", "Prisma", "Backend"]`、`category_slug: "backend"`。
NestJS AiService 接到后:
- **分类**:按 slug 严格查;查不到 → 留空(LLM 不能凭空建分类)
- **标签**:按 slug(`makeSlug(name)`)upsert;不存在自动建。每个标签会出现在 admin 标签管理页

这是"严控分类、放开标签"的策略:分类是分类法的骨架,要人工把控;标签是细粒度,自然增长。

### 6. slug 冲突处理
LLM 给的 slug 可能跟现有 article 重复。我们的方案:
```ts
if (exists) slug = `${slug}-${Date.now().toString(36)}`;
```
加 base36 时间戳后缀。这是粗暴但可靠的兜底。**不抛异常导致整个生成失败**,因为模型已经吐了 4000 token 的内容,扔掉太可惜。

### 7. USE_MOCK_LLM=true 当默认开发模式

`.env` 里默认开启 mock。理由:
- 开发期反复调试链路,真调 API 浪费 quota
- mock 返回的 schema 跟真实输出完全一致,**前端联调零差别**
- 切到真模型只需改一行 `USE_MOCK_LLM=false`,无代码改动

**这种"默认 mock + 显式开真"是 LLM 应用的最佳实践**。生产环境的 .env 自然是 false。

### 8. 60 秒 + 90 秒的特别 timeout
默认 dio / fetch 超时 15 秒,LLM 生成可能 20-40 秒。
- mobile 端:`Options(sendTimeout: 60s, receiveTimeout: 90s)`
- NestJS 走 fetch 没显式超时(Node 18+ fetch 默认无超时)

## 实际产出

```
apps/ai-service/                        新建
├── pyproject.toml                      hatchling + fastapi + anthropic
├── .env / .env.example                 配置
├── main.py                             FastAPI 入口 + /healthz
└── app/
    ├── core/config.py                  pydantic-settings 集中配置
    ├── api/generate.py                 POST /generate/article
    ├── schemas/draft.py                DraftRequest / DraftResponse
    └── services/
        ├── mimo_client.py              AsyncAnthropic + base_url
        └── article_generator.py        prompt 编排 + tool_use + mock

apps/api/src/modules/ai/                新建
├── ai.module.ts
├── ai.controller.ts                    @Controller('admin/ai') @Roles('ADMIN')
├── ai.service.ts                       fetch ai-service + 落库 + 标签 upsert
└── dto/create-draft.dto.ts             prompt + tone + length 校验

apps/admin/src/api/ai.ts                新建,前端 client
apps/admin/src/views/AIInbox.vue        改写:接真草稿 + 顶部 prompt 表单

apps/mobile/lib/services/ai_service.dart  新建
apps/mobile/lib/providers/ai_provider.dart 新建
apps/mobile/lib/pages/create_request_page.dart 改写:真接 NestJS
```

## 踩坑 / 注意

### 坑 1:小米 MiMo 真实 endpoint 待用户验证
我猜的 base_url 是 `https://platform.xiaomimimo.com/anthropic`(根据"claudecode"集成文档名推断)。如果 Endpoint 实际不同,V4-07 验收时切到 USE_MOCK_LLM=false 跑一次会立刻看到 401/404,改 .env 即可。代码不需要改。

### 坑 2:Python 3.14 + FastAPI 0.136 的小不兼容
默认 fastapi 在 Python 3.14 下安装会拉一些较新的 transitive(annotated_doc 等),没大碍但有 warn。生产可锁 Python 3.12 / 3.13 更稳。

### 坑 3:Node 18+ fetch 默认无超时
ai.service.ts 里没显式 timeout。如果 ai-service 卡死,NestJS 会一直等。
**改善方法**:用 AbortController + setTimeout。当前 V4 不做,Final 阶段加。

### 坑 4:NestJS env validation 必须更新
新加的 AI_SERVICE_BASE_URL 如果不在 EnvVariables 里,ConfigService 读得到但 IDE 不知道。同时如果你忘了在 .env 写它,启动期校验会通过(因为 @IsOptional),但 service 里读到 undefined 会拼出 `undefined/generate/article`。所以加了 default。

### 坑 5:admin AIInbox 复用 articles list API
我没单独建一个 `/admin/articles?source=AI`。理由:草稿就是草稿,不论谁建的都该出现在收件箱里。**手动建的草稿、移动端建的、AI 建的统一**,运维心智简单。
未来想区分时,在 articles 表加 `source` 字段(MANUAL / AI)即可,API 加一个 query。

### 坑 6:tool_use 名字必须匹配
`tool_choice={"type": "tool", "name": "save_article_draft"}` 跟 tool 定义里的 `"name": "save_article_draft"` 必须**严格相等**。我把它提到模块顶部 `_DRAFT_TOOL["name"]` 用变量,避免手误。

## 验收记录

```
# 1. ai-service 启动
$ cd apps/ai-service && .venv/bin/uvicorn main:app --port 8001
✓ /healthz → 200

# 2. NestJS 启动(读根 .env 的 AI_SERVICE_BASE_URL)
$ pnpm --filter api start:prod
✓ /admin/ai routes mapped

# 3. 端到端
$ curl -X POST localhost:3000/admin/ai/drafts \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"prompt":"NestJS 模块化","tone":"technical","length":"medium"}'
✓ 返回:id=cmorn26da... title=[MOCK] NestJS 模块化 status=DRAFT
       tags=[AI, mock, dev]

# 4. DB 验证
$ psql ... "SELECT title, status FROM articles WHERE slug='mock-ai-draft'"
[MOCK] NestJS 模块化 | DRAFT

# 5. 回归测试
$ pnpm --filter api test     → 13 passed
$ pnpm --filter admin build  → ok
$ pnpm --filter web build    → ok
$ flutter analyze (mobile)   → no issues
```

## 给学习者的提醒

- **AI 用 Python 微服务,不是把 LLM 库塞进主后端**。生态决定胜负,不是技术决定胜负。
- **NestJS 中转的设计永远要有**:鉴权 / 配额 / 落库 / 审计都在主后端最自然。微服务直接暴露给客户端是反模式。
- **tool_use 是结构化输出的事实标准**。比 JSON mode 更稳,比正则提取强一万倍。
- **USE_MOCK_LLM 是 LLM 应用必备开关**。不只是为了省钱,也为了让 e2e 测试稳定可重复(真模型每次输出不一样,测不了 string match)。
- **slug / tag 自动消解冲突 / upsert** 是 AI 生成场景的常见模式:模型输出无法控制,业务代码必须容错。
- **超时设置要分层**:LLM 慢,要专门给 AI 端点拉长 timeout;不能用全局默认值。
- **microservice 间通信不要用 httpx + 自己写**,SDK 已经处理了 retry / streaming / 类型,直接用即可。
