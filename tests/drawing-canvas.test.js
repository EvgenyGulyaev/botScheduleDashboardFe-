import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clampBrushSize,
  clampCanvasDimension,
  createBlankCanvasState,
  createUndoStack,
  DRAWING_BRUSH_MAX,
  DRAWING_BRUSH_MIN,
  DRAWING_CANVAS_MAX,
  DRAWING_CANVAS_MIN,
  DRAWING_TITLE_MAX_LENGTH,
  DRAWING_UNDO_STACK_MAX,
  normalizeDrawingTitle,
  validateCanvasDimensions,
} from '../src/lib/drawing-canvas.js'

test('normalizeDrawingTitle trims and caps length', () => {
  assert.equal(normalizeDrawingTitle('  hello  '), 'hello')
  assert.equal(normalizeDrawingTitle(''), '')
  assert.equal(normalizeDrawingTitle('   '), '')
  const long = 'a'.repeat(DRAWING_TITLE_MAX_LENGTH + 50)
  const result = normalizeDrawingTitle(long)
  assert.equal([...result].length, DRAWING_TITLE_MAX_LENGTH)
})

test('clampBrushSize enforces min and max', () => {
  assert.equal(clampBrushSize(0), DRAWING_BRUSH_MIN)
  assert.equal(clampBrushSize(-5), DRAWING_BRUSH_MIN)
  assert.equal(clampBrushSize(1000), DRAWING_BRUSH_MAX)
  assert.equal(clampBrushSize(DRAWING_BRUSH_MIN), DRAWING_BRUSH_MIN)
  assert.equal(clampBrushSize(DRAWING_BRUSH_MAX), DRAWING_BRUSH_MAX)
  assert.equal(clampBrushSize('not a number'), DRAWING_BRUSH_MIN)
  assert.equal(clampBrushSize(12.4), 12)
})

test('createBlankCanvasState keeps positive dimensions', () => {
  const state = createBlankCanvasState(800, 600)
  assert.equal(state.width, 800)
  assert.equal(state.height, 600)
  assert.equal(state.background, '#ffffff')
  const empty = createBlankCanvasState(0, 0)
  assert.equal(empty.width, DRAWING_CANVAS_MIN)
  assert.equal(empty.height, DRAWING_CANVAS_MIN)
})

test('undo stack caps at max length and supports pop/clear', () => {
  const stack = createUndoStack({ max: 3 })
  assert.equal(stack.size(), 0)
  assert.equal(stack.canUndo(), false)
  stack.push('a')
  stack.push('b')
  stack.push('c')
  stack.push('d')
  assert.equal(stack.size(), 3)
  assert.equal(stack.canUndo(), true)
  assert.equal(stack.pop(), 'd')
  assert.equal(stack.pop(), 'c')
  stack.clear()
  assert.equal(stack.size(), 0)
  assert.equal(stack.pop(), null)
})

test('undo stack uses default max length', () => {
  const stack = createUndoStack()
  for (let i = 0; i < DRAWING_UNDO_STACK_MAX + 10; i++) {
    stack.push(`s${i}`)
  }
  assert.equal(stack.size(), DRAWING_UNDO_STACK_MAX)
  assert.equal(stack.pop(), `s${DRAWING_UNDO_STACK_MAX + 10 - 1}`)
})

test('undo stack ignores null and undefined pushes', () => {
  const stack = createUndoStack()
  stack.push(null)
  stack.push(undefined)
  assert.equal(stack.size(), 0)
})

test('validateCanvasDimensions enforces min and max', () => {
  assert.deepEqual(validateCanvasDimensions(100, 100), { ok: true, width: 100, height: 100 })
  const tooSmall = validateCanvasDimensions(10, 10)
  assert.equal(tooSmall.ok, false)
  const tooBig = validateCanvasDimensions(9999, 9999)
  assert.equal(tooBig.ok, false)
  const nan = validateCanvasDimensions("foo", 100)
  assert.equal(nan.ok, false)
})

test('clampCanvasDimension rounds and bounds', () => {
  assert.equal(clampCanvasDimension(100), 100)
  assert.equal(clampCanvasDimension(10), DRAWING_CANVAS_MIN)
  assert.equal(clampCanvasDimension(99999), DRAWING_CANVAS_MAX)
  assert.equal(clampCanvasDimension(100.7), 100)
})
