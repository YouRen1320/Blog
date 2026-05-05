import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["./app/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  // dev 端口固定 3100,避免跟 NestJS API(3000)抢
  devServer: {
    port: 3100,
  },
  // 公开运行时变量:服务端 + 客户端都能读 useRuntimeConfig().public.apiBase
  // 用 127.0.0.1 而不是 localhost —— Node 默认 fetch 倾向 IPv4,
  // 而 NestJS 启动时只绑了 IPv6 ::1 时,localhost 容易解析到 ::1 走不通
  runtimeConfig: {
    public: {
      apiBase: "http://127.0.0.1:3000",
      // sitemap / RSS / og:url 等地方需要的对外域名。
      // 生产环境通过 NUXT_PUBLIC_SITE_URL 覆盖。
      siteUrl: "http://localhost:3100",
    },
  },
  app: {
    head: {
      title: "YouRen",
      htmlAttrs: { lang: "zh-CN" },
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "Youren 的写作:博客、笔记、AI 内容生产实验。" },
      ],
    },
  },
});
