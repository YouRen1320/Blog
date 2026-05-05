"""
流式文章生成。

设计权衡:
- OpenAI 协议**理论上**支持 streaming + tool calling(tool_call.arguments 是 partial JSON)
- 但解析 partial JSON 在 v1 阶段成本不值得 ——
  改让 LLM 输出"约定格式的 markdown",在 stream 末尾用正则一次性 parse

约定格式(system prompt 强制):

    # 标题(60 字内)

    > 摘要(200 字内,blockquote 形式)

    ## 二级标题
    正文……

    ## 二级标题
    更多正文……

    ---
    tags: 标签 1, 标签 2, 标签 3

LLM 输出完后:
- title  ← 第一个 `# ` 行
- summary ← 第一个 `> ` 行
- content ← title 和 `---tags:` 之间的部分(不含两端)
- tags ← 末尾 `tags: ...` 切分逗号

不严格遵守时(LLM 偶尔会跑偏)有 fallback,见 `parse_markdown` 注释。
"""

import json
import logging
import re
from typing import AsyncIterator

from app.core.config import get_settings
from app.schemas.draft import DraftRequest, DraftResponse
from app.services.llm_router import acompletion
from app.services.retriever import retrieve

log = logging.getLogger(__name__)

_TONE = {
    "technical": "严谨克制,术语准确,段落紧凑,代码示例必须可运行",
    "casual": "轻盈散文体,允许第一人称叙述,语气像朋友间闲聊",
    "poetic": "抒情含蓄,长短句交错,克制使用比喻,结尾留白",
    "narrative": "记叙文体,以人物或事件为线索,有起承转合",
}
_LENGTH = {
    "short": "约 600-900 字",
    "medium": "约 1300-1700 字",
    "long": "约 2500-3500 字",
}


def _make_slug(text: str) -> str:
    """生成英文 slug。中文字符直接被 strip,所以中文标题会得到空 slug,
    fallback 用时间戳。NestJS 那边也有 makeSlug(),这里只为流式做轻量解析。"""
    s = re.sub(r"[^a-zA-Z0-9\s-]", "", text.lower())
    s = re.sub(r"\s+", "-", s).strip("-")
    return s[:80] if s else f"draft-{abs(hash(text)) % 100000}"


def parse_markdown(text: str) -> DraftResponse:
    """从 LLM 输出的 markdown 提取 title/summary/content/tags。

    fallback 策略:
    - 没找到 `# 标题` → title = "(未命名)"
    - 没找到 `> 摘要` → summary = content 前 200 字
    - 没找到 `tags: ...` → tags = ["AI"]
    """
    title_match = re.search(r"^#\s+(.+?)\s*$", text, re.MULTILINE)
    title = title_match.group(1).strip() if title_match else "(未命名)"

    summary_match = re.search(r"^>\s+(.+?)\s*$", text, re.MULTILINE)
    summary = summary_match.group(1).strip() if summary_match else ""

    tags_match = re.search(r"^tags?[::]\s*(.+?)\s*$", text, re.MULTILINE | re.IGNORECASE)
    tags = (
        [t.strip() for t in tags_match.group(1).split(",") if t.strip()]
        if tags_match
        else []
    )

    # 抠出正文:去掉 title 行 / summary 行 / 末尾 tags 行
    content = text
    if title_match:
        content = content.replace(title_match.group(0), "", 1)
    if summary_match:
        content = content.replace(summary_match.group(0), "", 1)
    if tags_match:
        content = content[: content.rfind(tags_match.group(0))]
    # 去掉孤立的 --- 分隔线和多余空行
    content = re.sub(r"^---\s*$\n?", "", content, flags=re.MULTILINE)
    content = content.strip()

    return DraftResponse(
        title=title,
        slug=_make_slug(title),
        summary=summary or content[:200],
        content=content or text,
        tags=tags or ["AI"],
        category_slug=None,
    )


def _sse(event: str, data: dict | str) -> str:
    """格式化一条 SSE 消息。data 可以是 dict(自动 json)或已 json 化的 string。"""
    payload = data if isinstance(data, str) else json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


