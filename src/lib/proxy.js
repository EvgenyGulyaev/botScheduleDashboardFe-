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
  trafficStatsEnabled: Boolean(payload.traffic_stats_enabled ?? payload.trafficStatsEnabled),
  trafficPollIntervalSeconds: Number(
    payload.traffic_poll_interval_seconds ?? payload.trafficPollIntervalSeconds ?? 0,
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
  poolPriorities: toArray(payload.pool_priorities ?? payload.poolPriorities).map((item) => ({
    poolId: item.pool_id ?? item.poolId ?? '',
    priority: Number(item.priority ?? 100),
  })),
  routeGroups: toArray(payload.route_groups ?? payload.routeGroups).map(String).filter(Boolean),
  selectionMode: payload.selection_mode ?? payload.selectionMode ?? 'pool',
  activeNodeId: payload.active_node_id ?? payload.activeNodeId ?? '',
  trafficLimitBytes: payload.traffic_limit_bytes ?? payload.trafficLimitBytes ?? null,
  traffic: normalizeUserTraffic(payload.traffic),
})

export const normalizeUserTraffic = (payload = {}) => ({
  period: payload?.period ?? '',
  uplinkBytes: Number(payload?.uplink_bytes ?? payload?.uplinkBytes ?? 0),
  downlinkBytes: Number(payload?.downlink_bytes ?? payload?.downlinkBytes ?? 0),
  totalBytes: Number(payload?.total_bytes ?? payload?.totalBytes ?? 0),
  quotaBytes: payload?.quota_bytes ?? payload?.quotaBytes ?? null,
  quotaUsedPercent: payload?.quota_used_percent ?? payload?.quotaUsedPercent ?? null,
})

export const normalizeProxyRouteGroup = (payload = {}) => ({
  id: payload.id ?? '',
  name: payload.name ?? '',
})

export const normalizeProxyRouteRule = (payload = {}) => ({
  id: payload.id ?? '',
  groupId: payload.group_id ?? payload.groupId ?? 'default',
  name: payload.name ?? '',
  kind: payload.kind ?? 'domain',
  value: payload.value ?? '',
  outboundTag: payload.outbound_tag ?? payload.outboundTag ?? 'direct',
  enabled: Boolean(payload.enabled),
  priority: Number(payload.priority ?? 100),
})

export const normalizeProxyState = ({ runtime, nodes, pools, users, routeGroups, routes } = {}) => ({
  runtime: normalizeProxyRuntime(runtime),
  nodes: toArray(nodes).map(normalizeProxyNode),
  pools: toArray(pools).map(normalizeProxyPool),
  users: toArray(users).map(normalizeProxyUser),
  routeGroups: toArray(routeGroups).map(normalizeProxyRouteGroup),
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

export const inferProxyNodeName = (raw = '') => {
  try {
    const url = new URL(raw)
    if (!isSupportedNodeProtocol(url.protocol)) return ''
    return decodeURIComponent(url.hash.replace(/^#/, '')) || url.hostname
  } catch {
    return ''
  }
}

export const inferProxyNodeCountry = (raw = '') => {
  const parsed = parseProxyNodeUrl(raw)
  const host = parsed?.hostname || ''
  const name = inferProxyNodeName(raw)
  const value = `${name} ${host}`.toLowerCase()
  const tokens = value.split(/[^a-zа-яё0-9]+/iu).filter(Boolean)
  const tokenSet = new Set(tokens)
  const hostCountry = {
    '31.56.196.40': 'FI',
    '31.56.177.191': 'FI',
  }[host]

  if (hostCountry) return hostCountry
  if (value.includes('🇩🇪') || tokenSet.has('germany') || tokenSet.has('de')) return 'DE'
  if (value.includes('🇳🇱') || tokenSet.has('netherlands') || tokenSet.has('nl')) return 'NL'
  if (value.includes('🇫🇮') || tokenSet.has('finland') || tokenSet.has('fi')) return 'FI'
  if (value.includes('🇺🇸') || tokenSet.has('usa') || tokenSet.has('us')) return 'US'
  return ''
}

export const inferVlessName = inferProxyNodeName
export const inferVlessCountry = inferProxyNodeCountry

const isSupportedNodeProtocol = (protocol = '') => (
  protocol === 'vless:' || protocol === 'hysteria2:' || protocol === 'hy2:'
)

const parseProxyNodeUrl = (raw = '') => {
  try {
    const url = new URL(raw)
    return isSupportedNodeProtocol(url.protocol) ? url : null
  } catch {
    return null
  }
}
