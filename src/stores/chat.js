import { defineStore } from 'pinia'
import {
  applyChatSocketEvent,
  buildChatWebSocketUrl,
  getChatReconnectDelayMs,
  normalizeChatConversation,
  normalizeChatConversations,
  normalizeChatMessage,
  normalizeChatMessages,
  normalizeChatUsers,
} from '../lib/chat.js'
import {
  buildIncomingChatNotice,
  isChatSoundEnabled,
  playChatNotificationSound,
  setChatSoundEnabled,
  shouldNotifyIncomingChatMessage,
} from '../lib/chat-notifications.js'
import { useAuthStore } from './auth.js'
import { useNotificationsStore } from './notifications.js'

const createLoadingState = () => ({
  users: false,
  conversations: false,
  messages: false,
})

const getApi = (authStore) => {
  if (!authStore.api && typeof authStore.init === 'function') {
    authStore.init()
  }

  return authStore.api
}

const getCurrentUser = (authStore) => authStore.user || {}

const getCurrentOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return 'http://localhost:5173'
}

const sortConversations = (conversations) =>
  [...conversations].sort((left, right) => {
    const leftTime = left.lastMessageAt || left.updatedAt || left.createdAt || ''
    const rightTime = right.lastMessageAt || right.updatedAt || right.createdAt || ''

    if (leftTime !== rightTime) {
      return rightTime.localeCompare(leftTime)
    }

    return left.title.localeCompare(right.title)
  })

const ensureMessagesCollection = (state, conversationId) => {
  if (!state.messagesByConversation[conversationId]) {
    state.messagesByConversation[conversationId] = []
  }

  return state.messagesByConversation[conversationId]
}

const upsertConversation = (state, conversation, currentUserEmail) => {
  const normalized = normalizeChatConversation(conversation, currentUserEmail)
  const index = state.conversations.findIndex((item) => item.id === normalized.id)

  if (index === -1) {
    state.conversations.push(normalized)
  } else {
    state.conversations[index] = {
      ...state.conversations[index],
      ...normalized,
    }
  }

  state.conversations = sortConversations(state.conversations)
  return normalized
}

const sendSocketEnvelope = (socket, event, data) => {
  const openState = typeof WebSocket !== 'undefined' && WebSocket.OPEN != null ? WebSocket.OPEN : 1

  if (!socket || socket.readyState !== openState) {
    return false
  }

  socket.send(JSON.stringify({ event, data }))
  return true
}

const getSocketOpenState = () =>
  typeof WebSocket !== 'undefined' && WebSocket.OPEN != null ? WebSocket.OPEN : 1