async def stream_article(req: DraftRequest) -> AsyncIterator[str]:
    """
    主流程:
      1. (可选)RAG 检索旧文塞 system prompt
      2. 调 LLM stream=True,逐 chunk 通过 SSE 转发
      3. stream 结束后用 parse_markdown 提取结构化 DraftResponse
      4. 发 `event: draft` 把完整结构传给上游(NestJS 拿来落库)
      5. 发 `event: done` 收尾
    出错时发 `event: error` + message。
    """
    settings = get_settings()

    # mock 模式:逐字符模拟流式,本地开发联调时不烧 quota
    if settings.USE_MOCK_LLM:
        mock_text = (
            f"# [MOCK STREAM] {req.prompt[:30].strip()}\n\n"
            f"> 这是一段流式 mock 草稿(语气={req.tone},长度={req.length})。\n\n"
            "## 一、为什么会有这一篇\n\n"
            f"用户输入是:{req.prompt}\n\n"
            "在真实模式下,LLM 会按这个结构边写边推送 chunk,前端边渲染。\n\n"
            "## 二、流式的好处\n\n"
            "> 用户能感觉到 AI 在思考,而不是黑盒等 30 秒。\n\n"
            "---\ntags: AI, mock, stream"
        )
        # 按字符切,每 ~5 个字符一个 chunk,模拟真实流式节奏
        for i in range(0, len(mock_text), 6):
            yield _sse("chunk", {"text": mock_text[i : i + 6]})
        draft = parse_markdown(mock_text)
        yield _sse("draft", draft.model_dump())
        yield _sse("done", {})
        return

    # RAG 检索(失败容错)
    rag_block = ""
    try:
        retrieved = retrieve(req.prompt, top_k=3, min_similarity=0.5)
        if retrieved:
            rag_block = "\n\n## 你已有的相关旧文(参考语气和已写过的内容)\n"
            for i, art in enumerate(retrieved, 1):
                rag_block += (
                    f"\n### 旧文 {i} · 「{art.title}」\n"
                    f"摘要:{art.summary or '(无)'}\n"
                    f"片段:\n{art.content[:600]}...\n"
                )
            log.info("[stream] RAG injected %d articles", len(retrieved))
    except Exception as e:
        log.warning("[stream] RAG retrieve failed: %s", e)

    system = (
        "你是 Youren 的博客写作助手。请按以下 markdown 格式输出,**不要任何前后缀**:\n\n"
        "```\n"
        "# 标题(60 字以内,中文)\n\n"
        "> 摘要(200 字以内,blockquote 形式)\n\n"
        "## 第一节小标题\n"
        "正文段落……\n\n"
        "## 第二节小标题\n"
        "更多正文……\n\n"
        "---\n"
        "tags: 标签1, 标签2, 标签3\n"
        "```\n\n"
        "如果给出了'相关旧文',先读完,语气和说理方式跟旧文保持一致,可用 `[slug]` 引用,不要复制粘贴整段。"
    )
    user = (
        f"创作意图:{req.prompt}\n\n"
        f"语气:{_TONE[req.tone]}\n"
        f"长度:{_LENGTH[req.length]}\n"
        f"目标语言:{req.language}"
        f"{rag_block}"
    )

    full_text = ""
    try:
        stream = await acompletion(
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_completion_tokens=4096,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                full_text += delta
                yield _sse("chunk", {"text": delta})
    except Exception as e:
        log.exception("[stream] LLM call failed")
        yield _sse("error", {"message": str(e)})
        return

    if not full_text.strip():
        yield _sse("error", {"message": "LLM 返回空内容"})
        return

    try:
        draft = parse_markdown(full_text)
    except Exception as e:
        log.exception("[stream] parse failed")
        yield _sse("error", {"message": f"parse 失败: {e}"})
        return

    log.info("[stream] done, parsed title=%s, tags=%s", draft.title[:30], draft.tags)
    yield _sse("draft", draft.model_dump())
    yield _sse("done", {})
