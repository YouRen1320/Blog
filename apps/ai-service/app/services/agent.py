"""
LangGraph 多步 Agent —— 把"理解 + 检索 + 生成"画成状态图。

为什么用图模型而不是一条 chain:
- 每步独立 trace,LangSmith 能看到每个 node 的 token / 延迟
- 出错时可以只重试某个节点,不重新走完整条流程
- 后续要加"草稿不合格就 revise"分支,加一个 conditional edge 即可
- 状态显式声明,debug 时打印一下 state 就知道走到哪儿了

当前流程很简单:
  START → retrieve → generate → END
但骨架已经摆好,以后加 revise / fact_check 节点不用重构。
"""

import json
import logging
import uuid
from typing import TypedDict

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from app.core.config import get_settings
from app.schemas.draft import DraftRequest, DraftResponse
from app.services.llm_router import acompletion
from app.services.reranker import rerank
from app.services.retriever import RetrievedArticle, retrieve

log = logging.getLogger(__name__)


# ── State ──────────────────────────────────────────────
class AgentState(TypedDict, total=False):
    """流过 graph 的状态。total=False 让每个 node 只填自己关心的字段。"""

    request: DraftRequest          # 入参
    retrieved: list[RetrievedArticle]  # retrieve 节点填
    draft: DraftResponse           # generate 节点填
    error: str                     # 任意节点出错时填,END 检查


# ── Tool 定义(OpenAI function calling)─────────────────
_DRAFT_TOOL = {
    "type": "function",
    "function": {
        "name": "save_article_draft",
        "description": "把生成的文章保存为博客草稿。",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "标题,不超过 60 字"},
                "slug": {"type": "string", "description": "URL slug,英文小写 + 连字符"},
                "summary": {"type": "string", "description": "200 字以内摘要"},
                "content": {"type": "string", "description": "完整 Markdown 正文"},
                "tags": {"type": "array", "items": {"type": "string"}},
                "category_slug": {"type": "string"},
            },
            "required": ["title", "slug", "summary", "content", "tags"],
        },
    },
}

_TONE = {
    "technical": "严谨克制,术语准确,代码示例必须可运行",
    "casual": "轻盈散文体,允许第一人称,语气像朋友间闲聊",
    "poetic": "抒情含蓄,长短句交错,克制使用比喻,结尾留白",
    "narrative": "记叙文体,以人物或事件为线索,有起承转合",
}
_LENGTH = {"short": "约 600-900 字", "medium": "约 1300-1700 字", "long": "约 2500-3500 字"}


# ── Nodes ──────────────────────────────────────────────
def retrieve_node(state: AgentState) -> AgentState:
    """
    对用户 prompt 做 RAG,把候选旧文写进 state。
    扩大召回到 10 篇,放低 min_similarity(给 reranker 更大空间);精排到 top 3 在 rerank_node 里做。
    """
    req = state["request"]
    try:
        results = retrieve(req.prompt, top_k=10, min_similarity=0.35)
        log.info("[retrieve] %d candidates above threshold", len(results))
        return {"retrieved": results}
    except Exception as e:
        log.warning("[retrieve] failed: %s — continuing without context", e)
        return {"retrieved": []}


def rerank_node(state: AgentState) -> AgentState:
    """
    用 cross-encoder(BGE-reranker-base)对 retrieve 候选做精排,留 top 3。
    候选 ≤1 条时直接 passthrough,reranker 没意义还多花首次加载时间。
    """
    candidates = state.get("retrieved", [])
    if len(candidates) <= 1:
        return {"retrieved": candidates}
    try:
        top = rerank(state["request"].prompt, candidates, top_n=3)
        log.info("[rerank] kept top %d", len(top))
        return {"retrieved": top}
    except Exception as e:
        # rerank 是增益不是必需,失败时回退用召回结果的前 3 个
        log.warning("[rerank] failed: %s — falling back to retrieve order", e)
        return {"retrieved": candidates[:3]}


