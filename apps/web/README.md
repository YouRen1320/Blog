# apps/web —— Nuxt 公开博客

Nuxt 4 SSR 站,文章展示 + SEO + 评论 + 订阅源。

**生产地址**:<https://www.iyouren.top>
**端口**:`3100`(本地开发,生产容器内 `3000`)

---

## 页面结构

| 路由 | 用途 |
| --- | --- |
| `/` | 首页(Profile hero + 最新文章卡片网格) |
| `/writing` | 写作目录(全部已发布文章列表) |
| `/writing/:slug` | 文章详情(Markdown 渲染 + InkArt 封面 + **评论区**) |
| `/categories/:slug` | 分类下文章列表 |
| `/tags` 、`/tags/:slug` | 标签首页 / 标签下文章列表 |
| `/about` | 关于页 |
| `/notes` 、`/code` 、`/now` 、`/links` 、`/travelling` | 占位栏目(等用户后续填充) |
| `/sitemap.xml` | 给搜索引擎的站点地图(server route) |
| `/feed.xml` | RSS 2.0 订阅源(server route) |

---

## 技术栈

- **Nuxt 4.4** + Vue 3 + `<script setup>`
- **Tailwind CSS 4.1**(运行时主要靠手写 token / scoped CSS,tailwind 仅作 reset 和工具类托底;主题 token 在 `app/assets/css/main.css`)
- **markdown-it**:文章正文渲染(关闭 html,开 linkify)
- **TypeScript** strict
- **server routes**:`server/routes/sitemap.xml.ts`、`server/routes/feed.xml.ts`

## 关键文件

```
app/
├── pages/                    # 路由页面
├── components/
│   ├── layout/AppFooter.vue  # 站点 footer(读 useSiteSettings)
│   ├── ArticleCard.vue       # 文章卡(带 InkArt 封面)
│   ├── InkArt.vue            # 程序生成的水墨封面
│   └── CommentSection.vue    # 文章评论区(嵌入详情页底部)
├── composables/
│   ├── useArticles.ts        # 文章列表 / 详情(useFetch)
│   ├── useSiteSettings.ts    # 站点配置(title / tagline / icp)
│   ├── useComments.ts        # 评论列表 + 提交
│   └── useTheme.ts           # 深色模式切换
├── utils/format.ts           # 时间 / slug / 阅读时长格式化
└── assets/                   # CSS / SVG / 字体
server/routes/
├── sitemap.xml.ts            # SEO sitemap
└── feed.xml.ts               # RSS 2.0
```

---

## 设计语言

文学风,引用 [chlo.is](https://chlo.is) 风格 —— 暖灰底 / 浮起卡片 / 衬线标题 + 等宽小字。**字体**:

- 西文衬线:Cormorant Garamond / Source Serif 4
- 西文等宽:JetBrains Mono
- 中文:Noto Serif SC

主题 token 同 admin(`--bg / --card / --ink / --accent / ...`),通过 `<html class="dark">` 切深色。

---

## 本地开发

```bash
pnpm install
pnpm --filter web dev          # :3100
```

需要 NestJS API 在 `:3000`。`useRuntimeConfig().public.apiBase` 默认指 `http://127.0.0.1:3000`(用 IPv4 避免 IPv6 解析坑)。

环境变量:

```env
# 默认值在 nuxt.config.ts.runtimeConfig.public,生产用 NUXT_PUBLIC_* 覆盖
NUXT_PUBLIC_API_BASE=https://www.iyouren.top/api
NUXT_PUBLIC_SITE_URL=https://www.iyouren.top   # sitemap / RSS / og:url 用
```

## Build

```bash
pnpm --filter web build         # 出 .output/(Nitro standalone)
pnpm --filter web preview       # 本地跑 .output 测一下
```

---

## 部署提示(重要)

V1.3 起 web 端 docker 镜像采用**镜像外 build,镜像内只跑**模式:

- 历史:`@tailwindcss/oxide` 在 docker 容器里多线程处理含中文 .vue 文件时触发 UTF-8 byte-slice panic(`vue.rs:18:59`),4.1.x / 4.2.x 都没修
- 修法:本地 `pnpm build` 出 `.output`,Dockerfile 只 `COPY .output`,不在容器里跑 nuxt build
- 部署流程:
  ```bash
  cd apps/web && pnpm build
  tar -czf /tmp/web-bundle.tar.gz apps/web/.output apps/web/Dockerfile
  scp /tmp/web-bundle.tar.gz blog-deploy:/tmp/
  ssh blog-deploy 'cd /opt/blog && sudo tar -xzf /tmp/web-bundle.tar.gz -C . && sudo docker compose -f docker-compose.prod.yml up -d --build web'
  ```

详见 [`docs/journal/V1.3-comments-and-seo.md`](../../docs/journal/V1.3-comments-and-seo.md) 末尾"踩坑"段。

---

## 相关文档

- [`docs/journal/V1-08-web-api.md`](../../docs/journal/V1-08-web-api.md) — web 接 API + 主题
- [`docs/journal/V1.3-comments-and-seo.md`](../../docs/journal/V1.3-comments-and-seo.md) — sitemap+RSS + 评论嵌入
