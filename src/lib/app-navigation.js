const APP_MENU_ITEMS = [
  {
    key: 'messages',
    to: '/messages',
    label: 'Бот Расписание',
    icon: '💬',
    adminOnly: false,
  },
  {
    key: 'chat',
    to: '/chat',
    label: 'Чат',
    icon: '💬',
    adminOnly: false,
  },
  {
    key: 'geo3d',
    to: '/geo3d',
    label: '3D Модели',
    icon: '🏔️',
    adminOnly: false,
  },
  {
    key: 'short-links',
    to: '/short-links',
    label: 'Короткие ссылки',
    icon: '🔗',
    adminOnly: false,
  },
  {
    key: 'alice',
    to: '/alice',
    label: 'Алиса',
    icon: '🔊',
    adminOnly: true,
  },
]

const ADMIN_MENU_ITEMS = [
  {
    to: '/dashboard',
    label: 'Статистика сервисов',
    icon: '📊',
  },
  {
    to: '/admin/users',
    label: 'Пользователи',
    icon: '👥',
  },
  {
    to: '/admin/audit',
    label: 'Аудит',
    icon: '🧾',
  },
]

const normalizeMenuOptions = (options = false) => {
  if (typeof options === 'boolean') {
    return {
      isAdmin: options,
      isSuperAdmin: false,
      appPermissions: [],
    }
  }

  return {
    isAdmin: Boolean(options?.isAdmin),
    isSuperAdmin: Boolean(options?.isSuperAdmin),
    appPermissions: Array.isArray(options?.appPermissions) ? options.appPermissions : [],
  }
}

export const getAppMenuItems = (options = false) => {
  const { isAdmin, isSuperAdmin, appPermissions } = normalizeMenuOptions(options)
  const permissionSet = new Set(appPermissions)
  const shouldFilterPermissions = permissionSet.size > 0

  return APP_MENU_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin && !isSuperAdmin) {
      return false
    }
    if (shouldFilterPermissions && !permissionSet.has(item.key)) {
      return false
    }
    return true
  }).map(({ key, ...item }) => item)
}

export const getAdminMenuItems = (isSuperAdmin = false) =>
  isSuperAdmin ? [...ADMIN_MENU_ITEMS] : []
