"""
草稿生成请求 / 响应数据模型。
"""

from typing import Literal

from pydantic import BaseModel, Field

Tone = Literal["technical", "casual", "poetic", "narrative"]
Length = Literal["short", "medium", "long"]


class DraftRequest(BaseModel):
    prompt: str = Field(..., min_length=2, max_length=2000, description="用户的创作意图描述")
    tone: Tone = Field(default="technical", description="语气风格")
    length: Length = Field(default="medium", description="目标长度")
    language: str = Field(default="zh-CN", description="输出语言,目前主要支持中文")


class DraftResponse(BaseModel):
    """LLM 输出的结构化草稿,直接对应 articles 表的写入字段。"""

    title: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200, description="URL-safe 短串,英文优先")
    summary: str = Field(..., max_length=500)
    content: str = Field(..., min_length=10, description="Markdown 正文")
    tags: list[str] = Field(default_factory=list, max_length=8, description="3-5 个建议标签名(中文)")
    category_slug: str | None = Field(default=None, description="建议分类的 slug")
