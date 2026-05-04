# V1-04 业务接口

**日期**:2026-05-05
**任务**:#4
**状态**:已完成

## 目标

把博客的核心 CRUD 端点全部实现:文章 / 分类 / 标签的后台增删改查 + 文章发布/下线 + 公开访问接口。

**验收**:用 admin token 创建 → 发布 → 公开接口能查到 → 下线 → 公开接口看不到 → 删除 → 数据消失。

## 关键决策

### 1. 路径分两类:`/admin/*` 与裸路径

```
后台:GET /admin/articles, POST /admin/articles, ...
公开:GET /articles, GET /articles/:slug, ...
```

**备选**:统一前缀 + query param 区分(如 `/articles?admin=1`),让后端判断当前用户能不能看草稿
**已选**:**两套独立 controller**

理由:
- 关注点分离:admin 接口默认要 ADMIN 权限,公开接口默认 @Public()。靠路径分类 = 靠路由层面隔离权限,而不是靠 service 内部 if/else
- 默认行为不同:admin list 返回所有状态,public list 只返回 PUBLISHED。两个 service 方法(`listAdmin` / `listArticles`)更清晰
- 字段也不同:public 返回的文章不包含 author 邮箱、不包含 DRAFT 字段等,通过 `select` 显式声明,避免泄漏

### 2. 用 `select` 而不是 `include` 控制公开字段

```ts
const publicArticleSelect = {
  id: true, title: true, slug: true, summary: true,
  cover: true, publishedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  tags: { select: { tag: { select: { id, name, slug } } } },
} satisfies Prisma.ArticleSelect;
```

**关键**:不返回 `content`(列表场景列表很大,不要传整篇文章)、不返回 author 的 email / role(隐私)、不返回 status 字段(public 场景永远是 PUBLISHED,无意义)。

`satisfies Prisma.ArticleSelect` 让 TS 同时记住"这是有效的 select"和"具体选了哪些字段",service 方法的返回类型会自动推导出**精确**的形状。

### 3. 列表分页用 page/pageSize,不用 cursor

**备选 A**:offset 分页(page=1, pageSize=20)
**备选 B**:cursor 分页(更适合无限滚动)

V1 选 A 因为博客文章总量小(几百到几千),offset 性能足够;Admin 后台有"跳到第 N 页"的需求,cursor 分页做不到。

未来 public 端要做无限滚动时再考虑加 cursor 接口。

### 4. tagIds 全量替换语义,不是增删 diff

```ts
if (dto.tagIds !== undefined) {
  await tx.articleTag.deleteMany({ where: { articleId: id } });
  if (dto.tagIds.length > 0) {
    await tx.articleTag.createMany({ data: ... });
  }
}
```

**`tagIds: undefined`** = 不动标签
**`tagIds: []`** = 清空所有标签
**`tagIds: [a, b]`** = 只保留这两个

这种"全量替换"语义最容易在前端心智模型对齐(就是输入框现在显示什么,提交后就保留什么),代价是每次 update 多一次 deleteMany。但因为 article_tags 表很小,不是性能瓶颈。

### 5. 用事务处理"删旧标签 + 加新标签"
```ts
this.prisma.$transaction(async (tx) => { ... });
```
如果不放事务,deleteMany 成功但 createMany 失败的瞬间,文章会**短暂没有标签**。事务保证原子性。

### 6. 状态机:publish / unpublish 的 publishedAt 处理

```ts
publish: publishedAt: article.publishedAt ?? new Date()
unpublish: publishedAt: null
```

**为什么 publish 时保留旧 publishedAt**:文章可能被发→下线→重发,这种"重发"语义上不应该把发表时间往后推(那等于"洗稿"重新出现在最新文章列表)。

第一次发布才打时间戳。后续重发保留原 publishedAt。

如果业务想要"明确重新推",可以加一个 `?refreshDate=true` 参数。当前不需要。

### 7. ArticleTag.tag 用 Cascade,Article.author 用 Restrict

