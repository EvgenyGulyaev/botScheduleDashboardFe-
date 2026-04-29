import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeAuditEntries } from '../src/lib/admin-audit.js'

test('normalizes admin audit entries for rendering newest operations', () => {
  const entries = normalizeAuditEntries([
    {
      id: '2',
      actor_email: 'evgeny@example.com',
      actor_login: 'evgeny',
      action: 'admin.user.delete',
      target: 'nika@example.com',
      summary: 'Удалён пользователь nika@example.com',
      created_at: '2026-04-29T10:01:00Z',
    },
  ])

  assert.deepEqual(entries, [
    {
      id: '2',
      actorEmail: 'evgeny@example.com',
      actorLogin: 'evgeny',
      action: 'admin.user.delete',
      target: 'nika@example.com',
      summary: 'Удалён пользователь nika@example.com',
      metadata: {},
      createdAt: '2026-04-29T10:01:00Z',
      badge: {
        label: 'Пользователь',
        classes: 'border-sky-200 bg-sky-50 text-sky-800',
      },
    },
  ])
})
