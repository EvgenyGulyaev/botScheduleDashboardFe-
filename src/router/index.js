import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { resolveAuthRedirect } from './guards.js'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue'),
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPassword.vue'),
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/dashboard/ssh-accesses',
    name: 'SSHAccesses',
    component: () => import('../views/SSHAccesses.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true, appKey: 'dashboard' },
  },
  {
    path: '/proxy/:section?',
    name: 'Proxy',
    component: () => import('../views/Proxy.vue'),
    meta: { requiresAuth: true, appKey: 'proxy', superAdminBypass: true },
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('../views/AdminUsers.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true },
  },
  {
    path: '/admin/audit',
    name: 'AdminAudit',
    component: () => import('../views/AdminAudit.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true },
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('../views/Messages.vue'),
    meta: { requiresAuth: true, appKey: 'messages' },
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/Chat.vue'),
    meta: { requiresAuth: true, appKey: 'chat' },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/alice',
    name: 'Alice',
    component: () => import('../views/Alice.vue'),
    meta: { requiresAuth: true, appKey: 'alice' },
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
    meta: { requiresAuth: true, appKey: 'geo3d' },
  },
  {
    path: '/short-links',
    name: 'ShortLinks',
    component: () => import('../views/ShortLinks.vue'),
    meta: { requiresAuth: true, appKey: 'short-links' },
  },
  {
    path: '/wedding',
    name: 'Wedding',
    component: () => import('../views/Wedding.vue'),
    meta: { requiresAuth: true, appKey: 'wedding' },
  },
  {
    path: '/drawing',
    name: 'Drawing',
    component: () => import('../views/Drawing.vue'),
    meta: { requiresAuth: true, appKey: 'drawing' },
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
    isAdmin: Boolean(authStore.user?.isAdmin),
    isSuperAdmin: Boolean(authStore.user?.isSuperAdmin),
    appPermissions: authStore.user?.appPermissions || [],
    defaultRoute: authStore.getDefaultRoute(),
    to,
  })
})

export default router
