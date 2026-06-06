const EMPTY_STATS = {
  pid: '',
  memory: '',
  memoryBytes: 0,
  cpu: '',
  cpuSeconds: 0,
  uptime: '',
  activeSince: '',
  restarts: '',
  tasks: '',
  fragmentPath: '',
}

const HEALTH_BADGES = {
  ok: {
    label: 'OK',
    icon: '🟢',
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  warning: {
    label: 'Внимание',
    icon: '🟡',
    classes: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  error: {
    label: 'Ошибка',
    icon: '🔴',
    classes: 'border-rose-200 bg-rose-50 text-rose-800',
  },
}

export const normalizeServiceStatus = (payload = {}) => {
  const stats = payload?.Stats ?? payload?.stats ?? {}
  const health = payload?.health ?? {}
  const healthLevel =
    health?.level ||
    (payload?.status === 'active' ? 'ok' : payload?.status === 'failed' ? 'error' : 'warning')

  return {
    service: payload?.service || '',
    raw: payload?.raw || '',
    status: payload?.status || 'unknown',
    loaded: payload?.loaded || '',
    subState: payload?.sub_state ?? payload?.subState ?? '',
    description: payload?.description || '',
    health: {
      level: healthLevel,
      message: health?.message || '',
    },
    stats: {
      ...EMPTY_STATS,
      pid: stats?.pid || '',
      memory: stats?.memory || '',
      memoryBytes: Number(stats?.memory_bytes ?? stats?.memoryBytes ?? 0),
      cpu: stats?.cpu || '',
      cpuSeconds: Number(stats?.cpu_seconds ?? stats?.cpuSeconds ?? 0),
      uptime: stats?.uptime || '',
      activeSince: stats?.active_since ?? stats?.activeSince ?? '',
      restarts: stats?.restarts || '',
      tasks: stats?.tasks || '',
      fragmentPath: stats?.fragment_path ?? stats?.fragmentPath ?? '',
    },
    logs: Array.isArray(payload?.logs) ? payload.logs.filter(Boolean) : [],
  }
}

export const getServiceHealthBadge = (level = 'warning') =>
  HEALTH_BADGES[level] || HEALTH_BADGES.warning

export const formatServiceMemoryTotal = (bytes = 0) => {
  const value = Number(bytes) || 0
  if (value <= 0) {
    return '—'
  }

  const units = ['B', 'K', 'M', 'G', 'T']
  let amount = value
  let unitIndex = 0

  while (amount >= 1024 && unitIndex < units.length - 1) {
    amount /= 1024
    unitIndex += 1
  }

  if (unitIndex === 0) {
    return `${amount.toFixed(0)}${units[unitIndex]}`
  }

  return `${amount.toFixed(1)}${units[unitIndex]}`
}

export const getServicesMemoryTotalBytes = (statuses = {}) =>
  Object.values(statuses).reduce(
    (sum, status) => sum + Math.max(0, Number(status?.stats?.memoryBytes) || 0),
    0,
  )

export const formatServiceUptime = (uptime = '') => {
  const text = String(uptime)
    .trim()
    .toLowerCase()
    .replace(/\bago\b/g, '')
    .trim()
  if (!text) {
    return ''
  }

  const weekMatches = [...text.matchAll(/(\d+)\s*w(?:eek)?s?/g)]
  const dayMatches = [...text.matchAll(/(\d+)\s*d(?:ay)?s?/g)]
  const daysTotal =
    weekMatches.reduce((sum, match) => sum + Number(match[1]) * 7, 0) +
    dayMatches.reduce((sum, match) => sum + Number(match[1]), 0)
  if (daysTotal > 0) {
    return `${daysTotal}d`
  }

  const units = [
    { pattern: /(\d+)\s*h(?:our)?s?/g, suffix: 'h', multiplier: 1 },
    { pattern: /(\d+)\s*m(?:in(?:ute)?)?s?/g, suffix: 'm', multiplier: 1 },
    { pattern: /(\d+)\s*s(?:ec(?:ond)?)?s?/g, suffix: 's', multiplier: 1 },
  ]

  for (const unit of units) {
    let total = 0
    for (const match of text.matchAll(unit.pattern)) {
      total += Number(match[1]) * unit.multiplier
    }
    if (total > 0) {
      return `${total}${unit.suffix}`
    }
  }

  return uptime
}

export const summarizeServiceTile = (status = normalizeServiceStatus()) => {
  const badge = getServiceHealthBadge(status.health?.level)
  const meta = [
    formatServiceUptime(status.stats?.uptime),
    status.stats?.memory ? `RAM ${status.stats.memory}` : '',
  ].filter(Boolean)

  return {
    icon: badge.icon,
    status: status.status || 'unknown',
    meta,
  }
}
