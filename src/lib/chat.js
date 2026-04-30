const toArray = (value) => (Array.isArray(value) ? value : [])

const normalizeString = (value) => (value == null ? '' : String(value))

const normalizeIso = (value) => (value ? String(value) : null)

export const CHAT_TYPING_TTL_MS = 6000

const sortByDateThenId = (left, right) => {
  const leftTime = left.lastMessageAt || left.updatedAt || left.createdAt || ''
  const rightTime = right.lastMessageAt || right.updatedAt || right.createdAt || ''

  if (leftTime !== rightTime) {
    return rightTime.localeCompare(leftTime)
  }

  return normalizeString(left.id).localeCompare(normalizeString(right.id))
}

const sortMessages = (left, right) => {
  const leftTime = normalizeString(left.createdAt)
  const rightTime = normalizeString(right.createdAt)

  if (leftTime !== rightTime) {
    return leftTime.localeCompare(rightTime)
  }

  return normalizeString(left.id).localeCompare(normalizeString(right.id))
}

const normalizeParticipant = (participant = {}) => ({
  conversationId: normalizeString(participant.conversation_id ?? participant.conversationId),
  email: normalizeString(participant.email),
  login: normalizeString(participant.login),
  lastReadMessageId: normalizeString(
    participant.last_read_message_id ?? participant.lastReadMessageId,
  ),
})

const normalizeReceipt = (receipt = {}) => ({
  email: normalizeString(receipt.email),
  login: normalizeString(receipt.login),
  at: normalizeIso(receipt.at),
})

const normalizeChatPresence = (presence = {}) => ({
  online: Boolean(presence.online),
  onlineCount: Number(presence.online_count ?? presence.onlineCount ?? 0),
  lastActiveAt: normalizeIso(presence.last_active_at ?? presence.lastActiveAt),
  lastSeenAt: normalizeIso(presence.last_seen_at ?? presence.lastSeenAt),
})

export const normalizeChatDraft = (draft = {}) => ({
  text: normalizeString(draft.text),
  updatedAt: normalizeIso(draft.updated_at ?? draft.updatedAt),
})

export const getChatDraftPreview = (conversation = {}) => {
  const text = normalizeString(conversation.draft?.text).trim()
  return text ? `Черновик: ${text}` : ''
}

export const normalizeChatTypingUser = (user = {}) => ({
  email: normalizeString(user.email ?? user.user_email ?? user.userEmail),
  login: normalizeString(user.login ?? user.user_login ?? user.userLogin),
  startedAt: normalizeIso(user.started_at ?? user.startedAt),
  expiresAt: normalizeIso(user.expires_at ?? user.expiresAt),
})

const normalizeChatAudio = (audio = null) => {
  if (!audio) {
    return null
  }

  return {
    id: normalizeString(audio.id),
    mimeType: normalizeString(audio.mime_type ?? audio.mimeType),
    sizeBytes: Number(audio.size_bytes ?? audio.sizeBytes ?? 0),
    durationSeconds: Number(audio.duration_seconds ?? audio.durationSeconds ?? 0),
    consumed: Boolean(audio.consumed),
    consumedAt: normalizeIso(audio.consumed_at ?? audio.consumedAt),
    consumedByEmail: normalizeString(audio.consumed_by_email ?? audio.consumedByEmail),
    consumedByLogin: normalizeString(audio.consumed_by_login ?? audio.consumedByLogin),
    expiresAt: normalizeIso(audio.expires_at ?? audio.expiresAt),
    expired: Boolean(audio.expired),
    expiredAt: normalizeIso(audio.expired_at ?? audio.expiredAt),
  }
}

const normalizeChatImage = (image = null) => {
  if (!image) {
    return null
  }

  return {
    id: normalizeString(image.id),
    mimeType: normalizeString(image.mime_type ?? image.mimeType),
    sizeBytes: Number(image.size_bytes ?? image.sizeBytes ?? 0),
    consumed: Boolean(image.consumed),
    consumedAt: normalizeIso(image.consumed_at ?? image.consumedAt),
    consumedByEmail: normalizeString(image.consumed_by_email ?? image.consumedByEmail),
    consumedByLogin: normalizeString(image.consumed_by_login ?? image.consumedByLogin),
    expiresAt: normalizeIso(image.expires_at ?? image.expiresAt),
    expired: Boolean(image.expired),
    expiredAt: normalizeIso(image.expired_at ?? image.expiredAt),
  }
}