export const useChatStore = defineStore('chat', {
  state: () => ({
    users: [],
    conversations: [],
    messagesByConversation: {},
    activeConversationId: null,
    loading: createLoadingState(),
    error: null,
    socketStatus: 'disconnected',
    reconnectAttempts: 0,
    reconnectTimer: null,
    socket: null,
    manualDisconnect: false,
    soundEnabled: isChatSoundEnabled(),
  }),

  getters: {
    activeConversation(state) {
      return state.conversations.find((conversation) => conversation.id === state.activeConversationId) || null
    },

    activeConversationMessages(state) {
      if (!state.activeConversationId) {
        return []
      }

      return state.messagesByConversation[state.activeConversationId] || []
    },

    activeConversationMembers(state) {
      return state.conversations.find((conversation) => conversation.id === state.activeConversationId)?.members || []
    },
  },

  actions: {
    resetError() {
      this.error = null
    },

    async loadUsers() {
      this.loading = { ...this.loading, users: true }
      this.error = null

      try {
        const authStore = useAuthStore()
        const api = getApi(authStore)
        const response = await api.get('/chat/users')
        this.users = normalizeChatUsers(response.data)
        return this.users
      } catch (error) {
        this.error = error
        useNotificationsStore().errorFrom(error, 'Не удалось загрузить пользователей чата')
        throw error
      } finally {
        this.loading = { ...this.loading, users: false }
      }
    },

    async loadConversations() {
      this.loading = { ...this.loading, conversations: true }
      this.error = null

      try {
        const authStore = useAuthStore()
        const api = getApi(authStore)
        const currentUserEmail = getCurrentUser(authStore).email || ''
        const response = await api.get('/chat/conversations')
        this.conversations = sortConversations(
          normalizeChatConversations(response.data, currentUserEmail),
        )
        return this.conversations
      } catch (error) {
        this.error = error
        useNotificationsStore().errorFrom(error, 'Не удалось загрузить диалоги чата')
        throw error
      } finally {
        this.loading = { ...this.loading, conversations: false }
      }
    },

    async loadMessages(conversationId) {
      if (!conversationId) {
        return []
      }

      this.loading = { ...this.loading, messages: true }
      this.error = null

      try {
        const authStore = useAuthStore()
        const api = getApi(authStore)
        const response = await api.get(`/chat/conversations/${conversationId}/messages`)
        this.messagesByConversation[conversationId] = normalizeChatMessages(response.data)
        return this.messagesByConversation[conversationId]
      } catch (error) {
        this.error = error
        useNotificationsStore().errorFrom(error, 'Не удалось загрузить сообщения чата')
        throw error
      } finally {
        this.loading = { ...this.loading, messages: false }
      }
    },

    async ensureDirectConversation(recipientEmail) {
      const currentUser = getCurrentUser(useAuthStore())
      const existing = this.conversations.find(
        (conversation) =>
          conversation.type === 'direct' &&
          conversation.members.some((member) => member.email === recipientEmail),
      )

      if (existing) {
        this.activeConversationId = existing.id
        return existing
      }

      try {
        const authStore = useAuthStore()
        const api = getApi(authStore)
        const response = await api.post('/chat/conversations/direct', {
          email: recipientEmail,
        })
        const conversation = normalizeChatConversation(response.data, currentUser.email || '')
        upsertConversation(this, conversation, currentUser.email || '')
        this.activeConversationId = conversation.id
        return conversation
      } catch (error) {
        this.error = error
        useNotificationsStore().errorFrom(error, 'Не удалось создать прямой диалог')
        throw error
      }
    },

    async createGroupConversation({ title, memberEmails = [] } = {}) {
      try {
        const authStore = useAuthStore()
        const api = getApi(authStore)
        const currentUserEmail = getCurrentUser(authStore).email || ''
        const response = await api.post('/chat/conversations/group', {
          title,
          member_emails: memberEmails,
        })
        const conversation = normalizeChatConversation(response.data, currentUserEmail)
        upsertConversation(this, conversation, currentUserEmail)
        this.activeConversationId = conversation.id
        return conversation
      } catch (error) {
        this.error = error
        useNotificationsStore().errorFrom(error, 'Не удалось создать группу')
        throw error
      }
    },

    async renameGroupConversation({ conversationId, title }) {
      if (!conversationId || !title) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const currentUserEmail = getCurrentUser(authStore).email || ''
      const response = await api.patch(`/chat/conversations/group/${conversationId}`, {
        title,
      })
      const conversation = normalizeChatConversation(response.data, currentUserEmail)
      upsertConversation(this, conversation, currentUserEmail)
      return conversation
    },

    async addGroupMembers({ conversationId, memberEmails = [] }) {
      if (!conversationId || memberEmails.length === 0) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const currentUserEmail = getCurrentUser(authStore).email || ''
      const response = await api.post(`/chat/conversations/group/${conversationId}/members`, {
        emails: memberEmails,
      })
      const conversation = normalizeChatConversation(response.data, currentUserEmail)
      upsertConversation(this, conversation, currentUserEmail)
      return conversation
    },

    async removeGroupMembers({ conversationId, memberEmails = [] }) {
      if (!conversationId || memberEmails.length === 0) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const currentUserEmail = getCurrentUser(authStore).email || ''
      const response = await api.delete(`/chat/conversations/group/${conversationId}/members`, {
        data: {
          emails: memberEmails,
        },
      })
      const conversation = normalizeChatConversation(response.data, currentUserEmail)
      upsertConversation(this, conversation, currentUserEmail)
      return conversation
    },

    async setActiveConversation(conversationOrId) {
      const conversationId =
        typeof conversationOrId === 'object' && conversationOrId
          ? conversationOrId.id
          : conversationOrId

      if (!conversationId) {
        this.activeConversationId = null
        return null
      }

      this.activeConversationId = conversationId

      if (!this.messagesByConversation[conversationId]) {
        await this.loadMessages(conversationId)
      }

      const messages = this.messagesByConversation[conversationId] || []
      const latestMessage = messages[messages.length - 1]
      if (latestMessage) {
        this.markRead({ conversationId, messageId: latestMessage.id })
      }

      return this.activeConversation
    },

    async loadInitialState() {
      await Promise.all([this.loadUsers(), this.loadConversations()])
      this.connect()
      return this
    },

    async bootstrap() {
      return this.loadInitialState()
    },

    connect() {
      const authStore = useAuthStore()
      const token = authStore.token

      if (!token) {
        this.error = new Error('Missing auth token')
        return null
      }

      if (this.socket && this.socket.readyState === getSocketOpenState()) {
        return this.socket
      }

      this.manualDisconnect = false
      this.socketStatus = 'connecting'

      const socket = new WebSocket(buildChatWebSocketUrl(getCurrentOrigin(), token))
      this.socket = socket

      socket.addEventListener('open', () => {
        this.socketStatus = 'connected'
        this.reconnectAttempts = 0
      })

      socket.addEventListener('message', (event) => {
        this.handleSocketEvent(event.data)
      })

      socket.addEventListener('error', (event) => {
        this.socketStatus = 'error'
        const error = event?.error || new Error('Chat websocket error')
        this.error = error
        useNotificationsStore().errorFrom(error, 'Ошибка подключения к чату')
      })

      socket.addEventListener('close', () => {
        this.socketStatus = 'disconnected'
        this.socket = null

        if (this.manualDisconnect || !authStore.token) {
          return
        }

        this.socketStatus = 'reconnecting'
        const delay = getChatReconnectDelayMs(this.reconnectAttempts)
        this.reconnectAttempts += 1

        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
        }

        this.reconnectTimer = setTimeout(() => {
          this.reconnectTimer = null
          this.connect()
        }, delay)
      })

      return socket
    },

    disconnect() {
      this.manualDisconnect = true

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }

      if (this.socket) {
        this.socket.close()
      }

      this.socket = null
      this.socketStatus = 'disconnected'
    },

    setSoundEnabled(enabled) {
      this.soundEnabled = setChatSoundEnabled(Boolean(enabled))
      if (this.soundEnabled) {
        playChatNotificationSound({ volume: 0.04, durationMs: 80 })
      }
      return this.soundEnabled
    },

    sendMessage({ conversationId, recipientEmail, text }) {
      const authStore = useAuthStore()
      const currentUser = getCurrentUser(authStore)
      const socket = this.socket || this.connect()

      if (!socket) {
        return false
      }

      return sendSocketEnvelope(socket, 'send_message', {
        conversation_id: conversationId || '',
        recipient_email: recipientEmail || '',
        sender_email: currentUser.email || '',
        sender_login: currentUser.login || '',
        text: text || '',
      })
    },

    markRead({ conversationId, messageId }) {
      const targetConversationId = conversationId || this.activeConversationId
      if (!targetConversationId) {
        return false
      }

      const socket = this.socket || this.connect()
      if (!socket) {
        return false
      }

      const messages = this.messagesByConversation[targetConversationId] || []
      const targetMessageId = messageId || messages[messages.length - 1]?.id

      if (!targetMessageId) {
        return false
      }

      return sendSocketEnvelope(socket, 'mark_read', {
        conversation_id: targetConversationId,
        message_id: targetMessageId,
      })
    },

    handleSocketEvent(payload) {
      const authStore = useAuthStore()
      const currentUserEmail = authStore.user?.email || ''
      const rawPayload =
        typeof payload === 'string'
          ? payload
          : typeof payload?.data === 'string'
            ? payload.data
            : payload

      let envelope
      try {
        envelope = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload
      } catch (error) {
        this.error = error
        useNotificationsStore().errorFrom(error, 'Не удалось разобрать событие чата')
        return
      }

      if (!envelope) {
        return
      }

      const shouldNotify = shouldNotifyIncomingChatMessage(envelope, {
        currentUserEmail,
        activeConversationId: this.activeConversationId,
      })

      applyChatSocketEvent(this, envelope, currentUserEmail)

      if (shouldNotify) {
        const notice = buildIncomingChatNotice(envelope)
        useNotificationsStore().info(`${notice.title}. ${notice.message}`, { duration: 7000 })

        if (this.soundEnabled) {
          playChatNotificationSound()
        }
      }
    },

    handleSocketEnvelope(envelope) {
      this.handleSocketEvent(envelope)
    },

    async refreshConversation(conversationId) {
      await this.loadMessages(conversationId)
      await this.loadConversations()
    },

    patchConversationFromEvent(conversation, members = []) {
      const authStore = useAuthStore()
      const currentUserEmail = authStore.user?.email || ''
      const normalized = normalizeChatConversation(
        { ...conversation, members },
        currentUserEmail,
      )
      upsertConversation(this, normalized, currentUserEmail)
      return normalized
    },

    replaceConversationMessages(conversationId, messages = []) {
      this.messagesByConversation[conversationId] = normalizeChatMessages(messages)
    },
  },
})
