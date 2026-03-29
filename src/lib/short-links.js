const HTTP_URL_RE = /^https?:\/\//i

export const validateOriginalUrl = (value) => {
  const normalized = String(value ?? '').trim()

  if (!normalized) {
    return 'Вставь ссылку, которую нужно сократить.'
  }

  if (!HTTP_URL_RE.test(normalized)) {
    return 'Ссылка должна начинаться с http:// или https://'
  }

  return ''
}

export const buildShortLinkUrl = (origin, shortCode) => {
  const normalizedOrigin = String(origin ?? '').replace(/\/$/, '')
  return `${normalizedOrigin}/short/url?url=${encodeURIComponent(shortCode)}`
}

export const normalizeShortLinks = (items = []) =>
  [...items]
    .map((item) => ({
      shortCode: item.short_code,
      originalUrl: item.original_url,
      createdAt: item.created_at,
      clicks: item.clicks,
    }))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())

export const formatShortLinkDate = (value) =>
  new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
