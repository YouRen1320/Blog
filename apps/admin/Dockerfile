# Vue Admin 生产镜像 —— 静态文件构建后由 Caddy 直接服务,
# 这里产出的镜像只是把 dist 通过一个轻量 nginx 对外暴露,
# 部署时如果用 Caddy 反代静态目录,可以不用这个镜像,直接 mount dist。

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/admin/package.json apps/admin/

RUN pnpm install --filter admin --frozen-lockfile

COPY apps/admin ./apps/admin
RUN cd apps/admin && pnpm exec vue-tsc -b && pnpm exec vite build

# ── runtime:nginx 静态服务 ─────────────────────────────
FROM nginx:1.27-alpine AS runner

# SPA 历史路由要让 / 兜底到 index.html
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
  # 静态资源走长缓存
  location ~* \.(js|css|svg|png|jpg|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
EOF

COPY --from=builder /repo/apps/admin/dist /usr/share/nginx/html

EXPOSE 80
