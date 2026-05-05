"""
编辑器内联 AI 端点。`POST /generate/inline`。

请求:InlineRequest(action / context / selection / instruction)
响应:SSE
  - event: chunk  data={"text": "..."}
  - event: done   data={}
  - event: error  data={"message": "..."}

跟 /generate/article/stream 不同:这里**只产出一段文本**,不解析结构,
不落库 —— 前端拿到流后自己决定塞到 textarea 哪里(替换 selection / 追加光标位置 / 写到 title 字段等)。
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.schemas.inline import InlineRequest
from app.services.inline_generator import stream_inline

router = APIRouter()


@router.post("/inline")
async def inline_generate(req: InlineRequest):
    return StreamingResponse(
        stream_inline(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
