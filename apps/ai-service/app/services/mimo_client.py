"""
小米 MiMo 客户端封装 ——
小米 MiMo 是 OpenAI 协议(不是 Anthropic),用 openai SDK 的 base_url override
把请求指向 https://api.xiaomimimo.com/v1。
"""

from functools import lru_cache

from openai import AsyncOpenAI

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_mimo_client() -> AsyncOpenAI:
    """单例。lru_cache + 进程级 settings 让重复创建的成本归零。"""
    s = get_settings()
    return AsyncOpenAI(
        api_key=s.XIAOMI_MIMO_API_KEY,
        base_url=s.XIAOMI_MIMO_BASE_URL,
    )
