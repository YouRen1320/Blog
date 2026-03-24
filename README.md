# Blog（Vue + NestJS）全栈项目

- 前端：Vue 3（Vite + TypeScript）
- 后端：NestJS（TypeScript）
- 数据库：PostgreSQL（Docker）
- ORM：Prisma
- 包管理：pnpm

---

## 快速开始

在仓库根目录：

1）安装依赖：

- `pnpm install`

2）启动数据库（PostgreSQL）：

- `docker compose up -d`
- 查看日志：`pnpm db:logs`

3）启动前后端：

- `pnpm dev`
  - 仅前端：`pnpm dev:web`
  - 仅后端：`pnpm dev:api`

> 依赖新增/升级都建议在根目录用 filter：
>
>- 前端：`pnpm --filter web add <pkg>`
>- 后端：`pnpm --filter api add <pkg>`

---

## 仓库结构（Monorepo）

```
Blog/
  apps/
    web/          # Vue 前端
    api/          # NestJS 后端
  packages/
    shared/       # 前后端共享 types
  docker/
    postgres/     # 数据库初始化脚本
  docker-compose.yml
  pnpm-workspace.yaml
  .env            # 本地开发环境变量
  README.md
```
---

未完待续
