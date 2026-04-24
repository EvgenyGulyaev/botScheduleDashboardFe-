const toArray = (value) => (Array.isArray(value) ? value : [])

const normalizeString = (value) => (value == null ? '' : String(value).trim())

const normalizeVoiceOption = (voice) => {
  if (typeof voice === 'string') {
    const value = normalizeString(voice)
    return value ? { value, label: value } : null
  }

  const value = normalizeString(
    voice?.value ??
      voice?.id ??
      voice?.voice ??
      voice?.name ??
      voice?.code,
  )
  const label = normalizeString(
    voice?.label ??
      voice?.title ??
      voice?.name ??
      voice?.voice ??
      value,
  )

  return value ? { value, label: label || value } : null
}

const appendVoiceOptions = (target, seen, voices = []) => {
  for (const voice of toArray(voices)) {
    const normalized = normalizeVoiceOption(voice)
    if (!normalized || seen.has(normalized.value)) {
      continue
    }

    seen.add(normalized.value)
    target.push(normalized)
  }

  return target
}

const getEntityVoices = (entity = {}) =>
  toArray(
    entity?.voices ??
      entity?.voice_options ??
      entity?.voiceOptions ??
      entity?.supported_voices ??
      entity?.supportedVoices,
  )

export const normalizeAliceAccountResources = (payload = {}) => {
  const households = toArray(payload?.households)
  const rooms = toArray(payload?.rooms)
  const devices = toArray(payload?.devices)
  const scenarios = toArray(payload?.scenarios)
  const voices = []
  const seenVoices = new Set()

  appendVoiceOptions(voices, seenVoices, payload?.voices ?? payload?.voice_options ?? payload?.voiceOptions)
  for (const device of devices) {
    appendVoiceOptions(voices, seenVoices, getEntityVoices(device))
  }

  return {
    households,
    rooms,
    devices,
    scenarios,
    voices,
  }
}

export const getAliceHouseholdOptions = ({
  households = [],
  rooms = [],
  devices = [],
} = {}) => {
  const ids = []
  const seen = new Set()

  for (const household of households) {
    const id = normalizeString(household?.id)
    if (!id || seen.has(id)) {
      continue
    }

    seen.add(id)
    ids.push(id)
  }

  for (const room of rooms) {
    const id = normalizeString(room?.household_id ?? room?.householdId)
    if (!id || seen.has(id)) {
      continue
    }

    seen.add(id)
    ids.push(id)
  }

  for (const device of devices) {
    const id = normalizeString(device?.household_id ?? device?.householdId)
    if (!id || seen.has(id)) {
      continue
    }

    seen.add(id)
    ids.push(id)
  }

  return ids.map((id, index) => ({
    id,
    label: `Дом ${index + 1}`,
  }))
}

export const filterAliceRooms = (rooms = [], householdId = '') => {
  const targetHouseholdId = normalizeString(householdId)
  return toArray(rooms).filter((room) => {
    if (!targetHouseholdId) {
      return true
    }

    return normalizeString(room?.household_id ?? room?.householdId) === targetHouseholdId
  })
}

export const filterAliceDevices = (devices = [], householdId = '', roomId = '') => {
  const targetHouseholdId = normalizeString(householdId)
  const targetRoomId = normalizeString(roomId)

  return toArray(devices).filter((device) => {
    const deviceHouseholdId = normalizeString(device?.household_id ?? device?.householdId)
    const deviceRoomId = normalizeString(device?.room_id ?? device?.roomId)

    return (
      (!targetHouseholdId || deviceHouseholdId === targetHouseholdId) &&
      (!targetRoomId || deviceRoomId === targetRoomId)
    )
  })
}

export const getAliceVoiceOptions = ({
  resources = null,
  account = null,
  devices = [],
  selectedDeviceId = '',
  selectedVoice = '',
} = {}) => {
  const options = [{ value: '', label: 'По умолчанию сервиса' }]
  const seen = new Set([''])
  const normalizedDeviceId = normalizeString(selectedDeviceId)
  const normalizedSelectedVoice = normalizeString(selectedVoice)
  const selectedDevice =
    toArray(devices).find((device) => normalizeString(device?.id) === normalizedDeviceId) || null

  appendVoiceOptions(options, seen, resources?.voices)
  appendVoiceOptions(options, seen, getEntityVoices(account))

  if (selectedDevice) {
    appendVoiceOptions(options, seen, getEntityVoices(selectedDevice))
  } else {
    for (const device of toArray(devices)) {
      appendVoiceOptions(options, seen, getEntityVoices(device))
    }
  }

  if (normalizedSelectedVoice && !seen.has(normalizedSelectedVoice)) {
    options.push({
      value: normalizedSelectedVoice,
      label: normalizedSelectedVoice,
    })
  }

  return options
}

export const buildAliceAnnouncementPayload = ({
  conversationId = '',
  messageId = '',
  text = '',
  accountId = '',
  householdId = '',
  roomId = '',
  deviceId = '',
  voice = '',
} = {}) => {
  const payload = {}
  const normalizedConversationId = normalizeString(conversationId)
  const normalizedMessageId = normalizeString(messageId)
  const normalizedText = normalizeString(text)
  const normalizedAccountId = normalizeString(accountId)
  const normalizedHouseholdId = normalizeString(householdId)
  const normalizedRoomId = normalizeString(roomId)
  const normalizedDeviceId = normalizeString(deviceId)
  const normalizedVoice = normalizeString(voice)

  if (normalizedConversationId) {
    payload.conversation_id = normalizedConversationId
  }
  if (normalizedMessageId) {
    payload.message_id = normalizedMessageId
  }
  if (normalizedText) {
    payload.text = normalizedText
  }
  if (normalizedAccountId) {
    payload.account_id = normalizedAccountId
  }
  if (normalizedHouseholdId) {
    payload.household_id = normalizedHouseholdId
  }
  if (normalizedRoomId) {
    payload.room_id = normalizedRoomId
  }
  if (normalizedDeviceId) {
    payload.device_id = normalizedDeviceId
  }
  if (normalizedVoice) {
    payload.voice = normalizedVoice
  }

  return payload
}
