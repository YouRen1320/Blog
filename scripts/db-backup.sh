#!/usr/bin/env bash
# Postgres 每日备份脚本 —— 留 7 天,过期自动删
# 用 systemd timer 调度(由 db-backup.timer / db-backup.service)
# 本地环境变量需 source 自 /opt/blog/.env.production

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/blog}"
KEEP_DAYS="${KEEP_DAYS:-7}"
COMPOSE_FILE="${COMPOSE_FILE:-/opt/blog/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-/opt/blog/.env.production}"

mkdir -p "$BACKUP_DIR"

# 容器内 pg_dump 比 host 上跑 pg_dump 简单:不需要装 postgres-client
ts=$(date +%Y%m%d-%H%M%S)
out="$BACKUP_DIR/blog-$ts.sql.gz"

# 从 .env.production 读 POSTGRES_USER / POSTGRES_DB
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "[$(date)] dumping to $out"
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
  | gzip -9 > "$out"

# 删 N 天前的备份
find "$BACKUP_DIR" -name "blog-*.sql.gz" -mtime "+$KEEP_DAYS" -delete -print

echo "[$(date)] done. current backups:"
ls -lh "$BACKUP_DIR" | tail -10
