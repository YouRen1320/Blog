<template>
  <!--
    sticky-footer 布局:整体 flex column,min-height 撑满视口;
    main 区域 flex:1 吸收剩余空间,把 footer 钉在视口底部 ——
    页面内容少时不会让 footer 浮到屏幕中间。
  -->
  <div class="app-shell">
    <LayoutAppHeader />

    <NuxtRouteAnnouncer />

    <main class="app-main">
      <NuxtPage />
    </main>

    <LayoutAppFooter />
  </div>
</template>

<style>
html {
  scroll-behavior: smooth;
}
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-main {
  flex: 1;
}
</style>
