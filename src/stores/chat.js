import { defineStore } from 'pinia'
import {
  applyChatSocketEvent,
  buildChatWebSocketUrl,
  normalizeChatCall,
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
  isChatToastEnabled,
  playChatNotificationSound,
  setChatSoundEnabled,
  setChatToastEnabled,
  shouldNotifyIncomingChatMessage,
} from '../lib/chat-notifications.js'
import { buildAliceAnnouncementPayload } from '../lib/alice.js'
import { useAuthStore } from './auth.js'
import { useNotificationsStore } from './notifications.js'

const createLoadingState = () => ({
  users: false,
  conversations: false,
  messages: false,
  search: false,
})

const socketEnvelopeListeners = new Set()

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

const withTokenQuery = (path, token = '') => {
  if (!token) {
    return path
  }

  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}token=${encodeURIComponent(token)}`
}

const withTokenPath = (path, token = '') => {
  if (!token) {
    return path
  }

  return `${path}/${encodeURIComponent(token)}`
}

const normalizeSearchResults = (results = []) =>
  (Array.isArray(results) ? results : []).map((item) => ({
    conversationId: item?.conversation_id ?? item?.conversationId ?? '',
    conversationTitle: item?.conversation_title ?? item?.conversationTitle ?? '',
    messageId: item?.message_id ?? item?.messageId ?? '',
    senderEmail: item?.sender_email ?? item?.senderEmail ?? '',
    senderLogin: item?.sender_login ?? item?.senderLogin ?? '',
    text: item?.text ?? '',
  }))

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

const getSocketConnectingState = () =>
  typeof WebSocket !== 'undefined' && WebSocket.CONNECTING != null ? WebSocket.CONNECTING : 0

const latestPeerMessage = (messages = [], currentUserEmail = '') => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.senderEmail && message.senderEmail !== currentUserEmail) {
      return message
    }
  }

  return null
}

const markLatestPeerMessageRead = (state, socket, conversationId, currentUserEmail = '') => {
  const messageToRead = latestPeerMessage(
    state.messagesByConversation[conversationId] || [],
    currentUserEmail,
  )
  if (!messageToRead) {
    return false
  }

  return sendSocketEnvelope(socket, 'mark_read', {
    conversation_id: conversationId || '',
    message_id: messageToRead.id,
  })
}

const updateAudioMessage = (state, conversationId, messageId, patch = {}) => {
  const messages = ensureMessagesCollection(state, conversationId)
  const index = messages.findIndex((message) => message.id === messageId)
  if (index === -1) {
    return null
  }

  const nextMessage = {
    ...messages[index],
    audio: {
      ...(messages[index].audio || {}),
      ...patch,
    },
  }
  const nextMessages = [...messages]
  nextMessages[index] = nextMessage
  state.messagesByConversation[conversationId] = nextMessages
  return nextMessage
}

const updateImageMessage = (state, conversationId, messageId, patch = {}) => {
  const messages = ensureMessagesCollection(state, conversationId)
  const index = messages.findIndex((message) => message.id === messageId)
  if (index === -1) {
    return null
  }

  const nextMessage = {
    ...messages[index],
    image: {
      ...(messages[index].image || {}),
      ...patch,
    },
  }
  const nextMessages = [...messages]
  nextMessages[index] = nextMessage
  state.messagesByConversation[conversationId] = nextMessages
  return nextMessage
}

const replaceMessage = (state, conversationId, message) => {
  const normalized = normalizeChatMessage(message)
  const messages = ensureMessagesCollection(state, conversationId || normalized.conversationId)
  const index = messages.findIndex((item) => item.id === normalized.id)
  if (index === -1) {
    state.messagesByConversation[normalized.conversationId] = [...messages, normalized]
  } else {
    const nextMessages = [...messages]
    nextMessages[index] = {
      ...nextMessages[index],
      ...normalized,
    }
    state.messagesByConversation[normalized.conversationId] = nextMessages
  }

  const conversation = state.conversations.find((item) => item.id === normalized.conversationId)
  if (conversation) {
    if (conversation.lastMessageId === normalized.id) {
      conversation.lastMessageText = normalized.text
      conversation.lastMessageAt = normalized.createdAt
    }
    if (conversation.pinnedMessageId === normalized.id) {
      conversation.pinnedMessage = {
        id: normalized.id,
        type: normalized.type,
        text: normalized.text,
        senderEmail: normalized.senderEmail,
        senderLogin: normalized.senderLogin,
      }
    }
  }

  return normalized
}

const removeMessageLocally = (state, conversationId, messageId) => {
  const messages = ensureMessagesCollection(state, conversationId)
  const nextMessages = messages
    .filter((message) => message.id !== messageId)
    .map((message) =>
      message.replyToMessageId === messageId
        ? {
            ...message,
            replyPreview: null,
          }
        : message,
    )
  state.messagesByConversation[conversationId] = nextMessages

  const conversation = state.conversations.find((item) => item.id === conversationId)
  if (!conversation) {
    return true
  }

  if (conversation.pinnedMessageId === messageId) {
    conversation.pinnedMessageId = ''
    conversation.pinnedMessage = null
  }

  const lastMessage = nextMessages[nextMessages.length - 1] || null
  conversation.lastMessageId = lastMessage?.id || ''
  conversation.lastMessageText = lastMessage?.text || ''
  conversation.lastMessageAt = lastMessage?.createdAt || ''
  return true
}

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
    toastEnabled: isChatToastEnabled(),
    searchResults: [],
    lastSearchQuery: '',
    highlightedMessageId: '',
    callConfig: null,
    activeCallsByConversation: {},
    activeCall: null,
  }),

  getters: {
    activeConversation(state) {
      return (
        state.conversations.find(
          (conversation) => conversation.id === state.activeConversationId,
        ) || null
      )
    },

    activeConversationMessages(state) {
      if (!state.activeConversationId) {
        return []
      }

      return state.messagesByConversation[state.activeConversationId] || []
    },

    activeConversationMembers(state) {
      return (
        state.conversations.find((conversation) => conversation.id === state.activeConversationId)
          ?.members || []
      )
    },

    activeConversationCall(state) {
      if (!state.activeConversationId) {
        return null
      }

      return state.activeCallsByConversation[state.activeConversationId] || null
    },
  },

  actions: {
    addSocketEnvelopeListener(listener) {
      if (typeof listener !== 'function') {
        return () => {}
      }

      socketEnvelopeListeners.add(listener)
      return () => {
        socketEnvelopeListeners.delete(listener)
      }
    },

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

    async loadCallConfig(force = false) {
      if (this.callConfig && !force) {
        return this.callConfig
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const response = await api.get('/chat/calls/config')
      this.callConfig = {
        iceServers: Array.isArray(response.data?.ice_servers)
          ? response.data.ice_servers.map((server) => ({
              urls: Array.isArray(server?.urls) ? server.urls.filter(Boolean) : [],
              username: server?.username || '',
              credential: server?.credential || '',
            }))
          : [{ urls: ['stun:stun.l.google.com:19302'] }],
      }
      return this.callConfig
    },

    async loadConversationCall(conversationId) {
      if (!conversationId) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      try {
        const response = await api.get(`/chat/conversations/${conversationId}/call`)
        const call = normalizeChatCall(response.data)
        if (!call?.id) {
          this.activeCallsByConversation[conversationId] = null
          if (this.activeCall?.conversationId === conversationId) {
            this.activeCall = null
          }
          return null
        }
        this.activeCallsByConversation[conversationId] = call
        if (call?.participants?.some((participant) => participant.email === authStore.user?.email)) {
          this.activeCall = call
        }
        return call
      } catch (error) {
        if (error?.response?.status === 404) {
          this.activeCallsByConversation[conversationId] = null
          if (this.activeCall?.conversationId === conversationId) {
            this.activeCall = null
          }
          return null
        }
        throw error
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

    async deleteGroupConversation(conversationId) {
      if (!conversationId) {
        return false
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      await api.delete(`/chat/conversations/group/${conversationId}`)

      this.conversations = this.conversations.filter(
        (conversation) => conversation.id !== conversationId,
      )
      delete this.messagesByConversation[conversationId]
      if (this.activeConversationId === conversationId) {
        this.activeConversationId = null
      }

      return true
    },

    async announceOnAlice({
      conversationId,
      messageId = '',
      text = '',
      accountId = '',
      householdId = '',
      roomId = '',
      deviceId = '',
      voice = '',
    } = {}) {
      const payload = buildAliceAnnouncementPayload({
        conversationId,
        messageId,
        text,
        accountId,
        householdId,
        roomId,
        deviceId,
        voice,
      })

      if (!payload.conversation_id && !payload.text) {
        throw new Error('conversation_id or text is required')
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const response = await api.post('/alice/announce', payload)
      return response.data || null
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
      await this.loadConversationCall(conversationId)

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
      this.syncNotificationSettings(getCurrentUser(useAuthStore()))
      await Promise.all([this.loadUsers(), this.loadConversations(), this.loadCallConfig()])
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

      if (
        this.socket &&
        [getSocketConnectingState(), getSocketOpenState()].includes(this.socket.readyState)
      ) {
        return this.socket
      }

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer)
        this.reconnectTimer = null
      }

      this.manualDisconnect = false
      this.socketStatus = 'connecting'

      const socket = new WebSocket(buildChatWebSocketUrl(getCurrentOrigin(), token))
      this.socket = socket

      socket.addEventListener('open', () => {
        if (this.socket !== socket) {
          return
        }

        this.socketStatus = 'connected'
        this.reconnectAttempts = 0
        this.error = null
      })

      socket.addEventListener('message', (event) => {
        this.handleSocketEvent(event.data)
      })

      socket.addEventListener('error', (event) => {
        if (this.socket !== socket) {
          return
        }

        this.socketStatus = 'error'
        const error = event?.error || new Error('Chat websocket error. Reconnecting...')
        this.error = error

        if ([getSocketConnectingState(), getSocketOpenState()].includes(socket.readyState)) {
          socket.close()
        }
      })

      socket.addEventListener('close', () => {
        if (this.socket === socket) {
          this.socket = null
        }

        this.socketStatus = 'disconnected'

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

    setToastEnabled(enabled) {
      this.toastEnabled = setChatToastEnabled(Boolean(enabled))
      return this.toastEnabled
    },

    syncNotificationSettings(user = {}) {
      const settings = user?.notificationSettings || {}
      this.soundEnabled = setChatSoundEnabled(settings.soundEnabled ?? this.soundEnabled)
      this.toastEnabled = setChatToastEnabled(settings.toastEnabled ?? this.toastEnabled)
      return {
        soundEnabled: this.soundEnabled,
        toastEnabled: this.toastEnabled,
      }
    },

    sendMessage({ conversationId, recipientEmail, text, replyToMessageId, announceOnAlice = false }) {
      const authStore = useAuthStore()
      const currentUser = getCurrentUser(authStore)
      const socket = this.socket || this.connect()

      if (!socket) {
        return false
      }

      markLatestPeerMessageRead(this, socket, conversationId, currentUser.email || '')

      return sendSocketEnvelope(socket, 'send_message', {
        conversation_id: conversationId || '',
        recipient_email: recipientEmail || '',
        sender_email: currentUser.email || '',
        sender_login: currentUser.login || '',
        text: text || '',
        reply_to_message_id: replyToMessageId || '',
        announce_on_alice: Boolean(announceOnAlice),
      })
    },

    sendCallSignal(payload = {}) {
      const authStore = useAuthStore()
      const socket = this.socket || this.connect()
      if (!socket) {
        return false
      }

      return sendSocketEnvelope(socket, 'call_signal', {
        call_id: payload.callId || '',
        conversation_id: payload.conversationId || '',
        recipient_email: payload.recipientEmail || '',
        kind: payload.kind || '',
        payload: payload.payload || {},
        sender_email: authStore.user?.email || '',
        sender_login: authStore.user?.login || '',
      })
    },

    async startCall(conversationId) {
      if (!conversationId) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const response = await api.post(`/chat/conversations/${conversationId}/calls`)
      const call = normalizeChatCall(response.data)
      this.activeCallsByConversation[conversationId] = call
      this.activeCall = call
      return call
    },

    async joinCall({ conversationId, callId }) {
      if (!conversationId || !callId) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const response = await api.post(`/chat/conversations/${conversationId}/calls/${callId}/join`)
      const call = normalizeChatCall(response.data)
      this.activeCallsByConversation[conversationId] = call
      this.activeCall = call
      return call
    },

    async leaveCall({ conversationId, callId }) {
      if (!conversationId || !callId) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const response = await api.post(`/chat/conversations/${conversationId}/calls/${callId}/leave`)
      if (response.data?.ended) {
        this.activeCallsByConversation[conversationId] = null
        if (this.activeCall?.id === callId) {
          this.activeCall = null
        }
        if (response.data?.message) {
          replaceMessage(this, conversationId, response.data.message)
        }
        return null
      }

      const call = normalizeChatCall(response.data)
      this.activeCallsByConversation[conversationId] = call
      if (this.activeCall?.id === callId) {
        this.activeCall = call
      }
      return call
    },

    async endCall({ conversationId, callId }) {
      if (!conversationId || !callId) {
        return false
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const response = await api.post(`/chat/conversations/${conversationId}/calls/${callId}/end`)
      this.activeCallsByConversation[conversationId] = null
      if (this.activeCall?.id === callId) {
        this.activeCall = null
      }
      if (response.data?.message) {
        replaceMessage(this, conversationId, response.data.message)
      }
      return true
    },

    async setCallMuted({ conversationId, callId, muted }) {
      if (!conversationId || !callId) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const response = await api.put(`/chat/conversations/${conversationId}/calls/${callId}/mute`, {
        muted: Boolean(muted),
      })
      const call = normalizeChatCall(response.data)
      this.activeCallsByConversation[conversationId] = call
      if (this.activeCall?.id === callId) {
        this.activeCall = call
      }
      return call
    },

    async editMessage({ conversationId, messageId, text }) {
      if (!conversationId || !messageId || !String(text || '').trim()) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const response = await api.patch(`/chat/conversations/${conversationId}/messages/${messageId}`, {
        text: String(text).trim(),
      })
      return replaceMessage(this, conversationId, response.data)
    },

    async deleteMessage({ conversationId, messageId }) {
      if (!conversationId || !messageId) {
        return false
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      await api.delete(`/chat/conversations/${conversationId}/messages/${messageId}`)
      return removeMessageLocally(this, conversationId, messageId)
    },

    async setReaction({ conversationId, messageId, emoji }) {
      if (!conversationId || !messageId || !emoji) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const response = await api.put(
        `/chat/conversations/${conversationId}/messages/${messageId}/reaction`,
        { emoji },
      )
      return replaceMessage(this, conversationId, response.data)
    },

    async removeReaction({ conversationId, messageId }) {
      if (!conversationId || !messageId) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const response = await api.delete(
        `/chat/conversations/${conversationId}/messages/${messageId}/reaction`,
      )
      return replaceMessage(this, conversationId, response.data)
    },

    async pinMessage({ conversationId, messageId }) {
      if (!conversationId || !messageId) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const currentUserEmail = getCurrentUser(authStore).email || ''
      const response = await api.put(`/chat/conversations/${conversationId}/pin`, {
        message_id: messageId,
      })
      const conversation = normalizeChatConversation(response.data, currentUserEmail)
      upsertConversation(this, conversation, currentUserEmail)
      return conversation
    },

    async clearPin(conversationId) {
      if (!conversationId) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const currentUserEmail = getCurrentUser(authStore).email || ''
      const response = await api.delete(`/chat/conversations/${conversationId}/pin`)
      const conversation = normalizeChatConversation(response.data, currentUserEmail)
      upsertConversation(this, conversation, currentUserEmail)
      return conversation
    },

    async searchMessages(query) {
      const normalizedQuery = String(query || '').trim()
      this.lastSearchQuery = normalizedQuery
      if (!normalizedQuery) {
        this.searchResults = []
        return this.searchResults
      }

      this.loading = { ...this.loading, search: true }
      try {
        const authStore = useAuthStore()
        const api = getApi(authStore)
        const response = await api.get(`/chat/search?q=${encodeURIComponent(normalizedQuery)}`)
        this.searchResults = normalizeSearchResults(response.data)
        return this.searchResults
      } finally {
        this.loading = { ...this.loading, search: false }
      }
    },

    setHighlightedMessage(messageId = '') {
      this.highlightedMessageId = messageId || ''
      return this.highlightedMessageId
    },

    async sendAudioMessage({ conversationId, audioBlob, durationSeconds, announceOnAlice = false }) {
      if (!conversationId || !audioBlob) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const currentUser = getCurrentUser(authStore)
      const socket = this.socket || this.connect()
      if (socket) {
        markLatestPeerMessageRead(this, socket, conversationId, currentUser.email || '')
      }

      const form = new FormData()
      form.append('duration_seconds', String(Math.max(1, Math.round(Number(durationSeconds) || 1))))
      form.append('announce_on_alice', announceOnAlice ? 'true' : 'false')
      const file =
        typeof File !== 'undefined'
          ? new File([audioBlob], 'voice.webm', {
              type: audioBlob.type || 'audio/webm',
            })
          : audioBlob
      form.append('audio', file, 'voice.webm')

      const response = await api.post(withTokenPath(`/chat/conversations/${conversationId}/audio`, authStore.token), form, {
        headers: authStore.token
          ? {
              'X-Chat-Token': authStore.token,
            }
          : undefined,
      })
      const message = normalizeChatMessage(response.data)
      const messages = ensureMessagesCollection(this, conversationId)
      if (!messages.some((item) => item.id === message.id)) {
        this.messagesByConversation[conversationId] = [...messages, message]
      }
      return message
    },

    async consumeAudioMessage({ conversationId, messageId }) {
      if (!conversationId || !messageId) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const currentUser = getCurrentUser(authStore)
      try {
        const response = await api.get(
          `/chat/conversations/${conversationId}/messages/${messageId}/audio`,
          {
            responseType: 'blob',
          },
        )
        updateAudioMessage(this, conversationId, messageId, {
          consumed: true,
          consumedByEmail: currentUser.email || '',
          consumedByLogin: currentUser.login || '',
        })
        return response.data
      } catch (error) {
        if (error?.response?.status === 410) {
          await this.loadMessages(conversationId)
        }
        throw error
      }
    },

    async sendImageMessage({ conversationId, imageBlob, filename = 'image.png' }) {
      if (!conversationId || !imageBlob) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const currentUser = getCurrentUser(authStore)
      const socket = this.socket || this.connect()
      if (socket) {
        markLatestPeerMessageRead(this, socket, conversationId, currentUser.email || '')
      }

      const form = new FormData()
      const file =
        typeof File !== 'undefined'
          ? new File([imageBlob], filename, {
              type: imageBlob.type || 'image/png',
            })
          : imageBlob
      form.append('image', file, filename)

      const response = await api.post(withTokenPath(`/chat/conversations/${conversationId}/image`, authStore.token), form, {
        headers: authStore.token
          ? {
              'X-Chat-Token': authStore.token,
            }
          : undefined,
      })
      const message = normalizeChatMessage(response.data)
      const messages = ensureMessagesCollection(this, conversationId)
      if (!messages.some((item) => item.id === message.id)) {
        this.messagesByConversation[conversationId] = [...messages, message]
      }
      return message
    },

    async consumeImageMessage({ conversationId, messageId }) {
      if (!conversationId || !messageId) {
        return null
      }

      const authStore = useAuthStore()
      const api = getApi(authStore)
      const currentUser = getCurrentUser(authStore)
      try {
        const response = await api.get(
          `/chat/conversations/${conversationId}/messages/${messageId}/image`,
          {
            responseType: 'blob',
          },
        )
        updateImageMessage(this, conversationId, messageId, {
          consumed: true,
          consumedByEmail: currentUser.email || '',
          consumedByLogin: currentUser.login || '',
        })
        return response.data
      } catch (error) {
        if (error?.response?.status === 410) {
          await this.loadMessages(conversationId)
        }
        throw error
      }
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

      for (const listener of socketEnvelopeListeners) {
        try {
          listener(envelope)
        } catch (error) {
          console.error('chat socket listener failed', error)
        }
      }

      if (shouldNotify) {
        const notice = buildIncomingChatNotice(envelope)
        if (this.toastEnabled) {
          useNotificationsStore().chat(`${notice.title}. ${notice.message}`, { duration: 7000 })
        }

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
      const normalized = normalizeChatConversation({ ...conversation, members }, currentUserEmail)
      upsertConversation(this, normalized, currentUserEmail)
      return normalized
    },

    replaceConversationMessages(conversationId, messages = []) {
      this.messagesByConversation[conversationId] = normalizeChatMessages(messages)
    },
  },
})
