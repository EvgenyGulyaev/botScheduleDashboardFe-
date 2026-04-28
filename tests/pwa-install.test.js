import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getIOSInstallSteps,
  isMobileOrTabletInstallContext,
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
    shouldShowPwaInstallPrompt({
      isAuthenticated: true,
      isStandalone: false,
      dismissed: false,
      isMobileOrTablet: true,
    }),
    true,
  )
  assert.equal(
    shouldShowPwaInstallPrompt({
      isAuthenticated: true,
      isStandalone: true,
      dismissed: false,
      isMobileOrTablet: true,
    }),
    false,
  )
  assert.equal(
    shouldShowPwaInstallPrompt({
      isAuthenticated: true,
      isStandalone: false,
      dismissed: true,
      isMobileOrTablet: true,
    }),
    false,
  )
  assert.equal(
    shouldShowPwaInstallPrompt({
      isAuthenticated: true,
      isStandalone: false,
      dismissed: false,
      isMobileOrTablet: false,
    }),
    false,
  )
})

test('detects mobile or tablet install context by width or platform', () => {
  assert.equal(isMobileOrTabletInstallContext({ innerWidth: 1280, navigator: { userAgent: 'Desktop' } }), false)
  assert.equal(isMobileOrTabletInstallContext({ innerWidth: 1024, navigator: { userAgent: 'Desktop' } }), true)
  assert.equal(isMobileOrTabletInstallContext({ innerWidth: 1440, navigator: { userAgent: 'Mozilla/5.0 (iPhone)' } }), true)
  assert.equal(isMobileOrTabletInstallContext({ innerWidth: 1440, navigator: { userAgent: 'Mozilla/5.0 (Android)' } }), true)
})

test('explains ios install flow because browsers cannot auto-install there', () => {
  assert.deepEqual(getIOSInstallSteps(), [
    'Нажми кнопку «Поделиться» в Safari.',
    'Выбери «На экран Домой».',
    'Подтверди добавление приложения.',
  ])
})
