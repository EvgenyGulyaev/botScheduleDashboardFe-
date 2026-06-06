import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatServiceUptime,
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
    meta: ['2h', 'RAM 9.8M'],
  })
})

test('formats service uptime as compact duration', () => {
  assert.equal(formatServiceUptime('48min ago'), '48m')
  assert.equal(formatServiceUptime('2h ago'), '2h')
  assert.equal(formatServiceUptime('2hours ago'), '2h')
  assert.equal(formatServiceUptime('1 week ago'), '7d')
  assert.equal(formatServiceUptime('1 week 5 days ago'), '12d')
  assert.equal(formatServiceUptime('2 days ago'), '2d')
  assert.equal(formatServiceUptime('35s ago'), '35s')
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
