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

export const isChatMessageReadByPeer = (message = {}, currentUserEmail = '') =>
  (message.readBy || []).some((receipt) => receipt.email && receipt.email !== currentUserEmail)

export const getChatMessageStatusIcon = (message = {}, currentUserEmail = '') =>
  isChatMessageReadByPeer(message, currentUserEmail) ? '✓✓' : '✓'

export const getChatMessageStatusTitle = (message = {}, currentUserEmail = '') =>
  isChatMessageReadByPeer(message, currentUserEmail) ? 'Прочитано собеседником' : 'Отправлено'

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
