// 后台路由：登录页独立，受保护页全部挂在 / 之下，由 AdminShell 提供布局。
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // 默认进仪表盘；登录页放 /login。
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
  { path: '/dashboard', name: 'dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/editor', name: 'editor', component: () => import('../views/Editor.vue') },
  { path: '/inbox', name: 'inbox', component: () => import('../views/AIInbox.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
