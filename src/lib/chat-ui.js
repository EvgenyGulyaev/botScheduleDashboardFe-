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

export const isAudioMessageExpired = (audio = {}, now = Date.now()) => {
  if (!audio) {
    return false
  }

  if (audio.expired) {
    return true
  }

  const expiresAt = audio.expiresAt ? new Date(audio.expiresAt).getTime() : null
  return Number.isFinite(expiresAt) && expiresAt <= now
}

export const isAudioMessageConsumedByPeer = (audio = {}, currentUserEmail = '') =>
  Boolean(audio?.consumedByEmail) && audio.consumedByEmail !== currentUserEmail

export const isChatMessageReadByPeer = (message = {}, currentUserEmail = '') => {
  if (message?.type === 'audio' && message.audio) {
    return isAudioMessageConsumedByPeer(message.audio, currentUserEmail)
  }

  return (message.readBy || []).some((receipt) => receipt.email && receipt.email !== currentUserEmail)
}

export const getChatMessageStatusIcon = (message = {}, currentUserEmail = '') =>
  isChatMessageReadByPeer(message, currentUserEmail) ? '✓✓' : '✓'

export const getChatMessageStatusTitle = (message = {}, currentUserEmail = '') =>
  isChatMessageReadByPeer(message, currentUserEmail)
    ? message?.type === 'audio'
      ? 'Голосовое прослушано'
      : 'Прочитано собеседником'
    : 'Отправлено'

export const getAudioMessageButtonLabel = (
  message = {},
  playingAudioMessageId = null,
  targetMessageId = message?.id,
) => {
  if (message?.audio?.consumed || isAudioMessageExpired(message?.audio)) {
    return 'Недоступно'
  }

  if (playingAudioMessageId && targetMessageId && playingAudioMessageId === targetMessageId) {
    return 'Воспроизводим…'
  }

  return 'Прослушать 1 раз'
}

export const getChatAudioRecorderLabel = (isRecording = false) =>
  isRecording ? 'Остановить запись' : 'Начать запись'

export const isChatSendShortcut = (event = {}) =>
  event.key === 'Enter' && (event.metaKey || event.ctrlKey)

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
