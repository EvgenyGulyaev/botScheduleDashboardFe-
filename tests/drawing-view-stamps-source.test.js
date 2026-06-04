import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const drawingVue = readFileSync(resolve(__dirname, '../src/views/Drawing.vue'), 'utf8')

test('drawing view includes separate stamps management screen', () => {
  assert.match(drawingVue, /viewMode === 'stamps'/)
  assert.match(drawingVue, /Кисти/)
  assert.match(drawingVue, /Управление кистями/)
})

test('gallery header exposes visible stamps entry point', () => {
  const galleryStart = drawingVue.indexOf(`viewMode === 'gallery'`)
  const stampsStart = drawingVue.indexOf(`viewMode === 'stamps'`)
  assert.notEqual(galleryStart, -1)
  assert.notEqual(stampsStart, -1)
  const galleryTemplate = drawingVue.slice(galleryStart, stampsStart)
  assert.match(galleryTemplate, /@click="openStampsScreen"[\s\S]*?>\s*Кисти\s*</)
})

test('drawing view switches brush slider to stamp size', () => {
  assert.match(drawingVue, /sliderLabel/)
  assert.match(drawingVue, /Размер/)
})

test('stamp form shows priority only when text and image are both available', () => {
  assert.match(drawingVue, /showStampPriority/)
  assert.match(drawingVue, /v-if="showStampPriority"/)
})
