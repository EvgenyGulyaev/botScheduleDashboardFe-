const ACTION_BADGES = [
  {
    match: 'admin.user.',
    label: 'Пользователь',
    classes: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  {
    match: 'service.',
    label: 'Сервис',
    classes: 'border-amber-200 bg-amber-50 text-amber-800',
  },
]

const DEFAULT_BADGE = {
  label: 'Система',
  classes: 'border-slate-200 bg-slate-50 text-slate-700',
}

export const getAuditActionBadge = (action = '') =>
  cleanBadge(ACTION_BADGES.find((badge) => action.startsWith(badge.match)) || DEFAULT_BADGE)

export const normalizeAuditEntries = (items = []) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    id: item?.id || '',
    actorEmail: item?.actor_email ?? item?.actorEmail ?? '',
    actorLogin: item?.actor_login ?? item?.actorLogin ?? '',
    action: item?.action || '',
    target: item?.target || '',
    summary: item?.summary || '',
    metadata: item?.metadata && typeof item.metadata === 'object' ? item.metadata : {},
    createdAt: item?.created_at ?? item?.createdAt ?? '',
    badge: getAuditActionBadge(item?.action || ''),
  }))

const cleanBadge = ({ label, classes }) => ({ label, classes })