const normalizeChatFile = (file = null) => {
  if (!file) {
    return null
  }

  return {
    id: normalizeString(file.id),
    filename: normalizeString(file.filename || file.name),
    mimeType: normalizeString(file.mime_type ?? file.mimeType),
    sizeBytes: Number(file.size_bytes ?? file.sizeBytes ?? 0),
    consumed: Boolean(file.consumed),
    consumedAt: normalizeIso(file.consumed_at ?? file.consumedAt),
    consumedByEmail: normalizeString(file.consumed_by_email ?? file.consumedByEmail),
    consumedByLogin: normalizeString(file.consumed_by_login ?? file.consumedByLogin),
    expiresAt: normalizeIso(file.expires_at ?? file.expiresAt),
    expired: Boolean(file.expired),
    expiredAt: normalizeIso(file.expired_at ?? file.expiredAt),
  }
}

const normalizeReplyPreview = (reply = null) => {
  if (!reply) {
    return null
  }

  return {
    id: normalizeString(reply.id),
    type: normalizeString(reply.type || 'text'),
    text: normalizeString(reply.text),
    senderEmail: normalizeString(reply.sender_email ?? reply.senderEmail),
    senderLogin: normalizeString(reply.sender_login ?? reply.senderLogin),
  }
}

const normalizeCallParticipant = (participant = {}) => ({
  email: normalizeString(participant.email),
  login: normalizeString(participant.login),
  joinedAt: normalizeIso(participant.joined_at ?? participant.joinedAt),
  muted: Boolean(participant.muted),
})

export const normalizeChatCall = (call = null) => {
  if (!call) {
    return null
  }

  return {
    id: normalizeString(call.id ?? call.call_id ?? call.callId),
    conversationId: normalizeString(call.conversation_id ?? call.conversationId),
    messageId: normalizeString(call.message_id ?? call.messageId),
    startedByEmail: normalizeString(call.started_by_email ?? call.startedByEmail),
    startedByLogin: normalizeString(call.started_by_login ?? call.startedByLogin),
    startedAt: normalizeIso(call.started_at ?? call.startedAt),
    endedAt: normalizeIso(call.ended_at ?? call.endedAt),
    joinable: Boolean(call.joinable ?? !normalizeIso(call.ended_at ?? call.endedAt)),
    maxParticipants: Number(call.max_participants ?? call.maxParticipants ?? 4),
    participantCount: Number(
      call.participant_count ?? call.participantCount ?? toArray(call.participants).length,
    ),
    participants: toArray(call.participants).map(normalizeCallParticipant),
  }
}

const normalizeReaction = (reaction = {}) => ({
  emoji: normalizeString(reaction.emoji),
  userEmail: normalizeString(reaction.user_email ?? reaction.userEmail),
  userLogin: normalizeString(reaction.user_login ?? reaction.userLogin),
  createdAt: normalizeIso(reaction.created_at ?? reaction.createdAt),
  updatedAt: normalizeIso(reaction.updated_at ?? reaction.updatedAt),
})

const dedupeReceipts = (receipts = [], extra = []) => {
  const merged = []
  const seen = new Set()

  for (const receipt of [...toArray(receipts), ...toArray(extra)]) {
    const normalized = normalizeReceipt(receipt)
    if (!normalized.email || seen.has(normalized.email)) {
      continue
    }

    seen.add(normalized.email)
    merged.push(normalized)
  }

  return merged
}

export const normalizeChatUser = (user = {}) => ({
  email: normalizeString(user.email),
  login: normalizeString(user.login),
  isAdmin: Boolean(user.is_admin ?? user.isAdmin),
  aliceConfigured: Boolean(user.alice_configured ?? user.aliceConfigured),
  aliceEnabled: Boolean(user.alice_enabled ?? user.aliceEnabled ?? true),
})

