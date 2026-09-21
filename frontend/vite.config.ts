import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // 相对路径：Electron 生产模式以 file:// 加载时资源路径才正确
  base: './',
  plugins: [react()],
  // 本机 IPv6 回环不可用，显式绑定 IPv4，否则只监听 [::1] 无法访问
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
})
