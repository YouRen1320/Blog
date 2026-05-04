# V1-08 Web 接 API

**日期**:2026-05-05
**任务**:#8
**状态**:已完成

## 目标

把 Nuxt 公开站点从静态 mock 数据变成"从 NestJS 实时取数据":
- composables 封装公开接口
- 首页文章网格、/writing 列表、/writing/[slug] 详情、/categories/[slug]、/tags/[slug] 都走 API
- markdown-it 渲染正文
- SEO meta 写在每个页面(useSeoMeta)
- 端口固定 3100,跟 NestJS API 的 3000 错开

**验收**:首页有最新文章卡片(从 seed 数据来),点进去能看到正文渲染,分类/标签筛选生效,不存在的 slug 返回 404。

## 关键决策

### 1. composables 而不是直接 $fetch
Nuxt 鼓励 composables 模式(SSR + CSR 自动协调缓存)。我把每种"取一类数据"封装成函数:
```ts
useArticleList(query)
useArticleBySlug(slug)
useArticlesByCategory(slug, query)
useArticlesByTag(slug, query)
```

每个里面用 `useFetch` + 唯一 `key`,Nuxt 会:
- SSR 时在服务端 fetch 一次,把结果嵌到 HTML
- 客户端 hydration 时不再重复 fetch
- 同一个 key 的多次调用共享结果

**直接用 $fetch 也行,但失去 SSR 缓存优化**。

### 2. 统一 fetch 用 127.0.0.1 而不是 localhost

**坑**:服务器渲染时 Node 18+ 的 fetch 倾向走 IPv4,而 NestJS 启动 `listen(3000)` 时如果只绑了 IPv6 ::1,`localhost` 解析为 ::1 走不通。

修法:`apiBase: 'http://127.0.0.1:3000'`,显式 IPv4。**生产 V2 服务器内部用 docker network 可以用服务名(`api:3000`)**,本地用 127 最简单。

### 3. 把 list 文件挪进同名子目录
Nuxt 的文件式路由有这么个规则:
```
pages/writing.vue          → /writing
pages/writing/[slug].vue   → /writing/:slug
```
这两个**同时存在**时,`writing.vue` 变成 children 的 layout(需要里面写 `<NuxtPage />`),否则 `/writing/foo` 会渲染 `writing.vue` 而不是 `[slug].vue`。

修法:把 `writing.vue` 重命名成 `writing/index.vue`。
```
pages/writing/index.vue   → /writing
pages/writing/[slug].vue  → /writing/:slug
```
同样适用 tags.vue。

副作用:**子目录内部的相对 import 路径要多一层 `../`**(`../composables` → `../../composables`)。我跌到这个坑两次。

### 4. 详情页渲染 markdown 用 markdown-it
**备选**:vue-markdown-render(响应式包装)
**已选**:裸 `markdown-it` + `v-html`

理由:
- vue-markdown-render 大几十 KB,markdown-it 已经 30 KB,加包装收益不大
- `v-html` 直接展示已渲染的 HTML 是常规做法
- 关闭 `html: false`(防 XSS)+ 开 `linkify: true`(自动识别裸 URL)是合理默认

V1 不用代码高亮(prism / shiki)。**V4 之前不是优先级**。

### 5. 关键 SEO 字段在每个页面声明

```ts
useSeoMeta({
  title: () => `${article.value.title} · YouRen`,
  description: () => article.value?.summary,
  ogType: 'article',
  ogTitle: ...,
  ogDescription: ...,
})
```

`title` 用函数形式:SSR 时数据 ready 后 head 才 commit。

不写 `og:image` 是因为 V1 没有真实封面图(InkArt 是 SVG,需要单独导出 PNG)。**V2 上线时记得补**。

### 6. 列表里不带 content,详情才带

后端 PublicService 的 `publicArticleSelect` 不包含 content;`publicArticleDetailSelect` 才包含。前端类型也对应:
```ts
PublicArticle    // 列表里的形状
PublicArticleDetail extends PublicArticle { content, author }
```

这避免列表 API 返回大 payload。Postgres 一行 content 几 KB,100 篇就是几百 KB。

### 7. 不存在的 slug 主动 throw 404

```ts
if (error.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article not found' })
}
```

为什么不只是渲染"找不到"提示?
- HTTP 404 状态码是 SEO 信号:Google 不会索引 404 页
- 浏览器 URL 历史正确(用户能看到 404 页面而不是"成功"页)
- 监控(uptime checker)可以基于 status code 判断

## 实际做了什么

新文件:
| 文件 | 作用 |
|------|------|
| `app/composables/useArticles.ts` | 4 个 useFetch 包装函数 + 类型 |
| `app/utils/format.ts` | 法国共和历月份 / 阅读时长 / 日期格式化 / id→seed |
| `app/pages/writing/index.vue` | 文章存档(原 writing.vue 内容,接 API) |
| `app/pages/categories/[slug].vue` | 分类下文章列表 |
| `app/pages/tags/[slug].vue` | 标签下文章列表 |

