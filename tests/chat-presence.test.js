import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeChatConversation } from '../src/lib/chat.js'
import {
  getChatPresenceText,
  getTypingIndicatorLabel,
} from '../src/lib/chat-ui.js'

test('normalizes direct presence payload and renders online text', () => {
  const conversation = normalizeChatConversation(
    {
      id: 'direct-1',
      type: 'direct',
      members: [
        { email: 'alice@example.com', login: 'alice' },
        { email: 'bob@example.com', login: 'bob' },
      ],
      presence: {
        online: true,
        last_active_at: '2026-04-27T10:00:00Z',
        last_seen_at: '2026-04-27T09:30:00Z',
      },
    },
    'alice@example.com',
  )

  assert.deepEqual(conversation.presence, {
    online: true,
    onlineCount: 0,
    lastActiveAt: '2026-04-27T10:00:00Z',
    lastSeenAt: '2026-04-27T09:30:00Z',
  })
  assert.equal(getChatPresenceText(conversation), 'в сети')
})

test('normalizes group online count summary', () => {
  const conversation = normalizeChatConversation(
    {
      id: 'group-1',
      type: 'group',
      title: 'Team',
      members: [
        { email: 'alice@example.com', login: 'alice' },
        { email: 'bob@example.com', login: 'bob' },
        { email: 'carol@example.com', login: 'carol' },
      ],
      presence: {
        online_count: 2,
        last_active_at: '2026-04-27T10:15:00Z',
      },
    },
    'alice@example.com',
  )

  assert.equal(conversation.presence.onlineCount, 2)
  assert.equal(conversation.presence.lastActiveAt, '2026-04-27T10:15:00Z')
  assert.equal(getChatPresenceText(conversation), '2 в сети')
})

test('builds typing indicator labels for one and multiple users', () => {
  assert.equal(
    getTypingIndicatorLabel([{ email: 'bob@example.com', login: 'bob' }]),
    'bob печатает...',
  )
  assert.equal(
    getTypingIndicatorLabel([
      { email: 'bob@example.com', login: 'bob' },
      { email: 'carol@example.com', login: 'carol' },
    ]),
    'bob и carol печатают...',
  )
  assert.equal(
    getTypingIndicatorLabel([
      { email: 'bob@example.com', login: 'bob' },
      { email: 'carol@example.com', login: 'carol' },
      { email: 'dave@example.com', login: 'dave' },
    ]),
    'bob и ещё 2 печатают...',
  )
})
