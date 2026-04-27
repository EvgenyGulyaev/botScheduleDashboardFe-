export const filterChatUsersForSearch = (users = [], query = '', currentUserEmail = '') => {
  const normalizedQuery = String(query || '')
    .trim()
    .toLowerCase()
  const ownEmail = String(currentUserEmail || '')
    .trim()
    .toLowerCase()

  if (!normalizedQuery) {
    return []
  }

  return users.filter((user) => {
    const email = String(user?.email || '')
      .trim()
      .toLowerCase()
    const login = String(user?.login || '')
      .trim()
      .toLowerCase()

    if (!email || email === ownEmail) {
      return false
    }

    return email.includes(normalizedQuery) || login.includes(normalizedQuery)
  })
}

export const getRecentChatItems = (conversations = [], limit = 5) => conversations.slice(0, limit)

export const getConversationMembersSummary = (conversation = {}, currentUserEmail = '') => {
  const ownEmail = String(currentUserEmail || '')
    .trim()
    .toLowerCase()
  const members = conversation.members || []
  const labels = members
    .map((member) => {
      const email = String(member?.email || '').trim()
      const isOwn = email.toLowerCase() === ownEmail

      return {
        isOwn,
        label: isOwn ? 'Вы' : member?.login || email || 'Участник',
      }
    })
    .sort((left, right) => Number(left.isOwn) - Number(right.isOwn))
    .map((member) => member.label)

  return `${members.length} - ${labels.join(', ')}`
}

export const getGroupMemberActionState = ({
  conversation = {},
  member = {},
  currentUserEmail = '',
} = {}) => {
  const permissions = conversation.permissions || {}
  const memberEmail = String(member?.email || '')
  const ownEmail = String(currentUserEmail || '')
  const isSelf = Boolean(memberEmail && memberEmail === ownEmail)
  const role = String(member?.role || 'member')
  const canManageRoles = Boolean(permissions.canManageRoles)
  const canRemoveMembers = Boolean(permissions.canRemoveMembers)

  return {
    canChangeRole: Boolean(canManageRoles && !isSelf && role !== 'owner'),
    canRemove: Boolean(
      canRemoveMembers && !isSelf && role !== 'owner' && (canManageRoles || role === 'member'),
    ),
    canLeave: Boolean(isSelf && permissions.canLeave),
    roleOptions: canManageRoles && !isSelf && role !== 'owner' ? ['admin', 'member'] : [],
  }
}

export const getChatPresenceText = (conversation = {}) => {
  const presence = conversation?.presence || {}
  if (conversation?.type === 'group') {
    const onlineCount = Number(presence.onlineCount ?? presence.online_count ?? 0)
    return onlineCount > 0 ? `${onlineCount} в сети` : 'никого нет в сети'
  }

  if (presence.online) {
    return 'в сети'
  }

  if (presence.lastSeenAt || presence.last_seen_at) {
    return 'был(а) недавно'
  }

  return 'не в сети'
}

export const getTypingIndicatorLabel = (typers = []) => {
  const labels = (Array.isArray(typers) ? typers : [])
    .map((user) => user?.login || user?.email || '')
    .filter(Boolean)

  if (labels.length === 0) {
    return ''
  }

  if (labels.length === 1) {
    return `${labels[0]} печатает...`
  }

  if (labels.length === 2) {
    return `${labels[0]} и ${labels[1]} печатают...`
  }

  return `${labels[0]} и ещё ${labels.length - 1} печатают...`
}

export const shouldRefreshChatTyping = (
  lastSentAt = 0,
  now = Date.now(),
  intervalMs = 3000,
) => Number(now) - Number(lastSentAt || 0) >= Number(intervalMs)

export const getChatMessageSenderLabel = (message = {}, currentUser = {}) => {
  if (message.senderEmail && message.senderEmail === currentUser.email) {
    return currentUser.login || currentUser.email || 'Вы'
  }

  return message.senderLogin || message.senderEmail || 'Пользователь'
}

export const isOneTimeMediaExpired = (media = {}, now = Date.now()) => {
  if (!media) {
    return false
  }

  if (media.expired) {
    return true
  }

  const expiresAt = media.expiresAt ? new Date(media.expiresAt).getTime() : null
  return Number.isFinite(expiresAt) && expiresAt <= now
}

export const isOneTimeMediaConsumedByPeer = (media = {}, currentUserEmail = '') =>
  Boolean(media?.consumedByEmail) && media.consumedByEmail !== currentUserEmail

export const isChatMessageReadByPeer = (message = {}, currentUserEmail = '') => {
  if (message?.type === 'audio' && message.audio) {
    return isOneTimeMediaConsumedByPeer(message.audio, currentUserEmail)
  }

  if (message?.type === 'image' && message.image) {
    return isOneTimeMediaConsumedByPeer(message.image, currentUserEmail)
  }

  if (message.deliveryStatus === 'read' || Number(message.readByCount || 0) > 0) {
    return true
  }

  return (message.readBy || []).some((receipt) => receipt.email && receipt.email !== currentUserEmail)
}

