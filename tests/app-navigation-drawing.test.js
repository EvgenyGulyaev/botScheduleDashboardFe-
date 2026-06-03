import test from 'node:test'
import assert from 'node:assert/strict'
import { getAppMenuItems } from '../src/lib/app-navigation.js'

test('hides drawing app without drawing permission', () => {
  const drawingItem = getAppMenuItems({
    isAdmin: false,
    isSuperAdmin: false,
    appPermissions: ['chat'],
  }).find((item) => item.to === '/drawing')

  assert.equal(drawingItem, undefined)
})

test('hides drawing when user has no app permissions', () => {
  const items = getAppMenuItems({
    isAdmin: false,
    isSuperAdmin: false,
    appPermissions: [],
  })

  assert.equal(items.some((item) => item.to === '/drawing'), false)
})

test('shows drawing when user has drawing permission', () => {
  const items = getAppMenuItems({
    isAdmin: true,
    isSuperAdmin: false,
    appPermissions: ['chat', 'drawing', 'wedding'],
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
    appPermissions: ['drawing'],
  })
  const drawingItem = items.find((item) => item.to === '/drawing')

  assert.equal(Object.prototype.hasOwnProperty.call(drawingItem, 'alwaysVisible'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(drawingItem, 'key'), false)
})