export const normalizeChatMember = (member = {}) => ({
  email: normalizeString(member.email),
  login: normalizeString(member.login),
  role: normalizeString(member.role || 'member'),
  lastReadMessageId: normalizeString(member.last_read_message_id ?? member.lastReadMessageId),
  joinedAt: normalizeIso(member.joined_at ?? member.joinedAt),
})

const normalizeChatPermissions = (permissions = {}) => ({
  canRename: Boolean(permissions.can_rename ?? permissions.canRename),
  canAddMembers: Boolean(permissions.can_add_members ?? permissions.canAddMembers),
  canRemoveMembers: Boolean(permissions.can_remove_members ?? permissions.canRemoveMembers),
  canManageRoles: Boolean(permissions.can_manage_roles ?? permissions.canManageRoles),
  canDelete: Boolean(permissions.can_delete ?? permissions.canDelete),
  canLeave: Boolean(permissions.can_leave ?? permissions.canLeave),
})

export const getChatConversationTitle = (conversation = {}, currentUserEmail = '') => {
  const type = normalizeString(conversation.type)
  const explicitTitle = normalizeString(conversation.title)

  if (type !== 'direct') {
    return explicitTitle || 'Group'
  }

  const members = toArray(conversation.members).map(normalizeChatMember)
  const current = normalizeString(currentUserEmail)
  const other = members.find((member) => member.email && member.email !== current) || members[0]

  return normalizeString(other?.login || other?.email || explicitTitle || 'Direct')
}

export const normalizeChatConversation = (conversation = {}, currentUserEmail = '') => {
  const members = toArray(conversation.members).map(normalizeChatMember)

  return {
    id: normalizeString(conversation.id),
    type: normalizeString(conversation.type || 'group'),
    title: getChatConversationTitle({ ...conversation, members }, currentUserEmail),
    rawTitle: normalizeString(conversation.title),
    createdByEmail: normalizeString(conversation.created_by_email ?? conversation.createdByEmail),
    createdByLogin: normalizeString(conversation.created_by_login ?? conversation.createdByLogin),
    createdAt: normalizeIso(conversation.created_at ?? conversation.createdAt),
    updatedAt: normalizeIso(conversation.updated_at ?? conversation.updatedAt),
    lastMessageId: normalizeString(conversation.last_message_id ?? conversation.lastMessageID),
    lastMessageText: normalizeString(
      conversation.last_message_text ?? conversation.lastMessageText,
    ),
    lastMessageAt: normalizeIso(conversation.last_message_at ?? conversation.lastMessageAt),
    pinnedMessageId: normalizeString(
      conversation.pinned_message_id ?? conversation.pinnedMessageId,
    ),
    pinnedMessage: normalizeReplyPreview(conversation.pinned_message ?? conversation.pinnedMessage),
    lastReadMessageId: normalizeString(
      conversation.last_read_message_id ?? conversation.lastReadMessageId,
    ),
    unreadCount: Number(conversation.unread_count ?? conversation.unreadCount ?? 0),
    currentUserRole: normalizeString(
      conversation.current_user_role ?? conversation.currentUserRole,
    ),
    permissions: normalizeChatPermissions(conversation.permissions ?? conversation),
    presence: normalizeChatPresence(conversation.presence ?? {}),
    draft: normalizeChatDraft(conversation.draft ?? {}),
    members,
  }
}

const hasOwnField = (item = {}, fields = []) =>
  Boolean(
    item &&
      typeof item === 'object' &&
      fields.some((field) => Object.prototype.hasOwnProperty.call(item, field)),
  )

const hasConversationUnreadCount = (conversation = {}) =>
  hasOwnField(conversation, ['unread_count', 'unreadCount'])

const hasConversationLastReadMessageId = (conversation = {}) =>
  hasOwnField(conversation, ['last_read_message_id', 'lastReadMessageId'])

