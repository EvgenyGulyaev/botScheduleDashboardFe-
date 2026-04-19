import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useNotificationsStore } from '../src/stores/notifications.js'

test('adds notifications with defaults and schedules auto-dismiss', () => {
  setActivePinia(createPinia())

  const scheduled = []
  const originalSetTimeout = global.setTimeout
  global.setTimeout = (callback, delay) => {
    scheduled.push({ callback, delay })
    return scheduled.length
  }

  try {
    const store = useNotificationsStore()
    const id = store.success('Saved successfully')

    assert.equal(store.items.length, 1)
    assert.deepEqual(store.items[0], {
      id,
      type: 'success',
      message: 'Saved successfully',
      duration: 4000,
    })
    assert.equal(scheduled.length, 1)
    assert.equal(scheduled[0].delay, 4000)

    scheduled[0].callback()
    assert.equal(store.items.length, 0)
  } finally {
    global.setTimeout = originalSetTimeout
  }
})

test('supports persistent notifications and manual dismiss', () => {
  setActivePinia(createPinia())

  const originalSetTimeout = global.setTimeout
  global.setTimeout = () => {
    throw new Error('setTimeout should not be called for persistent notifications')
  }

  try {
    const store = useNotificationsStore()
    const id = store.error('Something went wrong', { duration: 0 })

    assert.equal(store.items.length, 1)
    assert.equal(store.items[0].type, 'error')
    assert.equal(store.items[0].duration, 0)

    store.dismiss(id)
    assert.equal(store.items.length, 0)
  } finally {
    global.setTimeout = originalSetTimeout
  }
})

test('adds chat notifications for incoming messages', () => {
  setActivePinia(createPinia())

  const store = useNotificationsStore()
  const id = store.chat('Новое сообщение', { duration: 0 })

  assert.deepEqual(store.items[0], {
    id,
    type: 'chat',
    message: 'Новое сообщение',
    duration: 0,
  })
})

test('extracts a readable message from api-like errors', () => {
  setActivePinia(createPinia())

  const store = useNotificationsStore()
  const id = store.errorFrom(
    {
      response: {
        data: {
          message: 'Backend is unavailable',
        },
      },
    },
    'Fallback message',
    { duration: 0 },
  )

  assert.equal(store.items.length, 1)
  assert.deepEqual(store.items[0], {
    id,
    type: 'error',
    message: 'Backend is unavailable',
    duration: 0,
  })
})
