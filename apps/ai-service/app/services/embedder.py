"""
本地文本 → 512 维向量。

为什么不用第三方 API?
- 中国境内访问 OpenAI / Cohere 不稳
- 小米 MiMo 是 Claude 协议,只有 messages 没 embeddings
- 阿里云 dashscope 又要单独 key + 收费
- BGE-small-zh-v1.5 是开源模型,fastembed 用 ONNX runtime 跑,
  100MB 模型 + CPU 推理 < 100ms,**不烧任何 quota,中文效果一流**

第一次启动会自动下载模型到 ~/.cache/fastembed/,后续直接加载。
"""

import logging
from functools import lru_cache

from fastembed import TextEmbedding

log = logging.getLogger(__name__)

MODEL_NAME = "BAAI/bge-small-zh-v1.5"
EMBEDDING_DIM = 512  # bge-small-zh-v1.5 实际是 512 维


@lru_cache(maxsize=1)
def get_embedder() -> TextEmbedding:
    """单例。第一次调用时下载/加载模型,之后直接用。"""
    log.info("loading embedding model %s (first call may download ~100MB)", MODEL_NAME)
    embedder = TextEmbedding(model_name=MODEL_NAME)
    log.info("embedding model ready")
    return embedder


def embed_text(text: str) -> list[float]:
    """单条文本 → 向量。fastembed 返回 numpy.ndarray,转 Python list 便于序列化。"""
    embedder = get_embedder()
    vectors = list(embedder.embed([text]))
    return vectors[0].tolist()