export const normalizeChatMessage = (message = {}) => ({
  id: normalizeString(message.id),
  conversationId: normalizeString(message.conversation_id ?? message.conversationId),
  clientMessageId: normalizeString(message.client_message_id ?? message.clientMessageId),
  type: normalizeString(
    message.type ||
      (message.audio ? 'audio' : message.image ? 'image' : message.file ? 'file' : 'text'),
  ),
  senderEmail: normalizeString(message.sender_email ?? message.senderEmail),
  senderLogin: normalizeString(message.sender_login ?? message.senderLogin),
  text: normalizeString(message.text),
  favorite: Boolean(message.favorite ?? message.is_favorite ?? message.isFavorite),
  forwardedFrom: normalizeForwardedFrom(message.forwarded_from ?? message.forwardedFrom),
  aliceAnnounced: Boolean(message.alice_announced ?? message.aliceAnnounced),
  createdAt: normalizeIso(message.created_at ?? message.createdAt),
  updatedAt: normalizeIso(message.updated_at ?? message.updatedAt),
  editedAt: normalizeIso(message.edited_at ?? message.editedAt),
  replyToMessageId: normalizeString(message.reply_to_message_id ?? message.replyToMessageId),
  replyPreview: normalizeReplyPreview(message.reply_preview ?? message.replyPreview),
  deliveredTo: toArray(message.delivered_to ?? message.deliveredTo).map(normalizeReceipt),
  readBy: toArray(message.read_by ?? message.readBy).map(normalizeReceipt),
  deliveryStatus: normalizeMessageDeliveryStatus(message),
  deliveredToCount: normalizeMessageReceiptCount(message, 'delivered'),
  readByCount: normalizeMessageReceiptCount(message, 'read'),
  errorMessage: normalizeString(message.error_message ?? message.errorMessage),
  reactions: toArray(message.reactions).map(normalizeReaction),
  audio: normalizeChatAudio(message.audio),
  image: normalizeChatImage(message.image),
  file: normalizeChatFile(message.file),
  call: normalizeChatCall(message.call),
})

function normalizeForwardedFrom(forwardedFrom = null) {
  if (!forwardedFrom || typeof forwardedFrom !== 'object') {
    return null
  }

  return {
    conversationId: normalizeString(
      forwardedFrom.original_conversation_id ??
        forwardedFrom.originalConversationId ??
        forwardedFrom.conversation_id ??
        forwardedFrom.conversationId,
    ),
    messageId: normalizeString(
      forwardedFrom.original_message_id ??
        forwardedFrom.originalMessageId ??
        forwardedFrom.message_id ??
        forwardedFrom.messageId,
    ),
    senderEmail: normalizeString(
      forwardedFrom.original_sender_email ??
        forwardedFrom.originalSenderEmail ??
        forwardedFrom.sender_email ??
        forwardedFrom.senderEmail,
    ),
    senderLogin: normalizeString(
      forwardedFrom.original_sender_login ??
        forwardedFrom.originalSenderLogin ??
        forwardedFrom.sender_login ??
        forwardedFrom.senderLogin,
    ),
  }
}

const normalizeMessageReceiptCount = (message = {}, kind = 'delivered') => {
  const snakeKey = kind === 'read' ? 'read_by_count' : 'delivered_to_count'
  const camelKey = kind === 'read' ? 'readByCount' : 'deliveredToCount'
  const fallback =
    kind === 'read'
      ? (message.read_by ?? message.readBy)
      : (message.delivered_to ?? message.deliveredTo)
  return Number(message[snakeKey] ?? message[camelKey] ?? toArray(fallback).length)
}

const normalizeMessageDeliveryStatus = (message = {}) => {
  const explicit = normalizeString(message.delivery_status ?? message.deliveryStatus)
  if (explicit) {
    return explicit
  }

  if (normalizeMessageReceiptCount(message, 'read') > 0) {
    return 'read'
  }

  if (normalizeMessageReceiptCount(message, 'delivered') > 0) {
    return 'delivered'
  }

  return 'sent'
}

export const normalizeChatUsers = (users = []) => toArray(users).map(normalizeChatUser)

export const normalizeChatConversations = (conversations = [], currentUserEmail = '') =>
  toArray(conversations).map((conversation) =>
    normalizeChatConversation(conversation, currentUserEmail),
  )

export const normalizeChatMessages = (messages = []) =>
  toArray(messages)
    .map((message) => normalizeChatMessage(message))
    .sort(sortMessages)

