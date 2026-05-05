"""
文章生成业务逻辑:
- 把 DraftRequest 转成 OpenAI chat.completions 的 messages + tools
- 用 function calling(tool_choice 强制走单 function)拿到严格 JSON
- 走 mock 时返回固定假数据
"""

import json
import logging

from app.core.config import get_settings
from app.schemas.draft import DraftRequest, DraftResponse
from app.services.mimo_client import get_mimo_client
from app.services.retriever import retrieve

log = logging.getLogger(__name__)

# OpenAI function calling 格式:type=function + function.{name, description, parameters(JSON Schema)}
_DRAFT_TOOL = {
    "type": "function",
    "function": {
        "name": "save_article_draft",
        "description": "把生成的文章保存为博客草稿。所有字段必填(category_slug 可选)。",
        "parameters": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "标题,不超过 60 字"},
                "slug": {
                    "type": "string",
                    "description": "URL slug,英文小写 + 连字符,长度 3-80",
                },
                "summary": {"type": "string", "description": "200 字以内摘要"},
                "content": {
                    "type": "string",
                    "description": "完整正文,使用 Markdown 语法,包含 h2/h3 小节、必要的 blockquote 与代码块",
                },
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "3-5 个建议标签名,中文",
                },
                "category_slug": {
                    "type": "string",
                    "description": "建议分类的 slug。可选,不确定时省略",
                },
            },
            "required": ["title", "slug", "summary", "content", "tags"],
        },
    },
}

_TONE_GUIDANCE = {
    "technical": "严谨克制,术语准确,段落紧凑,代码示例必须可运行",
    "casual": "轻盈散文体,允许第一人称叙述,语气像朋友间闲聊",
    "poetic": "抒情含蓄,长短句交错,克制使用比喻,结尾留白",
    "narrative": "记叙文体,以人物或事件为线索,有起承转合",
}

_LENGTH_GUIDANCE = {
    "short": "约 600-900 字",
    "medium": "约 1300-1700 字",
    "long": "约 2500-3500 字",
}


async def generate_article_draft(req: DraftRequest) -> DraftResponse:
    settings = get_settings()
    if settings.USE_MOCK_LLM:
        return _mock_draft(req)

    # AI2-04 起:RAG 检索作者历史文章,作为风格 + 知识参考塞进 prompt
    # 失败时不阻塞生成 —— 检索是增益,不是必需
    rag_context = ""
    try:
        retrieved = retrieve(req.prompt, top_k=3, min_similarity=0.5)
        if retrieved:
            rag_context = "\n\n## 你已有的相关旧文(参考语气 + 已写过的内容,不要重复造)\n"
            for i, art in enumerate(retrieved, 1):
                rag_context += (
                    f"\n### 旧文 {i} · 「{art.title}」(slug: {art.slug}, 相似度 {art.similarity:.2f})\n"
                    f"摘要:{art.summary or '(无)'}\n"
                    f"正文片段:\n{art.content[:600]}...\n"
                )
            log.info("RAG: injecting %d articles into context (total %d chars)", len(retrieved), len(rag_context))
    except Exception as e:
        log.warning("RAG retrieve failed, generating without context: %s", e)

    client = get_mimo_client()
    system = (
        "你是 Youren 的博客写作助手。读完用户描述后,产出可立刻进入草稿箱的中文文章。\n"
        "输出**必须**通过工具 save_article_draft,不要返回纯文本。\n"
        "如果下面给出了'相关旧文',先读完,新文章的语气和说理方式要跟旧文一致;\n"
        "可以用 [文章 slug] 这种风格引用旧文,但不要复制粘贴整段。"
    )
    user = (
        f"创作意图:{req.prompt}\n\n"
        f"语气:{_TONE_GUIDANCE[req.tone]}\n"
        f"长度:{_LENGTH_GUIDANCE[req.length]}\n"
        f"目标语言:{req.language}\n\n"
        "正文用 Markdown,含至少一个 h2 二级标题、一个 blockquote。"
        f"{rag_context}"
    )

    response = await client.chat.completions.create(
        model=settings.XIAOMI_MIMO_MODEL,
        max_completion_tokens=4096,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        tools=[_DRAFT_TOOL],
        # OpenAI 强制走某个 function 的写法:tool_choice = {"type":"function","function":{"name":...}}
        tool_choice={"type": "function", "function": {"name": "save_article_draft"}},
    )

    payload = _extract_tool_input(response)
    return DraftResponse(**payload)


def _extract_tool_input(response) -> dict:
    """从 OpenAI ChatCompletion 里挑出 tool_call 的 arguments(JSON 字符串,需 loads)。"""
    choice = response.choices[0]
    tool_calls = getattr(choice.message, "tool_calls", None) or []
    for call in tool_calls:
        if call.function.name == "save_article_draft":
            return json.loads(call.function.arguments)
    raise ValueError("LLM 没返回预期的 tool_call(save_article_draft)")


def _mock_draft(req: DraftRequest) -> DraftResponse:
    """开发用假数据。结构跟真实输出一致,方便上下游联调。"""
    log.info("mock mode: returning canned draft for prompt=%s", req.prompt[:60])
    return DraftResponse(
        title=f"[MOCK] {req.prompt[:30].strip()}",
        slug="mock-ai-draft",
        summary=f"这是 mock AI 草稿(语气={req.tone}, 长度={req.length}),用于联调,不消耗 quota。",
        content=(
            "# Mock AI 草稿\n\n"
            f"用户输入:{json.dumps(req.model_dump(), ensure_ascii=False)}\n\n"
            "## 一、为什么用 mock\n"
            "ai-service 的 USE_MOCK_LLM=true 时,这里返回固定假数据,不真调小米 MiMo,免烧 quota。\n\n"
            "> 这一段就是 mock 模式的 blockquote 演示。\n\n"
            "## 二、切到真实模式\n"
            "把 .env 里 USE_MOCK_LLM=false 即可启用真实模型调用。"
        ),
        tags=["AI", "mock", "dev"],
        category_slug=None,
    )
