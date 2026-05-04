# NestJS api 生产镜像 —— 多阶段构建,runtime 镜像只留 dist + 生产依赖
# 构建上下文必须是 monorepo 根目录(因为我们要 pnpm-lock.yaml + workspace)

FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /repo

# 1. 元文件 + lockfile,先复制让 pnpm 能利用 layer cache
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma

# 2. 装依赖(filter api 只装 api 需要的,monorepo 收益)
RUN pnpm install --filter api --frozen-lockfile

# 3. 复制源码 + Prisma client + 编译
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json apps/api/
COPY apps/api/src apps/api/src

# Prisma generate 不需要 DATABASE_URL,仅读 schema 出 client
RUN cd apps/api && pnpm exec prisma generate
RUN cd apps/api && pnpm exec nest build

# 4. Pruning:把 api 的运行时部分(dist + prod deps)抠出来
RUN pnpm --filter api --prod deploy --legacy /deploy

# ── runtime 阶段 ──────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 复制运行所需:dist + node_modules + prisma migrations(部署时跑 deploy)
COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /deploy/dist ./dist
COPY --from=builder /repo/apps/api/prisma ./prisma

# 不用 root 跑
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -D nodejs
USER nodejs

EXPOSE 3000

# entrypoint:先迁移再起 server
# migrate deploy 不会 prompt(跟 migrate dev 不同),适合生产
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node dist/main.js"]
