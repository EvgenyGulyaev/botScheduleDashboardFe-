export const normalizeMaintenanceItem = (item = {}) => ({
  key: item.key || '',
  title: item.title || item.key || 'Очистка',
  description: item.description || '',
  path: item.path || '',
  enabled: Boolean(item.enabled),
  reason: item.reason || '',
  reclaimableBytes: Number(item.reclaimable_bytes ?? item.reclaimableBytes ?? 0) || 0,
  reclaimable: item.reclaimable || '0B',
})

export const normalizeMaintenancePlan = (payload = {}) => {
  const items = Array.isArray(payload.items)
    ? payload.items.map((item) => normalizeMaintenanceItem(item))
    : []

  return {
    generatedAt: payload.generated_at || payload.generatedAt || '',
    totalReclaimableBytes:
      Number(payload.total_reclaimable_bytes ?? payload.totalReclaimableBytes ?? 0) || 0,
    totalReclaimable: payload.total_reclaimable || payload.totalReclaimable || '0B',
    cleanedBytes: Number(payload.cleaned_bytes ?? payload.cleanedBytes ?? 0) || 0,
    cleaned: payload.cleaned || '0B',
    selectedItems: Array.isArray(payload.selected_items)
      ? payload.selected_items
      : payload.selectedItems || [],
    items,
  }
}

export const getMaintenanceItemTone = (item = {}) => {
  if (!item.enabled) {
    return 'muted'
  }
  if (!item.reclaimableBytes) {
    return 'ok'
  }
  return item.reclaimableBytes >= 1024 * 1024 ? 'warning' : 'info'
}

export const getDefaultMaintenanceSelection = (plan = {}) =>
  (plan.items || [])
    .filter((item) => item.enabled && item.reclaimableBytes > 0)
    .map((item) => item.key)
