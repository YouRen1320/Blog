<template>
  <!--
    v3 footer: a single thin row of mono microcopy split across both edges.
    Mirrors the design's `FooterV3` component — no visible top border, just
    breathing room above and the muted ink-3 token for text.
  -->
  <footer class="app-footer mono">
    <div class="left">
      <span>© {{ year }} {{ settings.title }}</span>
      <span>Powered by Nuxt</span>
      <span>Theme — Hermeneutics</span>
    </div>
    <div class="right">
      <NuxtLink to="/search" class="link">🔍 搜索</NuxtLink>
      <!--
        APK 直链走 GitHub release latest:
        - URL 永远指向最新 v* tag 的 app-release.apk(GitHub 自动 redirect)
        - 发新版 tag 时 web 端不用改代码
        rel="external" 让爬虫不带权重过去
      -->
      <a
        href="https://github.com/YouRen1320/Blog/releases/latest/download/app-release.apk"
        class="link"
        rel="external"
        download
      >📱 Android APK</a>
      <a href="#" class="link">IndieWebRing →</a>
      <a href="#" class="link">开往</a>
      <span v-if="settings.icp">{{ settings.icp }}</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
// 年份 SSR/客户端保持一致,直接 new Date 即可(单个数字没必要引 dayjs)。
// 站点 title / icp 走 useSiteSettings,改后台 Settings 页即可生效。
const year = new Date().getFullYear()
const { data: settings } = await useSiteSettings()
</script>

<style scoped>
.app-footer {
  max-width: 1100px;
  margin: 60px auto 0;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 11px;
  color: var(--ink-3);
}

.left, .right {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}

.link {
  color: var(--ink-3);
  text-decoration: none;
  transition: color 0.15s ease;
}
.link:hover { color: var(--ink); }
</style>
