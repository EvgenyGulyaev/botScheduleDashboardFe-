export const resolveAuthRedirect = ({
  isAuthenticated,
  isAdmin = false,
  isSuperAdmin = false,
  appPermissions = [],
  to,
  defaultRoute = '/chat',
}) => {
  if (!isAuthenticated && to.meta?.requiresAuth) {
    return '/login'
  }

  if (
    isAuthenticated &&
    (to.path === '/login' || to.path === '/forgot-password' || to.path === '/reset-password')
  ) {
    return defaultRoute
  }

  if (isAuthenticated && to.meta?.requiresAdmin && !isAdmin) {
    return defaultRoute
  }

  if (isAuthenticated && to.meta?.requiresSuperAdmin && !isSuperAdmin) {
    return defaultRoute
  }

  if (
    isAuthenticated &&
    to.meta?.appKey &&
    Array.isArray(appPermissions) &&
    !appPermissions.includes(to.meta.appKey)
  ) {
    return defaultRoute
  }

  return true
}
