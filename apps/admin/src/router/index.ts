// 后台路由:登录页独立,受保护页全部挂在 / 之下。
// beforeEach 守卫:
// - 没登录访问任意非 /login → 跳 /login
// - 已登录访问 /login → 跳 /dashboard(ADMIN)或 /articles(USER)
// - role=USER 访问 meta.adminOnly 的路由 → 跳 /articles(测试者只用得到文章 + AI Drafts)
// 视图层级靠 meta.requiresAuth / meta.adminOnly 标记
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'login', component: () => import('../views/Login.vue'), meta: { requiresAuth: false } },
  // 注册路由暂时关闭(单作者模式),日后开放再取消注释:
  // { path: '/register', name: 'register', component: () => import('../views/Register.vue'), meta: { requiresAuth: false } },
  { path: '/dashboard', name: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { adminOnly: true } },
  { path: '/articles', name: 'articles', component: () => import('../views/Articles.vue') },
  { path: '/editor', name: 'editor', component: () => import('../views/Editor.vue') },
  { path: '/editor/:id', name: 'editor-edit', component: () => import('../views/Editor.vue'), props: true },
  { path: '/inbox', name: 'inbox', component: () => import('../views/AIInbox.vue') },
  { path: '/tags', name: 'tags', component: () => import('../views/Tags.vue'), meta: { adminOnly: true } },
  { path: '/categories', name: 'categories', component: () => import('../views/Categories.vue'), meta: { adminOnly: true } },
  { path: '/comments', name: 'comments', component: () => import('../views/Comments.vue'), meta: { adminOnly: true } },
  { path: '/users', name: 'users', component: () => import('../views/Users.vue'), meta: { adminOnly: true } },
  { path: '/settings', name: 'settings', component: () => import('../views/Settings.vue'), meta: { adminOnly: true } },
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
  // 已登录用户进登录页 → 按角色给个像样的落地页
  if (to.name === 'login' && auth.isAuthenticated) {
    return auth.user?.role === 'ADMIN' ? { name: 'dashboard' } : { name: 'articles' }
  }
  // USER(测试者)拦截 ADMIN 专属路由,跳到 articles 列表
  if (to.meta.adminOnly && auth.user && auth.user.role !== 'ADMIN') {
    return { name: 'articles' }
  }
})

export default router
