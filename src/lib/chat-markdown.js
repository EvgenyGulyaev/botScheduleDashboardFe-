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

const renderInlineFormatting = (value = '') =>
  escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')

const renderLink = (label = '', href = '') => {
  if (!isSafeLink(href)) {
    return renderInlineFormatting(`[${label}](${href})`)
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
      parts.push(renderInlineFormatting(source.slice(cursor, start)))
    }

    parts.push(renderLink(label, href))
    cursor = start + raw.length
  }

  if (cursor < source.length) {
    parts.push(renderInlineFormatting(source.slice(cursor)))
  }

  return parts.join('').replace(/\n/g, '<br>')
}