export const getChatMessageLifecycleStatus = (message = {}, currentUserEmail = '') => {
  if (message.deliveryStatus === 'pending' || message.deliveryStatus === 'failed') {
    return message.deliveryStatus
  }

  if (isChatMessageReadByPeer(message, currentUserEmail)) {
    return 'read'
  }

  if (message.deliveryStatus === 'delivered' || Number(message.deliveredToCount || 0) > 0) {
    return 'delivered'
  }

  return 'sent'
}

export const getChatMessageStatusIcon = (message = {}, currentUserEmail = '') => {
  switch (getChatMessageLifecycleStatus(message, currentUserEmail)) {
    case 'pending':
      return '…'
    case 'failed':
      return '!'
    case 'delivered':
    case 'read':
      return '✓✓'
    default:
      return '✓'
  }
}

export const getChatMessageStatusTitle = (message = {}, currentUserEmail = '') => {
  switch (getChatMessageLifecycleStatus(message, currentUserEmail)) {
    case 'pending':
      return 'Отправляем'
    case 'failed':
      return 'Не удалось отправить'
    case 'delivered':
      return 'Доставлено'
    case 'read':
      return message?.type === 'audio'
        ? 'Голосовое прослушано'
        : message?.type === 'image'
          ? 'Изображение просмотрено'
          : 'Прочитано собеседником'
    default:
      return 'Отправлено'
  }
}

export const getChatMessageStatusTone = (message = {}, currentUserEmail = '') => {
  switch (getChatMessageLifecycleStatus(message, currentUserEmail)) {
    case 'read':
      return 'read'
    case 'failed':
      return 'failed'
    case 'pending':
      return 'pending'
    default:
      return 'neutral'
  }
}

export const getAudioMessageButtonLabel = (
  message = {},
  playingAudioMessageId = null,
  targetMessageId = message?.id,
) => {
  if (message?.audio?.consumed || isOneTimeMediaExpired(message?.audio)) {
    return 'Недоступно'
  }

  if (playingAudioMessageId && targetMessageId && playingAudioMessageId === targetMessageId) {
    return 'Воспроизводим…'
  }

  return 'Прослушать 1 раз'
}

export const getImageMessageButtonLabel = (
  message = {},
  viewingImageMessageId = null,
  targetMessageId = message?.id,
) => {
  if (message?.image?.consumed || isOneTimeMediaExpired(message?.image)) {
    return 'Недоступно'
  }

  if (viewingImageMessageId && targetMessageId && viewingImageMessageId === targetMessageId) {
    return 'Открываем…'
  }

  return 'Открыть 1 раз'
}

export const getChatAudioRecorderLabel = (isRecording = false) =>
  isRecording ? 'Остановить запись' : 'Начать запись'

export const isChatSendShortcut = (event = {}) =>
  event.key === 'Enter' && (event.metaKey || event.ctrlKey)

export const groupChatReactions = (reactions = []) =>
  Array.from(
    reactions.reduce((groups, reaction) => {
      const emoji = String(reaction?.emoji || '')
      if (!emoji) {
        return groups
      }

      groups.set(emoji, (groups.get(emoji) || 0) + 1)
      return groups
    }, new Map()),
  ).map(([emoji, count]) => ({ emoji, count }))

export const getCurrentUserReactionEmoji = (reactions = [], currentUserEmail = '') =>
  String(
    reactions.find((reaction) => reaction?.userEmail === currentUserEmail)?.emoji || '',
  )

export const isChatMessageEditable = (message = {}, currentUserEmail = '') =>
  message?.type === 'text' && message?.senderEmail === currentUserEmail

export const getFirstUnreadMessageId = (
  messages = [],
  lastReadMessageId = '',
  currentUserEmail = '',
) => {
  const items = Array.isArray(messages) ? messages : []
  const readIndex = lastReadMessageId
    ? items.findIndex((message) => message?.id === lastReadMessageId)
    : -1

  for (let index = readIndex + 1; index < items.length; index += 1) {
    const message = items[index]
    if (message?.id && message.senderEmail !== currentUserEmail) {
      return message.id
    }
  }

  return ''
}

export const shouldJumpToFirstUnread = (
  messages = [],
  lastReadMessageId = '',
  currentUserEmail = '',
) => Boolean(getFirstUnreadMessageId(messages, lastReadMessageId, currentUserEmail))

export const getChatUnreadScrollAction = ({
  conversationChanged = false,
  messageCountChanged = false,
  hasFirstUnread = false,
  messagesLoaded = true,
  wasNearBottom = false,
  hasFocusedViewport = true,
} = {}) => {
  if (!hasFocusedViewport) {
    return 'none'
  }

  if (conversationChanged && !messagesLoaded) {
    return 'defer'
  }

  if (conversationChanged && hasFirstUnread) {
    return 'first-unread'
  }

  if (conversationChanged) {
    return 'bottom'
  }

  if (messageCountChanged && wasNearBottom) {
    return 'bottom'
  }

  return 'none'
}

