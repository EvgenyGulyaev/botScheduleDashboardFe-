import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatLastUpdatedLabel,
  validateGeoForm,
  validateLoginForm,
} from '../src/lib/view-feedback.js'

test('validates login form fields with friendly messages', () => {
  const emptyErrors = validateLoginForm({ email: '', password: '' })
  const invalidEmailErrors = validateLoginForm({ email: 'wrong-email', password: '123456' })
  const validErrors = validateLoginForm({ email: 'admin@example.com', password: '123456' })

  assert.deepEqual(emptyErrors, {
    email: 'Укажи email для входа.',
    password: 'Введи пароль.',
  })
  assert.deepEqual(invalidEmailErrors, {
    email: 'Похоже, email введён не полностью.',
  })
  assert.deepEqual(validErrors, {})
})

test('validates geo form for city and coordinates modes', () => {
  const cityErrors = validateGeoForm({
    mode: 'city',
    city: '',
    lat: null,
    lon: null,
    width: 50,
    height: 2500,
    email: 'wrong',
  })

  const coordsErrors = validateGeoForm({
    mode: 'coords',
    city: '',
    lat: null,
    lon: 37.61,
    width: 500,
    height: 500,
    email: '',
  })

  const validErrors = validateGeoForm({
    mode: 'coords',
    city: '',
    lat: 55.75,
    lon: 37.61,
    width: 500,
    height: 500,
    email: 'user@example.com',
  })

  assert.deepEqual(cityErrors, {
    city: 'Укажи город или место для генерации.',
    width: 'Ширина должна быть от 100 до 2000 метров.',
    height: 'Высота должна быть от 100 до 2000 метров.',
    email: 'Проверь email, если хочешь получить результат на почту.',
  })
  assert.deepEqual(coordsErrors, {
    coords: 'Для режима координат нужны и широта, и долгота.',
  })
  assert.deepEqual(validErrors, {})
})

test('formats last updated labels consistently', () => {
  assert.equal(formatLastUpdatedLabel(null), 'Ещё не обновляли')
  assert.match(
    formatLastUpdatedLabel(new Date('2026-03-29T09:07:00Z')),
    /^Обновлено в \d{2}:\d{2}$/,
  )
})
