<template>
  <!--
    v3 footer: a single thin row of mono microcopy split across both edges.
    Mirrors the design's `FooterV3` component — no visible top border, just
    breathing room above and the muted ink-3 token for text.
  -->
  <footer class="app-footer mono">
    <div class="left">
      <span>© {{ year }} YouRen</span>
      <span>Powered by Nuxt</span>
      <span>Theme — Hermeneutics</span>
    </div>
    <div class="right">
      <a href="#" class="link">IndieWebRing →</a>
      <a href="#" class="link">开往</a>
      <span>萌 ICP 备 20253545 号</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Render year client-side as well as during SSR so it stays in sync without
// importing dayjs just for one number.
const year = new Date().getFullYear()
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
