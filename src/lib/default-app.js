export const DEFAULT_APP_OPTIONS = [
  { value: 'chat', label: 'Чат', path: '/chat' },
  { value: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { value: 'messages', label: 'Бот Расписание', path: '/messages' },
  { value: 'geo3d', label: '3D Модели', path: '/geo3d' },
  { value: 'short-links', label: 'Короткие ссылки', path: '/short-links' },
]

const DEFAULT_APP_PATHS = Object.fromEntries(
  DEFAULT_APP_OPTIONS.map((option) => [option.value, option.path]),
)

export const resolveDefaultAppValue = (value = '') =>
  Object.prototype.hasOwnProperty.call(DEFAULT_APP_PATHS, value) ? value : 'chat'

export const resolveDefaultAppRoute = (value = '') =>
  DEFAULT_APP_PATHS[resolveDefaultAppValue(value)] || '/chat'
