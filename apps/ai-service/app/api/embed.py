"""
embedding 端点。NestJS 在文章发布时调一次,把向量写回 article.embedding 字段。
"""

import logging

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.embedder import EMBEDDING_DIM, embed_text

router = APIRouter()
log = logging.getLogger(__name__)


class EmbedRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=20000)


class EmbedResponse(BaseModel):
    vector: list[float]
    dim: int


@router.post("", response_model=EmbedResponse)
async def embed(req: EmbedRequest) -> EmbedResponse:
    vec = embed_text(req.text)
    return EmbedResponse(vector=vec, dim=len(vec))


@router.get("/info")
async def info():
    """让 NestJS 启动时确认 ai-service 用了哪个模型 / 多少维。"""
    return {"dim": EMBEDDING_DIM, "model": "BAAI/bge-small-zh-v1.5"}