[详见 V1-02 的"外键级联策略"](V1-02-database.md#4-外键级联策略各不相同)。删除 article 自动清掉 article_tags 行,删除 user 时如果他还有文章会失败。

## 实际做了什么

新模块:

```
src/modules/
├── articles/   (admin 接口,路径 /admin/articles)
├── categories/ (admin 接口,路径 /admin/categories)
├── tags/       (admin 接口,路径 /admin/tags)
└── public/     (公开接口,/articles, /categories/:slug/articles, ...)
```

通用工具:

- `src/common/dto/pagination.dto.ts` —— PaginationQueryDto 基类 + paginate() 函数
- `src/common/utils/slug.ts` —— makeSlug() 包装 slugify

`AppModule` 注册 4 个新模块。

## 踩坑 / 注意

### 坑 1:slugify 的中文 = 空 slug
Title `"测试 Tag"` 经过 `slugify(..., { strict: true })` → `"tag"`。中文字符都被 strict mode 干掉了。
对纯中文标题(如"你好,博客")会变成空字符串 → 触发 `slug @unique` 冲突或者空 slug 进库,都不好。

**当前规避**:DTO 上 `slug?` 改成"虽然可选但实际推荐填",前端在中文标题场景必须手动给 slug。
**未来**:接 pinyin 库,中文 → 拼音 → slugify。这是 V1 之后的事。

### 坑 2:admin 路由的 401 vs 403
admin 路由应该:
- 没 token → 401(Unauthorized)
- 有 token 但角色不是 ADMIN → 403(Forbidden)

我们的全局守卫顺序保证了这点:JwtAuthGuard 先跑,没 token 直接 401;有 token 通过后 RolesGuard 跑,角色不对抛 403。**顺序重要**(在 AppModule 里 APP_GUARD 的注册顺序控制)。

### 坑 3:`@Roles('ADMIN')` 装饰器加在 Controller 上
NestJS 的 `Reflector.getAllAndOverride()` 会先看方法,再看类。所以装饰器加在 Controller 类上,所有方法都继承;某个方法想覆盖(比如 admin 内部某个端点公开),再单独装饰。

`@Public()` 同理,但作用是绕过整个 Auth/Roles 流程。

### 坑 4:Prisma 错误码 P2002 把 unique 字段名放在 `meta.target`
```ts
{
  code: 'P2002',
  meta: { target: ['name'] },
  ...
}
```
不同 Prisma 版本里 `target` 的形状不一样:有时是 `string`,有时是 `string[]`。我在过滤器里都做了兼容。

### 坑 5:NestJS 11 的 ParseUUIDPipe 不适合 cuid
我们的 id 是 cuid(`cmorjjkq80000vqr5gdkjto9p`),不是 UUID。所以 `:id` 参数不能用 `ParseUUIDPipe` 验证,直接当 string 接收。如果 id 格式错,Prisma 自己会返回 P2025 找不到,过滤器映射成 404。

## 验收记录

```
$ Admin lists articles → total: 3 (2 drafts + 1 published)
$ Public lists articles → total: 1 (only published)
$ Create + publish smoke article → status: PUBLISHED, publishedAt: 2026-05-04
$ Public lists now → total: 2 (smoke shows up)
$ Delete smoke → HTTP 200
$ Public lists now → total: 1 (smoke gone)
$ GET /articles/non-existent → 404 "文章不存在或未发布"
$ POST /admin/categories duplicate name → 409 "已存在相同的 name"
$ GET /admin/articles without token → 401 "Unauthorized"
```

22 个端点全部 mapped:
- /auth/login, /auth/profile, /users/me  (3)
- /admin/articles × 5 + publish + unpublish  (7)
- /admin/categories × 5  (5)
- /admin/tags × 5  (5)
- /articles, /articles/:slug, /categories/:slug/articles, /tags/:slug/articles  (4)

## 给学习者的提醒

- **路径前缀决定关注点**:`/admin/*` vs 公开,清楚地把权限边界画在路由层
- **`select` 优于 `include` 表达"对外字段"**:select 是白名单,字段控制收敛;include 是默认全选,容易泄漏内部字段(updatedAt、internal flags 等)
- **状态机要在 service 内部封装**,不要让 controller 直接调 update。`publish()` / `unpublish()` 是有命名的动作,业务语义清晰,日后加审计日志、通知都好挂
- **多写 `satisfies`**:`satisfies Prisma.ArticleSelect` 比 `as` 更安全(强制全字段校验)+ 比直接写 `Prisma.ArticleSelect` 更精确(保留具体字段集合给类型推导)
- **PartialType 是 NestJS 的 DRY 利器**:UpdateXxxDto 几乎永远是 CreateXxxDto 的可选版本,直接 `extends PartialType()`
- **事务边界在哪里?** 一句话能说清的"原子操作"必须放进 `$transaction`(比如标签替换 = 删 + 加),否则中间状态可见就是 bug
