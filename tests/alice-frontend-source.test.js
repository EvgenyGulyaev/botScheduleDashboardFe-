import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const readSource = (relativePath) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8')

test('chat view uses automatic alice announce and allows repeating from sent badge', () => {
  const source = readSource('../src/views/Chat.vue')

  assert.doesNotMatch(source, /Отправлять и на Алису/)
  assert.match(source, /const shouldAutoAnnounceOnAlice = computed\(/)
  assert.ok(
    (source.match(/announceOnAlice:\s*shouldAutoAnnounceOnAlice\.value/g) || []).length >= 2,
  )
  assert.match(source, /announceMessageOnAlice = async \(message\) =>/)
  assert.match(
    source,
    /await chatStore\.announceOnAlice\(\{\s*conversationId:\s*activeConversation\.value\.id,\s*messageId:\s*message\.id,\s*\}\)/s,
  )
  assert.match(source, /aliceAnnouncementPendingMessageId/)
  assert.match(source, /aliceAnnouncementErrorMessageId/)
})

test('settings view includes alice quiet hours controls and save payload fields', () => {
  const source = readSource('../src/views/Settings.vue')

  assert.match(source, /Тихие часы/)
  assert.match(source, /[Пп]о Москве/)
  assert.match(source, /v-model="profileForm\.aliceQuietHoursEnabled"/)
  assert.match(source, /v-model="profileForm\.aliceQuietHoursStart"/)
  assert.match(source, /v-model="profileForm\.aliceQuietHoursEnd"/)
  assert.match(source, /payload\.alice_quiet_hours_enabled = nextAliceQuietHoursEnabled/)
  assert.match(source, /payload\.alice_quiet_hours_start = nextAliceQuietHoursStart/)
  assert.match(source, /payload\.alice_quiet_hours_end = nextAliceQuietHoursEnd/)
})
