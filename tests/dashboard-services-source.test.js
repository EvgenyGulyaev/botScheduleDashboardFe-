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

test('dashboard puts service overview before server maintenance sections', () => {
  const servicesIndex = dashboardVue.indexOf('<!-- Все сервисы -->')
  const serverIndex = dashboardVue.indexOf('<!-- Сервер -->')
  const maintenanceIndex = dashboardVue.indexOf('<!-- Обслуживание сервера -->')

  assert.notEqual(servicesIndex, -1)
  assert.notEqual(serverIndex, -1)
  assert.notEqual(maintenanceIndex, -1)
  assert.ok(servicesIndex < serverIndex)
  assert.ok(servicesIndex < maintenanceIndex)
})

test('dashboard does not keep the old top service selector', () => {
  assert.doesNotMatch(dashboardVue, /<label[^>]*>\s*Сервис:/)
})
