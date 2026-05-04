# Nuxt web 生产镜像 —— SSR 模式跑 Nitro 输出
# 构建上下文是 monorepo 根目录

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/

RUN pnpm install --filter web --frozen-lockfile

COPY apps/web ./apps/web
RUN cd apps/web && pnpm exec nuxt build

# ── runtime ────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# 默认监听端口,可通过 PORT env 覆盖
ENV PORT=3000

# Nitro 自包含 standalone 输出,只需要 .output 目录
COPY --from=builder /repo/apps/web/.output ./.output

RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -D nodejs
USER nodejs

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
