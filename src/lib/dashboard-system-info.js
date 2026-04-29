const EMPTY_SYSTEM_INFO = {
  hostname: '',
  os: '',
  arch: '',
  cpu: {
    cores: 0,
    load: { one: 0, five: 0, fifteen: 0 },
  },
  memory: {
    total: '',
    used: '',
    available: '',
    usedPercent: 0,
    swapUsed: '',
  },
  disk: {
    path: '/',
    total: '',
    used: '',
    free: '',
    usedPercent: 0,
  },
  uptime: {
    human: '',
  },
}

export const normalizeSystemInfo = (payload = {}) => ({
  hostname: payload?.hostname || '',
  os: payload?.os || '',
  arch: payload?.arch || '',
  cpu: {
    cores: Number(payload?.cpu?.cores || 0),
    load: {
      one: Number(payload?.cpu?.load?.one || 0),
      five: Number(payload?.cpu?.load?.five || 0),
      fifteen: Number(payload?.cpu?.load?.fifteen || 0),
    },
  },
  memory: {
    ...EMPTY_SYSTEM_INFO.memory,
    total: payload?.memory?.total || '',
    used: payload?.memory?.used || '',
    available: payload?.memory?.available || '',
    usedPercent: Number(payload?.memory?.used_percent ?? payload?.memory?.usedPercent ?? 0),
    swapUsed: payload?.memory?.swap_used ?? payload?.memory?.swapUsed ?? '',
  },
  disk: {
    ...EMPTY_SYSTEM_INFO.disk,
    path: payload?.disk?.path || '/',
    total: payload?.disk?.total || '',
    used: payload?.disk?.used || '',
    free: payload?.disk?.free || '',
    usedPercent: Number(payload?.disk?.used_percent ?? payload?.disk?.usedPercent ?? 0),
  },
  uptime: {
    human: payload?.uptime?.human || '',
  },
})

export const emptySystemInfo = () => structuredClone(EMPTY_SYSTEM_INFO)

export const systemUsageTone = (percent = 0) => {
  if (Number(percent) >= 90) {
    return 'danger'
  }
  if (Number(percent) >= 70) {
    return 'warning'
  }
  return 'ok'
}
