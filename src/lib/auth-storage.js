import { resolveDefaultAppValue } from './default-app.js'

export const normalizeAuthUser = (payload = {}) => {
  const notificationSettings = payload?.notification_settings ?? payload?.notificationSettings ?? {}
  const push = payload?.push ?? payload?.pushConfig ?? {}
  const alice = payload?.alice_settings ?? payload?.aliceSettings ?? {}
  const aliceVoice =
    alice?.voice ??
    alice?.voice_id ??
    alice?.voiceId ??
    alice?.default_voice ??
    alice?.defaultVoice ??
    payload?.alice_voice ??
    payload?.aliceVoice ??
    ''
  const aliceQuietHoursEnabled =
    alice?.quiet_hours_enabled ??
    alice?.quietHoursEnabled ??
    payload?.alice_quiet_hours_enabled ??
    payload?.aliceQuietHoursEnabled ??
    false
  const aliceQuietHoursStart =
    alice?.quiet_hours_start ??
    alice?.quietHoursStart ??
    payload?.alice_quiet_hours_start ??
    payload?.aliceQuietHoursStart ??
    ''
  const aliceQuietHoursEnd =
    alice?.quiet_hours_end ??
    alice?.quietHoursEnd ??
    payload?.alice_quiet_hours_end ??
    payload?.aliceQuietHoursEnd ??
    ''

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
    alice_settings: {
      account_id: alice?.account_id ?? alice?.accountId ?? '',
      household_id: alice?.household_id ?? alice?.householdId ?? '',
      room_id: alice?.room_id ?? alice?.roomId ?? '',
      device_id: alice?.device_id ?? alice?.deviceId ?? '',
      scenario_id: alice?.scenario_id ?? alice?.scenarioId ?? '',
      voice: aliceVoice,
      disabled: Boolean(alice?.disabled ?? alice?.aliceDisabled ?? false),
      quiet_hours_enabled: Boolean(aliceQuietHoursEnabled),
      quiet_hours_start: String(aliceQuietHoursStart || ''),
      quiet_hours_end: String(aliceQuietHoursEnd || ''),
    },
    aliceSettings: {
      accountId: alice?.account_id ?? alice?.accountId ?? '',
      householdId: alice?.household_id ?? alice?.householdId ?? '',
      roomId: alice?.room_id ?? alice?.roomId ?? '',
      deviceId: alice?.device_id ?? alice?.deviceId ?? '',
      scenarioId: alice?.scenario_id ?? alice?.scenarioId ?? '',
      voice: aliceVoice,
      disabled: Boolean(alice?.disabled ?? alice?.aliceDisabled ?? false),
      quietHoursEnabled: Boolean(aliceQuietHoursEnabled),
      quietHoursStart: String(aliceQuietHoursStart || ''),
      quietHoursEnd: String(aliceQuietHoursEnd || ''),
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
