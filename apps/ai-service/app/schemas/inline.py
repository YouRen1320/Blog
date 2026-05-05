"""
编辑器内联 AI 的请求 schema。
"""

from typing import Literal

from pydantic import BaseModel, Field

InlineAction = Literal["continue", "rewrite", "expand", "summarize", "title"]


class InlineRequest(BaseModel):
    action: InlineAction = Field(..., description="操作类型")
    context: str = Field("", max_length=20_000, description="文章全文(Markdown),用于 continue/summarize/title")
    selection: str = Field("", max_length=8_000, description="选中文本片段,用于 rewrite/expand")
    instruction: str | None = Field(default=None, max_length=200, description="额外指令(如 '改成更口语')")
