import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterChatUsersForSearch,
  getChatMessageSenderLabel,
  getChatMessageStatusIcon,
  getChatMessageStatusTitle,
  getChatAudioRecorderLabel,
  getChatMicrophoneErrorMessage,
  getConversationMembersSummary,
  getRecentChatItems,
  insertEmojiIntoText,
  isChatMessageReadByPeer,
  isChatSendShortcut,
} from '../src/lib/chat-ui.js'

test('filters users by login or email and excludes current user', () => {
  const users = [
    { login: 'nika', email: 'nika@example.com' },
    { login: 'warder', email: 'warder@example.com' },
    { login: 'current', email: 'me@example.com' },
  ]

  assert.deepEqual(filterChatUsersForSearch(users, 'war', 'me@example.com'), [
    { login: 'warder', email: 'warder@example.com' },
  ])
  assert.deepEqual(filterChatUsersForSearch(users, 'NIKA', 'me@example.com'), [
    { login: 'nika', email: 'nika@example.com' },
  ])
  assert.deepEqual(
    filterChatUsersForSearch(users, 'example.com', 'me@example.com').map((user) => user.login),
    ['nika', 'warder'],
  )
})

test('returns five most recent chat items in existing conversation order', () => {
  const conversations = Array.from({ length: 7 }, (_, index) => ({
    id: `chat-${index + 1}`,
    title: `Chat ${index + 1}`,
  }))

  assert.deepEqual(
    getRecentChatItems(conversations).map((chat) => chat.id),
    ['chat-1', 'chat-2', 'chat-3', 'chat-4', 'chat-5'],
  )
})

test('formats conversation members summary with current user as you', () => {
  assert.equal(
    getConversationMembersSummary(
      {
        members: [
          { login: 'warder', email: 'warder@example.com' },
          { login: 'nika', email: 'nika@example.com' },
        ],
      },
      'warder@example.com',
    ),
    '2 - nika, Вы',
  )
})

test('uses current auth login for own message sender label', () => {
  assert.equal(
    getChatMessageSenderLabel(
      {
        senderEmail: 'wardercompany@gmail.com',
        senderLogin: 'wardercompany@gmail.com',
      },
      {
        email: 'wardercompany@gmail.com',
        login: 'warder',
      },
    ),
    'warder',
  )
})

test('message read status ignores current user receipt', () => {
  const message = {
    readBy: [{ email: 'wardercompany@gmail.com', login: 'warder' }],
  }

  assert.equal(isChatMessageReadByPeer(message, 'wardercompany@gmail.com'), false)
  assert.equal(getChatMessageStatusIcon(message, 'wardercompany@gmail.com'), '✓')
  assert.equal(getChatMessageStatusTitle(message, 'wardercompany@gmail.com'), 'Отправлено')
})

test('message read status uses double check when peer has read it', () => {
  const message = {
    readBy: [{ email: 'nika@example.com', login: 'nika' }],
  }

  assert.equal(isChatMessageReadByPeer(message, 'wardercompany@gmail.com'), true)
  assert.equal(getChatMessageStatusIcon(message, 'wardercompany@gmail.com'), '✓✓')
  assert.equal(
    getChatMessageStatusTitle(message, 'wardercompany@gmail.com'),
    'Прочитано собеседником',
  )
})

test('detects cmd enter and ctrl enter as chat send shortcut', () => {
  assert.equal(isChatSendShortcut({ key: 'Enter', metaKey: true, ctrlKey: false }), true)
  assert.equal(isChatSendShortcut({ key: 'Enter', metaKey: false, ctrlKey: true }), true)
  assert.equal(isChatSendShortcut({ key: 'Enter', metaKey: false, ctrlKey: false }), false)
  assert.equal(isChatSendShortcut({ key: 'a', metaKey: true, ctrlKey: false }), false)
})

test('inserts emoji at cursor position and returns next cursor index', () => {
  assert.deepEqual(insertEmojiIntoText('Привет друг', '😊', 6, 6), {
    text: 'Привет😊 друг',
    cursor: 8,
  })
  assert.deepEqual(insertEmojiIntoText('Привет друг', '🔥', 7, 11), {
    text: 'Привет 🔥',
    cursor: 9,
  })
})

test('explains microphone permission failures with actionable messages', () => {
  assert.match(
    getChatMicrophoneErrorMessage(null, { isSecureContext: false, hasMediaDevices: true }),
    /HTTPS/,
  )
  assert.match(
    getChatMicrophoneErrorMessage(
      { name: 'NotAllowedError' },
      {
        isSecureContext: true,
        hasMediaDevices: true,
      },
    ),
    /замок/,
  )
  assert.match(
    getChatMicrophoneErrorMessage(
      { name: 'NotFoundError' },
      {
        isSecureContext: true,
        hasMediaDevices: true,
      },
    ),
    /микрофон/,
  )
})

test('labels audio recorder toggle by recording state', () => {
  assert.equal(getChatAudioRecorderLabel(false), 'Начать запись')
  assert.equal(getChatAudioRecorderLabel(true), 'Остановить запись')
})
