import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildUnreadCenterItems,
  filterImportantMessages,
  filterChatMessagesByMode,
  getChatReminderPresetOptions,
  getTotalUnreadCount,
  normalizeChatReminders,
} from '../src/lib/chat-power-tools.js'

test('builds unread center sorted by latest activity', () => {
  const conversations = [
    { id: 'a', title: 'Alpha', unreadCount: 1, lastMessageAt: '2026-04-20T10:00:00Z' },
    { id: 'b', title: 'Beta', unreadCount: 0, lastMessageAt: '2026-04-20T12:00:00Z' },
    { id: 'c', title: 'Gamma', unread_count: 3, lastMessageAt: '2026-04-20T11:00:00Z' },
  ]

  const items = buildUnreadCenterItems(conversations)

  assert.deepEqual(
    items.map((item) => item.id),
    ['c', 'a'],
  )
  assert.equal(getTotalUnreadCount(conversations), 4)
})

test('filters important messages by text and sender', () => {
  const messages = [
    {
      id: 'old',
      conversation_id: 'group-1',
      text: 'проверить сервер',
      sender_login: 'alice',
      created_at: '2026-04-20T10:00:00Z',
      favorite: true,
    },
    {
      id: 'new',
      conversation_id: 'group-1',
      text: 'созвон',
      sender_login: 'bob',
      created_at: '2026-04-20T12:00:00Z',
      favorite: true,
    },
  ]

  assert.deepEqual(
    filterImportantMessages(messages).map((message) => message.id),
    ['new', 'old'],
  )
  assert.deepEqual(
    filterImportantMessages(messages, 'alice').map((message) => message.id),
    ['old'],
  )
})

test('normalizes reminders and builds quick reminder presets', () => {
  const reminders = normalizeChatReminders([
    {
      id: 'later',
      conversation_id: 'chat-1',
      message_id: 'msg-2',
      remind_at: '2026-04-20T13:00:00Z',
      created_at: '2026-04-20T10:00:00Z',
    },
    {
      id: 'soon',
      conversationId: 'chat-1',
      messageId: 'msg-1',
      remindAt: '2026-04-20T12:00:00Z',
      createdAt: '2026-04-20T10:05:00Z',
    },
  ])

  assert.deepEqual(
    reminders.map((reminder) => reminder.id),
    ['soon', 'later'],
  )

  const options = getChatReminderPresetOptions(new Date('2026-04-20T08:30:00Z'))
  assert.equal(options[0].remindAt, '2026-04-20T08:45:00.000Z')
  assert.equal(options[1].remindAt, '2026-04-20T09:30:00.000Z')
  assert.equal(options[2].key, 'tomorrow')
})

test('filters active chat messages by group work modes', () => {
  const messages = [
    { id: 'read', type: 'text', text: 'read', senderEmail: 'bob@example.com' },
    { id: 'unread', type: 'text', text: 'unread', senderEmail: 'bob@example.com' },
    { id: 'own', type: 'text', text: 'own', senderEmail: 'alice@example.com' },
    { id: 'star', type: 'text', text: 'star', senderEmail: 'bob@example.com', favorite: true },
    { id: 'voice', type: 'audio', senderEmail: 'bob@example.com' },
    { id: 'doc', type: 'file', senderEmail: 'bob@example.com' },
  ]

  assert.deepEqual(
    filterChatMessagesByMode(messages, 'unread', {
      lastReadMessageId: 'read',
      currentUserEmail: 'alice@example.com',
    }).map((message) => message.id),
    ['unread', 'star', 'voice', 'doc'],
  )
  assert.deepEqual(
    filterChatMessagesByMode(messages, 'important').map((message) => message.id),
    ['star'],
  )
  assert.deepEqual(
    filterChatMessagesByMode(messages, 'media').map((message) => message.id),
    ['voice', 'doc'],
  )
  assert.deepEqual(
    filterChatMessagesByMode(messages, 'files').map((message) => message.id),
    ['doc'],
  )
})
