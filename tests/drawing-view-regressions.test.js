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
