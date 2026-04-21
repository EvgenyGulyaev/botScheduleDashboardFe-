import { resolveDefaultAppValue } from './default-app.js'

export const normalizeAuthUser = (payload = {}) => {
  const notificationSettings = payload?.notification_settings ?? payload?.notificationSettings ?? {}
  const push = payload?.push ?? payload?.pushConfig ?? {}

  return {
    ...payload,
    login: payload?.login ?? '',
    email: payload?.email ?? '',
    isAdmin: Boolean(payload?.is_admin ?? payload?.isAdmin),
    defaultApp: resolveDefaultAppValue(payload?.default_app ?? payload?.defaultApp ?? 'chat'),
    notificationSettings: {
      pushEnabled: Boolean(
        notificationSettings?.push_enabled ?? notificationSettings?.pushEnabled ?? false,
      ),
      soundEnabled:
        notificationSettings?.sound_enabled ?? notificationSettings?.soundEnabled ?? true,
      toastEnabled:
        notificationSettings?.toast_enabled ?? notificationSettings?.toastEnabled ?? true,
    },
    push: {
      supported: Boolean(push?.supported ?? false),
      publicKey: push?.public_key ?? push?.publicKey ?? '',
    },
  }
}

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
    user: normalizeAuthUser(payload?.user ?? payload),
  }
}
