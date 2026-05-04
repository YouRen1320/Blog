# V1-02 数据库建模

**日期**:2026-05-05
**任务**:#2
**状态**:已完成

## 目标

把 README §681-753 设计的数据模型落到代码 + 真实数据库:
- Prisma schema 写好(User / Article / Category / Tag / ArticleTag)
- 跑 migration 在 Postgres 里建出对应的表
- 写一份 seed 脚本,造出可登录的管理员 + 几篇示例数据
- `pnpm db:seed` 一键重置到已知状态

**验收**:`docker exec blog-postgres psql -U blog -d blog -c "\dt"` 能看到全部业务表;seed 后 `SELECT FROM articles` 能看到示例文章。

## 关键决策

### 1. 选 Prisma 6 不选 Prisma 7
[详见 ADR 0002](../decisions/0002-prisma-version-choice.md)

简而言之:Prisma 7 引入了 driver adapter 强制依赖,跟 NestJS 的 CJS 默认搭配摩擦大,且生态资料还没跟上。一个标准博客项目用 Prisma 6 才划算。

### 2. 表名用 `@@map` 显式映射
schema 里的模型名是 PascalCase(`Article`、`User`),数据库里希望用 snake_case 复数(`articles`、`users`):
```prisma
model User {
  ...
  @@map("users")
}
```

理由:
- 业务层(NestJS、TS)期待大写驼峰(`prisma.user`)
- DBA / 运维查 SQL 期待小写复数表名(`select * from users`)
- 双方都得到自己习惯的命名,中间靠 Prisma 翻译

### 3. 复合索引覆盖最常见查询
```prisma
@@index([status, publishedAt])
@@index([categoryId])
```

`(status, publishedAt)` 这一对覆盖**前台公开列表**最常见的 SQL:
```sql
WHERE status = 'PUBLISHED' ORDER BY published_at DESC LIMIT 20;
```

`categoryId` 单独建索引,服务"分类页文章列表"接口。

故意**不**建 `slug` 的索引,因为 `@unique` 已经隐式建了。

### 4. 外键级联策略各不相同
```prisma
author     User     @relation(..., onDelete: Restrict)    // 不让删用户带走文章
category   Category? @relation(..., onDelete: SetNull)    // 删分类只是把文章变成"未分类"
tag (在 article_tags) → onDelete: Cascade                  // 标签解绑无副作用,直接删关联
```

理由:**业务后果不同的关系不能用同一种级联策略**。

- 用户带走文章会丢数据,必须先转移作者再删用户
- 分类变成"未分类"是合理的降级
- 标签和文章关联只是路由信息,删干净没事

### 5. seed 用 upsert,不用 createMany
seed 的核心约定是**幂等**:跑十次和跑一次结果一样。

`upsert({ where, update: {}, create })` 实现:存在就跳过,不存在就建。

`createMany` 第二次跑就 unique constraint 报错。开发者本能改成 `await prisma.user.deleteMany()` + `createMany`,但那会把别人正在调试的数据洗掉。**永远不要 destructive seed**,除非显式叫 `db:reset`。

### 6. 管理员密码用 bcryptjs
**备选**:`bcrypt`(原生绑定,更快)
**已选**:`bcryptjs`(纯 JS,慢一点但跨平台)

理由:bcrypt 编译时要 node-gyp + Python,Docker 多阶段构建容易踩坑。博客登录频率每天个位数,bcryptjs 的速度差异(微秒级)感知不到。**省下的部署时间** > 节省的 CPU。

### 7. 用 dotenv-cli 而不是改写 .env 加载逻辑
跑 prisma 命令时要让它读到根目录的 `DATABASE_URL`。三个备选:

A. apps/api 单独维护一份 `.env`(同步麻烦)
B. 改 prisma 配置文件,显式加载 `../../.env`
C. 用 `dotenv -e ../../.env -- prisma migrate` 包裹 ✅

选 C 因为 prisma + NestJS @nestjs/config + tests 都能用同一种"路径前缀"方式注入根 .env,**统一**比"配置一次性"重要。

## 实际做了什么

