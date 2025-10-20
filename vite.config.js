/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-04-17 00:59:57
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-10-20 10:43:08
 * @FilePath: /factory-visualization/vite.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  // 根据部署环境设置base路径
  base: process.env.NODE_ENV === 'production' ? '/factory-visualization/' : './',
  plugins: [vue()],
  build: {
    // 输出目录
    outDir: 'dist',
    // 静态资源目录
    assetsDir: 'assets',
    // 生成source map
    sourcemap: false,
    // 压缩选项
    minify: 'terser',
    // 分包策略
    rollupOptions: {
      output: {
        // 分包配置
        manualChunks: {
          // 将Vue相关库打包到vendor
          vendor: ['vue'],
          // 将Element Plus打包到element
          element: ['element-plus'],
          // 将ECharts打包到charts
          charts: ['echarts'],
          // 将Three.js打包到three
          three: ['three']
        }
      }
    },
    // 构建时清空输出目录
    emptyOutDir: true
  },
  // 开发服务器配置
  server: {
    port: 3000,
    open: true,
    host: true
  },
  // 预览服务器配置
  preview: {
    port: 4173,
    open: true,
    host: true
  }
})
