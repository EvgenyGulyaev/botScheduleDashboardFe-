import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatServiceMemoryTotal,
  getServiceHealthBadge,
  getServicesMemoryTotalBytes,
  normalizeServiceStatus,
  summarizeServiceTile,
} from '../src/lib/dashboard-service-status.js'

test('normalizes detailed service status payloads from backend', () => {
  const status = normalizeServiceStatus({
    service: 'dashboard',
    status: 'active',
    sub_state: 'running',
    description: 'Dashboard',
    health: { level: 'ok', message: 'Сервис работает' },
    Stats: {
      pid: '213066',
      memory: '9.8M',
      memory_bytes: 10276044,
      cpu: '44.812s',
      cpu_seconds: 44.812,
      uptime: '2h 15min ago',
      restarts: '2',
      tasks: '8',
    },
    logs: ['started', 'ready'],
  })

  assert.equal(status.service, 'dashboard')
  assert.equal(status.status, 'active')
  assert.equal(status.subState, 'running')
  assert.equal(status.description, 'Dashboard')
  assert.equal(status.health.level, 'ok')
  assert.equal(status.stats.pid, '213066')
  assert.equal(status.stats.memoryBytes, 10276044)
  assert.equal(status.stats.cpuSeconds, 44.812)
  assert.deepEqual(status.logs, ['started', 'ready'])
})

test('builds service tile summary with health icon and compact stats', () => {
  const summary = summarizeServiceTile(
    normalizeServiceStatus({
      service: 'dashboard',
      status: 'active',
      health: { level: 'ok' },
      Stats: {
        memory: '9.8M',
        uptime: '2h ago',
        restarts: '0',
      },
    }),
  )

  assert.deepEqual(summary, {
    icon: '🟢',
    status: 'active',
    meta: ['2h ago', 'RAM 9.8M', '0 restarts'],
  })
})

test('maps health levels to dashboard badge styles', () => {
  assert.equal(getServiceHealthBadge('ok').label, 'OK')
  assert.equal(getServiceHealthBadge('warning').label, 'Внимание')
  assert.equal(getServiceHealthBadge('error').label, 'Ошибка')
})

test('summarizes loaded services memory from bytes', () => {
  const statuses = {
    bot: normalizeServiceStatus({
      service: 'bot',
      Stats: { memory_bytes: 12 * 1024 * 1024 },
    }),
    dashboard: normalizeServiceStatus({
      service: 'dashboard',
      Stats: { memory_bytes: 8.5 * 1024 * 1024 },
    }),
    failed: normalizeServiceStatus({
      service: 'failed',
      Stats: { memory_bytes: -100 },
    }),
  }

  assert.equal(getServicesMemoryTotalBytes(statuses), 20.5 * 1024 * 1024)
  assert.equal(formatServiceMemoryTotal(getServicesMemoryTotalBytes(statuses)), '20.5M')
  assert.equal(formatServiceMemoryTotal(0), '—')
})
