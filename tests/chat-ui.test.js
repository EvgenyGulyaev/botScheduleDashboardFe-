import test from 'node:test'
import assert from 'node:assert/strict'
import {
  filterChatUsersForSearch,
  getChatMessageSenderLabel,
  getChatMessageStatusIcon,
  getChatMessageStatusTitle,
  getRecentChatItems,
  isChatMessageReadByPeer,
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
  assert.deepEqual(filterChatUsersForSearch(users, 'example.com', 'me@example.com').map((user) => user.login), [
    'nika',
    'warder',
  ])
})

test('returns five most recent chat items in existing conversation order', () => {
  const conversations = Array.from({ length: 7 }, (_, index) => ({
    id: `chat-${index + 1}`,
    title: `Chat ${index + 1}`,
  }))

  assert.deepEqual(getRecentChatItems(conversations).map((chat) => chat.id), [
    'chat-1',
    'chat-2',
    'chat-3',
    'chat-4',
    'chat-5',
  ])
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
    readBy: [
      { email: 'wardercompany@gmail.com', login: 'warder' },
    ],
  }

  assert.equal(isChatMessageReadByPeer(message, 'wardercompany@gmail.com'), false)
  assert.equal(getChatMessageStatusIcon(message, 'wardercompany@gmail.com'), '✓')
  assert.equal(getChatMessageStatusTitle(message, 'wardercompany@gmail.com'), 'Отправлено')
})

test('message read status uses double check when peer has read it', () => {
  const message = {
    readBy: [
      { email: 'nika@example.com', login: 'nika' },
    ],
  }

  assert.equal(isChatMessageReadByPeer(message, 'wardercompany@gmail.com'), true)
  assert.equal(getChatMessageStatusIcon(message, 'wardercompany@gmail.com'), '✓✓')
  assert.equal(getChatMessageStatusTitle(message, 'wardercompany@gmail.com'), 'Прочитано собеседником')
})
