import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getIOSInstallSteps,
  isStandaloneDisplayMode,
  shouldShowPwaInstallPrompt,
} from '../src/lib/pwa-install.js'

test('detects standalone display mode from browser signals', () => {
  assert.equal(isStandaloneDisplayMode({ standalone: true }), true)
  assert.equal(
    isStandaloneDisplayMode({
      matchMedia(query) {
        return { matches: query === '(display-mode: standalone)' }
      },
    }),
    true,
  )
})

test('shows install prompt only for authenticated non-standalone users', () => {
  assert.equal(
    shouldShowPwaInstallPrompt({ isAuthenticated: true, isStandalone: false, dismissed: false }),
    true,
  )
  assert.equal(
    shouldShowPwaInstallPrompt({ isAuthenticated: true, isStandalone: true, dismissed: false }),
    false,
  )
  assert.equal(
    shouldShowPwaInstallPrompt({ isAuthenticated: true, isStandalone: false, dismissed: true }),
    false,
  )
})

test('explains ios install flow because browsers cannot auto-install there', () => {
  assert.deepEqual(getIOSInstallSteps(), [
    'Нажми кнопку «Поделиться» в Safari.',
    'Выбери «На экран Домой».',
    'Подтверди добавление приложения.',
  ])
})
