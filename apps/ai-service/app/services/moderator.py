"""
评论 AI 辅助审核 —— 给一条评论打分 + 给出建议。

不自动 approve/reject(防 false positive 误删读者评论),
只给 ADMIN 的参考意见。最终 status 还是人按按钮决定。

输入:评论正文、作者昵称、文章标题(给 LLM 一点 context)
输出:{ score: 0-10, recommend: 'approve' | 'reject' | 'review', reason: '...' }
"""

import json
import logging
import re

from app.core.config import get_settings
from app.services.llm_router import acompletion

log = logging.getLogger(__name__)


_TOOL = {
    "type": "function",
    "function": {
        "name": "evaluate_comment",
        "description": "评估一条博客评论是否值得通过",
        "parameters": {
            "type": "object",
            "properties": {
                "score": {
                    "type": "integer",
                    "minimum": 0,
                    "maximum": 10,
                    "description": "0-10 分,10=优质评论 / 0=垃圾或攻击。"
                    "判断维度:相关性、表达质量、是否有价值贡献、是否友善。",
                },
                "recommend": {
                    "type": "string",
                    "enum": ["approve", "review", "reject"],
                    "description": "approve=明显优质 / review=需要人审 / reject=垃圾或攻击",
                },
                "reason": {
                    "type": "string",
                    "description": "30 字以内的一句中文评价",
                },
            },
            "required": ["score", "recommend", "reason"],
        },
    },
}


async def moderate(
    *, comment_content: str, author_name: str, article_title: str
) -> dict:
    """LLM 评分。失败时(LLM 拒绝 / 网络挂)抛 RuntimeError。"""
    if get_settings().USE_MOCK_LLM:
        # 简单规则:含中文且长度 > 5 视为合理,否则需要审
        ok = len(comment_content.strip()) > 5
        return {
            "score": 8 if ok else 4,
            "recommend": "approve" if ok else "review",
            "reason": "[MOCK] " + ("看起来是正常评论" if ok else "评论太短或可疑"),
        }

    system = (
        "你是博客评论审核助手。给一条评论打分(0-10)+ 推荐(approve / review / reject)+ "
        "一句简短中文理由。判断维度:相关性、表达质量、贡献价值、是否友善。"
        "**必须**通过工具 evaluate_comment 返回。"
    )
    user = (
        f"文章标题:{article_title}\n"
        f"评论作者:{author_name}\n"
        f"评论正文:\n{comment_content[:2000]}"
    )

    try:
        response = await acompletion(
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            max_completion_tokens=300,
            tools=[_TOOL],
            tool_choice={"type": "function", "function": {"name": "evaluate_comment"}},
        )
    except Exception as e:
        log.exception("[moderate] LLM call failed")
        raise RuntimeError(f"LLM call failed: {e}") from e

    tool_calls = getattr(response.choices[0].message, "tool_calls", None) or []
    for call in tool_calls:
        if call.function.name == "evaluate_comment":
            try:
                result = json.loads(call.function.arguments)
            except json.JSONDecodeError as e:
                # 偶尔 LLM 输出非法 JSON,fallback 用 regex 提取
                log.warning("[moderate] arguments not JSON: %s", e)
                m = re.search(r'"score"\s*:\s*(\d+)', call.function.arguments)
                result = {
                    "score": int(m.group(1)) if m else 5,
                    "recommend": "review",
                    "reason": "解析失败,人工审核",
                }
            log.info(
                "[moderate] score=%s recommend=%s",
                result.get("score"),
                result.get("recommend"),
            )
            return result
    raise RuntimeError("LLM 没返回 evaluate_comment tool_call")
