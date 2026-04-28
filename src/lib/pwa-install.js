const DISMISSED_KEY = 'pwa-install-dismissed'

export const isStandaloneDisplayMode = (target = globalThis) => {
  if (target?.standalone === true) {
    return true
  }
  if (typeof target?.matchMedia === 'function') {
    return Boolean(target.matchMedia('(display-mode: standalone)')?.matches)
  }
  return false
}

export const isIOSDevice = (nav = globalThis.navigator) =>
  /iphone|ipad|ipod/i.test(nav?.userAgent || '')

export const isMobileOrTabletInstallContext = (target = globalThis) => {
  const userAgent = target?.navigator?.userAgent || ''
  if (/android|iphone|ipad|ipod|mobile|tablet/i.test(userAgent)) {
    return true
  }
  return Number(target?.innerWidth || 0) > 0 && Number(target.innerWidth) <= 1024
}

export const getIOSInstallSteps = () => [
  'Нажми кнопку «Поделиться» в Safari.',
  'Выбери «На экран Домой».',
  'Подтверди добавление приложения.',
]

export const readInstallPromptDismissed = (storage = globalThis.localStorage) =>
  storage?.getItem?.(DISMISSED_KEY) === 'true'

export const writeInstallPromptDismissed = (storage = globalThis.localStorage) => {
  storage?.setItem?.(DISMISSED_KEY, 'true')
}

export const shouldShowPwaInstallPrompt = ({
  isAuthenticated,
  isStandalone,
  dismissed,
  isMobileOrTablet = false,
}) => Boolean(isAuthenticated) && !isStandalone && !dismissed && Boolean(isMobileOrTablet)
