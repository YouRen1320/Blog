# AI2 RAG + LangGraph Agent(整体)

**日期**:2026-05-05
**任务**:#38 ~ #43
**状态**:已完成
**Tag**:v1.1.0

> 这一阶段的故事是:**把 V4 的"单次 Claude 调用"升级成"先读自己的旧文,再用图状 Agent 写"**。

## 链路升级前后

```
V4(v0.4.0):
  用户 prompt → Claude (single call) → 草稿落库

V1.1(v1.1.0):
  用户 prompt
    ↓
  fastembed BGE → 512 维向量
    ↓
  pgvector 检索 articles.embedding (cosine 距离)
    ↓
  top-K 旧文摘要 + 片段塞进 system prompt
    ↓
  LangGraph: START → retrieve_node → generate_node → END
    ↓
  Claude 带着"读过的"风格 + 知识写新草稿
    ↓
  落库 source=AI status=DRAFT
```

每篇文章发布时,NestJS 自动调 ai-service `/embed` 把它转成向量,写回 `articles.embedding`。下次有人 prompt,这篇文章可能被 retrieve 到。

## 关键决策

### 1. 不引整个 LangChain 仓库,只装 LangGraph
LangChain 主仓库的问题在 V4 阶段就讨论过([V4 journal 第 4 节](V4-ai.md))。LangGraph 是它的 sub-project,可以单独装,不需要 retrieval/document_loaders/output_parsers 那一大堆抽象。

```bash
# pyproject.toml
"langgraph>=0.2.50",
"langchain-core>=0.3.0",  # LangGraph 间接依赖,显式声明
```

不装 langchain / langchain-community 等。

### 2. 本地 BGE 而不是远程 embedding API
- 小米 MiMo 是 Claude 协议,**只有 messages 没 embeddings**
- OpenAI / Voyage / Cohere 中国境内不稳
- 阿里云 dashscope 要新 API key + 收费
- BGE-small-zh-v1.5 + fastembed:ONNX runtime,~100MB,CPU 推理 < 100ms,**完全离线**

代价:首次部署 Docker 镜像多 ~100MB(模型 + onnxruntime)。在中国境内通过 `HF_ENDPOINT=https://hf-mirror.com` 加速首次下载。

### 3. ai-service 直连 Postgres 做 RAG,不走 NestJS API
RAG 检索是 AI 服务的"理解"环节,跟业务逻辑无关。直连节约 100ms + 简化代码。共享同一个 Postgres 实例(compose 内 service name `postgres`)。

### 4. Schema 用 Prisma `Unsupported("vector(512)")` + 业务层 raw SQL
Prisma 不原生支持 pgvector。Unsupported 让 schema 占位,但写入要走 `$executeRaw` + `::vector(512)` 类型转换:
```ts
const literal = `[${vector.join(',')}]`;
await prisma.$executeRaw`UPDATE articles SET embedding = ${literal}::vector(512) WHERE id = ${articleId}`;
```

### 5. publish 后异步 fire-and-forget embedding
```ts
void this.embedding.embedArticle(id);
```
不 await。用户的 publish 接口立刻返回,RAG 索引在后台慢慢建。失败只 warn 不阻塞。

### 6. LangGraph 状态图 vs 单纯 chain
当前只有 `retrieve → generate` 2 个节点。**功能上跟 chain 等价,但结构上是 graph,有这些好处**:
- LangSmith tracing 直接能看每个节点 token / 延迟
- 出错只重试单节点
- 加 `revise` / `fact_check` 节点不用重构入口
- State 显式 TypedDict,debug 时打印一下就知道走到哪儿了

代价:多写几行样板。值得。

### 7. mock 模式不走 graph
`run_agent` 头一行检查 `USE_MOCK_LLM`,直接 return mock。不让 mock 假装跑 graph(那会消耗 BGE 加载时间 + 留无意义日志)。**真模式才走 LangGraph 的真实流程**。

## 踩坑(详见 V1.1-REPORT)

按时间顺序:

1. **Python 3.14 → 3.12**:`py-rust-stemmers` 没 3.14 wheel
2. **fastembed 走 Clash 代理失败**:macOS 本机要 `socksio`,容器里 `HF_ENDPOINT` 走 hf-mirror.com
3. **BGE-small-zh-v1.5 是 512 维,不是 384**:常被记错,Schema 改了一次
4. **Debian 13 trixie sources**:`/etc/apt/sources.list` 旧格式不读,要改 `/etc/apt/sources.list.d/debian.sources`
5. **Dockerfile 预下载模型**:`RUN python ... | tail -3` 把错误吞了,模型其实没下载到。改成运行时下载
6. **服务器 git pull GitHub 不稳**:tar + scp 替代
7. **prisma migrate deploy 跑不到新 migration**:容器里的 prisma/ 是镜像里的,不会读宿主机。重 build api 镜像后才看到
8. **admin SPA build 时没 VITE_API_BASE_URL**:打包出的版本默认 localhost:3000,生产浏览器自然连不通。改成运行时探测 hostname

## 学到的

- **图模型(LangGraph)即使流程很简单也值得**:扩展性、可观测性、retry 都白来
- **生产部署 vs 本地跑通是两件事**,网络拓扑(代理、DNS、镜像源)经常是 99% 的卡点
- **embedding dim 必须先验证再写 schema**,不要照模型卡片字面值
- **Dockerfile RUN 后面的 `| tail`** 会吞错误码 + 错误内容,debug 极困难。生产关键 RUN 不要用 pipe
- **非 root 容器用户的 cache 路径要么放进 /home/<user>,要么用 ENV 显式控制**(`FASTEMBED_CACHE_DIR` 等)
- **build 时和运行时的网络环境不一样**:Aliyun ECS build 时 mirrors.cloud.aliyuncs.com 走内网骨干极快;运行时容器里走 docker bridge,延迟略高但还可用
