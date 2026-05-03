export const DEFAULT_VISIBILITY_GROUP = 'general'

export const normalizeVisibilityGroup = (value = '') => {
  let result = ''
  for (const char of String(value)) {
    if (char >= 'A' && char <= 'Z') {
      result += char.toLowerCase()
      continue
    }
    if ((char >= 'a' && char <= 'z') || (char >= '0' && char <= '9')) {
      result += char
      continue
    }
    if (char === '-' || char === '_') {
      result += char
      continue
    }
    if (/\s/.test(char) && result && !result.endsWith('-')) {
      result += '-'
    }
  }
  return result.replace(/-+$/g, '')
}

export const normalizeVisibilityGroups = (values = [], fallback = []) => {
  const seen = new Set()
  const result = []
  for (const value of values) {
    const group = normalizeVisibilityGroup(value)
    if (!group || seen.has(group)) {
      continue
    }
    seen.add(group)
    result.push(group)
  }
  if (result.length) {
    return result
  }
  return fallback.length ? normalizeVisibilityGroups(fallback) : [DEFAULT_VISIBILITY_GROUP]
}

export const splitVisibilityGroupInput = (value = '') =>
  String(value)
    .split(',')
    .map((group) => group.trim())
    .filter(Boolean)

export const collectVisibilityGroupOptions = (users = [], selectedGroups = []) => {
  const groups = [DEFAULT_VISIBILITY_GROUP, ...selectedGroups]
  for (const user of users) {
    if (Array.isArray(user?.visibilityGroups)) {
      groups.push(...user.visibilityGroups)
    }
  }

  const normalized = normalizeVisibilityGroups(groups)
  return normalized.sort((left, right) => {
    if (left === DEFAULT_VISIBILITY_GROUP) {
      return -1
    }
    if (right === DEFAULT_VISIBILITY_GROUP) {
      return 1
    }
    return left.localeCompare(right)
  })
}
