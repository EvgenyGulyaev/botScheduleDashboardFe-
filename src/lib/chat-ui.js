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
