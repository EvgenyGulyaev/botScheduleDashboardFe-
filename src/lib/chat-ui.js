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

  return (message.readBy || []).some((receipt) => receipt.email && receipt.email !== currentUserEmail)
}

export const getChatMessageStatusIcon = (message = {}, currentUserEmail = '') =>
  isChatMessageReadByPeer(message, currentUserEmail) ? '✓✓' : '✓'

export const getChatMessageStatusTitle = (message = {}, currentUserEmail = '') =>
  isChatMessageReadByPeer(message, currentUserEmail)
    ? message?.type === 'audio'
      ? 'Голосовое прослушано'
      : message?.type === 'image'
        ? 'Изображение просмотрено'
        : 'Прочитано собеседником'
    : 'Отправлено'

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
