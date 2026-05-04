// 后台入口:挂载 Vue 应用、装 pinia、装路由、注入 axios 拦截器、装载全局样式。
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { installAuthInterceptor } from './api/client'
import './styles/tokens.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 注入 axios 拦截器(必须在 pinia 装好后)
const auth = useAuthStore()
installAuthInterceptor(
  () => auth.token,
  () => {
    auth.logout()
    if (router.currentRoute.value.name !== 'login') {
      router.replace({ name: 'login' })
    }
  },
)

app.mount('#app')