export const shouldMarkReadAfterUnreadScrollAction = (action = 'none') => action === 'bottom'

export const shouldHandleUnreadScrollRead = ({
  firstUnreadVisible = false,
  programmaticUnreadScrollActive = false,
} = {}) => Boolean(firstUnreadVisible && !programmaticUnreadScrollActive)

export const buildChatTimelineItems = (
  messages = [],
  lastReadMessageId = '',
  currentUserEmail = '',
) => {
  const firstUnreadId = getFirstUnreadMessageId(messages, lastReadMessageId, currentUserEmail)
  const result = []

  for (const message of Array.isArray(messages) ? messages : []) {
    if (message?.id && message.id === firstUnreadId) {
      result.push({
        type: 'unread-separator',
        id: `unread-${message.id}`,
        messageId: message.id,
      })
    }
    result.push({
      type: 'message',
      id: message?.id || '',
      message,
    })
  }

  return result
}

export const getChatReplyPreviewText = (message = {}) => {
  if (!message) {
    return ''
  }

  if (message.type === 'audio') {
    return 'Голосовое сообщение'
  }

  if (message.type === 'image') {
    return 'Изображение'
  }

  return String(message.text || '').trim()
}

export const buildChatSearchExcerpt = (text = '', query = '', maxLength = 96) => {
  const source = String(text || '').replace(/\s+/g, ' ').trim()
  const needle = String(query || '').trim()
  if (!source) {
    return ''
  }

  if (!needle) {
    return source.length > maxLength ? `${source.slice(0, maxLength - 1)}…` : source
  }

  const lowerSource = source.toLowerCase()
  const lowerNeedle = needle.toLowerCase()
  const matchIndex = lowerSource.indexOf(lowerNeedle)
  if (matchIndex === -1 || source.length <= maxLength) {
    return source.length > maxLength ? `${source.slice(0, maxLength - 1)}…` : source
  }

  const padding = Math.max(12, Math.floor((maxLength - needle.length) / 2))
  const start = Math.max(0, matchIndex - padding)
  const end = Math.min(source.length, matchIndex + needle.length + padding)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < source.length ? '…' : ''
  return `${prefix}${source.slice(start, end)}${suffix}`
}

export const getChatSwipeReplyState = ({
  startX = 0,
  startY = 0,
  currentX = 0,
  currentY = 0,
  isMobile = false,
  maxOffset = 72,
  threshold = 64,
} = {}) => {
  if (!isMobile) {
    return { offsetX: 0, shouldReply: false }
  }

  const deltaX = Number(currentX) - Number(startX)
  const deltaY = Math.abs(Number(currentY) - Number(startY))
  if (deltaX <= 0 || deltaY > 36 || deltaY > Math.abs(deltaX)) {
    return { offsetX: 0, shouldReply: false }
  }

  const offsetX = Math.min(maxOffset, Math.max(0, deltaX))
  return {
    offsetX,
    shouldReply: offsetX >= threshold,
  }
}

export const getDroppedImageFile = (dataTransfer = null) => {
  const itemFile = Array.from(dataTransfer?.items || [])
    .filter((item) => item?.kind === 'file')
    .map((item) => (typeof item?.getAsFile === 'function' ? item.getAsFile() : null))
    .find((file) => String(file?.type || '').startsWith('image/'))

  if (itemFile) {
    return itemFile
  }

  return (
    Array.from(dataTransfer?.files || []).find((file) =>
      String(file?.type || '').startsWith('image/'),
    ) || null
  )
}

export const insertEmojiIntoText = (
  text = '',
  emoji = '',
  selectionStart = 0,
  selectionEnd = selectionStart,
) => {
  const safeText = String(text || '')
  const start = Math.max(0, Math.min(Number(selectionStart) || 0, safeText.length))
  const end = Math.max(start, Math.min(Number(selectionEnd) || start, safeText.length))
  const nextText = `${safeText.slice(0, start)}${emoji}${safeText.slice(end)}`

  return {
    text: nextText,
    cursor: start + String(emoji || '').length,
  }
}

export const getChatMicrophoneErrorMessage = (
  error = null,
  { isSecureContext = true, hasMediaDevices = true } = {},
) => {
  if (!isSecureContext) {
    return 'Запись микрофона доступна только на HTTPS или localhost. На HTTP браузер не покажет окно доступа.'
  }

  if (!hasMediaDevices) {
    return 'Этот браузер не поддерживает запись микрофона. Попробуй Chrome, Safari или другой современный браузер.'
  }

  const errorName = String(error?.name || '')
  if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
    return 'Доступ к микрофону запрещён. Нажми на замок в адресной строке и разреши микрофон для этого сайта.'
  }

  if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
    return 'Браузер не нашёл микрофон. Проверь, что микрофон подключён и доступен системе.'
  }

  if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
    return 'Микрофон занят другим приложением или недоступен. Закрой другое приложение с записью и попробуй снова.'
  }

  return 'Не получилось включить микрофон. Проверь разрешение на запись в настройках сайта и попробуй ещё раз.'
}
