import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import {
  getChatDraftPreview,
  normalizeChatConversation,
} from '../src/lib/chat.js'
import { useAuthStore } from '../src/stores/auth.js'
import { useChatStore } from '../src/stores/chat.js'
import { useNotificationsStore } from '../src/stores/notifications.js'

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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const setupStore = (api) => {
  setActivePinia(createPinia())
  globalThis.localStorage = createStorageMock()

  const authStore = useAuthStore()
  authStore.api = api
  authStore.token = 'token-123'
  authStore.user = { email: 'alice@example.com', login: 'alice' }

  const notifications = useNotificationsStore()
  notifications.errorFrom = () => {}
  notifications.error = () => {}

  return useChatStore()
}

test('composer loads saved draft when conversation opens', async () => {
  const calls = []
  const chatStore = setupStore({
    get(url) {
      calls.push(['get', url])
      if (url === '/chat/conversations/group-1/call') {
        return Promise.resolve({ data: null })
      }
      if (url === '/chat/conversations/group-1/messages') {
        return Promise.resolve({ data: { messages: [], last_read_message_id: '' } })
      }
      if (url === '/chat/drafts/group-1') {
        return Promise.resolve({
          data: {
            text: 'finish the reply',
            updated_at: '2026-04-27T10:00:00Z',
          },
        })
      }
      return Promise.resolve({ data: null })
    },
  })
  chatStore.conversations = [
    normalizeChatConversation({ id: 'group-1', type: 'group', title: 'Team' }, 'alice@example.com'),
  ]

  await chatStore.setActiveConversation('group-1')

  assert.equal(chatStore.draftTextByConversation['group-1'], 'finish the reply')
  assert.equal(chatStore.activeConversation.draft.text, 'finish the reply')
  assert.deepEqual(calls.map((call) => call[1]), [
    '/chat/conversations/group-1/call',
    '/chat/conversations/group-1/messages',
    '/chat/drafts/group-1',
  ])

  delete globalThis.localStorage
})

test('draft autosave uses debounce and does not spam requests', async () => {
  const calls = []
  const chatStore = setupStore({
    put(url, body) {
      calls.push(['put', url, body])
      return Promise.resolve({
        data: {
          text: body.text,
          updated_at: '2026-04-27T10:00:00Z',
        },
      })
    },
  })
  chatStore.conversations = [
    normalizeChatConversation({ id: 'group-1', type: 'group', title: 'Team' }, 'alice@example.com'),
  ]

  chatStore.queueDraftSave('group-1', 'h', 20)
  chatStore.queueDraftSave('group-1', 'he', 20)
  chatStore.queueDraftSave('group-1', 'hey', 20)
  await wait(50)

  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], ['put', '/chat/drafts/group-1', { text: 'hey' }])
  assert.equal(chatStore.conversations[0].draft.text, 'hey')

  delete globalThis.localStorage
})

test('draft save failure keeps local fallback text', async () => {
  const chatStore = setupStore({
    put() {
      return Promise.reject(new Error('offline'))
    },
  })
  chatStore.conversations = [
    normalizeChatConversation({ id: 'group-1', type: 'group', title: 'Team' }, 'alice@example.com'),
  ]

  chatStore.queueDraftSave('group-1', 'offline draft', 10)
  await wait(30)

  assert.equal(chatStore.draftTextByConversation['group-1'], 'offline draft')
  assert.equal(chatStore.conversations[0].draft.text, 'offline draft')

  delete globalThis.localStorage
})

test('send clears draft', async () => {
  const calls = []
  const chatStore = setupStore({
    delete(url) {
      calls.push(['delete', url])
      return Promise.resolve({ data: {} })
    },
  })
  chatStore.conversations = [
    normalizeChatConversation(
      {
        id: 'group-1',
        type: 'group',
        title: 'Team',
        draft: { text: 'send this', updated_at: '2026-04-27T10:00:00Z' },
      },
      'alice@example.com',
    ),
  ]
  chatStore.draftTextByConversation['group-1'] = 'send this'
  globalThis.window = { location: { origin: 'http://localhost:5173' } }
  globalThis.WebSocket = class FakeWebSocket {
    static instances = []
    constructor() {
      this.readyState = 1
      this.sent = []
      FakeWebSocket.instances.push(this)
    }
    send(payload) {
      this.sent.push(payload)
    }
    close() {}
    addEventListener() {}
  }

  assert.equal(chatStore.sendMessage({ conversationId: 'group-1', text: 'send this' }), true)
  await wait(0)

  assert.equal(chatStore.draftTextByConversation['group-1'], '')
  assert.equal(chatStore.conversations[0].draft.text, '')
  assert.deepEqual(calls, [['delete', '/chat/drafts/group-1']])

  delete globalThis.localStorage
  delete globalThis.window
  delete globalThis.WebSocket
})

test('chat list draft preview prefers Черновик over last message preview', () => {
  const conversation = normalizeChatConversation(
    {
      id: 'group-1',
      type: 'group',
      title: 'Team',
      last_message_text: 'last message',
      draft: { text: 'unfinished answer', updated_at: '2026-04-27T10:00:00Z' },
    },
    'alice@example.com',
  )

  assert.equal(getChatDraftPreview(conversation), 'Черновик: unfinished answer')
})
