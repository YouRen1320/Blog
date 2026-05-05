"""
评论 AI 辅助审核端点。`POST /moderate`
"""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.moderator import moderate

router = APIRouter()
log = logging.getLogger(__name__)


class ModerateRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    author_name: str = Field("", max_length=100)
    article_title: str = Field("", max_length=200)


class ModerateResponse(BaseModel):
    score: int
    recommend: str  # 'approve' | 'review' | 'reject'
    reason: str


@router.post("/", response_model=ModerateResponse)
async def moderate_endpoint(req: ModerateRequest) -> ModerateResponse:
    try:
        result = await moderate(
            comment_content=req.content,
            author_name=req.author_name,
            article_title=req.article_title,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    return ModerateResponse(**result)
