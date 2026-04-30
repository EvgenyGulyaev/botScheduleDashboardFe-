import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveAuthRedirect } from '../src/router/guards.js'

test('redirects guests away from protected routes', () => {
  const result = resolveAuthRedirect({
    isAuthenticated: false,
    to: { path: '/dashboard', meta: { requiresAuth: true } },
  })

  assert.equal(result, '/login')
})

test('redirects authenticated users away from login', () => {
  const result = resolveAuthRedirect({
    isAuthenticated: true,
    to: { path: '/login', meta: {} },
  })

  assert.equal(result, '/chat')
})

test('redirects authenticated users to configured default route', () => {
  const result = resolveAuthRedirect({
    isAuthenticated: true,
    defaultRoute: '/short-links',
    to: { path: '/reset-password', meta: {} },
  })

  assert.equal(result, '/short-links')
})

test('redirects users without app permission away from app routes', () => {
  const result = resolveAuthRedirect({
    isAuthenticated: true,
    appPermissions: ['chat'],
    defaultRoute: '/chat',
    to: { path: '/alice', meta: { requiresAuth: true, appKey: 'alice' } },
  })

  assert.equal(result, '/chat')
})

test('redirects non-super-admin users away from super-admin-only routes', () => {
  const result = resolveAuthRedirect({
    isAuthenticated: true,
    isAdmin: true,
    isSuperAdmin: false,
    defaultRoute: '/chat',
    to: { path: '/dashboard', meta: { requiresAuth: true, requiresSuperAdmin: true } },
  })

  assert.equal(result, '/chat')
})

test('allows navigation when route matches auth state', () => {
  const guestResult = resolveAuthRedirect({
    isAuthenticated: false,
    to: { path: '/login', meta: {} },
  })
  const authResult = resolveAuthRedirect({
    isAuthenticated: true,
    isAdmin: true,
    to: { path: '/messages', meta: { requiresAuth: true } },
  })
  const adminResult = resolveAuthRedirect({
    isAuthenticated: true,
    appPermissions: ['chat', 'alice'],
    to: { path: '/alice', meta: { requiresAuth: true, appKey: 'alice' } },
  })
  const superAdminResult = resolveAuthRedirect({
    isAuthenticated: true,
    isAdmin: true,
    isSuperAdmin: true,
    to: { path: '/dashboard', meta: { requiresAuth: true, requiresSuperAdmin: true } },
  })

  assert.equal(guestResult, true)
  assert.equal(authResult, true)
  assert.equal(adminResult, true)
  assert.equal(superAdminResult, true)
})
