import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildChatSearchExcerpt,
  extractChatMentions,
  filterChatUsersForSearch,
  getAudioMessageButtonLabel,
  getChatSwipeReplyState,
  getFileMessageButtonLabel,
  getDroppedImageFile,
  getChatMessageSenderLabel,
  getChatMessageStatusIcon,
  getChatMessageStatusTitle,
  getChatAudioRecorderLabel,
  getChatMicrophoneErrorMessage,
  getChatReplyPreviewText,
  getGroupMemberActionState,
  getSelectedChatMessagesActionState,
  getCurrentUserReactionEmoji,
  getConversationMembersSummary,
  groupChatReactions,
  isChatMessageEditable,
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

test('builds group member action state from roles and permissions', () => {
  const conversation = {
    currentUserRole: 'owner',
    permissions: {
      canManageRoles: true,
      canRemoveMembers: true,
    },
  }

  assert.deepEqual(
    getGroupMemberActionState({
      conversation,
      member: { email: 'bob@example.com', role: 'member' },
      currentUserEmail: 'alice@example.com',
    }),
    {
      canChangeRole: true,
      canRemove: true,
      canLeave: false,
      roleOptions: ['admin', 'member'],
    },
  )

  assert.deepEqual(
    getGroupMemberActionState({
      conversation,
      member: { email: 'alice@example.com', role: 'owner' },
      currentUserEmail: 'alice@example.com',
    }),
    {
      canChangeRole: false,
      canRemove: false,
      canLeave: false,
      roleOptions: [],
    },
  )
})

