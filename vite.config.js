import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true,
    // 代理配置 - 解决 CORS 跨域问题
    // 如果遇到 403 错误，可以尝试启用代理
    proxy: {
      '/ditto': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/ditto/, '') // 如果不需要保留 /ditto 路径，取消注释
      }
    }
  }
})

