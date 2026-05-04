"""
/generate/article 测试。
- 强制 USE_MOCK_LLM=true(避免触发真实 API + quota)
- 校验输入校验 + 输出 schema
"""

import os

import pytest
from fastapi.testclient import TestClient

# 必须在 import app 前设环境变量,settings 是单例 + lru_cache
os.environ["USE_MOCK_LLM"] = "true"
os.environ.setdefault("XIAOMI_MIMO_API_KEY", "test-key")

from app.core.config import get_settings  # noqa: E402
from main import app  # noqa: E402

# 重置 settings 缓存,确保读到我们刚设的环境
get_settings.cache_clear()
client = TestClient(app)


def test_generate_returns_structured_draft():
    res = client.post(
        "/generate/article",
        json={"prompt": "写一篇 NestJS 模块化设计的入门文章", "tone": "technical", "length": "medium"},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    # mock 模式下 title 一定带 [MOCK] 前缀
    assert body["title"].startswith("[MOCK]")
    # 必填字段全部在
    for key in ("title", "slug", "summary", "content", "tags"):
        assert key in body
    # 内容是 Markdown,至少有一个 h2
    assert "## " in body["content"]
    assert isinstance(body["tags"], list)


@pytest.mark.parametrize(
    "payload",
    [
        # prompt 太短(< 2 字)
        {"prompt": "x"},
        # tone 不在枚举里
        {"prompt": "写文章", "tone": "weird"},
        # length 不在枚举里
        {"prompt": "写文章", "length": "huge"},
    ],
)
def test_generate_rejects_invalid_input(payload):
    res = client.post("/generate/article", json=payload)
    # FastAPI / Pydantic 自动给 422
    assert res.status_code == 422
