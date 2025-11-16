/*
 * @Author: wuyifan 1208097313@qq.com
 * @Date: 2025-01-27 10:30:00
 * @LastEditors: wuyifan 1208097313@qq.com
 * @LastEditTime: 2025-01-27 10:30:00
 * @FilePath: /factory-visualization/src/router/index.ts
 * @Description: 路由配置
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Layout from '../layout/index.vue'
import Login from '../layout/auth/Login.vue'
import Register from '../layout/auth/Register.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    // NOTE：暂时跳过认证检查
    // redirect: '/login'
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: '注册',
      requiresAuth: false
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Layout,
    meta: {
      title: '工厂可视化系统',
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {

  // NOTE：暂时跳过认证检查
  // const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true'
  
  // // 如果访问需要认证的页面但未登录，重定向到登录页
  // if ((to.meta as any).requiresAuth && !isAuthenticated) {
  //   next('/login')
  // }
  // // 如果已登录但访问登录/注册页面，重定向到仪表板
  // else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
  //   next('/dashboard')
  // }
  // // 其他情况正常跳转
  // else {
  //   next()
  // }
  // NOTE END
  next()
})

export default router


