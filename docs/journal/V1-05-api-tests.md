# V1-05 API 测试

**日期**:2026-05-05
**任务**:#5
**状态**:已完成

## 目标

让 API 拥有可信的回归保障:
- 关键 service 的 unit test(mock Prisma)
- 跨整个 controller / guard / pipe / filter 的 e2e test(真实 Postgres)

**验收**:`pnpm --filter api test` 单测全绿、`pnpm --filter api test:e2e` 全绿。

## 关键决策

### 1. unit + e2e 双轨,不追求堆数量

**备选 A**:每个 service 都写完整单测
**备选 B**:重要逻辑走 unit,主链路走 e2e ✅

理由:
- 简单的 `findUnique` / `findMany` 包装层,unit test 等于在 mock prisma —— 实质是在测自己写的 mock 是否正确,价值有限
- 这种 thin wrapper 出 bug 一定也是在 prisma 调用形状或参数上,e2e 跑起来立刻爆,unit 反而看不出
- 真正值得 unit test 的:**有"业务规则"的方法**(发布状态机、密码校验、sanitize 等)

最终单测 13 个,e2e 20 个,33 个。覆盖了所有路径里"如果改坏会出事"的逻辑。

### 2. e2e 共用一个真实 Postgres,而不是搭测试 DB

**备选 A**:跑测试时 docker 起一个独立的 `blog-postgres-test` 容器
**备选 B**:复用开发 DB,beforeEach 清表

选 B 因为:
- 一份 docker-compose 维护更简单
- 慢的话 CI 上才考虑加测试容器
- e2e 的 `resetDb` 是 deleteMany 顺序删,几十毫秒就完成

代价:跑 e2e 时如果开发库里有重要数据会被洗掉。**所以本项目里"开发库"也是 disposable 的**,真实数据只在生产库。

### 3. 跨 e2e 文件强制 `--runInBand`(串行)

Jest 默认按文件并行跑。3 个 e2e 文件并行执行,各自 beforeEach 都在调用 `resetDb` —— 文件 A 的 user 在跑测试时,文件 B 的 beforeEach 把它删了 → A 的 token 失效 → 401。

**修法**:`jest --runInBand` 强制串行。代价是变慢一点,但 e2e 文件数量小不会有感。

### 4. e2e 用真实 ValidationPipe / 异常过滤器

`bootstrapTestApp()` 显式装上跟生产一样的 pipe + filter:
```ts
app.useGlobalPipes(new ValidationPipe({ whitelist, forbidNonWhitelisted, transform }));
app.useGlobalFilters(new AllExceptionsFilter());
```

否则 e2e 测的就是"裸 controller",看不到 DTO 校验和异常映射。**production parity > test convenience**。

### 5. unit 测专注"业务规则",e2e 测专注"主链路"

#### unit 关注什么
- AuthService:错密码 vs 邮箱不存在,**抛同一个错误**
- ArticlesService:重发布**保留旧 publishedAt**
- PublicService:listArticles **永远注入 `status: PUBLISHED`**
- CategoriesService:slug **缺省时从 name 自动生成**

这些是"行为约束",改坏了 unit 立刻爆。

#### e2e 关注什么
- 完整生命周期(create → publish → 公开能查到 → unpublish → 公开看不到 → delete)
- 401 / 403 边界(无 token / 错角色)
- 唯一约束 → 409 映射
- 分页参数生效

## 实际做了什么

新文件:

```
apps/api/
├── src/modules/
│   ├── auth/auth.service.spec.ts            (3 unit)
│   ├── articles/articles.service.spec.ts    (4 unit)
│   ├── categories/categories.service.spec.ts (3 unit)
│   └── public/public.service.spec.ts        (3 unit)
└── test/
    ├── helpers.ts                           (bootstrapTestApp + resetDb + ensureAdmin + TEST_ADMIN)
    ├── auth.e2e-spec.ts                     (8 e2e)
    ├── articles.e2e-spec.ts                 (5 e2e)
    └── public.e2e-spec.ts                   (7 e2e)
```

`apps/api/test/jest-e2e.json` 加了 `testTimeout: 30000`(慢机器留富余)。

`apps/api/package.json` 的 `test:e2e` 加 `--runInBand`。

删除了 NestJS scaffold 留下的失效 `app.e2e-spec.ts`(它引用了已被删除的 AppController)。

## 踩坑 / 注意

### 坑 1:`import * as request from 'supertest'` 不可调用
TS 在 esModuleInterop=true + supertest 的 ESM-style 导出下,`* as request` 拿到的是 namespace 不是函数本身。
**修法**:`import request from 'supertest'`(默认导入)。

### 坑 2:Jest `setupFilesAfterEach` 不存在
正确的是 `setupFiles` / `setupFilesAfterEach` / `globalSetup` / `globalTeardown`,我手滑写错了一个,Jest 报 "Unknown option"。直接删掉(这个 V1 不需要全局 setup)。

### 坑 3:`await import('bcryptjs')` 在 Jest CJS 模式下抛错
"A dynamic import callback was invoked without --experimental-vm-modules"。
**修法**:把 `await import` 换成顶层 `import * as bcrypt from 'bcryptjs'`。Jest 默认用 CJS,动态 import 要 ESM 模式才工作。

### 坑 4:Prisma 6.19 的"AI consent guard"
跑 `prisma migrate reset` 时 Prisma 会检测到 AI agent 在用,要求 `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` 环境变量。
这是 Prisma 团队在 2025 年加的安全特性,防 AI 误删生产 DB。
**绕开方法**:用 `pnpm db:seed`(upsert,非破坏)恢复种子状态,或者用户手动跑 reset。**故意保留这个保护,不教 AI 怎么绕**。

### 坑 5:e2e 测试需要 prod parity
仅用 `Test.createTestingModule` + `app.init()` 不会装 ValidationPipe / 全局过滤器。这意味着:
- DTO 校验测不到(任何字段都进得来)
- 错误格式测不到(裸 throw 而不是统一 JSON)

helpers.bootstrapTestApp 显式重新装上,跟 main.ts 同步。**main.ts 改了的话,helpers.ts 也要同步改** —— 这是个潜在的维护负担,值得在 Final 阶段把这部分提取成一个共享的 `appBootstrap(app)` 函数。

## 验收记录

```
$ pnpm --filter api test
Test Suites: 4 passed, 4 total
Tests:       13 passed, 13 total

$ pnpm --filter api test:e2e
Test Suites: 3 passed, 3 total
Tests:       20 passed, 20 total

$ pnpm db:seed
✅ Seed 完成(数据库回到 baseline:1 admin / 2 articles / 3 categories / 5 tags)
```

## 给学习者的提醒

- **不要为了覆盖率写 unit test**。覆盖率高不代表代码质量好,只代表测试代码量大。挑"行为约束"测,挑"输入边界"测。
- **e2e 比想象中重要**。在 NestJS 生态里,Pipe + Guard + Filter 的协作是常见 bug 来源,只能用 e2e 抓。
- **production parity** 是 e2e 测试的灵魂:测试环境跟生产环境差一个 pipe,等于没测那一层。
- **测试代码也是代码**,写脏了同样会拖累项目。helpers.ts 的提炼是必须的:别在每个 spec 里复制 30 行 setup。
- **学会优雅地 reset DB**:跨 e2e 文件并行跑必死,要么串行(`--runInBand`),要么每个文件独立 schema。
- **AI 时代的小心思**:工具(如 Prisma)开始内置"防 AI"机制。用 AI 帮你跑命令时,destructive 操作会触发 consent guard,这是好事 —— 写代码的人和审查代码的人之间多一道关。
