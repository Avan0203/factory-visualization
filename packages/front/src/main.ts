/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-04-17 00:59:57
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-11-21 10:37:56
 * @FilePath: /factory-visualization/src/main.ts
 * @Description: 入口文件（TypeScript）
 */
import { createApp } from 'vue'
import './style.css'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus, { locale: zhCn });
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component as any)
}
app.mount('#app')


