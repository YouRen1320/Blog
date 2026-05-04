// 后台入口：挂载 Vue 应用并装载路由 + 全局样式。
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/tokens.css'

createApp(App).use(router).mount('#app')
