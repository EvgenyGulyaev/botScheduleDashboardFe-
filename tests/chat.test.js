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
    put(url, body) {
      calls.push(['put', url, body])
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
      pinned_message_id: 'msg-1',
      pinned_message: {
        id: 'msg-1',
        type: 'text',
        text: 'pinned',
        sender_login: 'alice',
      },
      members: [{ email: 'alice@example.com', login: 'alice' }],
    },
    'alice@example.com',
  )

  assert.equal(conversation.title, 'Team')
  assert.equal(conversation.createdByLogin, 'alice')
  assert.equal(conversation.members[0].login, 'alice')
  assert.equal(conversation.pinnedMessageId, 'msg-1')
  assert.equal(conversation.pinnedMessage.text, 'pinned')

  const message = normalizeChatMessage({
    id: 'msg-1',
    conversation_id: 'group-1',
    type: 'audio',
    sender_email: 'alice@example.com',
    sender_login: 'alice',
    text: 'Голосовое сообщение',
    created_at: '2026-04-16T11:00:00Z',
    delivered_to: [{ email: 'bob@example.com', login: 'bob', at: '2026-04-16T11:00:00Z' }],
    read_by: [],
    audio: {
      id: 'audio-1',
      mime_type: 'audio/webm',
      size_bytes: 123,
      duration_seconds: 7,
      consumed: false,
      consumed_by_email: '',
      consumed_by_login: '',
      expires_at: '2026-04-17T11:00:00Z',
      expired: false,
    },
  })

  assert.equal(message.conversationId, 'group-1')
  assert.equal(message.type, 'audio')
  assert.equal(message.audio.durationSeconds, 7)
  assert.equal(message.audio.expiresAt, '2026-04-17T11:00:00Z')
  assert.equal(message.audio.consumedByEmail, '')
  assert.equal(message.deliveredTo[0].login, 'bob')

  const imageMessage = normalizeChatMessage({
    id: 'msg-image',
    conversation_id: 'group-1',
    type: 'image',
    sender_email: 'alice@example.com',
    sender_login: 'alice',
    text: 'Изображение',
    created_at: '2026-04-16T11:02:00Z',
    delivered_to: [],
    read_by: [],
    image: {
      id: 'image-1',
      mime_type: 'image/png',
      size_bytes: 321,
      consumed: false,
      consumed_by_email: '',
      consumed_by_login: '',
      expires_at: '2026-04-17T11:00:00Z',
      expired: false,
    },
  })

  assert.equal(imageMessage.type, 'image')
  assert.equal(imageMessage.image.mimeType, 'image/png')
  assert.equal(imageMessage.image.expiresAt, '2026-04-17T11:00:00Z')

  const replyMessage = normalizeChatMessage({
    id: 'msg-reply',
    conversation_id: 'group-1',
    type: 'text',
    sender_email: 'bob@example.com',
    sender_login: 'bob',
    text: 'Ответ',
    created_at: '2026-04-16T11:03:00Z',
    updated_at: '2026-04-16T11:05:00Z',
    edited_at: '2026-04-16T11:05:00Z',
    reply_to_message_id: 'msg-source',
    reply_preview: {
      id: 'msg-source',
      type: 'audio',
      text: 'Голосовое сообщение',
      sender_email: 'alice@example.com',
      sender_login: 'alice',
    },
    delivered_to: [],
    read_by: [],
  })

  assert.equal(replyMessage.updatedAt, '2026-04-16T11:05:00Z')
  assert.equal(replyMessage.editedAt, '2026-04-16T11:05:00Z')
  assert.equal(replyMessage.replyToMessageId, 'msg-source')
  assert.equal(replyMessage.replyPreview.id, 'msg-source')
  assert.equal(replyMessage.replyPreview.type, 'audio')
  assert.equal(
    normalizeChatMessage({
      id: 'msg-react',
      conversation_id: 'group-1',
      type: 'text',
      text: 'reacted',
      reactions: [{ emoji: '🔥', user_email: 'alice@example.com', user_login: 'alice' }],
    }).reactions[0].emoji,
    '🔥',
  )

  const callMessage = normalizeChatMessage({
    id: 'msg-call',
    conversation_id: 'group-1',
    type: 'call',
    text: 'Начался звонок',
    sender_email: 'alice@example.com',
    sender_login: 'alice',
    call: {
      id: 'call-1',
      call_id: 'call-1',
      conversation_id: 'group-1',
      message_id: 'msg-call',
      started_by_email: 'alice@example.com',
      started_by_login: 'alice',
      started_at: '2026-04-20T10:00:00Z',
      joinable: true,
      max_participants: 4,
      participant_count: 2,
      participants: [
        { email: 'alice@example.com', login: 'alice', muted: false },
        { email: 'bob@example.com', login: 'bob', muted: true },
      ],
    },
  })

  assert.equal(callMessage.type, 'call')
  assert.equal(callMessage.call.id, 'call-1')
  assert.equal(callMessage.call.participantCount, 2)
  assert.equal(callMessage.call.participants[1].muted, true)
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

