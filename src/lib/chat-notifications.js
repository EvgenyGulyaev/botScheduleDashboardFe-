const CHAT_SOUND_ENABLED_KEY = 'chat.sound.enabled'

const normalizeString = (value) => String(value ?? '').trim()

export const isChatSoundEnabled = (storage = globalThis.localStorage) =>
  storage?.getItem(CHAT_SOUND_ENABLED_KEY) === 'true'

export const setChatSoundEnabled = (enabled, storage = globalThis.localStorage) => {
  if (!storage) {
    return enabled
  }

  storage.setItem(CHAT_SOUND_ENABLED_KEY, enabled ? 'true' : 'false')
  return enabled
}

export const shouldNotifyIncomingChatMessage = (
  envelope,
  { currentUserEmail = '', activeConversationId = '' } = {},
) => {
  const event = envelope?.event || envelope?.type
  if (event !== 'message_persisted') {
    return false
  }

  const message = envelope?.data?.message || {}
  const conversation = envelope?.data?.conversation || {}
  const conversationId = normalizeString(
    message.conversation_id ?? message.conversationId ?? conversation.id,
  )
  const senderEmail = normalizeString(message.sender_email ?? message.senderEmail)

  if (!conversationId || !senderEmail) {
    return false
  }

  if (senderEmail === normalizeString(currentUserEmail)) {
    return false
  }

  return conversationId !== normalizeString(activeConversationId)
}

export const buildIncomingChatNotice = (envelope) => {
  const data = envelope?.data || {}
  const message = data.message || {}
  const conversation = data.conversation || {}
  const sender = normalizeString(message.sender_login ?? message.senderLogin ?? message.sender_email ?? message.senderEmail) || 'пользователя'
  const conversationTitle = normalizeString(conversation.title) || 'Чат'
  const text = normalizeString(message.text) || 'Новое сообщение'

  return {
    title: `Новое сообщение от ${sender}`,
    message: `${conversationTitle}: ${text}`,
  }
}

export const playChatNotificationSound = ({
  audioContextFactory,
  durationMs = 140,
  frequency = 880,
  volume = 0.08,
} = {}) => {
  const AudioContextClass =
    audioContextFactory ||
    globalThis.AudioContext ||
    globalThis.webkitAudioContext

  if (!AudioContextClass) {
    return false
  }

  try {
    const context = new AudioContextClass()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime || 0

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, now)
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + durationMs / 1000)

    oscillator.onended = () => {
      if (typeof context.close === 'function') {
        context.close()
      }
    }

    return true
  } catch {
    return false
  }
}
