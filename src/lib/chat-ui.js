export const filterChatUsersForSearch = (users = [], query = '', currentUserEmail = '') => {
  const normalizedQuery = String(query || '').trim().toLowerCase()
  const ownEmail = String(currentUserEmail || '').trim().toLowerCase()

  if (!normalizedQuery) {
    return []
  }

  return users.filter((user) => {
    const email = String(user?.email || '').trim().toLowerCase()
    const login = String(user?.login || '').trim().toLowerCase()

    if (!email || email === ownEmail) {
      return false
    }

    return email.includes(normalizedQuery) || login.includes(normalizedQuery)
  })
}

export const getRecentChatItems = (conversations = [], limit = 5) =>
  conversations.slice(0, limit)

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
