import test from 'node:test'
import assert from 'node:assert/strict'
import {
  collectVisibilityGroupOptions,
  normalizeVisibilityGroup,
  normalizeVisibilityGroups,
} from '../src/lib/visibility-groups.js'

test('normalizes visibility groups like backend and removes duplicates', () => {
  assert.equal(normalizeVisibilityGroup(' General Team '), 'general-team')
  assert.equal(normalizeVisibilityGroup('Family_1'), 'family_1')
  assert.equal(normalizeVisibilityGroup('???'), '')

  assert.deepEqual(normalizeVisibilityGroups([' General ', 'family', 'general', '']), [
    'general',
    'family',
  ])
})

test('collects visibility group options from users and selected tags', () => {
  const users = [
    { visibilityGroups: ['general', 'family'] },
    { visibilityGroups: ['work', 'family'] },
    { visibilityGroups: [] },
  ]

  assert.deepEqual(collectVisibilityGroupOptions(users, ['admins']), [
    'general',
    'admins',
    'family',
    'work',
  ])
})
