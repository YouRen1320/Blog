# V1-06 Admin 基础

**日期**:2026-05-05
**任务**:#6
**状态**:已完成

## 目标

把 Vue 后台从"漂亮静态页"升级成"能跟 API 对话":
- axios 客户端 + Authorization 拦截器 + 401 自动登出
- pinia auth store(token + 当前用户,持久化到 localStorage)
- Login.vue 真接入 `POST /auth/login`
- 路由守卫:未登录跳 /login,已登录访问 /login 跳 /dashboard

**验收**:dev server 起得来,login 页能调真 API,失败显示后端 message,成功跳 dashboard。完整的"看 dashboard 数据"留到 V1-07。

## 关键决策

### 1. 单一 axios 实例 + 拦截器,不是每次请求都裸 fetch

**备选**:用 fetch + 自己手动加 Authorization 头
**已选**:axios + interceptor

理由:
- token 注入是横切关注点,放拦截器一次性解决,不污染业务代码
- 401 处理同理:拦截器统一 logout + 跳转,避免每个 API 调用都 try/catch 401
- axios 的 `data` / `error.response.data` 形状一致,处理后端错误更直观

### 2. token 放 localStorage,不放 cookie

**备选 A**:HttpOnly Cookie(更难被 XSS 偷)
**备选 B**:localStorage + Bearer 头 ✅

V1 选 B 因为:
- 后台跟 API 跨域(localhost:5174 ↔ localhost:3000)。cookie 跨域要 SameSite=None + Secure,本地 HTTP 折腾
- Bearer token 是无状态的,后端不需要维护 session 表
- XSS 风险已经被 CSP / sanitize / 不引入 eval 等措施降低

V2 上线如果改成同源(`/api/*` 反代),可以再考虑改回 cookie。但**不是必须**:JWT + Bearer 是社区主流,生产可接受。

### 3. 拦截器在 main.ts 里注入,不在 client.ts 里
client.ts 里写 `axios.interceptors.request.use(...)` 直接引 useAuthStore 会循环依赖:auth.ts 引 client.ts 引 auth.ts。

**修法**:导出一个 `installAuthInterceptor(getToken, onUnauth)` 工厂,在 main.ts 装好 pinia 后再调用。**保证 client.ts 不依赖具体 store**,以后换状态管理也只动一处。

### 4. pinia store 启动时**主动**从 localStorage 水合

```ts
const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
```

**不要**等 `onMounted` 再水合 —— 那样路由守卫 `beforeEach` 第一次跑时 token 还是 null,会把已登录用户错误地跳到 /login。

### 5. 路由 meta:`requiresAuth: false` 显式声明,而不是反向

**备选 A**:写 `meta: { isPublic: true }`,默认所有路由要登录
**备选 B**:写 `meta: { requiresAuth: false }`,默认所有路由要登录

我选了 B(行为一样,但语义更直接 —— "这条路由是否需要 auth")。

### 6. 登录失败的错误展示来自后端 message

```ts
const msg = e?.response?.data?.message
error.value = Array.isArray(msg) ? msg.join('; ') : msg || '登录失败,请稍后再试'
```

后端 ValidationPipe 返回的 message 是数组(每个字段一条),业务异常返回字符串。前端兼容两种形态,**用户看到的提示就是后端的语义**。这避免了"前后端各维护一套错误文案"的同步噩梦。

## 实际做了什么

| 文件 | 作用 |
|------|------|
| `src/api/client.ts` | axios 实例 + `installAuthInterceptor` 工厂 |
| `src/api/auth.ts` | login / fetchProfile + 类型 |
| `src/stores/auth.ts` | pinia store,token + user + login + logout |
| `src/main.ts` | 装 pinia + 注入拦截器 + 装载路由 |
| `src/router/index.ts` | 加 `beforeEach` 守卫 + `meta.requiresAuth` |
| `src/views/Login.vue` | 调真 API,显示后端错误,成功跳 ?redirect 或 /dashboard |
| `apps/admin/.env.local` | `VITE_API_BASE_URL=http://localhost:3000`(gitignored) |

## 踩坑 / 注意

### 坑 1:Vite 的 import.meta.env 必须是 `VITE_` 前缀
`API_BASE_URL` 不行,要写 `VITE_API_BASE_URL`。这是 Vite 的安全机制 —— 防止你不小心把后端 secret 漏到客户端 bundle。

### 坑 2:Vite 端口与 Nuxt 冲突
Vite 默认 5173,但 Nuxt(web 应用)默认 3000 —— 而 NestJS API 也用 3000。开多个 dev server 会互相抢端口,vite 会自动找下一个(5174)。

V1-08 会给 web 显式分配端口。**不要放任 dev 端口随意漂移**:E2E 测试和 CORS 配置都依赖确定端口。

### 坑 3:循环依赖陷阱
`stores/auth.ts` 引 `api/auth.ts`,后者引 `api/client.ts`。如果 `api/client.ts` 直接引 `stores/auth.ts` 来读 token → 循环依赖,运行时未必报错,但 module 导出顺序会出怪事。
**用工厂函数 + 注入,把"读 token"延迟到调用时**(getter pattern),从根本上断掉环。

### 坑 4:axios 在某些浏览器里设置 headers 时 config.headers 可能 undefined
新版 axios 默认会保留传入的 config,但稳妥起见我们写 `config.headers = config.headers ?? {}`。否则极端情况下设置 Authorization 会 throw。

## 验收记录

```
$ pnpm --filter admin build
✓ 121 modules transformed.
✓ built in 431ms

$ pnpm --filter admin dev
  VITE v7.3.1  ready in 123 ms
  ➜  Local:   http://localhost:5174/

$ curl -s http://localhost:5174/
<html>...<title>Youren · Admin</title>...
```

完整的"登录跳转 + 拿到 token 看 dashboard"这一段交给 V1-09 的 Playwright e2e 验证(那时不需要靠人眼看屏幕)。

## 给学习者的提醒

- **横切关注点(认证、错误、loading)放拦截器**。业务代码假装这些不存在,代码量减半,可读性翻倍。
- **token 持久化只是入门题**,真问题是"如何让多 tab 同步"(用 storage event)+ "如何让 token 快过期前自动 refresh"(refresh token)。V1 不做,但要在心里有路径图。
- **Vue Router 的 beforeEach 是 `Promise<RouteLocationRaw | undefined>`**:返回新路由代表跳转,返回 undefined 代表放行。V3 文档里这个比 V2 的 next() 模式更清晰。
- **Vite 的 env 前缀**很多新人没注意,默认 `import.meta.env` 只暴露 VITE_*。给客户端用的变量必须显式带前缀,这是安全保护不是 bug。
- **循环依赖的现代解决方案是依赖注入(本质是"延迟读取")**。不是技术多炫,是它把模块的初始化顺序和**使用**顺序解耦了。
