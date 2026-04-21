import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveDefaultAppRoute, resolveDefaultAppValue } from '../src/lib/default-app.js'

test('falls back to chat for unknown default app value', () => {
  assert.equal(resolveDefaultAppValue('unknown-app'), 'chat')
  assert.equal(resolveDefaultAppRoute('unknown-app'), '/chat')
})

test('resolves known default app values to routes', () => {
  assert.equal(resolveDefaultAppRoute('dashboard'), '/dashboard')
  assert.equal(resolveDefaultAppRoute('messages'), '/messages')
  assert.equal(resolveDefaultAppRoute('geo3d'), '/geo3d')
  assert.equal(resolveDefaultAppRoute('short-links'), '/short-links')
})
