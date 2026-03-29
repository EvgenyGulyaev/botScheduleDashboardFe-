import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildShortLinkUrl,
  normalizeShortLinks,
  validateOriginalUrl,
} from '../src/lib/short-links.js'

test('builds public short-link url under /short/url', () => {
  const result = buildShortLinkUrl('https://admin.example.com', 'abc123')

  assert.equal(result, 'https://admin.example.com/short/url?url=abc123')
})

test('validates original urls before create', () => {
  assert.equal(validateOriginalUrl(''), 'Вставь ссылку, которую нужно сократить.')
  assert.equal(validateOriginalUrl('notaurl'), 'Ссылка должна начинаться с http:// или https://')
  assert.equal(validateOriginalUrl('https://example.com/page'), '')
})

test('normalizes and sorts short links by created date descending', () => {
  const normalized = normalizeShortLinks([
    {
      short_code: 'older',
      original_url: 'https://example.com/old',
      created_at: '2026-03-28T10:00:00Z',
      clicks: 2,
    },
    {
      short_code: 'newer',
      original_url: 'https://example.com/new',
      created_at: '2026-03-29T10:00:00Z',
      clicks: 5,
    },
  ])

  assert.equal(normalized[0].shortCode, 'newer')
  assert.deepEqual(normalized[0], {
    shortCode: 'newer',
    originalUrl: 'https://example.com/new',
    createdAt: '2026-03-29T10:00:00Z',
    clicks: 5,
  })
})
