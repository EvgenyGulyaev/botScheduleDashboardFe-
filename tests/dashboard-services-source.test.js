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

test('dashboard service cards avoid redundant status text', () => {
  assert.doesNotMatch(dashboardVue, /serviceTile\(service\)\.status/)
})

test('dashboard service cards use compact vertical spacing', () => {
  assert.match(dashboardVue, /px-4 py-3 text-left/)
  assert.match(dashboardVue, /class="text-xl"/)
  assert.match(dashboardVue, /class="mt-2 flex flex-wrap gap-1"/)
})

test('dashboard keeps the page header compact', () => {
  assert.match(dashboardVue, /max-w-7xl mx-auto px-4 py-4/)
  assert.match(dashboardVue, /class="mb-4 flex flex-wrap items-center justify-between gap-3"/)
  assert.match(dashboardVue, /loadingAll \? 'Обновляем\.\.\.' : dashboardTimestampLabel/)
  assert.doesNotMatch(dashboardVue, /<h2[^>]*>\s*Dashboard\s*<\/h2>/)
  assert.doesNotMatch(dashboardVue, /Статус ботов по сервисам/)
  assert.doesNotMatch(dashboardVue, /Данные подтягиваются без перезагрузки страницы/)
})

test('dashboard exposes maintenance as compact cleanup action only when useful', () => {
  assert.doesNotMatch(dashboardVue, /<!-- Обслуживание сервера -->/)
  assert.match(dashboardVue, /v-if="canRunMaintenanceCleanup"/)
  assert.match(dashboardVue, /@click="runMaintenanceCleanup"/)
  assert.match(dashboardVue, /Очистить/)
})
