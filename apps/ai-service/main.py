"""
ai-service 入口。挂 FastAPI app + 健康检查 + 业务路由。
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.embed import router as embed_router
from app.api.generate import router as generate_router
from app.api.inline import router as inline_router
from app.api.stream import router as stream_router
from app.core.config import get_settings


def _configure_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    settings = get_settings()
    _configure_logging(settings.LOG_LEVEL)
    log = logging.getLogger("ai-service")
    from app.services.llm_router import current_provider_label

    log.info(
        "ai-service starting | port=%s mock=%s llm=%s",
        settings.AI_SERVICE_PORT,
        settings.USE_MOCK_LLM,
        current_provider_label(),
    )
    yield
    log.info("ai-service stopped")


app = FastAPI(
    title="Blog AI Service",
    description="LLM 内容生成微服务(由 NestJS 主后端调用)",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(generate_router, prefix="/generate", tags=["generate"])
app.include_router(stream_router, prefix="/generate", tags=["generate"])
app.include_router(inline_router, prefix="/generate", tags=["generate"])
app.include_router(embed_router, prefix="/embed", tags=["embed"])


@app.get("/healthz")
def healthz() -> dict[str, str]:
    """K8s / Caddy / 健康检查用。"""
    return {"status": "ok"}
