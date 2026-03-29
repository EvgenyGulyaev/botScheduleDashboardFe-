import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clearStoredAuth,
  normalizeAuthPayload,
  readStoredAuth,
  writeStoredAuth,
} from '../src/lib/auth-storage.js'

const createStorageMock = () => {
  const storage = new Map()

  return {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null
    },
    setItem(key, value) {
      storage.set(key, String(value))
    },
    removeItem(key) {
      storage.delete(key)
    },
  }
}

test('reads stored auth safely even when user json is broken', () => {
  const storage = createStorageMock()
  storage.setItem('token', 'saved-token')
  storage.setItem('user', '{bad json')

  const result = readStoredAuth(storage)

  assert.deepEqual(result, {
    token: 'saved-token',
    user: null,
  })
})

test('writes and clears stored auth session', () => {
  const storage = createStorageMock()
  const session = {
    token: 'token-123',
    user: { id: 7, role: 'admin' },
  }

  writeStoredAuth(storage, session)
  assert.equal(storage.getItem('token'), 'token-123')
  assert.equal(storage.getItem('user'), JSON.stringify(session.user))

  clearStoredAuth(storage)
  assert.equal(storage.getItem('token'), null)
  assert.equal(storage.getItem('user'), null)
})

test('normalizes backend auth payloads with Token or token fields', () => {
  const upper = normalizeAuthPayload({ Token: 'upper', id: 1 })
  const lower = normalizeAuthPayload({ token: 'lower', user: { id: 2 } })

  assert.deepEqual(upper, {
    token: 'upper',
    user: { Token: 'upper', id: 1 },
  })
  assert.deepEqual(lower, {
    token: 'lower',
    user: { id: 2 },
  })
})

test('throws when auth payload does not contain a token', () => {
  assert.throws(() => normalizeAuthPayload({ user: { id: 1 } }), /token/i)
})
