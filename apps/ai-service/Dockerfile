# Python ai-service 生产镜像。slim 镜像 + uvicorn。
# 构建上下文:apps/ai-service(此目录)。

FROM python:3.12-slim AS builder
WORKDIR /app

# 系统工具
RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# 先复制 pyproject + lock(无),装依赖。利用 layer cache。
COPY pyproject.toml .
RUN pip install --no-cache-dir --user .

# ── runtime ────────────────────────────────────────────
FROM python:3.12-slim AS runner
WORKDIR /app
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# 装好的依赖直接搬过来
COPY --from=builder /root/.local /root/.local
COPY app ./app
COPY main.py .

# 不用 root 跑
RUN useradd --uid 1001 --create-home --shell /bin/bash app
RUN chown -R app:app /app /root/.local
USER app

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
