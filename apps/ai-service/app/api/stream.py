"""
SSE 流式生成端点。

路径:`POST /generate/article/stream`
- 请求体跟非流式一致(DraftRequest)
- 响应是 text/event-stream,事件有:
  - `event: chunk` data={"text":"..."} —— LLM token 增量
  - `event: draft` data=DraftResponse —— 流末解析出的结构化草稿
  - `event: done`  data={} —— 流正常结束
  - `event: error` data={"message":"..."} —— 任意错误

NestJS 主要从 chunk + draft 两类事件取值:chunk 转发给 admin UI,draft 拿来落库。
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.schemas.draft import DraftRequest
from app.services.streaming_generator import stream_article

router = APIRouter()


@router.post("/article/stream")
async def stream_generate(req: DraftRequest):
    return StreamingResponse(
        stream_article(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            # nginx / Caddy 默认会 buffer SSE,显式关掉
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
