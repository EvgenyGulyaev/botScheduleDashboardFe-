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

test('drawing view switches brush slider to stamp size', () => {
  assert.match(drawingVue, /sliderLabel/)
  assert.match(drawingVue, /Размер/)
})
