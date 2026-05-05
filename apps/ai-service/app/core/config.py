"""
集中读取并校验环境变量。所有运行时配置走这里,业务模块通过 get_settings() 获取。
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """环境变量映射。pydantic-settings 自动从 .env / 系统 env 读取。"""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    AI_SERVICE_PORT: int = 8000
    LOG_LEVEL: str = "INFO"

    XIAOMI_MIMO_API_KEY: str = Field(..., description="小米 MiMo 平台的 API key")
    XIAOMI_MIMO_BASE_URL: str = Field(
        default="https://platform.xiaomimimo.com/anthropic",
        description="Claude API 兼容端点根地址",
    )
    XIAOMI_MIMO_MODEL: str = Field(
        default="claude-3-5-sonnet-20241022",
        description="生成用的模型 ID(由小米 MiMo 控制台决定)",
    )

    USE_MOCK_LLM: bool = Field(
        default=False,
        description="开发期为 true 时走假数据,不调外部 API,避免烧 quota",
    )

    # AI2-04 起 RAG 需要直读 articles 表
    DATABASE_URL: str = Field(
        default="postgresql://blog:blog@localhost:5432/blog",
        description="Postgres 连接串(读 articles.embedding 做相似度检索)",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """单例。lru_cache 保证测试可以通过 cache_clear() 重置。"""
    return Settings()  # type: ignore[call-arg]
