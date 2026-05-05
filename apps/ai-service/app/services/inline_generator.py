"""
编辑器内联 AI:5 种 action,统一 SSE 流式输出。

跟 streaming_generator 的区别:
- streaming_generator 输出"完整草稿"(title/summary/content/tags 一整套)
- inline_generator 只输出"一段文本",前端自己决定怎么塞回 textarea
- 不解析结构,prompt 强调"只输出结果,不要任何前后缀"
"""

import json
import logging
from typing import AsyncIterator

from app.core.config import get_settings
from app.schemas.inline import InlineRequest
from app.services.llm_router import acompletion

log = logging.getLogger(__name__)


# 每个 action 一份 prompt 模板。format 时用 .format(**dict) 填变量,
# 留空 instruction / selection 也不会出问题(替换为空字符串)
_ACTION_TEMPLATES = {
    "continue": (
        "接着下面这篇文章继续写下一段(150-400 字),保持原文的语气和说理方式,"
        "不要重复已有内容,不要写小标题,直接给段落内容。\n\n"
        "已有正文:\n{context}\n\n"
        "{instruction_block}"
    ),
    "rewrite": (
        "改写下面的段落,保持原意但优化表达。{instruction_block}\n\n"
        "需要改写的段落:\n{selection}\n\n"
        "**只**输出改写后的段落本身,不要任何前后缀、引号、解释。"
    ),
    "expand": (
        "把下面这段文字扩写成一段更完整的内容(原长的 2-3 倍),保持原意,"
        "补充细节、例子、铺陈。{instruction_block}\n\n"
        "需要扩写的内容:\n{selection}\n\n"
        "**只**输出扩写后的段落,不要任何前后缀。"
    ),
    "summarize": (
        "为下面这篇文章写一个 200 字以内的中文摘要,语气保持跟正文一致,"
        "适合放在文章开头作为 lede。{instruction_block}\n\n"
        "文章:\n{context}\n\n"
        "**只**输出摘要文字,不要任何前后缀、引号、'摘要:'之类的标记。"
    ),
    "title": (
        "为下面这篇文章起一个简洁有力的中文标题(40 字以内),"
        "点出文章核心,不要副标题、不要冒号分隔的两段式。{instruction_block}\n\n"
        "文章:\n{context}\n\n"
        "**只**输出标题文字,不要书名号、引号或其他装饰。"
    ),
}


def _sse(event: str, data: dict | str) -> str:
    payload = data if isinstance(data, str) else json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


async def stream_inline(req: InlineRequest) -> AsyncIterator[str]:
    settings = get_settings()

    # mock 模式:逐字符模拟,不烧 quota,前端联调用
    if settings.USE_MOCK_LLM:
        mock_text = {
            "continue": "(mock 续写)这是一段假装是续写的内容,用来联调流式插入逻辑。",
            "rewrite": f"(mock 改写){req.selection[:50]}",
            "expand": f"(mock 扩写){req.selection[:30]} —— 加了一点细节和铺陈,使其更完整。",
            "summarize": "(mock 摘要)这是一段假装是 AI 写出来的摘要,200 字以内。",
            "title": "(mock 标题)流式 AI 写作辅助",
        }[req.action]
        for i in range(0, len(mock_text), 4):
            yield _sse("chunk", {"text": mock_text[i : i + 4]})
        yield _sse("done", {})
        return

    template = _ACTION_TEMPLATES[req.action]
    instruction_block = (
        f"额外要求:{req.instruction}" if req.instruction else ""
    )
    user_prompt = template.format(
        context=(req.context or "")[:6000],
        selection=(req.selection or "")[:3000],
        instruction_block=instruction_block,
    )

    try:
        stream = await acompletion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "你是 Youren 的博客写作助手,负责对已有文本做"
                        "续写 / 改写 / 扩写 / 摘要 / 起标题。"
                        "**只输出结果文字本身**,不要任何前后缀、解释、'好的我来'之类的回应。"
                    ),
                },
                {"role": "user", "content": user_prompt},
            ],
            max_completion_tokens=2048,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield _sse("chunk", {"text": delta})
    except Exception as e:
        log.exception("[inline] LLM call failed")
        yield _sse("error", {"message": str(e)})
        return

    log.info("[inline] action=%s done", req.action)
    yield _sse("done", {})
