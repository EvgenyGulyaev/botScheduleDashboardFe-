import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appVue = readFileSync(resolve(__dirname, '../src/App.vue'), 'utf8')

test('desktop app dropdown opens by click for tablet touch screens', () => {
  assert.match(appVue, /openDesktopMenu/)
  assert.match(appVue, /@click="toggleDesktopMenu\('apps'\)"/)
  assert.match(appVue, /v-if="openDesktopMenu === 'apps'"/)
  assert.match(appVue, /@click="closeDesktopMenu"/)
})

test('desktop navigation does not depend on hover-only dropdowns', () => {
  assert.doesNotMatch(appVue, /group-hover:opacity-100/)
  assert.doesNotMatch(appVue, /group-hover:visible/)
})
