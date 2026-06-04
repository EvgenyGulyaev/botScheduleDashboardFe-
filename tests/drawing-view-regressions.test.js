import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const drawingVue = readFileSync(resolve(__dirname, '../src/views/Drawing.vue'), 'utf8')

const functionBody = (name) => {
  const marker = `const ${name} = `
  const start = drawingVue.indexOf(marker)
  assert.notEqual(start, -1, `${name} must exist`)
  const next = drawingVue.indexOf('\nconst ', start + marker.length)
  return drawingVue.slice(start, next === -1 ? undefined : next)
}

test('selecting an existing drawing marks canvas as containing content', () => {
  const body = functionBody('onSelect')
  const loadIndex = body.indexOf('loadImageToCanvas')
  const contentIndex = body.indexOf('hasCanvasContent.value = true')

  assert.notEqual(loadIndex, -1, 'onSelect must load the stored image into canvas')
  assert.ok(
    contentIndex > loadIndex,
    'onSelect must set hasCanvasContent after a stored image is loaded',
  )
})

test('opening an existing drawing mounts editor before loading canvas content', () => {
  const body = functionBody('openExisting')
  const editorIndex = body.indexOf("viewMode.value = 'editor'")
  const selectIndex = body.indexOf('onSelect(item)')

  assert.notEqual(editorIndex, -1, 'openExisting must switch to editor view')
  assert.notEqual(selectIndex, -1, 'openExisting must load selected drawing')
  assert.ok(
    editorIndex < selectIndex,
    'openExisting must mount the editor canvas before loading image content',
  )
})

test('new drawing resets canvas without preserving old undo history', () => {
  const body = functionBody('onNew')

  assert.equal(
    body.includes('clearCanvas()'),
    false,
    'onNew must not call clearCanvas because clearCanvas pushes the previous image into undo history',
  )
  assert.match(body, /resetHistory\(\)/)

  const resetBody = functionBody('resetHistory')
  assert.match(resetBody, /undoStack\.clear\(\)/)
  assert.match(resetBody, /redoStack\.clear\(\)/)
})

test('clear canvas button uses eraser icon instead of ambiguous cross', () => {
  assert.match(drawingVue, /aria-label="Очистить холст"/)
  assert.match(drawingVue, /<svg[\s\S]*?<path d="m7 21-4-4/)
  assert.doesNotMatch(drawingVue, />\s*×\s*</)
})

test('drawing view handles keyboard shortcuts for undo and redo', () => {
  assert.match(drawingVue, /handleEditorKeydown/)
  assert.match(drawingVue, /event\.ctrlKey \|\| event\.metaKey/)
  assert.match(drawingVue, /event\.key\.toLowerCase\(\) === 'z'/)
  assert.match(drawingVue, /event\.key\.toLowerCase\(\) === 'y'/)
  assert.match(drawingVue, /window\.addEventListener\('keydown', handleEditorKeydown\)/)
})

test('drawing view can resize current canvas to viewport without clearing content', () => {
  assert.match(drawingVue, /aria-label="Подогнать холст под экран"/)
  const body = functionBody('resizeCanvasToViewport')

  assert.match(body, /viewportCanvasSize\(\)/)
  assert.match(body, /pushUndo\(\)/)
  assert.match(body, /drawImage\(previous/)
  assert.match(body, /stampObjects\.value = stampObjects\.value\.map/)
  assert.match(body, /renderCanvas\(\)/)
})
