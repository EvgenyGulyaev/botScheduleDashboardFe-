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
    alice_settings: {
      voice: 'oksana',
      announce_sender: true,
      quiet_hours_enabled: true,
      quiet_hours_start: '23:00',
      quiet_hours_end: '07:00',
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
      household_id: '',
      room_id: '',
      device_id: '',
      scenario_id: '',
      voice: 'oksana',
      disabled: false,
      announce_sender: true,
      quiet_hours_enabled: true,
      quiet_hours_start: '23:00',
      quiet_hours_end: '07:00',
    },
    aliceSettings: {
      accountId: '',
      householdId: '',
      roomId: '',
      deviceId: '',
      scenarioId: '',
      voice: 'oksana',
      disabled: false,
      announceSender: true,
      quietHoursEnabled: true,
      quietHoursStart: '23:00',
      quietHoursEnd: '07:00',
    },
  })
})

test('normalizes alice quiet hours from camelCase payloads and defaults missing values', () => {
  const user = normalizeAuthUser({
    aliceSettings: {
      announceSender: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:30',
      quietHoursEnd: '06:45',
    },
  })

  assert.deepEqual(user.alice_settings, {
    account_id: '',
    household_id: '',
    room_id: '',
    device_id: '',
    scenario_id: '',
    voice: '',
    disabled: false,
    announce_sender: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:30',
    quiet_hours_end: '06:45',
  })
  assert.deepEqual(user.aliceSettings, {
    accountId: '',
    householdId: '',
    roomId: '',
    deviceId: '',
    scenarioId: '',
    voice: '',
    disabled: false,
    announceSender: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:30',
    quietHoursEnd: '06:45',
  })
})
