export const resolveAuthRedirect = ({ isAuthenticated, to }) => {
  if (!isAuthenticated && to.meta?.requiresAuth) {
    return '/login'
  }

  if (isAuthenticated && to.path === '/login') {
    return '/dashboard'
  }

  return true
}