test('applies call lifecycle events into active call state', () => {
  const state = {
    users: [],
    conversations: [],
    messagesByConversation: {},
    activeConversationId: 'group-1',
    activeCall: null,
    activeCallsByConversation: {},
    loading: {},
    error: null,
    socketStatus: 'connected',
  }

  applyChatSocketEvent(
    state,
    {
      event: 'call_started',
      data: {
        conversation: {
          id: 'group-1',
          type: 'group',
          title: 'Team',
          members: [
            { email: 'alice@example.com', login: 'alice' },
            { email: 'bob@example.com', login: 'bob' },
          ],
        },
        members: [
          { email: 'alice@example.com', login: 'alice' },
          { email: 'bob@example.com', login: 'bob' },
        ],
        call: {
          id: 'call-1',
          conversation_id: 'group-1',
          message_id: 'msg-call',
          started_by_email: 'alice@example.com',
          started_by_login: 'alice',
          started_at: '2026-04-20T10:00:00Z',
          max_participants: 4,
          participants: [
            { email: 'alice@example.com', login: 'alice', muted: false },
          ],
        },
        message: {
          id: 'msg-call',
          conversation_id: 'group-1',
          type: 'call',
          text: 'Начался звонок',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
          created_at: '2026-04-20T10:00:00Z',
          call: {
            call_id: 'call-1',
            started_by_email: 'alice@example.com',
            started_by_login: 'alice',
            started_at: '2026-04-20T10:00:00Z',
            joinable: true,
            participant_count: 1,
          },
        },
      },
    },
    'alice@example.com',
  )

  assert.equal(state.activeCall?.id, 'call-1')
  assert.equal(state.activeCallsByConversation['group-1']?.id, 'call-1')
  assert.equal(state.messagesByConversation['group-1'][0].call.joinable, true)

  applyChatSocketEvent(
    state,
    {
      event: 'call_ended',
      data: {
        conversation: {
          id: 'group-1',
          type: 'group',
          title: 'Team',
        },
        call: {
          id: 'call-1',
          conversation_id: 'group-1',
          message_id: 'msg-call',
          started_by_email: 'alice@example.com',
          started_by_login: 'alice',
          started_at: '2026-04-20T10:00:00Z',
          ended_at: '2026-04-20T10:05:00Z',
          max_participants: 4,
          participants: [],
        },
        message: {
          id: 'msg-call',
          conversation_id: 'group-1',
          type: 'call',
          text: 'Начался звонок',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
          created_at: '2026-04-20T10:00:00Z',
          updated_at: '2026-04-20T10:05:00Z',
          call: {
            call_id: 'call-1',
            started_by_email: 'alice@example.com',
            started_by_login: 'alice',
            started_at: '2026-04-20T10:00:00Z',
            joinable: false,
            ended_at: '2026-04-20T10:05:00Z',
            participant_count: 0,
          },
        },
      },
    },
    'alice@example.com',
  )

  assert.equal(state.activeCall, null)
  assert.equal(state.activeCallsByConversation['group-1'], null)
  assert.equal(state.messagesByConversation['group-1'][0].call.joinable, false)
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

test('message_updated replaces message fields including reactions', () => {
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
      event: 'message_updated',
      data: {
        conversation: {
          id: 'group-1',
          type: 'group',
          title: 'Team',
          members: [{ email: 'alice@example.com', login: 'alice' }],
        },
        members: [{ conversation_id: 'group-1', email: 'alice@example.com', login: 'alice' }],
        message: {
          id: 'msg-1',
          conversation_id: 'group-1',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
          text: 'updated',
          created_at: '2026-04-16T11:00:00Z',
          edited_at: '2026-04-16T11:05:00Z',
          reactions: [{ emoji: '🔥', user_email: 'bob@example.com', user_login: 'bob' }],
        },
      },
    },
    'alice@example.com',
  )

  assert.equal(state.messagesByConversation['group-1'][0].text, 'updated')
  assert.equal(state.messagesByConversation['group-1'][0].editedAt, '2026-04-16T11:05:00Z')
  assert.equal(state.messagesByConversation['group-1'][0].reactions[0].emoji, '🔥')
})

