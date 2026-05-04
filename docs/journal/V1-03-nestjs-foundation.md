# V1-03 NestJS 基础设施

**日期**:2026-05-05
**任务**:#3
**状态**:已完成

## 目标

把 NestJS 从空壳变成一个**可登录、可鉴权、有统一错误格式**的工程基座:
- ConfigModule 启动时校验环境变量
- PrismaService 全局可注入,生命周期跟应用一致
- 全局 JWT 守卫 + RolesGuard,默认所有路由要 token,@Public() 标记的放行
- AuthModule 提供 `POST /auth/login` 和 `GET /auth/profile`
- UsersModule 提供 `GET /users/me`
- 全局 ValidationPipe(白名单 + 拒绝额外字段)
- 全局 AllExceptionsFilter 把 Prisma 错误映射到 HTTP 状态
- helmet 安全头 + CORS(开发宽松,生产收紧)

**验收**:用 seed admin 登录拿到 JWT,带 token 调 `/users/me` 返回用户信息;不带 token 返回 401;DTO 字段不合法返回 400。

## 关键决策

### 1. 全局守卫(APP_GUARD),不是每个 controller 加 @UseGuards

**备选 A**:在每个需要鉴权的 Controller 顶上写 `@UseGuards(JwtAuthGuard)`
**备选 B**:在 AppModule 注册 `APP_GUARD`,默认所有路由都要 token,公开路由用 `@Public()` 显式开口 ✅

选 B 的理由:
- "默认安全,显式公开"比"默认开放,显式保护"更难漏
- 加新接口时,作者**必须主动**思考"这个要不要鉴权",而不是不写就忘
- 同样的逻辑用于 RolesGuard:写 @Roles('ADMIN') 才需要管理员,不写就普通登录用户即可

### 2. PrismaService 用 NestJS 模块化方式

**备选 A**:`export const prisma = new PrismaClient()` 单例
**备选 B**:`@Injectable() class PrismaService extends PrismaClient` ✅

选 B 的理由:
- NestJS 测试体系(`@nestjs/testing`)需要 DI 才能 mock
- 生命周期钩子(`OnModuleInit`/`OnModuleDestroy`)能在应用退出前优雅断开连接
- 未来要换连接池配置、Read replica、动态 schema 都好扩展

### 3. JwtStrategy.validate() 重新查库

```ts
async validate(payload: JwtPayload) {
  const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new UnauthorizedException('用户不存在或已被删除');
  ...
}
```

**备选**:直接相信 token payload 里的 user 信息,不查库(性能更好)
**已选**:每次都查一次库(每个鉴权请求 +1 次 SELECT)

理由:**安全 > 性能**。
- 用户被 ban / 降权后,如果只信 token,他还能继续用旧 token 操作直到过期
- 博客访问量低,多一次主键 SELECT 完全无感
- 后续要做 RBAC、组织切换、token 黑名单时,这一步是天然钩子

如果性能成瓶颈,可以加 30 秒级 LRU 缓存,但那是 Final 阶段的事。

### 4. 错误处理:Prisma 错误映射到 HTTP 状态

```ts
case 'P2002': status = 409  // unique 冲突
case 'P2025': status = 404  // 记录不存在
```

**备选**:让 Prisma 错误冒泡成 500,客户端自己看消息
**已选**:在 `AllExceptionsFilter` 集中转换为合适的 4xx

理由:
- 客户端不应该被 Prisma 内部错误码污染
- 4xx vs 5xx 是客户端做"是否重试"判断的关键依据
- 业务层的 NotFoundException、ConflictException 该抛还是抛(更显式),但当 ORM 层比业务层先发现问题时,过滤器兜底

### 5. 登录失败统一 "邮箱或密码错误"

```ts
if (!user) throw new UnauthorizedException('邮箱或密码错误');
const ok = await bcrypt.compare(...);
if (!ok) throw new UnauthorizedException('邮箱或密码错误');
```

不区分"邮箱不存在"和"密码错"。

理由:**侧信道防御**。如果区分,攻击者可以通过爆破邮箱地址判断哪些账号存在,作为后续社工 / 钓鱼的目标列表。

### 6. ConfigModule.forRoot 启动时校验

```ts
ConfigModule.forRoot({
  envFilePath: ['../../.env'],
  validate: validateEnv,
});
```

`validate` 是 class-validator 跑一遍,如果 `JWT_SECRET` 缺失,**应用直接启动失败**,而不是等到第一个登录请求才发现 token 签不出来。

这种"启动期失败"是工程化的小但关键的习惯。

## 实际做了什么

主要文件:

- `src/main.ts` — 引导文件:helmet、CORS、ValidationPipe、全局过滤器
- `src/app.module.ts` — 注册各模块 + 两个 APP_GUARD
- `src/config/env.validation.ts` — 启动期 env 校验
- `src/prisma/prisma.module.ts` + `prisma.service.ts` — 全局 Prisma
- `src/common/decorators/` — Public、Roles、CurrentUser
- `src/common/guards/` — JwtAuthGuard、RolesGuard
- `src/common/filters/http-exception.filter.ts` — 统一错误格式
- `src/modules/auth/` — Login DTO、Service、Controller、JwtStrategy
- `src/modules/users/` — UsersService、UsersController(只有 GET /users/me)

