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

export const getConversationMembersSummary = (conversation = {}, currentUserEmail = '') => {
  const ownEmail = String(currentUserEmail || '').trim().toLowerCase()
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

export const isChatSendShortcut = (event = {}) =>
  event.key === 'Enter' && (event.metaKey || event.ctrlKey)