改动:
| 文件 | 改动 |
|------|------|
| `app/pages/index.vue` | 文章网格从静态 → API + 跳详情链接 |
| `app/pages/writing/[slug].vue` | mock → useArticleBySlug + markdown-it 渲染 + SEO |
| `app/components/ArticleCard.vue` | id 类型 `number` → `string \| number` 兼容 cuid |
| `nuxt.config.ts` | 加 devServer.port 3100, runtimeConfig.public.apiBase, html lang, meta description |
| `package.json` | dev / preview 脚本加 `--port 3100` |
| `pages/writing.vue` → `pages/writing/index.vue` | 文件移动(避免路由冲突) |
| `pages/tags.vue` → `pages/tags/index.vue` | 同上 |

## 踩坑 / 注意

### 坑 1:同名父级文件 + 同名子目录的路由冲突
已在"关键决策 3"详述。这是 Nuxt 文件式路由最容易踩的坑之一。**对应任何 `pages/xx.vue` 同时有 `pages/xx/[slug].vue` 的场景**,把 xx.vue 挪到 `pages/xx/index.vue` 是首选解法。

### 坑 2:Nuxt 4 dev 模式 IPC 偶发抽风
表现:`/writing` 突然 500,日志说 "IPC connection closed"。这是 Vite-node 跟 Nuxt 之间的 IPC bug,**不是应用代码问题**。
- 临时修法:重启 dev server 通常能解决
- 长期:用 `pnpm preview`(production build + node 启动)在 dev 中后期跑,比 `nuxt dev` 稳定

### 坑 3:`localhost` IPv6/IPv4 解析
NestJS 默认 `app.listen(3000)` 在 macOS Node 22 下绑到 IPv6 `::`。Nuxt fetch (Node 22) 在某些情况下解析 localhost 走 IPv4 → 拒绝连接。
**修法**:apiBase 写 `127.0.0.1`,或者后端 listen('0.0.0.0', 3000)。两种都能工作。

### 坑 4:Edit / Write 在我连续操作下偶尔丢失
我对 nuxt.config.ts 做了多次修改,某次保存似乎被另一次操作覆盖回了原样。
**自卫方法**:每次写完后立即 Read 一次确认,或者保留原文件做 diff。这个坑不是 Nuxt 的,是工具链的怪事。

### 坑 5:`pages/foo/index.vue` 后,所有 import 多一层 `../`
小事但容易漏掉:`pages/writing.vue` 里 `from '../composables/foo'` 没问题,挪到 `pages/writing/index.vue` 后必须改成 `../../composables/foo`。Vite 打包时编译器会立刻爆错,但 dev 模式下可能加载到一半才报。

### 坑 6:首页 ArticleCard 接口的 id 类型
原 mock 用 number 当 id;Prisma 是 cuid (string)。改 ArticleCard 的 interface 为 `id: string | number`。**比直接 cast as any 安全**,因为 cuid 类型仍然校验是 string。

## 验收记录

```
$ pnpm --filter api start:prod        # http://localhost:3000
$ pnpm --filter web preview --port 3100  # http://localhost:3100

$ curl -s -w "%{http_code}" http://localhost:3100/                      → 200
$ curl -s -w "%{http_code}" http://localhost:3100/writing                → 200
$ curl -s -w "%{http_code}" http://localhost:3100/writing/hello-blog     → 200
$ curl -s -w "%{http_code}" http://localhost:3100/writing/non-existent   → 404
$ curl -s -w "%{http_code}" http://localhost:3100/categories/backend     → 200
$ curl -s -w "%{http_code}" http://localhost:3100/tags/nestjs            → 200
$ curl -s -w "%{http_code}" http://localhost:3100/writing/draft-vue-component → 404 (草稿不公开)

$ curl -s http://localhost:3100/writing/hello-blog | grep '<title>'
<title>你好,博客 · YouRen</title>

$ curl -s http://localhost:3100/writing/hello-blog | grep 'name="description"'
<meta name="description" content="这是 Blog 项目的第一篇示例文章,用于验证种子数据。">
```

## 给学习者的提醒

- **`useFetch` 加 `key` 是关键**。Nuxt 不会自动给你建唯一 key,缺它会出现"列表页和详情页用同一份数据"的诡异 bug。
- **SSR fetch 不能假定 localhost = 127.0.0.1**。Node 内部 DNS 顺序在不同版本不一样,显式 IP 是工业级做法。
- **路由文件命名不要跟子目录重名**(除非你真的想要 nested layout)。否则 `<NuxtPage />` 不写就 404 / 500 找不到原因。
- **production preview 比 dev 稳定**。dev server 优化频繁,新版本时不时引入小 bug,真要跑 e2e 用 preview。
- **404 必须真正 throw 404**,不能"用 200 返回'找不到'页面"。SEO 和监控都依赖正确状态码。
- **`useSeoMeta` 用函数形式**才能让数据 ready 后才提交 head。直接传值会在 SSR 第一帧定型,值错了。
- **Edit / Write 完成后做一次最小 sanity check**(比如 `grep` 一下关键内容)。我已经吃了两次"以为改了实际没改"的亏。
