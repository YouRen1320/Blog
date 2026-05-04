# ADR 0002:选 Prisma 6,不选 Prisma 7

**日期**:2026-05-05
**状态**:已采纳

## 背景

`pnpm add prisma @prisma/client` 默认装的是 latest,在 2026-05 是 7.8.0。但跑起来才发现 Prisma 7 引入了几个**架构级别**的破坏性改动,显著抬高了一个标准博客项目的门槛。

## Prisma 7 vs Prisma 6 的差异

| 维度 | Prisma 6 | Prisma 7 |
|------|----------|----------|
| 数据库连接 | `new PrismaClient()` 直连,自动读 `DATABASE_URL` | 必须显式提供 `adapter`(driver adapter)或 `accelerateUrl`(Prisma 云服务) |
| 配置文件 | 仅 `schema.prisma` | 强制 `prisma.config.ts`;schema 里 `url = env(...)` 不再支持 |
| 默认 generator | `prisma-client-js`(成熟) | `prisma-client`(新,output 到自定义目录,生成 ESM) |
| seed 配置位置 | `package.json` 的 `prisma.seed` | `prisma.config.ts` 的 `migrations.seed` |
| 与 NestJS 的契合度 | 高(都是 CJS,直接 import @prisma/client) | 低(client 是 ESM,需要适配) |
| 教程 / StackOverflow 数量 | 极多 | 极少(刚出几个月) |

## 选项

### A. 跟进 Prisma 7,引入 driver adapter
```bash
pnpm add @prisma/adapter-pg pg
```
然后到处:
```ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

**好处**:用最新架构,未来值得。Driver adapter 在 Edge Runtime / Cloudflare Workers 这类不能直接 TCP 的环境是必须的。

**坏处**:
- 每个使用 PrismaClient 的地方都要先构造 adapter,模板代码 +5 行
- NestJS 的 PrismaService 模式要重新设计
- ESM client 跟 NestJS CJS 默认有摩擦
- 出错时可参考资料极少

### B. 降到 Prisma 6.x ✅
```bash
pnpm add prisma@^6 @prisma/client@^6
```
回到经典模式:`new PrismaClient()` 直接用,`@prisma/client` 直接 import,所有 NestJS+Prisma 教程都对得上。

**好处**:
- 全网教程、模板、StackOverflow 都对得上
- NestJS 的 PrismaService 三行能写完
- `@prisma/client` 包含 ESM 和 CJS,跨环境无脑

**坏处**:
- 将来想上 Edge Runtime 时还是得迁移
- 不算"最新最酷"

## 决定

**选 B —— Prisma 6.19.3**。理由:

1. **学习项目价值**:这个项目重点是"全栈博客 + AI 链路",不是"探索 Prisma 7 driver adapter"。把脑力花在业务上更有学习价值。
2. **Edge Runtime 不是当前目标**:V2 部署到阿里云 ECS Docker,直连 Postgres 没有任何问题。Driver adapter 解决的痛点跟这个项目无关。
3. **生态尚未跟进**:NestJS 官方文档、第三方教程、模板,2026 年 5 月仍以 Prisma 6 为主。早适应 v7 的成本无法摊销。
4. **可逆**:如果未来真要上 Edge,从 v6 升 v7 是单点工作量,而不是分散在所有模块里。

## 后果

- 整个 V1-V4 都用 Prisma 6 API
- `package.json` 里 `^6.10.0` 限制不要让 Renovate / Dependabot 自动跳到 7.x
- `prisma.config.ts` 不再使用,删除
- schema 里的 `datasource.url` 保留 `env("DATABASE_URL")` 写法
- seed 配置回到 `package.json` 的 `prisma.seed`

## 验证

参考 docs/journal/V1-02-database.md 末尾"验收记录"。
