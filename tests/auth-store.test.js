import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../src/stores/auth.js'

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
    clear() {
      storage.clear()
    },
  }
}

test('logs out and redirects to login when api responds with 401', async () => {
  setActivePinia(createPinia())

  global.localStorage = createStorageMock()

  let redirectedTo = null
  global.window = {
    location: {
      pathname: '/dashboard',
      replace(path) {
        redirectedTo = path
      },
    },
  }

  localStorage.setItem('token', 'expired-token')
  localStorage.setItem('user', JSON.stringify({ id: 42 }))

  const authStore = useAuthStore()
  authStore.init()

  const rejected = authStore.api.interceptors.response.handlers[0].rejected
  const error = { response: { status: 401 } }

  await assert.rejects(() => rejected(error), (caughtError) => caughtError === error)

  assert.equal(authStore.token, null)
  assert.equal(authStore.user, null)
  assert.equal(localStorage.getItem('token'), null)
  assert.equal(localStorage.getItem('user'), null)
  assert.equal(redirectedTo, '/login')

  delete global.localStorage
  delete global.window
})

test('updates stored session token from auth refresh response header', () => {
  setActivePinia(createPinia())

  global.localStorage = createStorageMock()
  localStorage.setItem('token', 'old-token')
  localStorage.setItem('user', JSON.stringify({ id: 42, email: 'alice@example.com' }))

  const authStore = useAuthStore()
  authStore.init()

  const fulfilled = authStore.api.interceptors.response.handlers[0].fulfilled
  const response = {
    headers: {
      'x-auth-token': 'fresh-token',
    },
  }

  assert.equal(fulfilled(response), response)
  assert.equal(authStore.token, 'fresh-token')
  assert.equal(localStorage.getItem('token'), 'fresh-token')
  assert.equal(
    localStorage.getItem('user'),
    JSON.stringify({
      id: 42,
      email: 'alice@example.com',
      login: '',
      isAdmin: false,
      notificationSettings: {
        pushEnabled: false,
        soundEnabled: true,
        toastEnabled: true,
      },
      push: {
        supported: false,
        publicKey: '',
      },
    }),
  )

  delete global.localStorage
})
