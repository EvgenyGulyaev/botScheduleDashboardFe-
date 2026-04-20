import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getBrowserPushPermission,
  isWebPushSupported,
  serializePushSubscription,
  urlBase64ToUint8Array,
} from '../src/lib/push-notifications.js'

test('converts VAPID public key to Uint8Array', () => {
  global.window = {
    atob(value) {
      return Buffer.from(value, 'base64').toString('binary')
    },
  }

  const bytes = urlBase64ToUint8Array('SGVsbG8')
  assert.deepEqual(Array.from(bytes), Array.from(Buffer.from('Hello')))

  delete global.window
})

test('serializes push subscription payload for backend', () => {
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      userAgent: 'Codex Browser',
    },
  })

  const subscription = {
    toJSON() {
      return {
        endpoint: 'https://push.example.com/subscription',
        keys: {
          p256dh: 'demo-p256dh',
          auth: 'demo-auth',
        },
      }
    },
  }

  assert.deepEqual(serializePushSubscription(subscription), {
    endpoint: 'https://push.example.com/subscription',
    user_agent: 'Codex Browser',
    keys: {
      p256dh: 'demo-p256dh',
      auth: 'demo-auth',
    },
  })

  delete globalThis.navigator
})

test('reports browser push support and permission conservatively', () => {
  assert.equal(isWebPushSupported(), false)
  assert.equal(getBrowserPushPermission(), 'denied')

  global.window = {
    isSecureContext: true,
    PushManager: class PushManager {},
    Notification: {
      permission: 'granted',
    },
  }
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      serviceWorker: {},
    },
  })
  global.Notification = global.window.Notification

  assert.equal(isWebPushSupported(), true)
  assert.equal(getBrowserPushPermission(), 'granted')

  delete global.window
  delete globalThis.navigator
  delete global.Notification
})
