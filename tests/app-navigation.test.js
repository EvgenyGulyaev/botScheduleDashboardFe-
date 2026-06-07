import test from 'node:test'
import assert from 'node:assert/strict'
import { getAdminMenuItems, getAppMenuItems } from '../src/lib/app-navigation.js'

test('hides alice app without explicit alice permission', () => {
  assert.equal(
    getAppMenuItems({
      isAdmin: true,
      appPermissions: ['chat'],
    }).some((item) => item.to === '/alice'),
    false,
  )
})

test('shows alice app for users with alice permission', () => {
  const aliceItem = getAppMenuItems({
    isAdmin: false,
    appPermissions: ['chat', 'alice'],
  }).find((item) => item.to === '/alice')

  assert.deepEqual(aliceItem, {
    to: '/alice',
    label: 'Алиса',
    icon: '🔊',
  })
})

test('shows wedding app for users with wedding permission', () => {
  const weddingItem = getAppMenuItems({
    isAdmin: false,
    appPermissions: ['chat', 'wedding'],
  }).find((item) => item.to === '/wedding')

  assert.deepEqual(weddingItem, {
    to: '/wedding',
    label: 'Свадьба',
    icon: '💍',
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

test('shows proxy app only for super admins', () => {
  assert.equal(
    getAppMenuItems({
      isAdmin: true,
      isSuperAdmin: false,
      appPermissions: ['chat', 'proxy'],
    }).some((item) => item.to === '/proxy'),
    false,
  )

  assert.deepEqual(
    getAppMenuItems({
      isAdmin: true,
      isSuperAdmin: true,
      appPermissions: ['chat'],
    }).find((item) => item.to === '/proxy'),
    {
      to: '/proxy',
      label: 'Прокси',
      icon: '🛰️',
    },
  )
})

test('shows admin dashboard dropdown only for super admins', () => {
  assert.deepEqual(getAdminMenuItems(false), [])
  assert.deepEqual(
    getAdminMenuItems(true).map((item) => item.to),
    ['/admin/users', '/admin/audit', '/dashboard/ssh-accesses'],
  )
})