清理:删了 `app.controller.ts` / `app.service.ts` / `app.controller.spec.ts`(空壳的 hello world)。

修了 `tsconfig.build.json`,把 `prisma/` 加进 exclude(不然 seed.ts 被卷入,rootDir 上滑导致 dist/main.js 跑到 dist/src/main.js)。

## 踩坑 / 注意

### 坑 1:isolatedModules + 装饰器 + 类型导入
`@CurrentUser() user: AuthUser` 写法,TS 报:
> A type referenced in a decorated signature must be imported with 'import type' or a namespace import when 'isolatedModules' and 'emitDecoratorMetadata' are enabled.

修法:`import { CurrentUser, type AuthUser } from '...'`。
**底层原因**:NestJS 装饰器需要运行时元数据(`emitDecoratorMetadata`),但 isolatedModules 不允许把"实际是类型"的东西当值导入,必须显式 `type`。

### 坑 2:JWT expiresIn 类型严格
`@nestjs/jwt` 11 的 `signOptions.expiresIn` 类型是模板字面量(`'7d'` / `'30s'` 等的并集),env 读出的 `string` 直接赋值会被拒。修法是导入 `jsonwebtoken` 的 `SignOptions` 类型再 cast。也得装 `@types/jsonwebtoken`。

### 坑 3:nest build 输出目录因兄弟目录而上滑
项目里 `apps/api/` 下既有 `src/` 也有 `prisma/`(seed.ts)。tsc 会取它们的最近公共父目录作为 rootDir,结果产物变成 `dist/src/main.js`,而不是 `dist/main.js`。`start:prod` 默认指向 `dist/main`,跑不起来。

修法:在 `tsconfig.build.json` 把 `prisma` 加进 `exclude`。这样 build 只看 src,rootDir 自然回到 src,产物落到 `dist/main.js`。

### 坑 4:dotenv-cli 在子项目里继承根 .env
开发期跑 `pnpm dev:api` 实际是 `dotenv -e ../../.env -- nest start --watch`。dotenv-cli 把根 `.env` 注入到子进程环境变量,nest 自己的 `process.env` 拿到所有值,ConfigModule 也能读到。**不需要再让 NestJS 自己 `envFilePath` 读** —— 但我还是配了 `envFilePath: ['../../.env']` 作为 fallback,以防有人没经过 dotenv-cli 直接 `node dist/main`。

### 坑 5:RolesGuard 必须在 JwtAuthGuard 之后
APP_GUARD 是按注册顺序执行。先 JWT 解析放上 user,再 Roles 检查 user.role。顺序写反就 user 还没挂,RolesGuard 抛 ForbiddenException。

## 验收记录

```
$ POST /auth/login {email, password}
{"accessToken":"...","user":{"role":"ADMIN",...}}
HTTP 200

$ GET /auth/profile  (no token)
{"statusCode":401,"message":"Unauthorized",...}

$ GET /auth/profile  (with token)
{"id":"...","email":"admin@iyouren.top","role":"ADMIN"}
HTTP 200

$ GET /users/me  (with token)
{"id":"...","username":"admin","email":"admin@iyouren.top","role":"ADMIN",...}
HTTP 200

$ POST /auth/login {wrong pwd 6+ chars}
{"statusCode":401,"message":"邮箱或密码错误"}

$ POST /auth/login {email:"x",password:"1"}
{"statusCode":400,"message":["email 格式不正确","密码至少 6 位"]}

$ POST /auth/login {..., extra: "hack"}
{"statusCode":400,"message":["property extra should not exist"]}
```

全部符合预期。Routes mapped:
- POST /auth/login
- GET /auth/profile
- GET /users/me

## 给学习者的提醒

- **默认拒绝,显式放行**:全局守卫 + `@Public()` 比"每个 controller 自己 @UseGuards" 更不容易漏。
- **JWT 不是真理**:每次拿到 token 还是要查一次用户表。性能和安全的取舍,博客这种规模选安全。
- **错误信息不要泄漏存在性**:登录失败别区分"邮箱不存在"和"密码错"。
- **环境变量要在启动期校验**:让 .env 缺失成为"启动失败",而不是"运行时报错"。`class-validator + validate` 是 Nest 生态的标准做法。
- **isolatedModules 是好东西**:它强迫你区分类型导入和值导入,长期看代码更清晰、增量编译更快。出现 TS1272 时,看一下哪个是纯类型,加 `type` 关键字。
- **monorepo 编译产物路径**:`tsc` 的 rootDir 会"上滑"到所有源文件的最近公共父目录。跨目录混编时检查 dist 结构,该 exclude 就 exclude。
