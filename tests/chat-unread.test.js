import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildChatTimelineItems,
  getChatUnreadScrollAction,
  getFirstUnreadMessageId,
  shouldJumpToFirstUnread,
} from '../src/lib/chat-ui.js'

const messages = [
  {
    id: 'msg-1',
    senderEmail: 'bob@example.com',
    text: 'already read',
  },
  {
    id: 'msg-2',
    senderEmail: 'alice@example.com',
    text: 'own reply',
  },
  {
    id: 'msg-3',
    senderEmail: 'bob@example.com',
    text: 'first unread',
  },
  {
    id: 'msg-4',
    senderEmail: 'bob@example.com',
    text: 'second unread',
  },
]

test('separator appears before first unread incoming message', () => {
  const timeline = buildChatTimelineItems(messages, 'msg-2', 'alice@example.com')

  assert.deepEqual(
    timeline.map((item) => `${item.type}:${item.id}`),
    ['message:msg-1', 'message:msg-2', 'unread-separator:unread-msg-3', 'message:msg-3', 'message:msg-4'],
  )
})

test('first unread anchor ignores own messages after read point', () => {
  assert.equal(getFirstUnreadMessageId(messages, 'msg-1', 'alice@example.com'), 'msg-3')
  assert.equal(getFirstUnreadMessageId(messages, 'msg-4', 'alice@example.com'), '')
})

test('initial open jumps only when a first unread anchor exists', () => {
  assert.equal(shouldJumpToFirstUnread(messages, 'msg-2', 'alice@example.com'), true)
  assert.equal(shouldJumpToFirstUnread(messages, 'msg-4', 'alice@example.com'), false)
})

test('incoming unread append away from bottom preserves scroll position', () => {
  assert.equal(
    getChatUnreadScrollAction({
      conversationChanged: false,
      messageCountChanged: true,
      hasFirstUnread: true,
      wasNearBottom: false,
      hasFocusedViewport: true,
    }),
    'none',
  )
})

test('initial open can jump to first unread but near-bottom append stays at bottom', () => {
  assert.equal(
    getChatUnreadScrollAction({
      conversationChanged: true,
      messageCountChanged: true,
      hasFirstUnread: true,
      wasNearBottom: false,
      hasFocusedViewport: true,
    }),
    'first-unread',
  )
  assert.equal(
    getChatUnreadScrollAction({
      conversationChanged: false,
      messageCountChanged: true,
      hasFirstUnread: true,
      wasNearBottom: true,
      hasFocusedViewport: true,
    }),
    'bottom',
  )
})

test('cold open defers initial scroll until messages are loaded', () => {
  assert.equal(
    getChatUnreadScrollAction({
      conversationChanged: true,
      hasFirstUnread: false,
      messagesLoaded: false,
      wasNearBottom: true,
      hasFocusedViewport: true,
    }),
    'defer',
  )
  assert.equal(
    getChatUnreadScrollAction({
      conversationChanged: true,
      hasFirstUnread: true,
      messagesLoaded: true,
      wasNearBottom: true,
      hasFocusedViewport: true,
    }),
    'first-unread',
  )
  assert.equal(
    getChatUnreadScrollAction({
      conversationChanged: true,
      hasFirstUnread: false,
      messagesLoaded: true,
      wasNearBottom: true,
      hasFocusedViewport: true,
    }),
    'bottom',
  )
})
