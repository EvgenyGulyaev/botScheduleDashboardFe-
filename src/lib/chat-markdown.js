const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const isSafeLink = (value = '') => {
  try {
    const url = new URL(String(value))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const phonePattern = /(?:\+7|8)[\s().-]*\d{3}[\s().-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/g

const isPhoneBoundary = (value = '') => !value || !/[\d+]/.test(value)

const normalizePhoneHref = (value = '') => {
  const trimmed = String(value || '').trim()
  const digits = trimmed.replace(/\D/g, '')
  if (trimmed.startsWith('+') && digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`
  }
  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`
  }
  return ''
}

const renderInlineFormatting = (value = '') =>
  escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')

const renderPhoneLink = (value = '') => {
  const phone = String(value || '').trim()
  const href = normalizePhoneHref(phone)
  if (!href) {
    return renderInlineFormatting(value)
  }

  return `<a href="tel:${escapeHtml(href)}" aria-label="Call ${escapeHtml(phone)}">&#128222; ${renderInlineFormatting(phone)}</a>`
}

const renderTextWithPhones = (value = '') => {
  const source = String(value || '')
  const parts = []
  let cursor = 0

  for (const match of source.matchAll(phonePattern)) {
    const [phone] = match
    const start = match.index ?? 0
    const end = start + phone.length
    const before = source[start - 1] || ''
    const after = source[end] || ''
    if (!isPhoneBoundary(before) || !isPhoneBoundary(after)) {
      continue
    }

    if (start > cursor) {
      parts.push(renderInlineFormatting(source.slice(cursor, start)))
    }
    parts.push(renderPhoneLink(phone))
    cursor = end
  }

  if (cursor < source.length) {
    parts.push(renderInlineFormatting(source.slice(cursor)))
  }

  return parts.join('')
}

const renderLink = (label = '', href = '') => {
  if (!isSafeLink(href)) {
    return renderTextWithPhones(`[${label}](${href})`)
  }

  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow">${renderInlineFormatting(label)}</a>`
}

export const renderChatMarkdown = (value = '') => {
  const source = String(value || '')
  const linkPattern = /\[([^\]]+)\]\(([^)\s]+)\)/g
  const parts = []
  let cursor = 0

  for (const match of source.matchAll(linkPattern)) {
    const [raw, label, href] = match
    const start = match.index ?? 0

    if (start > cursor) {
      parts.push(renderTextWithPhones(source.slice(cursor, start)))
    }

    parts.push(renderLink(label, href))
    cursor = start + raw.length
  }

  if (cursor < source.length) {
    parts.push(renderTextWithPhones(source.slice(cursor)))
  }

  return parts.join('').replace(/\n/g, '<br>')
}
