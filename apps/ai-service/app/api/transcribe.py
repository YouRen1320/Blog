"""
语音 → 文字。`POST /transcribe`

请求:multipart/form-data,字段 `file`(audio/m4a / wav / mp3 / webm)
响应:`{"text": "..."}`

LLM_PROVIDER 跟 transcription 解耦 —— MiMo / Anthropic / Gemini 都没原生 audio API,
所以单独配 WHISPER_API_KEY / WHISPER_API_BASE。空时返 503。

走 LiteLLM 的 atranscription —— 兼容 OpenAI Whisper、阿里 dashscope paraformer
(后者走 OpenAI 协议端点)。
"""

import logging
import os
import tempfile

import litellm
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import get_settings

router = APIRouter()
log = logging.getLogger(__name__)


@router.post("/")
async def transcribe(file: UploadFile = File(...)):
    s = get_settings()
    if not s.WHISPER_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="WHISPER_API_KEY 未配置(/transcribe 不可用)。在 .env 配 WHISPER_API_KEY 后重启 ai-service",
        )
    if not file.filename:
        raise HTTPException(status_code=400, detail="缺少文件名")

    # LiteLLM transcription 接 file path 或 file-like;为简化用临时文件
    suffix = os.path.splitext(file.filename)[1] or ".m4a"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            resp = await litellm.atranscription(
                model=s.WHISPER_MODEL,
                file=f,
                api_key=s.WHISPER_API_KEY,
                api_base=s.WHISPER_API_BASE,
            )
        text = resp.text if hasattr(resp, "text") else str(resp)
        log.info("transcribe ok: %d bytes → %d chars", len(content), len(text))
        return {"text": text}
    except Exception as e:
        log.exception("transcribe failed")
        raise HTTPException(status_code=502, detail=f"转写失败: {e}") from e
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
