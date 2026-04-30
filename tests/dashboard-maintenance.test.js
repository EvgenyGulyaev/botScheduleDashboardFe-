import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getMaintenanceItemTone,
  normalizeMaintenancePlan,
} from '../src/lib/dashboard-maintenance.js'

test('normalizes server maintenance preview payload', () => {
  const plan = normalizeMaintenancePlan({
    generated_at: '2026-04-30T12:00:00Z',
    total_reclaimable_bytes: 1536,
    total_reclaimable: '1.5K',
    items: [
      {
        key: 'tmp_old',
        title: 'Старые tmp-файлы',
        description: 'Можно удалить',
        path: '/tmp',
        reclaimable_bytes: 1024,
        reclaimable: '1.0K',
        enabled: true,
      },
    ],
  })

  assert.equal(plan.generatedAt, '2026-04-30T12:00:00Z')
  assert.equal(plan.totalReclaimableBytes, 1536)
  assert.equal(plan.items[0].key, 'tmp_old')
  assert.equal(plan.items[0].enabled, true)
})

test('maps maintenance item tone from size and availability', () => {
  assert.equal(getMaintenanceItemTone({ enabled: false, reclaimableBytes: 1000 }), 'muted')
  assert.equal(getMaintenanceItemTone({ enabled: true, reclaimableBytes: 0 }), 'ok')
  assert.equal(getMaintenanceItemTone({ enabled: true, reclaimableBytes: 1024 * 1024 }), 'warning')
})
