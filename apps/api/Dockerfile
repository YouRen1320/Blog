FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma
RUN pnpm install --filter api --frozen-lockfile
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json apps/api/
COPY apps/api/src apps/api/src
RUN cd apps/api && pnpm exec prisma generate
RUN cd apps/api && pnpm exec nest build
RUN pnpm --filter api --prod deploy --legacy /deploy
# Prisma 生成的 .prisma/client 在 monorepo node_modules,deploy 不带过去,手动拷
RUN cp -r /repo/node_modules/.pnpm/@prisma+client*/node_modules/.prisma /deploy/node_modules/.prisma 2>/dev/null ||     cp -r /repo/apps/api/node_modules/.prisma /deploy/node_modules/.prisma 2>/dev/null || true

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /deploy/dist ./dist
COPY --from=builder /repo/apps/api/prisma ./prisma
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -D nodejs \
 && mkdir -p /app/uploads \
 && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node dist/main.js"]
