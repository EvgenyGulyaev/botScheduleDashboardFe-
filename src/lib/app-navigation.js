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
    key: 'wedding',
    to: '/wedding',
    label: 'Свадьба',
    icon: '💍',
    adminOnly: false,
  },
  {
    key: 'drawing',
    to: '/drawing',
    label: 'Рисовалка',
    icon: '🎨',
    permissionOnly: true,
  },
  {
    key: 'alice',
    to: '/alice',
    label: 'Алиса',
    icon: '🔊',
    permissionOnly: true,
  },
  {
    key: 'proxy',
    to: '/proxy',
    label: 'Прокси',
    icon: '🛰️',
    superAdminOnly: true,
    alwaysVisible: true,
  },
]

const ADMIN_MENU_ITEMS = [
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
  {
    to: '/dashboard/ssh-accesses',
    label: 'SSH доступы',
    icon: '🔐',
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
    if (item.superAdminOnly && !isSuperAdmin) {
      return false
    }
    if (item.adminOnly && !isAdmin && !isSuperAdmin) {
      return false
    }
    if (item.permissionOnly && !permissionSet.has(item.key)) {
      return false
    }
    if (item.alwaysVisible) {
      return true
    }
    if (shouldFilterPermissions && !permissionSet.has(item.key)) {
      return false
    }
    return true
  }).map(({ key, adminOnly, superAdminOnly, permissionOnly, alwaysVisible, ...item }) => item)
}

export const getAdminMenuItems = (isSuperAdmin = false) =>
  isSuperAdmin ? [...ADMIN_MENU_ITEMS] : []
