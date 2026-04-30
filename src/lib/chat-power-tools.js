import { normalizeChatMessage } from './chat.js'

const normalizeString = (value) => (value == null ? '' : String(value))

const normalizeIso = (value) => (value ? String(value) : null)

const messageTimestamp = (message = {}) =>
  normalizeString(message.createdAt ?? message.created_at ?? message.remindAt ?? message.remind_at)

export const buildUnreadCenterItems = (conversations = []) =>
  (Array.isArray(conversations) ? conversations : [])
    .filter(
      (conversation) => Number(conversation?.unreadCount ?? conversation?.unread_count ?? 0) > 0,
    )
    .map((conversation) => ({
      ...conversation,
      unreadCount: Number(conversation.unreadCount ?? conversation.unread_count ?? 0),
    }))
    .sort((left, right) => {
      const leftTime = left.lastMessageAt || left.updatedAt || left.createdAt || ''
      const rightTime = right.lastMessageAt || right.updatedAt || right.createdAt || ''
      if (leftTime !== rightTime) {
        return rightTime.localeCompare(leftTime)
      }
      return normalizeString(left.title).localeCompare(normalizeString(right.title))
    })

export const getTotalUnreadCount = (conversations = []) =>
  buildUnreadCenterItems(conversations).reduce(
    (total, conversation) => total + Number(conversation.unreadCount || 0),
    0,
  )

export const filterImportantMessages = (messages = [], query = '') => {
  const normalizedQuery = normalizeString(query).trim().toLowerCase()
  const items = (Array.isArray(messages) ? messages : []).map(normalizeChatMessage)
  const sortedItems = items.sort((left, right) =>
    messageTimestamp(right).localeCompare(messageTimestamp(left)),
  )

  if (!normalizedQuery) {
    return sortedItems
  }

  return sortedItems.filter((message) => {
    const haystack = [
      message.text,
      message.senderLogin,
      message.senderEmail,
      message.conversationId,
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(normalizedQuery)
  })
}

export const filterChatMessagesByMode = (
  messages = [],
  mode = 'all',
  { lastReadMessageId = '', currentUserEmail = '' } = {},
) => {
  const items = (Array.isArray(messages) ? messages : []).map(normalizeChatMessage)
  const normalizedMode = normalizeString(mode) || 'all'
  if (normalizedMode === 'all') {
    return items
  }

  if (normalizedMode === 'unread') {
    const readIndex = lastReadMessageId
      ? items.findIndex((message) => message.id === lastReadMessageId)
      : -1
    return items.slice(readIndex + 1).filter((message) => {
      return message.id && message.senderEmail !== currentUserEmail
    })
  }

  if (normalizedMode === 'important') {
    return items.filter((message) => message.favorite)
  }

  if (normalizedMode === 'media') {
    return items.filter((message) => ['audio', 'image', 'file'].includes(message.type))
  }

  if (normalizedMode === 'audio') {
    return items.filter((message) => message.type === 'audio')
  }

  if (normalizedMode === 'files') {
    return items.filter((message) => message.type === 'file')
  }

  return items
}

export const normalizeChatReminder = (reminder = {}) => ({
  id: normalizeString(reminder.id),
  userEmail: normalizeString(reminder.user_email ?? reminder.userEmail),
  userLogin: normalizeString(reminder.user_login ?? reminder.userLogin),
  conversationId: normalizeString(reminder.conversation_id ?? reminder.conversationId),
  conversationTitle: normalizeString(reminder.conversation_title ?? reminder.conversationTitle),
  messageId: normalizeString(reminder.message_id ?? reminder.messageId),
  messageText: normalizeString(reminder.message_text ?? reminder.messageText),
  senderEmail: normalizeString(reminder.sender_email ?? reminder.senderEmail),
  senderLogin: normalizeString(reminder.sender_login ?? reminder.senderLogin),
  remindAt: normalizeIso(reminder.remind_at ?? reminder.remindAt),
  createdAt: normalizeIso(reminder.created_at ?? reminder.createdAt),
})

export const normalizeChatReminders = (reminders = []) =>
  (Array.isArray(reminders) ? reminders : [])
    .map(normalizeChatReminder)
    .filter((reminder) => reminder.id && reminder.messageId && reminder.conversationId)
    .sort((left, right) => {
      if (left.remindAt !== right.remindAt) {
        return left.remindAt.localeCompare(right.remindAt)
      }
      return right.createdAt.localeCompare(left.createdAt)
    })

export const getChatReminderPresetDate = (preset = 'hour', now = new Date()) => {
  const base = new Date(now)
  switch (preset) {
    case '15m':
      base.setMinutes(base.getMinutes() + 15)
      return base
    case 'tomorrow':
      base.setDate(base.getDate() + 1)
      base.setHours(9, 0, 0, 0)
      return base
    case 'hour':
    default:
      base.setHours(base.getHours() + 1)
      return base
  }
}

export const getChatReminderPresetOptions = (now = new Date()) => [
  {
    key: '15m',
    label: 'Через 15 мин',
    remindAt: getChatReminderPresetDate('15m', now).toISOString(),
  },
  {
    key: 'hour',
    label: 'Через час',
    remindAt: getChatReminderPresetDate('hour', now).toISOString(),
  },
  {
    key: 'tomorrow',
    label: 'Завтра утром',
    remindAt: getChatReminderPresetDate('tomorrow', now).toISOString(),
  },
]
