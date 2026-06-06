import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dashboardVue = readFileSync(resolve(__dirname, '../src/views/Dashboard.vue'), 'utf8')

test('dashboard service cards include drawing service daemon', () => {
  assert.match(dashboardVue, /'drawing-service'/)
})

test('dashboard puts server overview before service sections', () => {
  const serverIndex = dashboardVue.indexOf('<!-- Сервер -->')
  const servicesIndex = dashboardVue.indexOf('<!-- Все сервисы -->')
  const selectedServiceIndex = dashboardVue.indexOf('<!-- Детали выбранного сервиса -->')

  assert.notEqual(serverIndex, -1)
  assert.notEqual(servicesIndex, -1)
  assert.notEqual(selectedServiceIndex, -1)
  assert.ok(serverIndex < servicesIndex)
  assert.ok(serverIndex < selectedServiceIndex)
})

test('dashboard does not keep the old top service selector', () => {
  assert.doesNotMatch(dashboardVue, /<label[^>]*>\s*Сервис:/)
})

test('dashboard exposes maintenance as compact cleanup action only when useful', () => {
  assert.doesNotMatch(dashboardVue, /<!-- Обслуживание сервера -->/)
  assert.match(dashboardVue, /v-if="canRunMaintenanceCleanup"/)
  assert.match(dashboardVue, /@click="runMaintenanceCleanup"/)
  assert.match(dashboardVue, /Очистить/)
})