export const normalizeChatMessagesResponse = (response = []) => {
  if (Array.isArray(response)) {
    return {
      messages: normalizeChatMessages(response),
      lastReadMessageId: '',
    }
  }

  return {
    messages: normalizeChatMessages(response.messages),
    lastReadMessageId: normalizeString(response.last_read_message_id ?? response.lastReadMessageId),
  }
}

export const buildChatWebSocketUrl = (origin, token) => {
  const url = new URL('/chat/ws', origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('token', token)
  return url.toString()
}

export const getChatReconnectDelayMs = (attempt) => {
  void attempt
  return 2000
}

const ensureConversationCollection = (state) => {
  if (!Array.isArray(state.conversations)) {
    state.conversations = []
  }

  if (!state.messagesByConversation || typeof state.messagesByConversation !== 'object') {
    state.messagesByConversation = {}
  }

  if (!Array.isArray(state.users)) {
    state.users = []
  }

  if (!state.activeCallsByConversation || typeof state.activeCallsByConversation !== 'object') {
    state.activeCallsByConversation = {}
  }

  if (!state.activeTypersByConversation || typeof state.activeTypersByConversation !== 'object') {
    state.activeTypersByConversation = {}
  }

  if (state.activeCall === undefined) {
    state.activeCall = null
  }
}

const upsertConversation = (state, conversation, currentUserEmail) => {
  ensureConversationCollection(state)

  const normalized = normalizeChatConversation(conversation, currentUserEmail)
  const index = state.conversations.findIndex((item) => item.id === normalized.id)

  if (index === -1) {
    state.conversations.push(normalized)
  } else {
    const existingConversation = state.conversations[index]
    const existingDraft = existingConversation.draft || {}
    const nextDraft =
      normalized.draft?.text || normalized.draft?.updatedAt ? normalized.draft : existingDraft
    state.conversations[index] = {
      ...existingConversation,
      ...normalized,
      lastReadMessageId: hasConversationLastReadMessageId(conversation)
        ? normalized.lastReadMessageId
        : existingConversation.lastReadMessageId,
      unreadCount: hasConversationUnreadCount(conversation)
        ? normalized.unreadCount
        : existingConversation.unreadCount,
      draft: nextDraft,
    }
  }

  state.conversations.sort(sortByDateThenId)
  return normalized
}

const setConversationUnreadCount = (state, conversationId, unreadCount = 0) => {
  const normalizedConversationId = normalizeString(conversationId)
  const index = state.conversations.findIndex(
    (conversation) => conversation.id === normalizedConversationId,
  )
  if (index === -1) {
    return
  }

  state.conversations[index] = {
    ...state.conversations[index],
    unreadCount: Math.max(0, Number(unreadCount) || 0),
  }
}

const incrementConversationUnreadCount = (state, conversationId) => {
  const normalizedConversationId = normalizeString(conversationId)
  const conversation = state.conversations.find((item) => item.id === normalizedConversationId)
  setConversationUnreadCount(
    state,
    normalizedConversationId,
    Number(conversation?.unreadCount || 0) + 1,
  )
}

const countUnreadMessagesAfter = (messages = [], lastReadMessageId = '', currentUserEmail = '') => {
  const items = Array.isArray(messages) ? messages : []
  const readIndex = lastReadMessageId
    ? items.findIndex((message) => message?.id === lastReadMessageId)
    : -1

  return items.slice(readIndex + 1).filter((message) => {
    return message?.id && message.senderEmail !== currentUserEmail
  }).length
}

const canReconcilePersistedMessage = (localMessage, persistedMessage) =>
  Boolean(
    localMessage?.clientMessageId &&
      persistedMessage?.clientMessageId &&
      localMessage.clientMessageId === persistedMessage.clientMessageId &&
      persistedMessage.id &&
      persistedMessage.createdAt &&
      persistedMessage.senderEmail &&
      localMessage.senderEmail === persistedMessage.senderEmail,
  )

const upsertMessage = (state, message) => {
  ensureConversationCollection(state)

  const normalized = normalizeChatMessage(message)
  const conversationId = normalized.conversationId

  if (!conversationId) {
    return normalized
  }

  const currentMessages = state.messagesByConversation[conversationId] || []
  const index = currentMessages.findIndex((item) => item.id === normalized.id)
  const clientIndex = currentMessages.findIndex((item) =>
    canReconcilePersistedMessage(item, normalized),
  )

  if (index === -1) {
    if (clientIndex === -1) {
      state.messagesByConversation[conversationId] = [...currentMessages, normalized].sort(
        sortMessages,
      )
    } else {
      const nextMessages = [...currentMessages]
      nextMessages[clientIndex] = {
        ...nextMessages[clientIndex],
        ...normalized,
      }
      state.messagesByConversation[conversationId] = nextMessages.sort(sortMessages)
    }
  } else {
    const nextMessages = [...currentMessages]
    nextMessages[index] = {
      ...nextMessages[index],
      ...normalized,
    }
    state.messagesByConversation[conversationId] = nextMessages.sort(sortMessages)
  }

  return normalized
}

const mergeReceipts = (existing = [], receipts = []) => dedupeReceipts(existing, receipts)

const upsertReadReceipt = (message, receipt) => {
  const nextReceipt = normalizeReceipt(receipt)
  if (!nextReceipt.email) {
    return message
  }

  return {
    ...message,
    readBy: mergeReceipts(message.readBy, [nextReceipt]),
  }
}

const removeMessagesByIds = (messages = [], removedIds = []) => {
  if (!removedIds.length) {
    return messages
  }

  const removed = new Set(removedIds)
  return messages.filter((message) => !removed.has(message.id))
}

const clearReplyPreviewIfNeeded = (message = {}, removedIds = []) => {
  if (!removedIds.includes(message.replyToMessageId)) {
    return message
  }

  return {
    ...message,
    replyPreview: null,
  }
}

export const pruneExpiredChatTypers = (state, now = Date.now(), ttlMs = CHAT_TYPING_TTL_MS) => {
  ensureConversationCollection(state)
  const nowMs = Number(now) || Date.now()
  for (const [conversationId, typers] of Object.entries(state.activeTypersByConversation)) {
    state.activeTypersByConversation[conversationId] = toArray(typers).filter((typer) => {
      const expiresAtMs = typer.expiresAt ? Date.parse(typer.expiresAt) : Number.NaN
      if (Number.isFinite(expiresAtMs)) {
        return expiresAtMs > nowMs
      }
      const startedAtMs = typer.startedAt ? Date.parse(typer.startedAt) : Number.NaN
      return Number.isFinite(startedAtMs) && startedAtMs + ttlMs > nowMs
    })
  }
  return state
}

const withTypingExpiry = (user, now = Date.now(), ttlMs = CHAT_TYPING_TTL_MS) => {
  const startedAt = user.startedAt || new Date(now).toISOString()
  const startedAtMs = Date.parse(startedAt)
  const baseMs = Number.isFinite(startedAtMs) ? startedAtMs : now
  return {
    ...user,
    startedAt,
    expiresAt: new Date(baseMs + ttlMs).toISOString(),
  }
}

export const applyChatSocketEvent = (state, envelope, currentUserEmail = '') => {
  ensureConversationCollection(state)

  if (!envelope) {
    return state
  }

  const event = envelope.event || envelope.type
  const data = envelope.data || {}

  const applyCallState = (callPayload) => {
    const normalized = normalizeChatCall(callPayload)
    if (!normalized?.conversationId) {
      return null
    }

    state.activeCallsByConversation[normalized.conversationId] = normalized
    if (normalized.participants.some((participant) => participant.email === currentUserEmail)) {
      state.activeCall = normalized
    }
    return normalized
  }

  const clearCallState = (callPayload, conversationPayload) => {
    const normalized = normalizeChatCall(callPayload)
    const conversationId =
      normalized?.conversationId ||
      normalizeString(conversationPayload?.id ?? conversationPayload?.conversation_id)

    if (conversationId) {
      state.activeCallsByConversation[conversationId] = null
    }
    if (state.activeCall?.id && normalized?.id && state.activeCall.id === normalized.id) {
      state.activeCall = null
    } else if (conversationId && state.activeCall?.conversationId === conversationId) {
      state.activeCall = null
    }
  }

  if (event === 'message_persisted') {
    const conversationPayload = data.conversation
      ? { ...data.conversation, members: data.members ?? data.conversation.members }
      : null
    const incomingMessage = normalizeChatMessage(data.message || {})
    const previousMessages = incomingMessage.conversationId
      ? state.messagesByConversation[incomingMessage.conversationId] || []
      : []
    const isNewIncomingMessage = Boolean(
      incomingMessage.id &&
        incomingMessage.conversationId &&
        incomingMessage.senderEmail &&
        incomingMessage.senderEmail !== currentUserEmail &&
        !previousMessages.some((message) => message.id === incomingMessage.id),
    )

    if (data.conversation) {
      upsertConversation(state, conversationPayload, currentUserEmail)
    }

    if (data.message) {
      upsertMessage(state, data.message)
    }

    if (
      isNewIncomingMessage &&
      (!conversationPayload || !hasConversationUnreadCount(conversationPayload))
    ) {
      incrementConversationUnreadCount(state, incomingMessage.conversationId)
    }

    return state
  }

  if (event === 'message_read_updated') {
    const conversationPayload = data.conversation
      ? { ...data.conversation, members: data.members ?? data.conversation.members }
      : null
    if (data.conversation) {
      upsertConversation(state, conversationPayload, currentUserEmail)
    }

    const reader = normalizeChatUser(data.reader || {})
    const targetMessageId = normalizeString(data.message_id ?? data.messageId)
    const affectedMessageIds = toArray(data.affected_message_ids ?? data.affectedMessageIds)
      .map((value) => normalizeString(value))
      .filter(Boolean)

    if (data.message) {
      upsertMessage(state, data.message)
    }

    const conversationId = normalizeString(
      data.conversation_id ??
        data.conversationId ??
        data.conversation?.id ??
        data.message?.conversation_id ??
        data.message?.conversationId,
    )
    const currentMember = toArray(data.members ?? data.conversation?.members).find((member) => {
      const email = normalizeString(member?.email)
      return email && email === currentUserEmail
    })
    const currentReadMessageId = normalizeString(
      currentMember?.last_read_message_id ?? currentMember?.lastReadMessageId,
    )
    const readerIsCurrentUser = Boolean(reader.email && reader.email === currentUserEmail)
    const nextCurrentReadMessageId =
      currentReadMessageId || (readerIsCurrentUser ? targetMessageId : '')
    if (conversationId && nextCurrentReadMessageId) {
      state.lastReadMessageIdByConversation = {
        ...(state.lastReadMessageIdByConversation || {}),
        [conversationId]: nextCurrentReadMessageId,
      }
    }
    const messages = state.messagesByConversation[conversationId] || []
    const receipts = toArray(data.message?.read_by ?? data.message?.readBy).map(normalizeReceipt)
    const receipt = reader.email
      ? {
          email: reader.email,
          login: reader.login,
          at: receipts.find((item) => item.email === reader.email)?.at || null,
        }
      : null

    const idsToUpdate = affectedMessageIds.length ? affectedMessageIds : [targetMessageId]
    if (conversationId && receipt) {
      state.messagesByConversation[conversationId] = messages.map((message) => {
        if (!idsToUpdate.includes(message.id)) {
          return message
        }

        if (message.id === targetMessageId && data.message) {
          return {
            ...normalizeChatMessage(data.message),
            readBy: mergeReceipts(
              data.message.read_by ?? data.message.readBy,
              receipt ? [receipt] : [],
            ),
          }
        }

        return upsertReadReceipt(message, receipt)
      })
    }

    if (
      conversationId &&
      readerIsCurrentUser &&
      (!conversationPayload || !hasConversationUnreadCount(conversationPayload))
    ) {
      setConversationUnreadCount(
        state,
        conversationId,
        countUnreadMessagesAfter(
          state.messagesByConversation[conversationId] || [],
          nextCurrentReadMessageId,
          currentUserEmail,
        ),
      )
    }

    return state
  }

  if (event === 'message_delivered') {
    if (data.conversation) {
      upsertConversation(
        state,
        { ...data.conversation, members: data.members ?? data.conversation.members },
        currentUserEmail,
      )
    }

    if (data.message) {
      upsertMessage(state, data.message)
    }

    return state
  }

  if (event === 'message_updated') {
    if (data.conversation) {
      upsertConversation(
        state,
        { ...data.conversation, members: data.members ?? data.conversation.members },
        currentUserEmail,
      )
    }

    if (data.message) {
      upsertMessage(state, data.message)
    }

    return state
  }

  if (event === 'message_deleted') {
    const conversation = data.conversation
    if (conversation) {
      upsertConversation(
        state,
        { ...conversation, members: data.members ?? conversation.members },
        currentUserEmail,
      )
    }

    const conversationId = normalizeString(
      conversation?.id ?? data.conversation_id ?? data.conversationId,
    )
    const removedIds = [normalizeString(data.message_id ?? data.messageId)].filter(Boolean)
    if (conversationId && removedIds.length) {
      const existing = state.messagesByConversation[conversationId] || []
      state.messagesByConversation[conversationId] = removeMessagesByIds(existing, removedIds).map(
        (message) => clearReplyPreviewIfNeeded(message, removedIds),
      )
    }

    const affectedMessages = toArray(data.affected_messages ?? data.affectedMessages)
    for (const message of affectedMessages) {
      upsertMessage(state, message)
    }

    return state
  }

  if (event === 'conversation_updated') {
    const conversation = data.conversation
    if (conversation) {
      upsertConversation(
        state,
        { ...conversation, members: data.members ?? conversation.members },
        currentUserEmail,
      )
    }

    const conversationId = normalizeString(
      conversation?.id ?? data.conversation_id ?? data.conversationId,
    )
    const removedIds = toArray(data.removed_message_ids ?? data.removedMessageIds)
      .map((value) => normalizeString(value))
      .filter(Boolean)

    if (conversationId && removedIds.length) {
      state.messagesByConversation[conversationId] = removeMessagesByIds(
        state.messagesByConversation[conversationId] || [],
        removedIds,
      )
    }

    return state
  }

  if (event === 'presence_updated') {
    const conversationId = normalizeString(data.conversation_id ?? data.conversationId)
    const presence = normalizeChatPresence(data.presence || {})
    const index = state.conversations.findIndex(
      (conversation) => conversation.id === conversationId,
    )
    if (index !== -1) {
      state.conversations[index] = {
        ...state.conversations[index],
        presence,
      }
    }
    return state
  }

  if (event === 'typing_started' || event === 'typing_stopped') {
    pruneExpiredChatTypers(state)
    const conversationId = normalizeString(data.conversation_id ?? data.conversationId)
    const user = normalizeChatTypingUser(data.user || data)
    if (!conversationId || !user.email || user.email === currentUserEmail) {
      return state
    }
    const current = toArray(state.activeTypersByConversation[conversationId])
    if (event === 'typing_stopped') {
      state.activeTypersByConversation[conversationId] = current.filter(
        (typer) => typer.email !== user.email,
      )
      return state
    }
    const next = current.filter((typer) => typer.email !== user.email)
    state.activeTypersByConversation[conversationId] = [...next, withTypingExpiry(user)]
    return state
  }

  if (event === 'call_started' || event === 'call_updated') {
    if (data.conversation) {
      upsertConversation(
        state,
        { ...data.conversation, members: data.members ?? data.conversation.members },
        currentUserEmail,
      )
    }
    if (data.message) {
      upsertMessage(state, data.message)
    }
    applyCallState(data.call)
    return state
  }

  if (event === 'call_ended') {
    if (data.conversation) {
      upsertConversation(
        state,
        { ...data.conversation, members: data.members ?? data.conversation.members },
        currentUserEmail,
      )
    }
    if (data.message) {
      upsertMessage(state, data.message)
    }
    clearCallState(data.call, data.conversation)
    return state
  }

  if (event === 'pong') {
    state.socketStatus = 'connected'
  }

  if (event === 'error') {
    state.error = data.message || data.error || 'Chat error'
  }

  return state
}
