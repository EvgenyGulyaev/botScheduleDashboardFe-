import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildWeddingCsv,
  normalizeWeddingRSVPs,
  summarizeWeddingRSVPs,
} from '../src/lib/wedding.js'

const weddingViewSource = () =>
  readFileSync(new URL('../src/views/Wedding.vue', import.meta.url), 'utf8')

test('normalizes wedding rsvps from backend payload', () => {
  const items = normalizeWeddingRSVPs([
    {
      id: 7,
      full_name: 'Анна Иванова',
      attendance: 'attending',
      drinks: ['Белое сухое'],
      other_drink: 'Сидр',
      song: 'ABBA - Dancing Queen',
      created_at: '2026-05-24T10:00:00Z',
    },
  ])

  assert.deepEqual(items, [
    {
      id: '7',
      fullName: 'Анна Иванова',
      attendance: 'attending',
      attendanceLabel: 'Буду',
      drinks: ['Белое сухое'],
      otherDrink: 'Сидр',
      song: 'ABBA - Dancing Queen',
      createdAt: '2026-05-24T10:00:00Z',
    },
  ])
})

test('summarizes wedding rsvps and counts matching drinks', () => {
  const summary = summarizeWeddingRSVPs(
    normalizeWeddingRSVPs([
      {
        full_name: 'Анна',
        attendance: 'attending',
        drinks: ['Белое сухое', 'Другое'],
        other_drink: 'Сидр',
      },
      {
        full_name: 'Петр',
        attendance: 'attending',
        drinks: ['Белое сухое'],
      },
      {
        full_name: 'Мария',
        attendance: 'not_attending',
        drinks: ['Водка'],
      },
    ]),
  )

  assert.deepEqual(summary, {
    total: 3,
    attending: 2,
    notAttending: 1,
    drinkCounts: [
      { name: 'Белое сухое', count: 2 },
      { name: 'Сидр', count: 1 },
      { name: 'Водка', count: 1 },
    ],
  })
})

test('builds excel-friendly csv with utf bom and escaped values', () => {
  const csv = buildWeddingCsv(
    normalizeWeddingRSVPs([
      {
        full_name: 'Анна "Аня" Иванова',
        attendance: 'attending',
        drinks: ['Белое сухое', 'Другое'],
        other_drink: 'Сидр',
        song: 'ABBA; Dancing Queen',
        created_at: '2026-05-24T10:00:00Z',
      },
    ]),
  )

  assert.equal(
    csv,
    '\uFEFF"Дата";"Имя";"Статус";"Напитки";"Другое";"Композиция"\n"24.05.2026, 10:00";"Анна ""Аня"" Иванова";"Буду";"Белое сухое, Другое";"Сидр";"ABBA; Dancing Queen"',
  )
})

test('wedding admin exposes rsvp delete action', () => {
  const source = weddingViewSource()

  assert.match(source, /deleteWeddingRSVP/)
  assert.match(source, /deleteRSVP/)
  assert.match(source, /Удалить/)
  assert.match(source, /confirm/)
})