test('builds selected message action state for power tools', () => {
  const messages = [
    { id: 'msg-1', type: 'text', senderEmail: 'alice@example.com' },
    { id: 'msg-2', type: 'text', senderEmail: 'alice@example.com' },
  ]

  assert.deepEqual(
    getSelectedChatMessagesActionState({
      selectedMessageIds: ['msg-1', 'msg-2'],
      messages,
      currentUserEmail: 'alice@example.com',
    }),
    {
      selectedCount: 2,
      canFavorite: true,
      canForward: true,
      canDelete: true,
    },
  )

  assert.equal(
    getSelectedChatMessagesActionState({
      selectedMessageIds: ['msg-1', 'missing'],
      messages,
      currentUserEmail: 'alice@example.com',
    }).selectedCount,
    1,
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

test('status icon maps sent delivered and read lifecycle states', () => {
  assert.equal(getChatMessageStatusIcon({ deliveryStatus: 'sent' }, 'me@example.com'), '✓')
  assert.equal(
    getChatMessageStatusTitle({ deliveryStatus: 'sent' }, 'me@example.com'),
    'Отправлено',
  )
  assert.equal(getChatMessageStatusIcon({ deliveryStatus: 'delivered' }, 'me@example.com'), '✓✓')
  assert.equal(
    getChatMessageStatusTitle({ deliveryStatus: 'delivered' }, 'me@example.com'),
    'Доставлено',
  )
  assert.equal(getChatMessageStatusIcon({ deliveryStatus: 'read' }, 'me@example.com'), '✓✓')
  assert.equal(
    getChatMessageStatusTitle({ deliveryStatus: 'read' }, 'me@example.com'),
    'Прочитано собеседником',
  )
})

test('group aggregate read status uses any non-sender reader', () => {
  const message = {
    deliveryStatus: 'read',
    readByCount: 1,
    readBy: [{ email: 'carol@example.com', login: 'carol' }],
  }

  assert.equal(isChatMessageReadByPeer(message, 'alice@example.com'), true)
  assert.equal(getChatMessageStatusIcon(message, 'alice@example.com'), '✓✓')
})

test('audio message status does not switch to peer-read until voice is listened to', () => {
  const message = {
    type: 'audio',
    readBy: [{ email: 'nika@example.com', login: 'nika' }],
    audio: {
      consumed: false,
      consumedByEmail: '',
      expired: false,
    },
  }

  assert.equal(isChatMessageReadByPeer(message, 'wardercompany@gmail.com'), false)
  assert.equal(getChatMessageStatusIcon(message, 'wardercompany@gmail.com'), '✓')
  assert.equal(getChatMessageStatusTitle(message, 'wardercompany@gmail.com'), 'Отправлено')
})

test('audio message status uses listener identity instead of current user playback', () => {
  const message = {
    type: 'audio',
    readBy: [],
    audio: {
      consumed: true,
      consumedByEmail: 'nika@example.com',
      expired: false,
    },
  }

  assert.equal(isChatMessageReadByPeer(message, 'wardercompany@gmail.com'), true)
  assert.equal(getChatMessageStatusIcon(message, 'wardercompany@gmail.com'), '✓✓')
  assert.equal(
    getChatMessageStatusTitle(message, 'wardercompany@gmail.com'),
    'Голосовое прослушано',
  )
})

test('image message status uses viewer identity instead of generic read receipts', () => {
  const message = {
    type: 'image',
    readBy: [],
    image: {
      consumed: true,
      consumedByEmail: 'nika@example.com',
      expired: false,
    },
  }

  assert.equal(isChatMessageReadByPeer(message, 'wardercompany@gmail.com'), true)
  assert.equal(getChatMessageStatusIcon(message, 'wardercompany@gmail.com'), '✓✓')
  assert.equal(
    getChatMessageStatusTitle(message, 'wardercompany@gmail.com'),
    'Изображение просмотрено',
  )
})

test('file message status uses downloader identity instead of generic read receipts', () => {
  const message = {
    type: 'file',
    readBy: [],
    file: {
      consumed: true,
      consumedByEmail: 'nika@example.com',
      expired: false,
    },
  }

  assert.equal(isChatMessageReadByPeer(message, 'wardercompany@gmail.com'), true)
  assert.equal(getChatMessageStatusIcon(message, 'wardercompany@gmail.com'), '✓✓')
  assert.equal(getChatMessageStatusTitle(message, 'wardercompany@gmail.com'), 'Файл скачан')
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

test('extracts the first image file from dropped data transfer items', () => {
  const image = { name: 'preview.png', type: 'image/png' }

  assert.equal(
    getDroppedImageFile({
      items: [
        { kind: 'file', getAsFile: () => ({ name: 'doc.txt', type: 'text/plain' }) },
        { kind: 'file', getAsFile: () => image },
      ],
    }),
    image,
  )
})

test('falls back to dropped files and ignores non-image payloads', () => {
  const image = { name: 'photo.webp', type: 'image/webp' }

  assert.equal(
    getDroppedImageFile({
      files: [{ name: 'report.pdf', type: 'application/pdf' }, image],
    }),
    image,
  )
  assert.equal(
    getDroppedImageFile({
      files: [{ name: 'report.pdf', type: 'application/pdf' }],
    }),
    null,
  )
})

test('groups reactions by emoji and detects current user reaction', () => {
  const reactions = [
    { emoji: '🔥', userEmail: 'alice@example.com', userLogin: 'alice' },
    { emoji: '🔥', userEmail: 'bob@example.com', userLogin: 'bob' },
    { emoji: '👍', userEmail: 'carol@example.com', userLogin: 'carol' },
  ]

  assert.deepEqual(groupChatReactions(reactions), [
    { emoji: '🔥', count: 2 },
    { emoji: '👍', count: 1 },
  ])
  assert.equal(getCurrentUserReactionEmoji(reactions, 'alice@example.com'), '🔥')
  assert.equal(getCurrentUserReactionEmoji(reactions, 'nobody@example.com'), '')
})

test('allows editing only own text messages', () => {
  assert.equal(
    isChatMessageEditable({ type: 'text', senderEmail: 'alice@example.com' }, 'alice@example.com'),
    true,
  )
  assert.equal(
    isChatMessageEditable({ type: 'audio', senderEmail: 'alice@example.com' }, 'alice@example.com'),
    false,
  )
  assert.equal(
    isChatMessageEditable({ type: 'text', senderEmail: 'bob@example.com' }, 'alice@example.com'),
    false,
  )
})

test('builds reply preview labels for text and one-time media', () => {
  assert.equal(getChatReplyPreviewText({ type: 'text', text: '  Привет  ' }), 'Привет')
  assert.equal(getChatReplyPreviewText({ type: 'audio', text: 'ignored' }), 'Голосовое сообщение')
  assert.equal(getChatReplyPreviewText({ type: 'image', text: 'ignored' }), 'Изображение')
  assert.equal(getChatReplyPreviewText({ type: 'file', text: 'ignored' }), 'Файл')
})

test('builds compact search excerpt around the match', () => {
  const excerpt = buildChatSearchExcerpt(
    'Это довольно длинное сообщение про критичный релиз и срочное исправление бага в чате',
    'релиз',
    40,
  )

  assert.match(excerpt, /релиз/i)
  assert.ok(excerpt.length <= 42)
  assert.equal(buildChatSearchExcerpt('Короткий текст', '', 40), 'Короткий текст')
})

test('detects reply swipe only for mobile-sized right swipes', () => {
  assert.deepEqual(
    getChatSwipeReplyState({
      startX: 10,
      startY: 10,
      currentX: 96,
      currentY: 20,
      isMobile: true,
    }),
    { offsetX: 72, shouldReply: true },
  )

  assert.deepEqual(
    getChatSwipeReplyState({
      startX: 10,
      startY: 10,
      currentX: 40,
      currentY: 14,
      isMobile: true,
    }),
    { offsetX: 30, shouldReply: false },
  )

  assert.deepEqual(
    getChatSwipeReplyState({
      startX: 10,
      startY: 10,
      currentX: 96,
      currentY: 70,
      isMobile: true,
    }),
    { offsetX: 0, shouldReply: false },
  )

  assert.deepEqual(
    getChatSwipeReplyState({
      startX: 10,
      startY: 10,
      currentX: 96,
      currentY: 20,
      isMobile: false,
    }),
    { offsetX: 0, shouldReply: false },
  )
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

test('marks consumed or expired audio message button as unavailable', () => {
  assert.equal(
    getAudioMessageButtonLabel({ audio: { consumed: true, expired: false } }, null),
    'Недоступно',
  )
  assert.equal(
    getAudioMessageButtonLabel({ audio: { consumed: false, expired: true } }, null),
    'Недоступно',
  )
  assert.equal(
    getAudioMessageButtonLabel({ audio: { consumed: false, expired: false } }, 'msg-1', 'msg-1'),
    'Воспроизводим…',
  )
  assert.equal(
    getAudioMessageButtonLabel({ id: 'msg-2', audio: { consumed: false, expired: false } }, null),
    'Прослушать 1 раз',
  )
})

test('marks consumed or expired file message button as unavailable', () => {
  assert.equal(
    getFileMessageButtonLabel({ file: { consumed: true, expired: false } }, null),
    'Недоступно',
  )
  assert.equal(
    getFileMessageButtonLabel({ file: { consumed: false, expired: true } }, null),
    'Недоступно',
  )
  assert.equal(
    getFileMessageButtonLabel(
      { id: 'msg-1', file: { consumed: false, expired: false } },
      'msg-1',
      'msg-1',
    ),
    'Скачиваем…',
  )
  assert.equal(
    getFileMessageButtonLabel({ id: 'msg-2', file: { consumed: false, expired: false } }, null),
    'Скачать 1 раз',
  )
})

test('extracts group chat mentions from message text', () => {
  const mentions = extractChatMentions('Привет @nika и @warder, @unknown не подсвечиваем', [
    { login: 'nika', email: 'nika@example.com' },
    { login: 'warder', email: 'warder@example.com' },
  ])

  assert.deepEqual(
    mentions.map((mention) => mention.login),
    ['nika', 'warder'],
  )
})
