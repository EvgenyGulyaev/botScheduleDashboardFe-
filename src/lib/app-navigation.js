const APP_MENU_ITEMS = [
  {
    to: '/messages',
    label: 'Бот Расписание',
    icon: '💬',
    adminOnly: false,
  },
  {
    to: '/chat',
    label: 'Чат',
    icon: '💬',
    adminOnly: false,
  },
  {
    to: '/geo3d',
    label: '3D Модели',
    icon: '🏔️',
    adminOnly: false,
  },
  {
    to: '/short-links',
    label: 'Короткие ссылки',
    icon: '🔗',
    adminOnly: false,
  },
  {
    to: '/alice',
    label: 'Алиса',
    icon: '🔊',
    adminOnly: true,
  },
]

export const getAppMenuItems = (isAdmin = false) =>
  APP_MENU_ITEMS.filter((item) => !item.adminOnly || Boolean(isAdmin))