async def generate_node(state: AgentState) -> AgentState:
    """走 MiMo(OpenAI 协议)生成草稿,塞 retrieved 上下文。"""
    req = state["request"]
    retrieved = state.get("retrieved", [])

    rag_block = ""
    if retrieved:
        rag_block = "\n\n## 你已有的相关旧文(参考语气 + 已写过的内容,不要重复)\n"
        for i, art in enumerate(retrieved, 1):
            rag_block += (
                f"\n### 旧文 {i} · 「{art.title}」(slug: {art.slug}, 相似度 {art.similarity:.2f})\n"
                f"摘要:{art.summary or '(无)'}\n"
                f"片段:\n{art.content[:600]}...\n"
            )

    system = (
        "你是 Youren 的博客写作助手。\n"
        "输出**必须**通过工具 save_article_draft,不要返回纯文本。\n"
        "如果有相关旧文,语气要保持一致,可用 `[slug]` 引用,不要复制粘贴整段。"
    )
    user = (
        f"创作意图:{req.prompt}\n"
        f"语气:{_TONE[req.tone]}\n"
        f"长度:{_LENGTH[req.length]}\n"
        f"目标语言:{req.language}\n\n"
        "正文 Markdown,至少一个 h2 + 一个 blockquote。"
        f"{rag_block}"
    )

    try:
        response = await acompletion(
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_completion_tokens=4096,
            tools=[_DRAFT_TOOL],
            tool_choice={"type": "function", "function": {"name": "save_article_draft"}},
        )
    except Exception as e:
        log.error("[generate] LLM call failed: %s", e)
        return {"error": f"LLM call failed: {e}"}

    payload = None
    tool_calls = getattr(response.choices[0].message, "tool_calls", None) or []
    for call in tool_calls:
        if call.function.name == "save_article_draft":
            try:
                payload = json.loads(call.function.arguments)
            except json.JSONDecodeError as e:
                return {"error": f"tool_call arguments not valid JSON: {e}"}
            break
    if not payload:
        return {"error": "LLM 没返回预期的 tool_call(save_article_draft)"}

    log.info("[generate] draft generated: %s", payload.get("title", "")[:30])
    return {"draft": DraftResponse(**payload)}


# ── Checkpoint:让 graph state 在调用之间持久化(human-in-the-loop 前置)──
# MemorySaver 进程内存,简单 + 重启丢;生产想跨重启持久化用 SqliteSaver:
#   from langgraph.checkpoint.sqlite import SqliteSaver
#   _CHECKPOINTER = SqliteSaver.from_conn_string("/data/agent-state.db")
# 容器里需要把 /data 挂 volume,不然重启 sqlite 文件丢。
_CHECKPOINTER = MemorySaver()


# ── Graph 构建 ─────────────────────────────────────────
def _build_graph():
    """
    START → retrieve(top10)→ rerank(top3)→ generate → END

    加 checkpointer 后:
    - 每次调 ainvoke 必须传 config={"configurable":{"thread_id":"..."}}
    - state 按 thread_id 持久化,可以多次 invoke 同一 thread 实现"接着跑"
    - 想加 human-in-the-loop:在某节点调 langgraph.types.interrupt(...),
      ainvoke 会抛 GraphInterrupt,外部审核完后用同一 thread_id 调
      `graph.ainvoke(Command(resume=...), config=config)` 继续
    """
    g = StateGraph(AgentState)
    g.add_node("retrieve", retrieve_node)
    g.add_node("rerank", rerank_node)
    g.add_node("generate", generate_node)
    g.add_edge(START, "retrieve")
    g.add_edge("retrieve", "rerank")
    g.add_edge("rerank", "generate")
    g.add_edge("generate", END)
    return g.compile(checkpointer=_CHECKPOINTER)


_GRAPH = None


def get_graph():
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = _build_graph()
    return _GRAPH


async def run_agent(req: DraftRequest, thread_id: str | None = None) -> DraftResponse:
    """
    对外入口:跑一次 graph,把 DraftResponse 取出来。
    thread_id 不传时每次新 uuid;同一 thread 多次调用可在 checkpoint 里
    叠加 state(给 future 的 human-in-the-loop / 续作 / revise 流程用)。
    """
    settings = get_settings()
    if settings.USE_MOCK_LLM:
        return _mock_draft(req)

    graph = get_graph()
    config = {"configurable": {"thread_id": thread_id or str(uuid.uuid4())}}
    final_state = await graph.ainvoke({"request": req}, config=config)

    if final_state.get("error"):
        raise RuntimeError(final_state["error"])
    if not final_state.get("draft"):
        raise RuntimeError("graph finished without draft")
    return final_state["draft"]


def _mock_draft(req: DraftRequest) -> DraftResponse:
    """mock 模式不走 graph,直接返。"""
    log.info("mock mode: returning canned draft for prompt=%s", req.prompt[:60])
    return DraftResponse(
        title=f"[MOCK] {req.prompt[:30].strip()}",
        slug="mock-ai-draft",
        summary=f"mock 草稿(语气={req.tone}, 长度={req.length})。",
        content=(
            "# Mock AI 草稿\n\n"
            f"请求:{json.dumps(req.model_dump(), ensure_ascii=False)}\n\n"
            "## 关于 mock\n"
            "USE_MOCK_LLM=true 时不真调外部模型,LangGraph 直接绕过。\n\n"
            "> 切到真实模式:把 .env 里 USE_MOCK_LLM=false。"
        ),
        tags=["AI", "mock", "dev"],
        category_slug=None,
    )