test('message_deleted removes target message and clears affected reply previews', () => {
  const state = {
    users: [],
    conversations: [],
    messagesByConversation: {
      'group-1': [
        normalizeChatMessage({
          id: 'msg-source',
          conversation_id: 'group-1',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
          text: 'source',
          created_at: '2026-04-16T11:00:00Z',
        }),
        normalizeChatMessage({
          id: 'msg-reply',
          conversation_id: 'group-1',
          sender_email: 'bob@example.com',
          sender_login: 'bob',
          text: 'reply',
          created_at: '2026-04-16T11:01:00Z',
          reply_to_message_id: 'msg-source',
          reply_preview: {
            id: 'msg-source',
            type: 'text',
            text: 'source',
            sender_login: 'alice',
          },
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
      event: 'message_deleted',
      data: {
        conversation: {
          id: 'group-1',
          type: 'group',
          title: 'Team',
          members: [{ email: 'alice@example.com', login: 'alice' }],
        },
        members: [{ conversation_id: 'group-1', email: 'alice@example.com', login: 'alice' }],
        message_id: 'msg-source',
        affected_messages: [
          {
            id: 'msg-reply',
            conversation_id: 'group-1',
            sender_email: 'bob@example.com',
            sender_login: 'bob',
            text: 'reply',
            created_at: '2026-04-16T11:01:00Z',
            reply_to_message_id: 'msg-source',
          },
        ],
      },
    },
    'alice@example.com',
  )

  assert.equal(state.messagesByConversation['group-1'].length, 1)
  assert.equal(state.messagesByConversation['group-1'][0].id, 'msg-reply')
  assert.equal(state.messagesByConversation['group-1'][0].replyPreview, null)
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

  chatStore.sendMessage({
    conversationId: 'group-1',
    text: 'hello',
    replyToMessageId: 'msg-1',
  })
  const sent = JSON.parse(FakeWebSocket.instances[0].sent[0])
  assert.equal(sent.event, 'send_message')
  assert.equal(sent.data.sender_email, 'alice@example.com')
  assert.equal(sent.data.sender_login, 'alice')
  assert.equal(sent.data.conversation_id, 'group-1')
  assert.equal(sent.data.reply_to_message_id, 'msg-1')

  delete globalThis.localStorage
  delete globalThis.window
  delete globalThis.WebSocket
})

test('chat store marks previous peer message as read before sending a reply', async () => {
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
  chatStore.messagesByConversation = {
    'group-1': [
      normalizeChatMessage({
        id: 'msg-1',
        conversation_id: 'group-1',
        sender_email: 'bob@example.com',
        sender_login: 'bob',
        text: 'Привет',
        created_at: '2026-04-16T11:00:00Z',
        delivered_to: [],
        read_by: [],
      }),
    ],
  }
  chatStore.connect()
  chatStore.sendMessage({ conversationId: 'group-1', text: 'answer' })

  const readEnvelope = JSON.parse(FakeWebSocket.instances[0].sent[0])
  const sendEnvelope = JSON.parse(FakeWebSocket.instances[0].sent[1])
  assert.equal(readEnvelope.event, 'mark_read')
  assert.equal(readEnvelope.data.conversation_id, 'group-1')
  assert.equal(readEnvelope.data.message_id, 'msg-1')
  assert.equal(sendEnvelope.event, 'send_message')

  delete globalThis.localStorage
  delete globalThis.window
  delete globalThis.WebSocket
})

test('chat store uploads and consumes one-time audio messages', async () => {
  setActivePinia(createPinia())
  globalThis.localStorage = createStorageMock()
  globalThis.window = { location: { origin: 'http://localhost:5173' } }
  const FakeWebSocket = createSocketMock()
  globalThis.WebSocket = FakeWebSocket

  const calls = []
  const fakeApi = {
    get(url, config) {
      calls.push(['get', url, config])
      return Promise.resolve({ data: new Blob(['voice'], { type: 'audio/webm' }) })
    },
    post(url, body, config) {
      calls.push(['post', url, body, config])
      return Promise.resolve({
        data: {
          id: 'msg-audio',
          conversation_id: 'group-1',
          type: 'audio',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
          text: 'Голосовое сообщение',
          audio: {
            id: 'audio-1',
            mime_type: 'audio/webm',
            size_bytes: 5,
            duration_seconds: 4,
            consumed: false,
            consumed_by_email: '',
            consumed_by_login: '',
            expires_at: '2026-04-17T11:00:00Z',
            expired: false,
          },
        },
      })
    },
  }
  const authStore = useAuthStore()
  authStore.api = fakeApi
  authStore.token = 'token-123'
  authStore.user = { email: 'alice@example.com', login: 'alice' }

  const notifications = useNotificationsStore()
  notifications.errorFrom = () => {}
  notifications.error = () => {}

  const chatStore = useChatStore()
  const message = await chatStore.sendAudioMessage({
    conversationId: 'group-1',
    audioBlob: new Blob(['voice'], { type: 'audio/webm' }),
    durationSeconds: 4,
  })

  assert.equal(calls[0][0], 'post')
  assert.equal(calls[0][1], '/chat/conversations/group-1/audio')
  assert.ok(calls[0][2] instanceof FormData)
  assert.equal(calls[0][3].headers.Authorization, 'Bearer token-123')
  assert.equal(message.type, 'audio')
  assert.equal(chatStore.messagesByConversation['group-1'][0].audio.durationSeconds, 4)

  const blob = await chatStore.consumeAudioMessage({
    conversationId: 'group-1',
    messageId: 'msg-audio',
  })

  assert.equal(calls[1][0], 'get')
  assert.equal(calls[1][2].responseType, 'blob')
  assert.equal(blob.type, 'audio/webm')
  assert.equal(chatStore.messagesByConversation['group-1'][0].audio.consumed, true)
  assert.equal(chatStore.messagesByConversation['group-1'][0].audio.consumedByEmail, 'alice@example.com')

  delete globalThis.localStorage
  delete globalThis.window
  delete globalThis.WebSocket
})

test('chat store uploads and consumes one-time image messages', async () => {
  setActivePinia(createPinia())
  globalThis.localStorage = createStorageMock()
  globalThis.window = { location: { origin: 'http://localhost:5173' } }
  const FakeWebSocket = createSocketMock()
  globalThis.WebSocket = FakeWebSocket

  const calls = []
  const fakeApi = {
    get(url, config) {
      calls.push(['get', url, config])
      return Promise.resolve({ data: new Blob(['img'], { type: 'image/png' }) })
    },
    post(url, body, config) {
      calls.push(['post', url, body, config])
      return Promise.resolve({
        data: {
          id: 'msg-image',
          conversation_id: 'group-1',
          type: 'image',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
          text: 'Изображение',
          image: {
            id: 'image-1',
            mime_type: 'image/png',
            size_bytes: 3,
            consumed: false,
            consumed_by_email: '',
            consumed_by_login: '',
            expires_at: '2026-04-17T11:00:00Z',
            expired: false,
          },
        },
      })
    },
  }
  const authStore = useAuthStore()
  authStore.api = fakeApi
  authStore.token = 'token-123'
  authStore.user = { email: 'alice@example.com', login: 'alice' }

  const notifications = useNotificationsStore()
  notifications.errorFrom = () => {}
  notifications.error = () => {}

  const chatStore = useChatStore()
  const message = await chatStore.sendImageMessage({
    conversationId: 'group-1',
    imageBlob: new Blob(['img'], { type: 'image/png' }),
    filename: 'photo.png',
  })

  assert.equal(calls[0][0], 'post')
  assert.equal(calls[0][1], '/chat/conversations/group-1/image')
  assert.ok(calls[0][2] instanceof FormData)
  assert.equal(calls[0][3].headers.Authorization, 'Bearer token-123')
  assert.equal(message.type, 'image')
  assert.equal(chatStore.messagesByConversation['group-1'][0].image.mimeType, 'image/png')

  const blob = await chatStore.consumeImageMessage({
    conversationId: 'group-1',
    messageId: 'msg-image',
  })

  assert.equal(calls[1][0], 'get')
  assert.equal(calls[1][2].responseType, 'blob')
  assert.equal(blob.type, 'image/png')
  assert.equal(chatStore.messagesByConversation['group-1'][0].image.consumed, true)
  assert.equal(chatStore.messagesByConversation['group-1'][0].image.consumedByEmail, 'alice@example.com')

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
  const chatCalls = []
  notifications.chat = (message, options) => {
    chatCalls.push({ message, options })
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

  assert.equal(chatCalls.length, 1)
  assert.match(chatCalls[0].message, /Новое сообщение от bob/)
  assert.equal(chatStore.messagesByConversation['group-1'][0].text, 'Привет')

  delete globalThis.localStorage
})

test('chat store shows toast for incoming active conversation message', () => {
  setActivePinia(createPinia())
  globalThis.localStorage = createStorageMock()

  const authStore = useAuthStore()
  authStore.user = { email: 'alice@example.com', login: 'alice' }

  const notifications = useNotificationsStore()
  const chatCalls = []
  notifications.chat = (message, options) => {
    chatCalls.push({ message, options })
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

  assert.equal(chatCalls.length, 1)
  assert.match(chatCalls[0].message, /Новое сообщение от bob/)

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

  assert.deepEqual(fakeApi.calls[0], ['delete', '/chat/conversations/group/group-1', undefined])
  assert.equal(chatStore.conversations.length, 0)
  assert.equal(chatStore.messagesByConversation['group-1'], undefined)
  assert.equal(chatStore.activeConversationId, null)

  delete globalThis.localStorage
})

test('chat store edits messages, reacts, pins and searches through backend endpoints', async () => {
  setActivePinia(createPinia())
  globalThis.localStorage = createStorageMock()
  globalThis.window = { location: { origin: 'http://localhost:5173' } }

  const fakeApi = createFakeApi()
  fakeApi.patch = (url, body) => {
    fakeApi.calls.push(['patch', url, body])
    return Promise.resolve({
      data: {
        id: 'msg-1',
        conversation_id: 'group-1',
        type: 'text',
        sender_email: 'alice@example.com',
        sender_login: 'alice',
        text: body.text,
        created_at: '2026-04-16T11:00:00Z',
        edited_at: '2026-04-16T11:05:00Z',
      },
    })
  }
  fakeApi.put = (url, body) => {
    fakeApi.calls.push(['put', url, body])
    if (url.endsWith('/reaction')) {
      return Promise.resolve({
        data: {
          id: 'msg-1',
          conversation_id: 'group-1',
          type: 'text',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
          text: 'updated',
          created_at: '2026-04-16T11:00:00Z',
          reactions: [{ emoji: body.emoji, user_email: 'alice@example.com', user_login: 'alice' }],
        },
      })
    }

    return Promise.resolve({
      data: {
        id: 'group-1',
        type: 'group',
        title: 'Team',
        members: [{ email: 'alice@example.com', login: 'alice' }],
        pinned_message_id: 'msg-1',
        pinned_message: {
          id: 'msg-1',
          type: 'text',
          text: 'updated',
          sender_login: 'alice',
        },
      },
    })
  }
  fakeApi.delete = (url) => {
    fakeApi.calls.push(['delete', url])
    return Promise.resolve({ data: { message_id: 'msg-1' } })
  }
  fakeApi.get = (url) => {
    fakeApi.calls.push(['get', url])
    return Promise.resolve({
      data: [
        {
          conversation_id: 'group-1',
          conversation_title: 'Team',
          message_id: 'msg-1',
          sender_login: 'alice',
          text: 'updated',
        },
      ],
    })
  }

  const authStore = useAuthStore()
  authStore.api = fakeApi
  authStore.user = { email: 'alice@example.com', login: 'alice' }

  const notifications = useNotificationsStore()
  notifications.errorFrom = () => {}
  notifications.error = () => {}

  const chatStore = useChatStore()
  chatStore.conversations = [
    normalizeChatConversation(
      {
        id: 'group-1',
        type: 'group',
        title: 'Team',
        last_message_id: 'msg-1',
        last_message_text: 'hello',
        last_message_at: '2026-04-16T11:00:00Z',
        pinned_message_id: 'msg-1',
        pinned_message: {
          id: 'msg-1',
          type: 'text',
          text: 'hello',
          sender_email: 'alice@example.com',
          sender_login: 'alice',
        },
        members: [{ email: 'alice@example.com', login: 'alice' }],
      },
      'alice@example.com',
    ),
  ]
  chatStore.messagesByConversation = {
    'group-1': [
      normalizeChatMessage({
        id: 'msg-1',
        conversation_id: 'group-1',
        type: 'text',
        sender_email: 'alice@example.com',
        sender_login: 'alice',
        text: 'hello',
        created_at: '2026-04-16T11:00:00Z',
      }),
    ],
  }

  await chatStore.editMessage({ conversationId: 'group-1', messageId: 'msg-1', text: 'updated' })
  assert.equal(chatStore.messagesByConversation['group-1'][0].text, 'updated')
  assert.equal(chatStore.conversations[0].lastMessageText, 'updated')
  assert.equal(chatStore.conversations[0].pinnedMessage.text, 'updated')

  await chatStore.setReaction({ conversationId: 'group-1', messageId: 'msg-1', emoji: '🔥' })
  assert.equal(chatStore.messagesByConversation['group-1'][0].reactions[0].emoji, '🔥')

  await chatStore.pinMessage({ conversationId: 'group-1', messageId: 'msg-1' })
  assert.equal(chatStore.conversations[0].pinnedMessageId, 'msg-1')

  const results = await chatStore.searchMessages('upd')
  assert.equal(results[0].messageId, 'msg-1')

  await chatStore.deleteMessage({ conversationId: 'group-1', messageId: 'msg-1' })
  assert.equal(chatStore.messagesByConversation['group-1'].length, 0)
  assert.equal(chatStore.conversations[0].pinnedMessageId, '')
  assert.equal(chatStore.conversations[0].lastMessageText, '')

  delete globalThis.localStorage
  delete globalThis.window
})
