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

test('drawing view keeps editor inside one viewport on tablets', () => {
  assert.match(drawingVue, /h-\[100dvh\] overflow-hidden/)
  assert.match(drawingVue, /ref="editorStageRef"/)
  assert.match(drawingVue, /class="flex h-full min-h-0 flex-col overflow-hidden"/)
  assert.match(drawingVue, /class="flex min-h-0 flex-1 items-start justify-center overflow-hidden"/)
  assert.doesNotMatch(drawingVue, /ref="editorStageRef"[\s\S]{0,180}items-center/)
  assert.doesNotMatch(drawingVue, /ref="editorStageRef"[\s\S]{0,180}px-3/)
  assert.doesNotMatch(drawingVue, /ref="editorStageRef"[\s\S]{0,180}py-3/)
  assert.match(drawingVue, /maxHeight: '100%'/)
  assert.doesNotMatch(drawingVue, /maxHeight: 'calc\(100vh - 10\.25rem\)'/)
})

test('new drawing measures the mounted editor stage before sizing canvas', () => {
  const body = functionBody('onNew')
  const viewModeIndex = body.indexOf("viewMode.value = 'editor'")
  const tickIndex = body.indexOf('await nextTick()')
  const sizeIndex = body.indexOf('const size = viewportCanvasSize()')

  assert.notEqual(viewModeIndex, -1)
  assert.notEqual(tickIndex, -1)
  assert.notEqual(sizeIndex, -1)
  assert.ok(viewModeIndex < tickIndex)
  assert.ok(tickIndex < sizeIndex)
})

test('editor actions live in one compact toolbar', () => {
  const editorStart = drawingVue.indexOf(`v-else-if="viewMode === 'editor'"`)
  const modalStart = drawingVue.indexOf('v-if="saveModalOpen"', editorStart)
  const editorTemplate = drawingVue.slice(editorStart, modalStart)

  assert.match(editorTemplate, /role="toolbar"/)
  assert.match(editorTemplate, /aria-label="Назад к изображениям"/)
  assert.match(editorTemplate, /@click="openSaveModal"/)
  assert.match(editorTemplate, /class="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto/)
  assert.match(editorTemplate, /class="shrink-0 rounded-full bg-slate-950/)
  assert.doesNotMatch(editorTemplate, />\s*Изображения\s*</)
  assert.doesNotMatch(editorTemplate, />\s*Кисти\s*</)
})
