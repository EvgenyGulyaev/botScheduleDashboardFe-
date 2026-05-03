import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const chatSource = () => readFileSync(new URL('../src/views/Chat.vue', import.meta.url), 'utf8')

test('chat call view wires screen sharing controls and media state', () => {
  const source = chatSource()

  assert.match(source, /localCallScreenStream/)
  assert.match(source, /localCallScreenSharing/)
  assert.match(source, /toggleCallScreenShare/)
  assert.match(source, /startCallScreenShare/)
  assert.match(source, /stopCallScreenShare/)
  assert.match(source, /getDisplayMedia/)
  assert.match(source, /replacePeerConnectionsVideoTrack/)
  assert.match(source, /screen_sharing/)
  assert.match(source, /Демонстрац/)
})
