import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // 相对路径：Electron 生产模式以 file:// 加载时资源路径才正确
  base: './',
  plugins: [react()],
})
