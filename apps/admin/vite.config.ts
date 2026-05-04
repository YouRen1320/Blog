import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 管理后台占用 5174 端口，避开 web (3000) 与 api (3001)。
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    strictPort: true,
  },
})
