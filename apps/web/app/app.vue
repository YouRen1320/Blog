<template>
  <div>
    <!-- 全局导航 -->
    <LayoutAppHeader />

    <!-- 无障碍播报 -->
    <NuxtRouteAnnouncer />

    <!-- 页面内容 -->
    <NuxtPage />

    <!-- 全局页脚 -->
    <LayoutAppFooter />
  </div>
</template>
<style>
html {
  scroll-behavior: smooth;
}
</style>