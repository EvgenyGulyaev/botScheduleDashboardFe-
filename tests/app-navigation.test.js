import test from 'node:test'
import assert from 'node:assert/strict'
import { getAppMenuItems } from '../src/lib/app-navigation.js'

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
