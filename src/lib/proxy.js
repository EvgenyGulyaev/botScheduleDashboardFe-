const toArray = (value) => (Array.isArray(value) ? value : [])

export const normalizeProxyRuntime = (payload = {}) => ({
  xrayService: payload.xray_service ?? payload.xrayService ?? '',
  xrayActive: Boolean(payload.xray_active ?? payload.xrayActive),
  xrayBin: payload.xray_bin ?? payload.xrayBin ?? '',
  configPath: payload.config_path ?? payload.configPath ?? '',
  inboundSecurity: payload.inbound_security ?? payload.inboundSecurity ?? '',
  localProxyEnabled: Boolean(payload.local_proxy_enabled ?? payload.localProxyEnabled),
  localProxyListen: payload.local_proxy_listen ?? payload.localProxyListen ?? '',
  localProxyPort: Number(payload.local_proxy_port ?? payload.localProxyPort ?? 0),
  localProxyProtocol: payload.local_proxy_protocol ?? payload.localProxyProtocol ?? '',
  healthcheckUrl: payload.healthcheck_url ?? payload.healthcheckUrl ?? '',
  failoverEnabled: Boolean(payload.failover_enabled ?? payload.failoverEnabled),
  failoverCooldownSeconds: Number(
    payload.failover_cooldown_seconds ?? payload.failoverCooldownSeconds ?? 0,
  ),
})

export const normalizeProxyNode = (payload = {}) => ({
  id: payload.id ?? '',
  name: payload.name ?? '',
  protocol: payload.protocol ?? 'vless',
  country: payload.country ?? '',
  poolId: payload.pool_id ?? payload.poolId ?? '',
  maskedUrl: payload.masked_url ?? payload.maskedUrl ?? '',
  host: payload.parsed_host ?? payload.parsedHost ?? '',
  port: Number(payload.parsed_port ?? payload.parsedPort ?? 0),
  enabled: Boolean(payload.enabled),
  priority: Number(payload.priority ?? 100),
  healthStatus: payload.health_status ?? payload.healthStatus ?? 'unknown',
  lastError: payload.last_error ?? payload.lastError ?? '',
  lastCheckedAt: payload.last_checked_at ?? payload.lastCheckedAt ?? '',
})

export const normalizeProxyPool = (payload = {}) => ({
  id: payload.id ?? '',
  name: payload.name ?? '',
  mode: payload.mode ?? '',
  activeNodeId: payload.active_node_id ?? payload.activeNodeId ?? '',
})

export const normalizeProxyUser = (payload = {}) => ({
  id: payload.id ?? '',
  label: payload.label ?? '',
  uuid: payload.uuid ?? '',
  enabled: Boolean(payload.enabled),
  poolId: payload.pool_id ?? payload.poolId ?? '',
  selectionMode: payload.selection_mode ?? payload.selectionMode ?? 'pool',
  activeNodeId: payload.active_node_id ?? payload.activeNodeId ?? '',
  trafficLimitBytes: payload.traffic_limit_bytes ?? payload.trafficLimitBytes ?? null,
})

export const normalizeProxyRouteRule = (payload = {}) => ({
  id: payload.id ?? '',
  name: payload.name ?? '',
  kind: payload.kind ?? 'domain',
  value: payload.value ?? '',
  outboundTag: payload.outbound_tag ?? payload.outboundTag ?? 'direct',
  enabled: Boolean(payload.enabled),
  priority: Number(payload.priority ?? 100),
})

export const normalizeProxyState = ({ runtime, nodes, pools, users, routes } = {}) => ({
  runtime: normalizeProxyRuntime(runtime),
  nodes: toArray(nodes).map(normalizeProxyNode),
  pools: toArray(pools).map(normalizeProxyPool),
  users: toArray(users).map(normalizeProxyUser),
  routes: toArray(routes).map(normalizeProxyRouteRule),
})

export const proxyHealthTone = (status = '') => {
  switch (String(status).toLowerCase()) {
    case 'up':
      return 'ok'
    case 'degraded':
      return 'warning'
    case 'down':
      return 'error'
    default:
      return 'muted'
  }
}

export const inferVlessName = (raw = '') => {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'vless:') return ''
    return decodeURIComponent(url.hash.replace(/^#/, '')) || url.hostname
  } catch {
    return ''
  }
}

export const inferVlessCountry = (raw = '') => {
  const value = `${inferVlessName(raw)} ${raw}`.toLowerCase()
  if (value.includes('🇩🇪') || value.includes('germany') || value.includes('de')) return 'DE'
  if (value.includes('🇳🇱') || value.includes('netherlands') || value.includes('nl')) return 'NL'
  if (value.includes('🇫🇮') || value.includes('finland') || value.includes('fi')) return 'FI'
  if (value.includes('🇺🇸') || value.includes('usa') || value.includes('us')) return 'US'
  return ''
}
