"""
RAG reranking —— 二次精排。

LangGraph 流程:
    START → retrieve (BGE-small,bi-encoder,topK=10) → rerank → generate

为什么 retrieve 完还要 rerank:
- bi-encoder(retrieve)对 query 和 doc 各自独立编码,速度快但语义匹配粗
- cross-encoder(rerank)把 (query, doc) 拼一起编码,精度高但慢
- 标准做法是 bi-encoder 拉宽召回(top10)+ cross-encoder 精排到 top3

模型:BAAI/bge-reranker-base(中文友好,~1GB ONNX)。
首次部署会从 hf-mirror.com 下载 + 缓存到 ~/.cache/fastembed,~30-60s。

如果生产嫌 1GB 太大,可以切到:
- jinaai/jina-reranker-v1-turbo-en(150MB,英文为主)
- 或者完全跳过 rerank,把 retrieve 的 top_k 直接调小
"""

import logging
from functools import lru_cache

from app.core.config import get_settings
from app.services.retriever import RetrievedArticle

log = logging.getLogger(__name__)

RERANK_MODEL = "BAAI/bge-reranker-base"


@lru_cache(maxsize=1)
def _get_reranker():
    """
    单例。首次调用时下载 1GB 模型,后续命中本地缓存。
    fastembed.rerank.cross_encoder 模块在 import 时就会拉一些 onnxruntime 依赖,
    所以延迟到这里才 import,RERANK_ENABLED=false 时整个模块都不加载。
    """
    from fastembed.rerank.cross_encoder import TextCrossEncoder

    log.info("loading reranker: %s (this allocates ~1GB)", RERANK_MODEL)
    return TextCrossEncoder(model_name=RERANK_MODEL)


def rerank(
    query: str,
    candidates: list[RetrievedArticle],
    top_n: int = 3,
) -> list[RetrievedArticle]:
    """
    对 retrieve 召回的 candidates 用 cross-encoder 精排,返回 top_n。

    用 title + summary + content 前 600 字作为 doc 文本(跟 retrieve 时
    embedding 的内容范围一致,排序结果不会因为"看的部分不同"漂移)。

    RERANK_ENABLED=false 时直接返回 candidates 前 top_n,不加载模型。
    适合小内存(< 4GB)的服务器,代价是检索精度回到 retrieve bi-encoder 水平。
    """
    if not candidates:
        return []

    if not get_settings().RERANK_ENABLED:
        return candidates[:top_n]

    docs = [
        f"{c.title}\n\n{c.summary or ''}\n\n{c.content[:600]}"
        for c in candidates
    ]

    reranker = _get_reranker()
    # rerank() 返回 generator,逐 doc 给一个 score(越大越相关)
    scores = list(reranker.rerank(query, docs))

    paired = list(zip(candidates, scores, strict=True))
    paired.sort(key=lambda x: x[1], reverse=True)
    top = paired[:top_n]

    log.info(
        "rerank: query=%s..., %d → %d, top scores=%s",
        query[:30],
        len(candidates),
        len(top),
        [round(s, 3) for _, s in top],
    )
    # 把 reranker 的 score 写回 similarity 字段(覆盖原 cosine),
    # 让下游(generate node 的 prompt)显示的是更准确的相关度
    return [
        RetrievedArticle(
            id=c.id,
            title=c.title,
            summary=c.summary,
            content=c.content,
            slug=c.slug,
            similarity=float(s),
        )
        for c, s in top
    ]
