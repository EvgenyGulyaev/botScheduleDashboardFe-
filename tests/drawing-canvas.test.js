import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clampBrushSize,
  createBlankCanvasState,
  createUndoStack,
  DRAWING_BRUSH_MAX,
  DRAWING_BRUSH_MIN,
  DRAWING_TITLE_MAX_LENGTH,
  DRAWING_UNDO_STACK_MAX,
  normalizeDrawingTitle,
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
  assert.equal(empty.width, 1)
  assert.equal(empty.height, 1)
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
