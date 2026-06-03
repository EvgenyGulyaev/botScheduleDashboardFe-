import test from 'node:test'
import assert from 'node:assert/strict'
import { getAppMenuItems } from '../src/lib/app-navigation.js'

test('shows drawing app to authenticated user without drawing permission', () => {
  const drawingItem = getAppMenuItems({
    isAdmin: false,
    isSuperAdmin: false,
    appPermissions: ['chat'],
  }).find((item) => item.to === '/drawing')

  assert.deepEqual(drawingItem, {
    to: '/drawing',
    label: 'Рисовалка',
    icon: '🎨',
  })
})

test('keeps drawing in menu when user has no app permissions', () => {
  const items = getAppMenuItems({
    isAdmin: false,
    isSuperAdmin: false,
    appPermissions: [],
  })

  assert.ok(
    items.some((item) => item.to === '/drawing'),
    'drawing must be visible to every authenticated user',
  )
})

test('keeps drawing in menu when user has non-empty app permissions without drawing', () => {
  const items = getAppMenuItems({
    isAdmin: true,
    isSuperAdmin: false,
    appPermissions: ['chat', 'wedding'],
  })

  const paths = items.map((item) => item.to)
  assert.ok(paths.includes('/drawing'))
  assert.ok(paths.includes('/wedding'))
  assert.ok(paths.includes('/chat'))
})

test('does not leak alwaysVisible field on drawing item', () => {
  const items = getAppMenuItems({
    isAdmin: false,
    isSuperAdmin: false,
    appPermissions: ['chat'],
  })
  const drawingItem = items.find((item) => item.to === '/drawing')

  assert.equal(Object.prototype.hasOwnProperty.call(drawingItem, 'alwaysVisible'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(drawingItem, 'key'), false)
})
