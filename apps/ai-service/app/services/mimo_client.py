"""
小米 MiMo 客户端封装 ——
利用 anthropic SDK 的 base_url override 把请求指向小米 MiMo 的 Claude 兼容端点。
"""

from functools import lru_cache

from anthropic import AsyncAnthropic

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_mimo_client() -> AsyncAnthropic:
    """单例。lru_cache + 进程级 settings 让重复创建的成本归零。"""
    s = get_settings()
    return AsyncAnthropic(
        api_key=s.XIAOMI_MIMO_API_KEY,
        base_url=s.XIAOMI_MIMO_BASE_URL,
    )
