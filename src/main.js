/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-04-17 00:59:57
 * @LastEditors: wuyifan wuyifan@udschina.com
 * @LastEditTime: 2025-10-20 14:24:21
 * @FilePath: /factory-visualization/src/main.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createApp } from 'vue'
import './style.css'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router';

console.log('i am running');
console.log('base: ', import.meta.env.BASE_URL);

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

console.log('About to mount app to #app');
const mountedApp = app.mount('#app');
console.log('App mounted:', mountedApp);

