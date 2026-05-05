"""
LLM 多模型路由 —— 用 LiteLLM 把 OpenAI / Anthropic / Gemini / Qwen / MiMo 统一成一个接口。

为什么不直接 OpenAI SDK:
- OpenAI SDK 只能跑 OpenAI 协议端点(MiMo / Qwen / DeepSeek 都兼容,可以)
- Anthropic / Gemini 是各自的 native API,SDK 互不兼容
- LiteLLM 给一个统一的 `acompletion(model, messages)` 接口,自动按 model 前缀路由

为什么保留 OpenAI SDK 的 dependency:
- LiteLLM 本身**用 OpenAI SDK 做** OpenAI 兼容协议的底层 transport
- 保留 dependency 让升级版本时锁定一致

切换 provider:
- env LLM_PROVIDER=mimo|openai|anthropic|gemini|qwen
- 各家的 API key + 模型 ID 单独 env
- 不需要改任何业务代码
"""

import logging
from typing import Any

import litellm

from app.core.config import get_settings

log = logging.getLogger(__name__)

# 让 LiteLLM 静默忽略某 provider 不支持的参数(例如 max_completion_tokens 在
# 某些非 OpenAI provider 下不识别),避免业务侧到处写 if/else
litellm.drop_params = True


def _resolve_model() -> tuple[str, dict[str, Any]]:
    """
    返回 (litellm_model_id, kwargs)。kwargs 直接展开传给 litellm.acompletion(),
    业务侧再叠加自己的 messages / tools / stream 等参数。

    LiteLLM model 命名约定:
      - openai/<model>      —— OpenAI 兼容协议(走 api_base)
      - anthropic/<model>   —— Anthropic native
      - gemini/<model>      —— Google native
      - <provider>/<model>  —— 详见 LiteLLM docs
    """
    s = get_settings()
    provider = s.LLM_PROVIDER.lower()

    if provider == "mimo":
        return f"openai/{s.XIAOMI_MIMO_MODEL}", {
            "api_key": s.XIAOMI_MIMO_API_KEY,
            "api_base": s.XIAOMI_MIMO_BASE_URL,
        }
    if provider == "openai":
        return s.OPENAI_MODEL, {"api_key": s.OPENAI_API_KEY}
    if provider == "anthropic":
        return f"anthropic/{s.ANTHROPIC_MODEL}", {"api_key": s.ANTHROPIC_API_KEY}
    if provider == "gemini":
        return f"gemini/{s.GEMINI_MODEL}", {"api_key": s.GEMINI_API_KEY}
    if provider == "qwen":
        return f"openai/{s.QWEN_MODEL}", {
            "api_key": s.QWEN_API_KEY,
            "api_base": s.QWEN_API_BASE,
        }

    raise ValueError(
        f"unknown LLM_PROVIDER={provider}. "
        f"valid: mimo | openai | anthropic | gemini | qwen"
    )


async def acompletion(messages: list[dict], **kwargs: Any) -> Any:
    """
    异步 chat completion。返回 LiteLLM 的 ModelResponse(兼容 OpenAI ChatCompletion 形态),
    业务侧用 `response.choices[0].message.tool_calls` / `delta.content` 等访问没问题。

    stream=True 时返回的是 async iterator,逐 chunk yield ChatCompletionChunk-like 对象。
    """
    model, model_kwargs = _resolve_model()
    log.debug("acompletion via %s (model=%s)", get_settings().LLM_PROVIDER, model)
    return await litellm.acompletion(model=model, messages=messages, **model_kwargs, **kwargs)


def current_provider_label() -> str:
    """给日志 / health check 用,显示当前激活的 provider + model。"""
    s = get_settings()
    model, _ = _resolve_model()
    return f"{s.LLM_PROVIDER}::{model}"
