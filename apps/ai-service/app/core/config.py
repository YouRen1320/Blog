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

    # ── LLM Provider 路由(LiteLLM) ─────────────────────────────
    # LLM_PROVIDER 决定走哪家:mimo / openai / anthropic / gemini / qwen
    # 各家的 model + key + (可选)base_url 单独配,LiteLLM 自动按 model 前缀选 driver
    LLM_PROVIDER: str = Field(
        default="mimo",
        description="LLM 路由:mimo | openai | anthropic | gemini | qwen",
    )

    # MiMo(默认 provider,OpenAI 兼容协议)
    XIAOMI_MIMO_API_KEY: str = Field("", description="小米 MiMo 平台的 API key")
    XIAOMI_MIMO_BASE_URL: str = Field(
        default="https://api.xiaomimimo.com/v1",
        description="MiMo OpenAI 协议端点根地址",
    )
    XIAOMI_MIMO_MODEL: str = Field(
        default="mimo-v2.5-pro",
        description="MiMo 生成模型 ID",
    )

    # OpenAI 原生
    OPENAI_API_KEY: str = Field("", description="OpenAI 官方 API key")
    OPENAI_MODEL: str = Field("gpt-4o", description="OpenAI 模型 ID")

    # Anthropic 原生
    ANTHROPIC_API_KEY: str = Field("", description="Anthropic API key")
    ANTHROPIC_MODEL: str = Field("claude-sonnet-4-5", description="Anthropic 模型 ID")

    # Google Gemini
    GEMINI_API_KEY: str = Field("", description="Google AI Studio / Gemini API key")
    GEMINI_MODEL: str = Field("gemini-2.0-flash", description="Gemini 模型 ID")

    # 阿里云 Qwen(走 dashscope OpenAI 兼容端点)
    QWEN_API_KEY: str = Field("", description="阿里云 dashscope API key")
    QWEN_MODEL: str = Field("qwen-plus", description="Qwen 模型 ID")
    QWEN_API_BASE: str = Field(
        default="https://dashscope.aliyuncs.com/compatible-mode/v1",
        description="Qwen OpenAI 兼容端点",
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
