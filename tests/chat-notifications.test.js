import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildIncomingChatNotice,
  isChatSoundEnabled,
  playChatNotificationSound,
  setChatSoundEnabled,
  shouldNotifyIncomingChatMessage,
} from '../src/lib/chat-notifications.js'

const incomingEnvelope = (overrides = {}) => ({
  event: 'message_persisted',
  data: {
    conversation: {
      id: 'group-1',
      title: 'Team',
      type: 'group',
    },
    message: {
      id: 'msg-1',
      conversation_id: 'group-1',
      sender_email: 'bob@example.com',
      sender_login: 'bob',
      text: 'Привет',
    },
    ...overrides,
  },
})

test('notifies for messages from another user in inactive conversation', () => {
  assert.equal(
    shouldNotifyIncomingChatMessage(incomingEnvelope(), {
      currentUserEmail: 'alice@example.com',
      activeConversationId: 'direct-1',
    }),
    true,
  )
})

test('does not notify for own messages or currently active conversation', () => {
  assert.equal(
    shouldNotifyIncomingChatMessage(incomingEnvelope({
      message: {
        id: 'msg-1',
        conversation_id: 'group-1',
        sender_email: 'alice@example.com',
        sender_login: 'alice',
        text: 'Моё сообщение',
      },
    }), {
      currentUserEmail: 'alice@example.com',
      activeConversationId: 'direct-1',
    }),
    false,
  )

  assert.equal(
    shouldNotifyIncomingChatMessage(incomingEnvelope(), {
      currentUserEmail: 'alice@example.com',
      activeConversationId: 'group-1',
    }),
    false,
  )
})

test('builds a compact incoming message notice', () => {
  assert.deepEqual(buildIncomingChatNotice(incomingEnvelope()), {
    title: 'Новое сообщение от bob',
    message: 'Team: Привет',
  })
})

test('persists chat sound preference', () => {
  const values = new Map()
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  }

  assert.equal(isChatSoundEnabled(storage), false)
  setChatSoundEnabled(true, storage)
  assert.equal(isChatSoundEnabled(storage), true)
  setChatSoundEnabled(false, storage)
  assert.equal(isChatSoundEnabled(storage), false)
})

test('plays notification sound through WebAudio when available', () => {
  const calls = []

  class FakeAudioContext {
    constructor() {
      this.currentTime = 0
      this.destination = {}
    }

    createOscillator() {
      return {
        frequency: { setValueAtTime: (...args) => calls.push(['frequency', ...args]) },
        connect: (...args) => calls.push(['osc-connect', ...args]),
        start: (...args) => calls.push(['start', ...args]),
        stop: (...args) => calls.push(['stop', ...args]),
        set type(value) {
          calls.push(['type', value])
        },
      }
    }

    createGain() {
      return {
        gain: {
          setValueAtTime: (...args) => calls.push(['gain', ...args]),
          exponentialRampToValueAtTime: (...args) => calls.push(['ramp', ...args]),
        },
        connect: (...args) => calls.push(['gain-connect', ...args]),
      }
    }
  }

  assert.equal(playChatNotificationSound({ audioContextFactory: FakeAudioContext }), true)
  assert.equal(calls.some(([name]) => name === 'start'), true)
  assert.equal(calls.some(([name]) => name === 'stop'), true)
})
