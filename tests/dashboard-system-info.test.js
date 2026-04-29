import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSystemInfo, systemUsageTone } from '../src/lib/dashboard-system-info.js'

test('normalizes server system info payload', () => {
  const info = normalizeSystemInfo({
    hostname: 'srv',
    os: 'linux',
    arch: 'amd64',
    cpu: {
      cores: 4,
      load: { one: 0.5, five: 0.25, fifteen: 0.1 },
    },
    memory: {
      total: '1.0G',
      used: '512.0M',
      available: '512.0M',
      used_percent: 50,
      swap_used: '0B',
    },
    disk: {
      path: '/',
      total: '20.0G',
      used: '8.0G',
      free: '12.0G',
      used_percent: 40,
    },
    uptime: { human: '2d 3h 10m' },
  })

  assert.equal(info.hostname, 'srv')
  assert.equal(info.cpu.cores, 4)
  assert.equal(info.memory.usedPercent, 50)
  assert.equal(info.disk.usedPercent, 40)
  assert.equal(info.uptime.human, '2d 3h 10m')
})

test('maps usage percent to dashboard tone', () => {
  assert.equal(systemUsageTone(30), 'ok')
  assert.equal(systemUsageTone(75), 'warning')
  assert.equal(systemUsageTone(92), 'danger')
})
