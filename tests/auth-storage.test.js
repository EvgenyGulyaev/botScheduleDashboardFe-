import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clearStoredAuth,
  normalizeAuthUser,
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

  assert.equal(upper.token, 'upper')
  assert.equal(upper.user.login, '')
  assert.equal(upper.user.email, '')
  assert.equal(upper.user.defaultApp, 'chat')
  assert.equal(upper.user.notificationSettings.pushEnabled, false)
  assert.equal(upper.user.notificationSettings.soundEnabled, true)
  assert.equal(upper.user.notificationSettings.toastEnabled, true)

  assert.equal(lower.token, 'lower')
  assert.equal(lower.user.login, '')
  assert.equal(lower.user.email, '')
  assert.equal(lower.user.defaultApp, 'chat')
  assert.equal(lower.user.notificationSettings.pushEnabled, false)
})

test('throws when auth payload does not contain a token', () => {
  assert.throws(() => normalizeAuthPayload({ user: { id: 1 } }), /token/i)
})

test('normalizes profile notification and push metadata', () => {
  const user = normalizeAuthUser({
    login: 'alice',
    email: 'alice@example.com',
    is_admin: true,
    default_app: 'dashboard',
    notification_settings: {
      push_enabled: true,
      sound_enabled: false,
      toast_enabled: false,
    },
    push: {
      supported: true,
      public_key: 'public-key',
    },
  })

  assert.deepEqual(user, {
    login: 'alice',
    email: 'alice@example.com',
    is_admin: true,
    isAdmin: true,
    default_app: 'dashboard',
    defaultApp: 'dashboard',
    notification_settings: {
      push_enabled: true,
      sound_enabled: false,
      toast_enabled: false,
    },
    notificationSettings: {
      pushEnabled: true,
      soundEnabled: false,
      toastEnabled: false,
    },
    push: {
      supported: true,
      publicKey: 'public-key',
    },
    alice_settings: {
      account_id: '',
      room_id: '',
      device_id: '',
      scenario_id: '',
    },
    aliceSettings: {
      accountId: '',
      roomId: '',
      deviceId: '',
      scenarioId: '',
    },
  })
})
