export const readStoredAuth = (storage) => {
  const token = storage.getItem('token')
  const rawUser = storage.getItem('user')

  if (!rawUser) {
    return { token, user: null }
  }

  try {
    return {
      token,
      user: JSON.parse(rawUser),
    }
  } catch {
    return {
      token,
      user: null,
    }
  }
}

export const writeStoredAuth = (storage, { token, user }) => {
  storage.setItem('token', token)

  if (user) {
    storage.setItem('user', JSON.stringify(user))
    return
  }

  storage.removeItem('user')
}

export const clearStoredAuth = (storage) => {
  storage.removeItem('token')
  storage.removeItem('user')
}

export const normalizeAuthPayload = (payload) => {
  const token = payload?.token ?? payload?.Token

  if (!token) {
    throw new Error('Auth payload does not contain a token')
  }

  return {
    token,
    user: payload?.user ?? payload,
  }
}
