# Nuxt web 生产镜像 —— SSR 模式跑 Nitro 输出。
#
# 历史:V1.3 加评论组件后,docker 容器内 @tailwindcss/oxide 在多线程
# 处理 .vue 文件时触发 UTF-8 byte-slice panic
# (vue.rs:18:59 "Utf8Error{valid_up_to:45}",4.1/4.2 都没修)。
# 改成"镜像外 build,镜像内只跑"模式 —— Dockerfile 只 COPY 已 build 的
# `.output` 目录,绕过 oxide。
#
# 部署流程:
#   本地: cd apps/web && pnpm build         # 生成 apps/web/.output
#   服务器: tar `.output` 同步过去, 然后 docker compose build web

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Nitro standalone 输出已经包含所需 node_modules,镜像不需要装依赖
COPY .output ./.output

RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -D nodejs
USER nodejs

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
