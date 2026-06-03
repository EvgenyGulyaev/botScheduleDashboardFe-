import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeDrawingStamp,
  normalizeDrawingStamps,
  validateDrawingStampDraft,
} from '../src/lib/drawing-stamps.js'

test('normalizeDrawingStamp maps backend stamp payload', () => {
  const stamp = normalizeDrawingStamp({
    id: 10,
    name: 'Seal',
    textValue: 'S',
    hasImage: true,
    imageMimeType: 'image/png',
    imageSize: 100,
    imageWidth: 64,
    imageHeight: 32,
    priority: 'image',
  })

  assert.equal(stamp.id, '10')
  assert.equal(stamp.name, 'Seal')
  assert.equal(stamp.textValue, 'S')
  assert.equal(stamp.hasImage, true)
  assert.equal(stamp.priority, 'image')
})

test('normalizeDrawingStamps handles non arrays', () => {
  assert.deepEqual(normalizeDrawingStamps(null), [])
})

test('validateDrawingStampDraft requires matching priority content', () => {
  assert.equal(validateDrawingStampDraft({ name: '', textValue: 'x', priority: 'text', hasImage: false }).ok, false)
  assert.equal(validateDrawingStampDraft({ name: 'x', textValue: '', priority: 'text', hasImage: false }).ok, false)
  assert.equal(validateDrawingStampDraft({ name: 'x', textValue: 'x', priority: 'image', hasImage: false }).ok, false)
  assert.deepEqual(validateDrawingStampDraft({ name: 'x', textValue: 'x', priority: 'text', hasImage: false }), { ok: true })
})
