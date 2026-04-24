export const resolveAuthRedirect = ({
  isAuthenticated,
  isAdmin = false,
  to,
  defaultRoute = '/chat',
}) => {
  if (!isAuthenticated && to.meta?.requiresAuth) {
    return '/login'
  }

  if (isAuthenticated && (to.path === '/login' || to.path === '/forgot-password' || to.path === '/reset-password')) {
    return defaultRoute
  }

  if (isAuthenticated && to.meta?.requiresAdmin && !isAdmin) {
    return defaultRoute
  }

  return true
}
