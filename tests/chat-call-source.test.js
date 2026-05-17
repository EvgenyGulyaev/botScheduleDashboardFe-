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

test('mobile chat covers the app header and tracks the visual viewport height', () => {
  const source = chatSource()

  assert.match(source, /chatMobileViewportStyle/)
  assert.match(source, /--chat-mobile-viewport-height/)
  assert.match(source, /visualViewport/)
  assert.doesNotMatch(source, /fixed inset-x-0 bottom-0 top-16 overflow-hidden bg-white/)
})

test('mobile call focus keeps participant thumbnails visible', () => {
  const source = chatSource()

  assert.match(source, /getInitialCallFocusEmail/)
  assert.match(source, /mobileConversationMode\s*\?\s*'flex/)
  assert.doesNotMatch(source, /mobileConversationMode\s*\?\s*'hidden'/)
})
