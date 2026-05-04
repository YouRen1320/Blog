"""
文章生成端点。NestJS 是这里的唯一调用方,移动端不直接打 ai-service。
"""

import logging

from fastapi import APIRouter, HTTPException

from app.schemas.draft import DraftRequest, DraftResponse
from app.services.article_generator import generate_article_draft

router = APIRouter()
log = logging.getLogger(__name__)


@router.post("/article", response_model=DraftResponse)
async def generate_article(req: DraftRequest) -> DraftResponse:
    """根据 prompt + tone + length 生成结构化草稿。"""
    try:
        return await generate_article_draft(req)
    except Exception as e:
        log.exception("generation failed")
        raise HTTPException(status_code=502, detail=f"AI generation failed: {e}") from e
