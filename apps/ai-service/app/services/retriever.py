"""
RAG 检索:对 query 做 embedding,在 articles 表里按 cosine 距离取 top-K。

为什么直连 Postgres 不走 NestJS API:
- 检索逻辑天然属于 AI 服务的"理解"环节,跟 NestJS 业务逻辑无关
- 走 API 多一跳,而且要把全文返回再 embed,慢
- 直连节约 ~100ms,且代码简单
"""

import logging
from dataclasses import dataclass

import psycopg
from pgvector.psycopg import register_vector

from app.core.config import get_settings
from app.services.embedder import embed_text

log = logging.getLogger(__name__)


@dataclass
class RetrievedArticle:
    id: str
    title: str
    summary: str | None
    content: str
    slug: str
    similarity: float  # 1 - cosine_distance,越接近 1 越像


def _conn():
    """每次新连接,小流量场景够用;大流量再上 pool。"""
    s = get_settings()
    return psycopg.connect(s.DATABASE_URL)


def retrieve(query: str, top_k: int = 3, min_similarity: float = 0.5) -> list[RetrievedArticle]:
    """
    对 query 做 embedding,在已发布文章里找 top_k 最相似的。

    - 用 pgvector 的 cosine 距离 `<=>` 操作符
    - 1 - cosine_distance = similarity(范围 0~1)
    - 过滤掉 similarity < min_similarity 的(不相关的不要硬塞)
    - 只检索 PUBLISHED 文章(草稿不该被引用)
    """
    query_vec = embed_text(query)
    with _conn() as conn:
        register_vector(conn)
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, title, summary, content, slug,
                       1 - (embedding <=> %s::vector) AS similarity
                FROM articles
                WHERE status = 'PUBLISHED' AND embedding IS NOT NULL
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (query_vec, query_vec, top_k),
            )
            rows = cur.fetchall()
    results = [
        RetrievedArticle(id=r[0], title=r[1], summary=r[2], content=r[3], slug=r[4], similarity=float(r[5]))
        for r in rows
        if r[5] >= min_similarity
    ]
    log.info("retrieve: query=%s..., %d results above %.2f", query[:30], len(results), min_similarity)
    return results
