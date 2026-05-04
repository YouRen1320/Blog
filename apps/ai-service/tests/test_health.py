"""
基础健康检查测试。fastapi.testclient 走的是同进程 ASGI,
不需要真起 uvicorn,跑得很快。
"""

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_healthz_returns_ok():
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
