import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('../views/Messages.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: () => import('../views/Tasks.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/geo3d',
    name: 'Geo3D',
    component: () => import('../views/Geo3D.vue'),
    meta: { requiresAuth: true },
  },
  { path: '/', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 🛡️ Navigation Guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Если НЕ залогинен → только логин разрешен
  if (!authStore.isAuthenticated) {
    if (to.meta.requiresAuth) {
      return next('/login') // Редирект на логин
    }
    return next() // Логин страница OK
  }

  // Залогинен → логин не показываем
  if (to.path === '/login') {
    return next('/dashboard') // Редирект на дашборд
  }

  next() // Всё OK
})

export default router
