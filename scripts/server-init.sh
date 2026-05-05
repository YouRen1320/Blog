#!/usr/bin/env bash
# 服务器初始化脚本 —— 第一次部署在阿里云 ECS 上执行一次
# 假设当前用户已经能 sudo(admin 默认在 wheel 组)
#
# 跑法:
#   curl -fsSL https://raw.githubusercontent.com/YouRen1320/Blog/main/scripts/server-init.sh | bash
# 或:
#   bash server-init.sh

set -euo pipefail

DEPLOY_USER="admin"
DEPLOY_DIR="/opt/blog"
REPO_URL="https://github.com/YouRen1320/Blog.git"

log() { echo -e "\033[1;32m[init]\033[0m $1"; }

# 1. 装基础包(阿里云 Linux 3 / OpenAnolis 用 dnf)
log "更新包 + 装 git / curl"
sudo dnf install -y git curl ca-certificates

# 2. 装 docker(如果没装)
if ! command -v docker >/dev/null; then
  log "装 docker"
  sudo dnf install -y docker
  sudo systemctl enable --now docker
  sudo usermod -aG docker "$DEPLOY_USER"
  log "需要 logout 重登才能不带 sudo 跑 docker"
fi

# 3. 装 docker compose v2(plugin 形式)
if ! docker compose version >/dev/null 2>&1; then
  log "装 docker compose plugin"
  sudo mkdir -p /usr/local/lib/docker/cli-plugins
  sudo curl -fsSL "https://github.com/docker/compose/releases/download/v2.30.3/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

# 4. 准备部署目录
sudo mkdir -p "$DEPLOY_DIR"
sudo chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"

if [ ! -d "$DEPLOY_DIR/.git" ]; then
  log "克隆仓库到 $DEPLOY_DIR"
  git clone "$REPO_URL" "$DEPLOY_DIR"
fi

# 5. 提示生产 .env
if [ ! -f "$DEPLOY_DIR/.env.production" ]; then
  log "生产 .env.production 不存在,写入模板"
  cat > "$DEPLOY_DIR/.env.production" <<'EOF'
# 生产环境变量 —— 强密码,不要提交到 git
NODE_ENV=production

# Postgres
POSTGRES_USER=blog
POSTGRES_PASSWORD=__CHANGE_ME_STRONG__
POSTGRES_DB=blog

# NestJS
JWT_SECRET=__CHANGE_ME_STRONG_RANDOM__
JWT_EXPIRES_IN=7d

# AI Service
XIAOMI_MIMO_API_KEY=__YOUR_KEY__
XIAOMI_MIMO_BASE_URL=https://api.xiaomimimo.com/v1
XIAOMI_MIMO_MODEL=mimo-v2.5-pro
USE_MOCK_LLM=false

# LangSmith tracing(可选,留空=不开)
LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=blog-ai
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
EOF
  chmod 600 "$DEPLOY_DIR/.env.production"
  log "请编辑 $DEPLOY_DIR/.env.production 填入真实 secret 后再跑 docker compose"
fi

log "完成。下一步:"
log "  1. 编辑 $DEPLOY_DIR/.env.production"
log "  2. cd $DEPLOY_DIR && docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build"
