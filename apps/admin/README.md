# apps/admin —— 后台管理系统

Vue 3 + Vite + 手写 CSS 的 SPA。文学风设计(借鉴 chlo.is),完全不用 UI 组件库。

**生产地址**:<https://admin.iyouren.top>

## 默认管理员账号

```
邮箱:admin@iyouren.top
密码:admin12345
```

> 第一次登录后建议立刻去 **/settings → AUTH · 改密码** 改新密码。
> strict 限流 5/min,改完不强制踢人,旧 token 仍有效。

---

## 功能页面

| 路由 | 用途 |
| --- | --- |
| `/login` | 登录页(JWT,7 天过期) |
| `/dashboard` | 首页仪表盘 |
| `/articles` | 文章列表(草稿 / 已发布 / 已归档过滤) |
| `/editor` | 新建文章 |
| `/editor/:id` | 编辑现有文章 |
| `/inbox` | AI 生成的待审核草稿(从 mobile/admin 触发) |
| `/tags` | 标签 CRUD |
| `/categories` | 分类 CRUD |
| `/comments` | **评论审核**(PENDING / APPROVED / REJECTED 切换 + 通过/拒绝/删除) |
| `/settings` | 站点设置 + 改密码 + 批量回填 embedding |

### `/settings` 页能做的事

- **SITE 基本信息**:站点标题 / 副标 / ICP 备案号(改完 web 端立刻生效)
- **AI 模型配置**:默认模型 / confidence 阈值 / 流式 / RAG 推荐(已持久化,运行时尚未消费)
- **AI · 维护**:`批量回填 embedding` 按钮,给老文章补 RAG 向量
- **AUTH · 安全**:JWT 过期 / 强制 2FA(占位)
- **AUTH · 改密码**:三段表单,服务端 strict 限流

---

## 技术栈

- **Vue 3.5** + `<script setup>` + Composition API
- **Vite 7** 打包
- **Vue Router 4.5** + 路由守卫(`meta.requiresAuth`)
- **Pinia** 状态管理(只用于 auth store)
- **Axios** + 统一 `apiClient`(`src/api/client.ts`)
- **TypeScript** strict 模式
- **不用 UI 库**:全手写 CSS + 设计 token(`--ink`、`--accent`、`--rule` 等)

## 主要文件

```
src/
├── api/             # 后端 API client(每个模块一个文件)
│   ├── client.ts    # axios 实例 + token 注入 + baseURL 运行时探测
│   ├── auth.ts
│   ├── articles.ts
│   ├── categories.ts
│   ├── tags.ts
│   ├── comments.ts
│   └── settings.ts
├── components/      # 共享组件(AdminShell / Field / Toggle 等)
├── views/           # 路由视图(Login / Dashboard / Articles / Editor / ...)
├── stores/          # Pinia(只有 auth)
├── router/          # 路由 + 守卫
└── composables/     # useTheme(深色切换)
```

## 本地开发

```bash
# 在仓库根目录(monorepo 用 pnpm filter)
pnpm install                       # 装根依赖
pnpm --filter admin dev            # :5174

# 或直接进 apps/admin
cd apps/admin
pnpm dev
```

需要 NestJS API 在 `:3000` 跑着。`api/client.ts` 会:

- 优先读 `VITE_API_BASE_URL`
- 否则探测 `window.location.hostname`,生产域名 → `https://www.iyouren.top/api`
- fallback 到 `http://localhost:3000`

## Build

```bash
pnpm --filter admin build          # 出 apps/admin/dist
```

生产 Dockerfile 走 nginx:alpine 静态托管,镜像在 docker-compose 里 build。

## 设计语言

设计灵感来自 [chlo.is](https://chlo.is) —— 暖灰底 / 浮起卡片 / 衬线标题 + 等宽小字。深色模式通过给 `<html>` 加 `.dark` class 切换。色值定义在 `src/assets/css/variables.css`(token):

```css
--bg / --card / --ink / --ink-2 / --ink-3 / --ink-4 / --rule / --accent / --shadow
```

任何新加组件**复用 token 而不是写死颜色**,这样深浅色都自动适配。

---

详细各阶段的设计决策与踩坑见:

- [`docs/journal/V1-06-admin-foundation.md`](../../docs/journal/V1-06-admin-foundation.md)
- [`docs/journal/V1-07-admin-pages.md`](../../docs/journal/V1-07-admin-pages.md)
- [`docs/journal/V1.2-admin-and-tracing.md`](../../docs/journal/V1.2-admin-and-tracing.md)
- [`docs/journal/V1.3-comments-and-seo.md`](../../docs/journal/V1.3-comments-and-seo.md)
