import test from 'node:test'
import assert from 'node:assert/strict'
import { getAdminMenuItems, getAppMenuItems } from '../src/lib/app-navigation.js'

test('hides alice app from non-admin users', () => {
  assert.equal(
    getAppMenuItems(false).some((item) => item.to === '/alice'),
    false,
  )
})

test('shows alice app for admins', () => {
  const aliceItem = getAppMenuItems(true).find((item) => item.to === '/alice')

  assert.deepEqual(aliceItem, {
    to: '/alice',
    label: 'Алиса',
    icon: '🔊',
    adminOnly: true,
  })
})

test('filters app menu by user app permissions', () => {
  const items = getAppMenuItems({
    isAdmin: true,
    appPermissions: ['chat', 'alice'],
  })

  assert.deepEqual(
    items.map((item) => item.to),
    ['/chat', '/alice'],
  )
})

test('shows admin dashboard dropdown only for super admins', () => {
  assert.deepEqual(getAdminMenuItems(false), [])
  assert.deepEqual(
    getAdminMenuItems(true).map((item) => item.to),
    ['/dashboard', '/admin/users', '/admin/audit'],
  )
})
