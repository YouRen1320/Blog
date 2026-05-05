# apps/ai-service —— Python AI 服务

FastAPI + LangGraph + 小米 MiMo(OpenAI 协议)+ 本地 BGE embedding。负责文章生成、RAG 检索、向量化。

**对外**:不直接公开,通过 NestJS 反代调用
**内部端口**:`8001`(docker-compose 服务名 `ai-service`)
**本地端口**:`8001`

---

## 功能 endpoint

```
GET    /healthz                 健康检查(无认证)
POST   /generate/article        生成草稿(走 LangGraph: retrieve → generate)
POST   /embed                   文本 → 512 维向量
GET    /embed/info              embedding 模型信息
```

调用方:

- NestJS `AiService` 调 `/generate/article`(用户在 admin /inbox 或 mobile 创作时)
- NestJS `EmbeddingService` 调 `/embed`(文章发布后异步 embed,或 admin 触发批量回填)
- 直连 Postgres 做 RAG 检索(读 `articles.embedding`)

---

## 技术栈

- **FastAPI** + uvicorn
- **OpenAI SDK** 1.50+(指 `https://api.xiaomimimo.com/v1`,模型 `mimo-v2.5-pro`)
- **LangGraph** 0.2+(`langchain-core` 间接依赖,**不引 LangChain 主仓库**)
- **fastembed** + `BAAI/bge-small-zh-v1.5`(ONNX,512 维,~100ms,完全离线)
- **psycopg 3** + **pgvector**(直连 Postgres 做 RAG 检索)
- **pydantic-settings**(`Settings` 单例 + lru_cache)

## LangGraph 状态图

```
START → retrieve_node → generate_node → END
        │              │
        BGE embed       MiMo /chat/completions
        + pgvector      + tool_choice(JSON 严格输出)
        cosine 检索
```

代码在 `app/services/agent.py`:

- `retrieve_node`:对 prompt embed,在 articles 里找 top-K 相似旧文(`min_similarity=0.5`),失败容错
- `generate_node`:把 retrieved 拼进 system prompt,走 OpenAI function calling 强制结构化 JSON

## 主要目录

```
app/
├── api/
│   ├── generate.py     # POST /generate/article
│   └── embed.py        # POST /embed
├── services/
│   ├── mimo_client.py  # AsyncOpenAI 客户端单例(指 MiMo)
│   ├── article_generator.py  # 单次生成(legacy,/generate 还在用)
│   ├── agent.py        # LangGraph 状态图(retrieve → generate)
│   ├── retriever.py    # RAG 检索(pgvector 直查)
│   └── embedder.py     # BGE 模型加载 + embed_text
├── schemas/draft.py    # DraftRequest / DraftResponse
└── core/config.py      # Settings(从 .env 读)
```

---

## 配置

`.env`(本地)或 docker env(生产):

```env
AI_SERVICE_PORT=8001
LOG_LEVEL=INFO

# 小米 MiMo(OpenAI 兼容)
XIAOMI_MIMO_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
XIAOMI_MIMO_BASE_URL=https://api.xiaomimimo.com/v1
XIAOMI_MIMO_MODEL=mimo-v2.5-pro

# 开发期省 quota:走假数据
USE_MOCK_LLM=false

# RAG 直查 articles 表
DATABASE_URL=postgresql://blog:blog@localhost:5432/blog

# 可选:LangSmith tracing(开了会发节点 trace 到 smith.langchain.com)
LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=blog-ai
```

> 注意:LangGraph 自动检测 `LANGCHAIN_TRACING_V2`,**关闭时代码完全不调** smith.langchain.com。

---

## 本地开发

需要 Python 3.12(3.14 没 `py-rust-stemmers` wheel)。

```bash
# 1. venv + 装依赖(项目用 pyproject.toml)
cd apps/ai-service
python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# 2. 起 Postgres(从仓库根)
cd ../../
docker compose up -d

# 3. 启动
cd apps/ai-service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# 4. 测试
pytest                 # 5/5,mock 模式覆盖输入校验 + 输出 schema
```

首次 `/embed` 或 `/generate/article` 会下载 BGE 模型(`HF_ENDPOINT=https://hf-mirror.com` 自动加速),~3 秒,缓存到 `~/.cache/fastembed`。

---

## 生产部署

容器在 docker-compose.prod.yml 里 build,启动时下载 BGE 模型(首次 ~3-30 秒,之后命中 cache)。

健康检查:容器用 python urllib 自查 `/healthz`(alpine 没 wget)。

```bash
# 服务器侧
ssh blog-deploy
cd /opt/blog
sudo docker compose --env-file .env.production -f docker-compose.prod.yml build ai-service
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d ai-service
sudo docker logs blog-ai-service-1 --tail 30
```

---

## 历次大改

- **V4(v0.4.0)**:基础 LLM 调用(单次 chat completion 拿草稿)
- **AI2(v1.1.0)**:加 pgvector + LangGraph,RAG 检索改造草稿生成
- **AI2 补丁(v1.1.1)**:从 Anthropic SDK 切到 OpenAI SDK(MiMo 是 OpenAI 协议,不是 Anthropic;之前因为"claudecode 集成"文档名误判,踩了大坑)
- **V1.2(v1.2.0)**:LangSmith tracing 环境变量接线(代码 0 侵入)

详见各 journal:

- [`docs/journal/V4-ai.md`](../../docs/journal/V4-ai.md)
- [`docs/journal/AI2-rag-agent.md`](../../docs/journal/AI2-rag-agent.md)
- [`docs/journal/V1.2-admin-and-tracing.md`](../../docs/journal/V1.2-admin-and-tracing.md)