| 文件 | 改动 |
|------|------|
| `apps/api/package.json` | 加 prisma + @prisma/client + bcryptjs + slugify + dotenv-cli;加 `db:generate` / `db:migrate` / `db:seed` 等脚本;`prisma.seed` 配置 |
| `apps/api/prisma/schema.prisma` | 全部 5 个 model + 2 个 enum + 索引 + @@map |
| `apps/api/prisma/seed.ts` | 幂等 seed:1 admin + 3 分类 + 5 标签 + 2 文章 |
| `apps/api/.gitignore` | 移除 Prisma 7 留下的 `/generated/prisma`(回到 v6 默认到 node_modules) |
| `apps/api/.env` | 删除(防止跟根 `.env` 冲突) |
| `apps/api/prisma.config.ts` | 删除(Prisma 6 不需要) |

## 踩坑 / 注意

### 坑 1:Postgres 镜像换 alpine 后 collation 报错
V1-01 把 `postgres:16` 换成 `postgres:16-alpine`。但 docker volume `pgdata` 是之前用 glibc 镜像建的,glibc 和 musl 的 collation 版本对不上,migrate 时报:
```
template database "template1" has a collation version, but no actual collation version could be determined
```
**解法**:`docker compose down -v` 清掉 volume 后重新 up。教训:**换镜像 base** 在生产是大事,V2 部署时记得在服务器上提前规划数据迁移。

### 坑 2:Prisma 7 的 schema.prisma 不让写 `url`
`prisma.config.ts` 接管了 datasource URL 后,schema 里再写 `url = env("DATABASE_URL")` 会报 P1012 错。一开始没注意到这是 Prisma 7 的强制约束,以为是我哪里配错了。降到 Prisma 6 后这个写法又合法了。

### 坑 3:Prisma 7 的 PrismaClient 不能 `new PrismaClient()`
v7 起 PrismaClient 必须传 `adapter` 或 `accelerateUrl`,无参构造直接抛 `PrismaClientInitializationError`。这就是为什么我们决定降版。

### 坑 4:Prisma migrate dev 会"误报"已同步
当 schema.prisma 只有 `generator` + `datasource`(没有 model)时,`migrate dev` 会输出 `Already in sync, no schema change`,而不是抱怨"你没写 model"。第一次发现 schema 内容神秘消失时,被这个误导了一阵。**养成习惯:跑 migrate 后立刻 `\dt` 确认表真的建出来了**。

### 坑 5:ts-node 跑 ESM 生成产物
Prisma 7 默认 generator 输出 ESM 模块(用 `import.meta.url`),但 ts-node 默认是 CJS。这是为什么 seed 一开始报 "Cannot find module '../generated/prisma'":既找不到入口,又跑不动 ESM。回到 Prisma 6 的 prisma-client-js generator,产物是 CJS,丢回 `node_modules/.prisma/client`,seed 直接 `from '@prisma/client'` 无脑解决。

## 验收记录

```
$ pnpm db:migrate --name init
Applying migration `20260504183321_init`
Your database is now in sync with your schema.

$ pnpm db:seed
✅ Seed 完成
   管理员:admin@iyouren.top / admin12345
   文章:已发布 1 篇 + 草稿 1 篇
   分类:3 个,标签:5 个

$ docker exec blog-postgres psql -U blog -d blog -c "\dt"
 public | _prisma_migrations | table | blog
 public | article_tags       | table | blog
 public | articles           | table | blog
 public | categories         | table | blog
 public | tags               | table | blog
 public | users              | table | blog
(6 rows)

$ docker exec blog-postgres psql -U blog -d blog -c "SELECT title, status FROM articles;"
 你好,博客         | PUBLISHED
 Vue 组件设计草稿  | DRAFT
```

## 给学习者的提醒

- **第一次跑 migrate 之后立刻验证表**。Prisma 在某些状态下会"友好地"什么都不做,如果你不主动确认,会以为成功了。
- **schema 里的关系字段两边都要写**:有 `articles Article[]` 在 User 里,就必须在 Article 里有 `author User @relation(...)`。少一边会 silent skip。
- **永远幂等的 seed**:用 `upsert`,不要 `deleteMany + createMany`。不然多人协作时会洗掉别人的数据。
- **schema 里的所有"业务约束"尽量上 DB 层**:`@unique`、`@@index`、`onDelete`。不要只靠业务层守。DB 是最后一道防线,迟早有 race condition 让你后悔。
- **认清你用的工具版本**。Prisma 6 → 7 是 major 升级,行为差异大。`pnpm add` 默认装 latest,如果项目对稳定性敏感,用 `^6` 这种范围锁住。
- **dotenv-cli 是好朋友**:任何 npm script 前面加 `dotenv -e ../../.env --` 都能拿到根目录的 env,无需改业务代码。
