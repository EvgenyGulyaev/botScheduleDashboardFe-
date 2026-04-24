import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildAliceAnnouncementPayload,
  filterAliceDevices,
  filterAliceRooms,
  getAliceHouseholdOptions,
  getAliceVoiceOptions,
  normalizeAliceAccountResources,
} from '../src/lib/alice.js'

test('normalizes alice account resources with voices from payload and devices', () => {
  const resources = normalizeAliceAccountResources({
    households: [{ id: 'home-1', name: 'Дом' }],
    rooms: [{ id: 'room-1', household_id: 'home-1', name: 'Кухня' }],
    devices: [
      {
        id: 'speaker-1',
        household_id: 'home-1',
        room_id: 'room-1',
        name: 'Станция',
        voice_options: ['jane', { id: 'ermil', title: 'Ermil' }],
      },
    ],
    voices: [{ value: 'oksana', label: 'Oksana' }],
  })

  assert.deepEqual(resources.households, [{ id: 'home-1', name: 'Дом' }])
  assert.equal(resources.rooms[0].name, 'Кухня')
  assert.equal(resources.devices[0].name, 'Станция')
  assert.deepEqual(resources.voices, [
    { value: 'oksana', label: 'Oksana' },
    { value: 'jane', label: 'jane' },
    { value: 'ermil', label: 'Ermil' },
  ])
})

test('builds alice options and filters resources by selected location', () => {
  const households = getAliceHouseholdOptions({
    households: [{ id: 'home-1' }],
    rooms: [{ id: 'room-1', household_id: 'home-1', name: 'Кухня' }],
    devices: [{ id: 'speaker-1', household_id: 'home-1', room_id: 'room-1', name: 'Станция' }],
  })

  assert.deepEqual(households, [{ id: 'home-1', label: 'Дом 1' }])
  assert.deepEqual(filterAliceRooms([{ id: 'room-1', household_id: 'home-1', name: 'Кухня' }], 'home-1'), [
    { id: 'room-1', household_id: 'home-1', name: 'Кухня' },
  ])
  assert.deepEqual(
    filterAliceDevices(
      [
        { id: 'speaker-1', household_id: 'home-1', room_id: 'room-1', name: 'Станция' },
        { id: 'speaker-2', household_id: 'home-2', room_id: 'room-2', name: 'Мини' },
      ],
      'home-1',
      'room-1',
    ),
    [{ id: 'speaker-1', household_id: 'home-1', room_id: 'room-1', name: 'Станция' }],
  )
})

test('keeps selected alice voice in options even when backend does not return it', () => {
  const options = getAliceVoiceOptions({
    account: {
      voices: [{ value: 'jane', label: 'Jane' }],
    },
    devices: [
      {
        id: 'speaker-1',
        supported_voices: ['ermil'],
      },
    ],
    selectedDeviceId: 'speaker-1',
    selectedVoice: 'oksana',
  })

  assert.deepEqual(options, [
    { value: '', label: 'По умолчанию сервиса' },
    { value: 'jane', label: 'Jane' },
    { value: 'ermil', label: 'ermil' },
    { value: 'oksana', label: 'oksana' },
  ])
})

test('builds alice announce payload with optional target overrides', () => {
  const payload = buildAliceAnnouncementPayload({
    text: 'Привет',
    accountId: 'acc-1',
    householdId: 'home-1',
    roomId: 'room-1',
    deviceId: 'speaker-1',
    voice: 'jane',
  })

  assert.deepEqual(payload, {
    text: 'Привет',
    account_id: 'acc-1',
    household_id: 'home-1',
    room_id: 'room-1',
    device_id: 'speaker-1',
    voice: 'jane',
  })
})
