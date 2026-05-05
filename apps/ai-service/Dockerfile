FROM python:3.12-slim AS builder
WORKDIR /app
RUN sed -i "s|deb.debian.org|mirrors.cloud.aliyuncs.com|g" /etc/apt/sources.list.d/debian.sources
ENV PIP_INDEX_URL=http://mirrors.cloud.aliyuncs.com/pypi/simple/ PIP_TRUSTED_HOST=mirrors.cloud.aliyuncs.com PIP_DISABLE_PIP_VERSION_CHECK=1
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml .
RUN pip install --no-cache-dir --user .

FROM python:3.12-slim AS runner
RUN useradd --uid 1001 --create-home --shell /bin/bash app
WORKDIR /app
COPY --from=builder --chown=app:app /root/.local /home/app/.local
COPY --chown=app:app app ./app
COPY --chown=app:app main.py .
USER app
# BGE 模型首次启动从 hf-mirror.com 下载到 ~/.cache/fastembed(<100MB,~30s)
# 之前试过 builder 阶段预下载 + COPY 缓存,但 `RUN ... | tail` 会吞错误
# 导致缓存有时是空的,改成运行时下载更可靠
ENV PATH=/home/app/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HF_ENDPOINT=https://hf-mirror.com
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
