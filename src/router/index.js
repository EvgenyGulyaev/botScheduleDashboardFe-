import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { resolveAuthRedirect } from './guards.js'

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
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/Chat.vue'),
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
  {
    path: '/short-links',
    name: 'ShortLinks',
    component: () => import('../views/ShortLinks.vue'),
    meta: { requiresAuth: true },
  },
  { path: '/', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 🛡️ Navigation Guard
router.beforeEach((to) => {
  const authStore = useAuthStore()
  return resolveAuthRedirect({
    isAuthenticated: authStore.isAuthenticated,
    to,
  })
})

export default router
