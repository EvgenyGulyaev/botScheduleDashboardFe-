export const resolveAuthRedirect = ({ isAuthenticated, to, defaultRoute = '/chat' }) => {
  if (!isAuthenticated && to.meta?.requiresAuth) {
    return '/login'
  }

  if (isAuthenticated && (to.path === '/login' || to.path === '/forgot-password' || to.path === '/reset-password')) {
    return defaultRoute
  }

  return true
}
