# Python ai-service 生产镜像。slim 镜像 + uvicorn。
# 构建上下文:apps/ai-service(此目录)。

FROM python:3.12-slim AS builder
WORKDIR /app

# 阿里云内网镜像 —— 从 Aliyun ECS 走自家骨干网,不出公网,远比 Tsinghua HTTPS 快
# (阿里云 Linux 3 镜像默认就用这个,在容器里也走它)
RUN echo 'deb http://mirrors.aliyun.com/debian/ bookworm main contrib non-free non-free-firmware' > /etc/apt/sources.list && \
    echo 'deb http://mirrors.aliyun.com/debian/ bookworm-updates main contrib non-free non-free-firmware' >> /etc/apt/sources.list && \
    echo 'deb http://mirrors.aliyun.com/debian-security bookworm-security main contrib non-free non-free-firmware' >> /etc/apt/sources.list

ENV PIP_INDEX_URL=https://mirrors.aliyun.com/pypi/simple/ \
    PIP_TRUSTED_HOST=mirrors.aliyun.com \
    PIP_DISABLE_PIP_VERSION_CHECK=1

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
