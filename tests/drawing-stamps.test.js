import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DRAWING_STAMP_SIZE_DEFAULT,
  clampStampSize,
  normalizeDrawingStamp,
  normalizeDrawingStamps,
  resolveStampPriority,
  resolveStampText,
  shouldShowStampPriorityControls,
  validateDrawingStampDraft,
} from '../src/lib/drawing-stamps.js'

test('default stamp size starts compact', () => {
  assert.equal(DRAWING_STAMP_SIZE_DEFAULT, 20)
  assert.equal(clampStampSize(undefined), 20)
})

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

test('validateDrawingStampDraft allows text-only stamps without an image', () => {
  assert.equal(validateDrawingStampDraft({ name: '', textValue: 'x', priority: 'text', hasImage: false }).ok, false)
  assert.deepEqual(validateDrawingStampDraft({ name: 'x', textValue: '', priority: 'text', hasImage: false }), { ok: true })
  assert.deepEqual(validateDrawingStampDraft({ name: 'x', textValue: 'x', priority: 'image', hasImage: false }), { ok: true })
  assert.deepEqual(validateDrawingStampDraft({ name: 'x', textValue: 'x', priority: 'text', hasImage: false }), { ok: true })
})

test('stamp helpers derive text and priority from available content', () => {
  assert.equal(resolveStampText({ name: 'Евгений', textValue: '' }), 'Евгений')
  assert.equal(resolveStampText({ name: 'Евгений', textValue: 'Жених' }), 'Жених')
  assert.equal(resolveStampPriority({ name: 'Евгений', textValue: '', priority: 'image', hasImage: false }), 'text')
  assert.equal(resolveStampPriority({ name: 'Евгений', textValue: '', priority: 'image', hasImage: true }), 'image')
  assert.equal(shouldShowStampPriorityControls({ name: 'Евгений', textValue: '', hasImage: false }), false)
  assert.equal(shouldShowStampPriorityControls({ name: 'Евгений', textValue: '', hasImage: true }), true)
})
