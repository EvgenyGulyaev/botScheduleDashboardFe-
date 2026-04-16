import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import {
  applyChatSocketEvent,
  buildChatWebSocketUrl,
  getChatConversationTitle,
  getChatReconnectDelayMs,
  normalizeChatConversation,
  normalizeChatMessage,
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

const createFakeApi = () => {
  const calls = []

  return {
    calls,
    get(url) {
      calls.push(['get', url])
      return Promise.resolve({ data: [] })
    },
    post(url, body) {
      calls.push(['post', url, body])
      return Promise.resolve({ data: {} })
    },
    patch(url, body) {
      calls.push(['patch', url, body])
      return Promise.resolve({ data: {} })
    },
    delete(url, config) {
      calls.push(['delete', url, config?.data])
      return Promise.resolve({ data: {} })
    },
  }
}

const createSocketMock = () => {
  class FakeWebSocket {
    static instances = []

    constructor(url) {
      this.url = url
      this.sent = []
      this.readyState = 1
      this.closeCalls = 0
      this.listeners = {}
      FakeWebSocket.instances.push(this)
    }

    send(payload) {
      this.sent.push(payload)
    }

    close() {
      this.closeCalls += 1
      this.readyState = 3
    }

    addEventListener(type, handler) {
      this.listeners[type] = handler
    }

    dispatch(type, event) {
      const handler = this.listeners[type]
      if (handler) {
        handler(event)
      }
    }
  }

  return FakeWebSocket
}

test('resolves direct chat title from the other participant login', () => {
  const conversation = {
    id: 'direct-1',
    type: 'direct',
    title: '',
    members: [
      { email: 'alice@example.com', login: 'alice' },
      { email: 'bob@example.com', login: 'bob' },
    ],
  }

  assert.equal(getChatConversationTitle(conversation, 'alice@example.com'), 'bob')
  assert.equal(getChatConversationTitle(conversation, 'bob@example.com'), 'alice')
})

test('builds chat websocket url from origin and token', () => {
  assert.equal(
    buildChatWebSocketUrl('https://admin.example.com/app', 'token-123'),
    'wss://admin.example.com/chat/ws?token=token-123',
  )
  assert.equal(
    buildChatWebSocketUrl('http://localhost:5173', 'token-123'),
    'ws://localhost:5173/chat/ws?token=token-123',
  )
})

test('normalizes conversation and message payloads', () => {
  const conversation = normalizeChatConversation(
    {
      id: 'group-1',
      type: 'group',
      title: 'Team',
      created_by_email: 'alice@example.com',
      created_by_login: 'alice',
      created_at: '2026-04-16T10:00:00Z',
      updated_at: '2026-04-16T11:00:00Z',
      last_message_id: 'msg-2',
      last_message_text: 'hello',
      last_message_at: '2026-04-16T11:00:00Z',
      members: [{ email: 'alice@example.com', login: 'alice' }],
    },
    'alice@example.com',
  )

  assert.equal(conversation.title, 'Team')
  assert.equal(conversation.createdByLogin, 'alice')
  assert.equal(conversation.members[0].login, 'alice')

  const message = normalizeChatMessage({
    id: 'msg-1',
    conversation_id: 'group-1',
    sender_email: 'alice@example.com',
    sender_login: 'alice',
    text: 'hello',
    created_at: '2026-04-16T11:00:00Z',
    delivered_to: [{ email: 'bob@example.com', login: 'bob', at: '2026-04-16T11:00:00Z' }],
    read_by: [],
  })

  assert.equal(message.conversationId, 'group-1')
  assert.equal(message.deliveredTo[0].login, 'bob')
})

test('applies message_persisted into conversations and messages', () => {
  const state = {
    users: [],
    conversations: [],
    messagesByConversation: {},
    activeConversationId: null,
    loading: {},
    error: null,
    socketStatus: 'disconnected',
  }

  applyChatSocketEvent(
    state,
    {
      event: 'message_persisted',
      data: {
        conversation: {
          id: 'direct-1',
          type: 'direct',
          title: '',
          members: [
            { email: 'alice@example.com', login: 'alice' },
            { email: 'bob@example.com', login: 'bob' },
          ],
        },
        members: [
          { conversation_id: 'direct-1', email: 'alice@example.com', login: 'alice' },
          { conversation_id: 'direct-1', email: 'bob@example.com', login: 'bob' },
        ],
        message: {
          id: 'msg-1',
          conversation_id: 'direct-1',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
          text: 'hello',
          created_at: '2026-04-16T11:00:00Z',
          delivered_to: [],
          read_by: [],
        },
      },
    },
    'alice@example.com',
  )

  assert.equal(state.conversations[0].title, 'bob')
  assert.equal(state.conversations[0].members[1].login, 'bob')
  assert.equal(state.messagesByConversation['direct-1'][0].text, 'hello')
})

test('applies message_read_updated into state without duplicating receipts', () => {
  const state = {
    users: [],
    conversations: [],
    messagesByConversation: {
      'group-1': [
        normalizeChatMessage({
          id: 'msg-1',
          conversation_id: 'group-1',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
          text: 'one',
          created_at: '2026-04-16T11:00:00Z',
          delivered_to: [],
          read_by: [],
        }),
        normalizeChatMessage({
          id: 'msg-2',
          conversation_id: 'group-1',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
          text: 'two',
          created_at: '2026-04-16T11:01:00Z',
          delivered_to: [],
          read_by: [],
        }),
      ],
    },
    activeConversationId: null,
    loading: {},
    error: null,
    socketStatus: 'disconnected',
  }

  applyChatSocketEvent(
    state,
    {
      event: 'message_read_updated',
      data: {
        conversation: {
          id: 'group-1',
          type: 'group',
          title: 'Team',
          members: [{ email: 'alice@example.com', login: 'alice' }],
        },
        members: [
          {
            conversation_id: 'group-1',
            email: 'alice@example.com',
            login: 'alice',
            last_read_message_id: 'msg-2',
          },
        ],
        message_id: 'msg-2',
        message: {
          id: 'msg-2',
          conversation_id: 'group-1',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
          text: 'two',
          created_at: '2026-04-16T11:01:00Z',
          delivered_to: [],
          read_by: [{ email: 'bob@example.com', login: 'bob', at: '2026-04-16T12:00:00Z' }],
        },
        reader: { email: 'bob@example.com', login: 'bob' },
        affected_message_ids: ['msg-1', 'msg-2'],
      },
    },
    'alice@example.com',
  )

  assert.equal(state.messagesByConversation['group-1'][0].readBy[0].email, 'bob@example.com')
  assert.equal(state.messagesByConversation['group-1'][1].readBy[0].email, 'bob@example.com')
})

test('conversation_updated removes trimmed messages by ids', () => {
  const state = {
    users: [],
    conversations: [],
    messagesByConversation: {
      'group-1': [
        normalizeChatMessage({
          id: 'msg-1',
          conversation_id: 'group-1',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
          text: 'one',
          created_at: '2026-04-16T11:00:00Z',
          delivered_to: [],
          read_by: [],
        }),
        normalizeChatMessage({
          id: 'msg-2',
          conversation_id: 'group-1',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
          text: 'two',
          created_at: '2026-04-16T11:01:00Z',
          delivered_to: [],
          read_by: [],
        }),
      ],
    },
    activeConversationId: null,
    loading: {},
    error: null,
    socketStatus: 'disconnected',
  }

  applyChatSocketEvent(
    state,
    {
      event: 'conversation_updated',
      data: {
        conversation: {
          id: 'group-1',
          type: 'group',
          title: 'Team',
          members: [{ email: 'alice@example.com', login: 'alice' }],
        },
        members: [{ conversation_id: 'group-1', email: 'alice@example.com', login: 'alice' }],
        removed_message_ids: ['msg-1'],
      },
    },
    'alice@example.com',
  )

  assert.equal(state.messagesByConversation['group-1'].length, 1)
  assert.equal(state.messagesByConversation['group-1'][0].id, 'msg-2')
})

test('reconnect delay grows with attempts', () => {
  assert.equal(getChatReconnectDelayMs(0), 500)
  assert.equal(getChatReconnectDelayMs(1), 1000)
  assert.equal(getChatReconnectDelayMs(10), 5000)
})

test('chat store sends websocket commands with auth user context', async () => {
  setActivePinia(createPinia())
  globalThis.localStorage = createStorageMock()
  globalThis.window = { location: { origin: 'http://localhost:5173' } }

  const fakeApi = createFakeApi()
  const authStore = useAuthStore()
  authStore.api = fakeApi
  authStore.token = 'token-123'
  authStore.user = { email: 'alice@example.com', login: 'alice' }

  const notifications = useNotificationsStore()
  notifications.errorFrom = () => {}
  notifications.error = () => {}
  const FakeWebSocket = createSocketMock()
  globalThis.WebSocket = FakeWebSocket

  const chatStore = useChatStore()
  chatStore.connect()
  assert.equal(FakeWebSocket.instances[0].url, 'ws://localhost:5173/chat/ws?token=token-123')

  chatStore.sendMessage({ conversationId: 'group-1', text: 'hello' })
  const sent = JSON.parse(FakeWebSocket.instances[0].sent[0])
  assert.equal(sent.event, 'send_message')
  assert.equal(sent.data.sender_email, 'alice@example.com')
  assert.equal(sent.data.sender_login, 'alice')
  assert.equal(sent.data.conversation_id, 'group-1')

  delete globalThis.localStorage
  delete globalThis.window
  delete globalThis.WebSocket
})

test('chat store shows toast for incoming inactive conversation message', () => {
  setActivePinia(createPinia())
  globalThis.localStorage = createStorageMock()

  const authStore = useAuthStore()
  authStore.user = { email: 'alice@example.com', login: 'alice' }

  const notifications = useNotificationsStore()
  const infoCalls = []
  notifications.info = (message, options) => {
    infoCalls.push({ message, options })
  }

  const chatStore = useChatStore()
  chatStore.activeConversationId = 'direct-1'
  chatStore.handleSocketEvent({
    event: 'message_persisted',
    data: {
      conversation: {
        id: 'group-1',
        title: 'Team',
        type: 'group',
        members: [
          { email: 'alice@example.com', login: 'alice' },
          { email: 'bob@example.com', login: 'bob' },
        ],
      },
      message: {
        id: 'msg-1',
        conversation_id: 'group-1',
        sender_email: 'bob@example.com',
        sender_login: 'bob',
        text: 'Привет',
        created_at: '2026-04-16T11:00:00Z',
        delivered_to: [],
        read_by: [],
      },
    },
  })

  assert.equal(infoCalls.length, 1)
  assert.match(infoCalls[0].message, /Новое сообщение от bob/)
  assert.equal(chatStore.messagesByConversation['group-1'][0].text, 'Привет')

  delete globalThis.localStorage
})

test('chat store does not show toast for active conversation message', () => {
  setActivePinia(createPinia())
  globalThis.localStorage = createStorageMock()

  const authStore = useAuthStore()
  authStore.user = { email: 'alice@example.com', login: 'alice' }

  const notifications = useNotificationsStore()
  const infoCalls = []
  notifications.info = (message) => {
    infoCalls.push(message)
  }

  const chatStore = useChatStore()
  chatStore.activeConversationId = 'group-1'
  chatStore.handleSocketEvent({
    event: 'message_persisted',
    data: {
      conversation: {
        id: 'group-1',
        title: 'Team',
        type: 'group',
      },
      message: {
        id: 'msg-1',
        conversation_id: 'group-1',
        sender_email: 'bob@example.com',
        sender_login: 'bob',
        text: 'Привет',
        created_at: '2026-04-16T11:00:00Z',
        delivered_to: [],
        read_by: [],
      },
    },
  })

  assert.equal(infoCalls.length, 0)

  delete globalThis.localStorage
})

test('chat store bootstrap and active conversation actions work with api data', async () => {
  setActivePinia(createPinia())
  globalThis.localStorage = createStorageMock()
  globalThis.window = { location: { origin: 'http://localhost:5173' } }

  const fakeApi = createFakeApi()
  fakeApi.get = (url) => {
    fakeApi.calls.push(['get', url])

    if (url === '/chat/users') {
      return Promise.resolve({
        data: [
          { email: 'alice@example.com', login: 'alice', is_admin: true },
          { email: 'bob@example.com', login: 'bob', is_admin: false },
        ],
      })
    }

    if (url === '/chat/conversations') {
      return Promise.resolve({
        data: [
          {
            id: 'group-1',
            type: 'group',
            title: 'Team',
            members: [{ email: 'alice@example.com', login: 'alice' }],
          },
        ],
      })
    }

    if (url === '/chat/conversations/group-1/messages') {
      return Promise.resolve({
        data: [
          {
            id: 'msg-1',
            conversation_id: 'group-1',
            sender_email: 'alice@example.com',
            sender_login: 'alice',
            text: 'hello',
            created_at: '2026-04-16T11:00:00Z',
            delivered_to: [],
            read_by: [],
          },
        ],
      })
    }

    return Promise.resolve({ data: [] })
  }

  const authStore = useAuthStore()
  authStore.api = fakeApi
  authStore.token = 'token-123'
  authStore.user = { email: 'alice@example.com', login: 'alice' }

  const notifications = useNotificationsStore()
  notifications.errorFrom = () => {}
  notifications.error = () => {}

  const FakeWebSocket = createSocketMock()
  globalThis.WebSocket = FakeWebSocket

  const chatStore = useChatStore()
  await chatStore.bootstrap()

  assert.equal(chatStore.users[0].login, 'alice')
  assert.equal(chatStore.conversations[0].title, 'Team')
  assert.equal(FakeWebSocket.instances[0].url, 'ws://localhost:5173/chat/ws?token=token-123')

  await chatStore.setActiveConversation('group-1')
  assert.equal(chatStore.activeConversationId, 'group-1')
  assert.equal(chatStore.messagesByConversation['group-1'][0].text, 'hello')

  delete globalThis.localStorage
  delete globalThis.window
  delete globalThis.WebSocket
})

test('chat store uses backend direct-conversation payload contract', async () => {
  setActivePinia(createPinia())
  globalThis.localStorage = createStorageMock()

  const fakeApi = createFakeApi()
  const authStore = useAuthStore()
  authStore.api = fakeApi
  authStore.token = 'token-123'
  authStore.user = { email: 'alice@example.com', login: 'alice' }

  const notifications = useNotificationsStore()
  notifications.errorFrom = () => {}

  const chatStore = useChatStore()
  await chatStore.ensureDirectConversation('bob@example.com')

  assert.deepEqual(fakeApi.calls[0], [
    'post',
    '/chat/conversations/direct',
    { email: 'bob@example.com' },
  ])

  delete globalThis.localStorage
})

test('chat store uses backend group-member payload contract', async () => {
  setActivePinia(createPinia())
  globalThis.localStorage = createStorageMock()

  const fakeApi = createFakeApi()
  const authStore = useAuthStore()
  authStore.api = fakeApi
  authStore.token = 'token-123'
  authStore.user = { email: 'alice@example.com', login: 'alice' }

  const notifications = useNotificationsStore()
  notifications.errorFrom = () => {}

  const chatStore = useChatStore()
  await chatStore.addGroupMembers({
    conversationId: 'group-1',
    memberEmails: ['bob@example.com'],
  })
  await chatStore.removeGroupMembers({
    conversationId: 'group-1',
    memberEmails: ['bob@example.com'],
  })

  assert.deepEqual(fakeApi.calls[0], [
    'post',
    '/chat/conversations/group/group-1/members',
    { emails: ['bob@example.com'] },
  ])
  assert.deepEqual(fakeApi.calls[1], [
    'delete',
    '/chat/conversations/group/group-1/members',
    { emails: ['bob@example.com'] },
  ])

  delete globalThis.localStorage
})

test('chat store deletes group conversation and clears local state', async () => {
  setActivePinia(createPinia())
  globalThis.localStorage = createStorageMock()

  const fakeApi = createFakeApi()
  const authStore = useAuthStore()
  authStore.api = fakeApi
  authStore.token = 'token-123'
  authStore.user = { email: 'alice@example.com', login: 'alice' }

  const notifications = useNotificationsStore()
  notifications.errorFrom = () => {}

  const chatStore = useChatStore()
  chatStore.conversations = [{ id: 'group-1', title: 'Team', type: 'group' }]
  chatStore.messagesByConversation = { 'group-1': [{ id: 'msg-1' }] }
  chatStore.activeConversationId = 'group-1'

  await chatStore.deleteGroupConversation('group-1')

  assert.deepEqual(fakeApi.calls[0], [
    'delete',
    '/chat/conversations/group/group-1',
    undefined,
  ])
  assert.equal(chatStore.conversations.length, 0)
  assert.equal(chatStore.messagesByConversation['group-1'], undefined)
  assert.equal(chatStore.activeConversationId, null)

  delete globalThis.localStorage
})
