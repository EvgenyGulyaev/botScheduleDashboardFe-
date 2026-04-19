const CHAT_SOUND_ENABLED_KEY = 'chat.sound.enabled'

const normalizeString = (value) => String(value ?? '').trim()

let sharedAudioContext = null

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

  return true
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

const getAudioContext = (audioContextFactory) => {
  const AudioContextClass =
    audioContextFactory ||
    globalThis.AudioContext ||
    globalThis.webkitAudioContext

  if (!AudioContextClass) {
    return null
  }

  if (audioContextFactory) {
    return new AudioContextClass()
  }

  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContextClass()
  }

  return sharedAudioContext
}

const playTone = (context, { durationMs, frequency, volume }) => {
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
}

export const playChatNotificationSound = ({
  audioContextFactory,
  durationMs = 140,
  frequency = 880,
  volume = 0.08,
} = {}) => {
  try {
    const context = getAudioContext(audioContextFactory)
    if (!context) {
      return false
    }

    if (context.state === 'suspended' && typeof context.resume === 'function') {
      const resumeResult = context.resume()
      if (resumeResult && typeof resumeResult.then === 'function') {
        resumeResult
          .then(() => playTone(context, { durationMs, frequency, volume }))
          .catch(() => {})
        return true
      }
    }

    playTone(context, { durationMs, frequency, volume })
    return true
  } catch {
    return false
  }
}
