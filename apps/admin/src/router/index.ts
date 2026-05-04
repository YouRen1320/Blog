// 后台路由:登录页独立,受保护页全部挂在 / 之下。
// beforeEach 守卫:
// - 没登录访问任意非 /login → 跳 /login
// - 已登录访问 /login → 跳 /dashboard(避免来回反复)
// 视图层级靠 meta.requiresAuth 标记(默认开启,只有 /login 显式 false)
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'login', component: () => import('../views/Login.vue'), meta: { requiresAuth: false } },
  { path: '/dashboard', name: 'dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/articles', name: 'articles', component: () => import('../views/Articles.vue') },
  { path: '/editor', name: 'editor', component: () => import('../views/Editor.vue') },
  { path: '/editor/:id', name: 'editor-edit', component: () => import('../views/Editor.vue'), props: true },
  { path: '/inbox', name: 'inbox', component: () => import('../views/AIInbox.vue') },
  { path: '/tags', name: 'tags', component: () => import('../views/Tags.vue') },
  { path: '/categories', name: 'categories', component: () => import('../views/Categories.vue') },
  { path: '/settings', name: 'settings', component: () => import('../views/Settings.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false
  if (requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
