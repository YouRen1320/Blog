# V1-01 工程基建

**日期**:2026-05-05
**任务**:#1
**状态**:已完成

## 目标

把 monorepo 的"地基"打好,后续每个任务都能站在这个地基上跑:
- 环境变量有统一管理(.env / .env.example)
- 根目录 `pnpm` 脚本能联动各 app(`pnpm dev` 起所有服务,`pnpm dev:api` 起单个)
- 共享类型包 `@blog/shared` 的位置占好
- 数据库容器有 healthcheck,启动状态可观测
- 所有敏感值(数据库密码、JWT secret、AI API key)有规范的存放位置,绝不进 git

**验收标准**:`pnpm install` 成功,`pnpm db:up` 后 `docker compose ps` 显示 postgres `(healthy)`。

## 关键决策

### 1. `.env` 放根目录,而不是每个 app 一份

**备选 A**:每个 app 一份独立 `.env`,各自维护
**备选 B**:根目录一份 `.env`,所有 app 都从这里读 ✅
**备选 C**:用 `dotenv-cli` 做转发

选 B 的理由:
- 根目录 `.env` 是 docker-compose 默认就读的位置(无配置成本)
- 整个项目状态一眼看完,不用在 4 个目录之间切换
- 各 app 框架(NestJS / Vite / Nuxt)都能用 `--env-file` 或 `dotenv` 指向这一份
- V2 部署时服务器只需要维护**一份** `/opt/blog/.env`

代价:Vite 和 Nuxt 默认读自己 cwd 的 `.env`,V1-06 / V1-08 时需要额外配置(到时候解决)。

### 2. `docker-compose` 用变量替换,不写死凭据

旧 compose 直接硬编码 `POSTGRES_USER: blog`。问题是上线时要改成强密码,改 compose 文件本身就要重新部署。

新写法:
```yaml
POSTGRES_USER: ${POSTGRES_USER:-blog}
```

`${VAR:-default}` 含义是"如果 VAR 没设就用 default"。本地不配 `.env` 也能跑,生产配了就用强密码。**生产 / 开发用同一份 compose** 是这一步的关键收益。

### 3. Postgres 镜像换 alpine

`postgres:16` → `postgres:16-alpine`:体积 ~80MB 而不是 ~440MB。下载、传到服务器、CI 都更快。Alpine 是基于 musl libc 的 Linux 发行版,对 Postgres 这种成熟数据库来说兼容性已经过千万级生产验证,没有风险。

### 4. Postgres 加 healthcheck

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
```

为什么必须做:
- 后面 V1-02 跑 prisma migrate 之前必须确认数据库**真的能接受连接**(容器 Started ≠ 数据库 ready,差一个初始化窗口)
- V2 部署时 GitHub Actions 要等 db ready 才能跑 migration
- `docker compose ps` 直接显示 `(healthy)`,排查问题省一步

注意 `$$` 双美元符号的转义:docker-compose 把单 `$` 当成自己的变量,`$$` 才会传给 shell 后变成 `$`,让 `pg_isready` 能读到容器内的环境变量。这是个小坑。

### 5. 暂不引入 turbo / nx

**备选**:很多 monorepo 用 [Turborepo](https://turbo.build/) 或 Nx 管任务依赖图、做缓存。

**决定**:V1 不引入。理由:
- 5 个 app + 1 个 package,任务依赖很简单
- 引入工具就要配 `turbo.json` / `nx.json`,先复杂度后收益
- pnpm 自带的 `-r --parallel` 足以
- 后期需要再加,不是单向门

## 实际做了什么

| 文件 | 改动 |
|------|------|
| `.env.example` | 新建,作为环境变量的"目录索引",按 app 分段注释 |
| `.env` | 新建,本地开发实际值(已 gitignored) |
| `docker-compose.yml` | 镜像换 alpine、变量替换、加 healthcheck、`restart: always` 改 `unless-stopped`(`always` 会在手动 stop 后也重启,通常不是想要的) |
| `package.json` | 加 `dev` / `build` / `test` / `lint` / `format` 等联动脚本 |
| `packages/shared/package.json` | 新建工作区包 `@blog/shared`,目前是空壳 |
| `packages/shared/src/index.ts` | 占位 export,V1-04 起填入共享 DTO |
| `packages/shared/tsconfig.json` | 单独 tsconfig,严格模式 + ESM |

`pnpm-workspace.yaml` 之前已经写了 `packages/*`,所以新建 `packages/shared` 后 `pnpm install` 自动注册成第 5 个 workspace project。

## 踩坑 / 注意

1. **`restart: always` vs `unless-stopped`**
   `always` 即使你手动 `docker stop` 也会自动重启,调试时很烦人。生产场景一般用 `unless-stopped`(开机自动起,但尊重手动 stop)。
2. **healthcheck 里的 `$$`**
   docker-compose YAML 文件里 `$VAR` 是 compose 自己的变量替换。要传变量给容器内的 shell,必须写 `$$VAR`。如果错写成 `$POSTGRES_USER`,compose 会试图用宿主机环境替换,然后传一个空字符串给 shell。
3. **`postgres:16` → `postgres:16-alpine` 是改 image 名**
   旧容器要 `docker compose down` 后重新 `up`,直接 `up` 会因为 `container_name` 已存在而报错。
4. **`pnpm install` 警告 `Ignored build scripts: esbuild`**
   pnpm 10 默认不让依赖跑 install 脚本(供应链安全)。`esbuild` 是被 vite/nuxt 间接依赖的,正常;它会在用到时回退到下载预编译二进制。如果后面跑 admin / web 报错说 esbuild 没有,再 `pnpm approve-builds` 处理。

## 验收记录

```
$ pnpm install
Scope: all 5 workspace projects
Lockfile is up to date
Done in 3.4s

$ docker compose up -d
Container blog-postgres  Started

$ docker compose ps
NAME            IMAGE                STATUS                    PORTS
blog-postgres   postgres:16-alpine   Up 11 seconds (healthy)   0.0.0.0:5432->5432/tcp

$ docker inspect blog-postgres --format '{{.State.Health.Status}}'
healthy

$ docker exec blog-postgres psql -U blog -d blog -c "\conninfo"
You are connected to database "blog" as user "blog" via socket
```

## 给学习者的提醒

- **不要把 `.env` 加到 git**。即使是开发值,养成习惯,迟早会有一行你以为是 dev 但是真 secret。`.env.example` 是放给同事/未来自己看的"目录"。
- **每个新建 workspace 都要重跑 `pnpm install`**,否则依赖关系不会建,`@blog/shared` 引用会找不到。
- **healthcheck 不是装饰**。脚本类自动化(prisma migrate、CI 部署)依赖它判断时机。早做比补做便宜。
- **从一开始就让 compose 接受环境变量覆盖**,生产部署不用维护两份 compose。这种"一份配置走全场"的写法越早建立,后面回头改的成本越高。
