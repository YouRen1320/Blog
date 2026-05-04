<template>
  <!--
    根组件：直接渲染当前路由对应的视图。
    AdminShell 由各受保护视图自己包；登录页不需要侧栏，独立渲染。
  -->
  <RouterView />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useTheme } from './composables/useTheme'

// 仅触发一次主题水合（从 localStorage 读出 .dark 类）。
useTheme()
</script>
