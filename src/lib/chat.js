const toArray = (value) => (Array.isArray(value) ? value : [])

const normalizeString = (value) => (value == null ? '' : String(value))

const normalizeIso = (value) => (value ? String(value) : null)

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
})

export const normalizeChatMember = (member = {}) => ({
  email: normalizeString(member.email),
  login: normalizeString(member.login),
  lastReadMessageId: normalizeString(member.last_read_message_id ?? member.lastReadMessageId),
  joinedAt: normalizeIso(member.joined_at ?? member.joinedAt),
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
    pinnedMessage: normalizeReplyPreview(
      conversation.pinned_message ?? conversation.pinnedMessage,
    ),
    unreadCount: Number(conversation.unread_count ?? conversation.unreadCount ?? 0),
    members,
  }
}

export const normalizeChatMessage = (message = {}) => ({
  id: normalizeString(message.id),
  conversationId: normalizeString(message.conversation_id ?? message.conversationId),
  type: normalizeString(message.type || (message.audio ? 'audio' : message.image ? 'image' : 'text')),
  senderEmail: normalizeString(message.sender_email ?? message.senderEmail),
  senderLogin: normalizeString(message.sender_login ?? message.senderLogin),
  text: normalizeString(message.text),
  createdAt: normalizeIso(message.created_at ?? message.createdAt),
  updatedAt: normalizeIso(message.updated_at ?? message.updatedAt),
  editedAt: normalizeIso(message.edited_at ?? message.editedAt),
  replyToMessageId: normalizeString(message.reply_to_message_id ?? message.replyToMessageId),
  replyPreview: normalizeReplyPreview(message.reply_preview ?? message.replyPreview),
  deliveredTo: toArray(message.delivered_to ?? message.deliveredTo).map(normalizeReceipt),
  readBy: toArray(message.read_by ?? message.readBy).map(normalizeReceipt),
  reactions: toArray(message.reactions).map(normalizeReaction),
  audio: normalizeChatAudio(message.audio),
  image: normalizeChatImage(message.image),
  call: normalizeChatCall(message.call),
})

export const normalizeChatUsers = (users = []) => toArray(users).map(normalizeChatUser)

export const normalizeChatConversations = (conversations = [], currentUserEmail = '') =>
  toArray(conversations).map((conversation) =>
    normalizeChatConversation(conversation, currentUserEmail),
  )

export const normalizeChatMessages = (messages = []) =>
  toArray(messages)
    .map((message) => normalizeChatMessage(message))
    .sort(sortMessages)

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
    state.conversations[index] = {
      ...state.conversations[index],
      ...normalized,
    }
  }

  state.conversations.sort(sortByDateThenId)
  return normalized
}

const upsertMessage = (state, message) => {
  ensureConversationCollection(state)

  const normalized = normalizeChatMessage(message)
  const conversationId = normalized.conversationId

  if (!conversationId) {
    return normalized
  }

  const currentMessages = state.messagesByConversation[conversationId] || []
  const index = currentMessages.findIndex((item) => item.id === normalized.id)

  if (index === -1) {
    state.messagesByConversation[conversationId] = [...currentMessages, normalized].sort(
      sortMessages,
    )
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
    if (
      normalized.participants.some((participant) => participant.email === currentUserEmail)
    ) {
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

  if (event === 'message_read_updated') {
    if (data.conversation) {
      upsertConversation(
        state,
        { ...data.conversation, members: data.members ?? data.conversation.members },
        currentUserEmail,
      )
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
        data.message?.conversation_id ??
        data.message?.conversationId,
    )
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
