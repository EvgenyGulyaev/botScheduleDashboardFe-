const ATTENDANCE_LABELS = {
  attending: 'Буду',
  not_attending: 'Не буду',
}

export const normalizeWeddingRSVP = (item = {}) => {
  const attendance = item?.attendance || ''
  const drinks = Array.isArray(item?.drinks) ? item.drinks : []

  return {
    id: String(item?.id ?? ''),
    fullName: item?.full_name ?? item?.fullName ?? '',
    attendance,
    attendanceLabel: ATTENDANCE_LABELS[attendance] || 'Не указано',
    drinks: drinks.filter((drink) => typeof drink === 'string' && drink.trim()).map((drink) => drink.trim()),
    otherDrink: item?.other_drink ?? item?.otherDrink ?? '',
    song: item?.song ?? '',
    createdAt: item?.created_at ?? item?.createdAt ?? '',
  }
}

export const normalizeWeddingRSVPs = (items = []) =>
  (Array.isArray(items) ? items : []).map((item) => normalizeWeddingRSVP(item))

export const normalizeWeddingSettings = (payload = {}) => ({
  drinkOptions: Array.isArray(payload?.drink_options)
    ? payload.drink_options.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
    : Array.isArray(payload?.drinkOptions)
      ? payload.drinkOptions.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
      : [],
})

export const summarizeWeddingRSVPs = (items = []) => {
  const normalized = normalizeWeddingRSVPs(items)
  const drinkCountsMap = new Map()
  let attending = 0
  let notAttending = 0

  normalized.forEach((item) => {
    if (item.attendance === 'attending') {
      attending += 1
    }
    if (item.attendance === 'not_attending') {
      notAttending += 1
    }

    item.drinks.forEach((drink) => {
      const key = drink === 'Другое' && item.otherDrink ? item.otherDrink : drink
      if (!key) {
        return
      }
      drinkCountsMap.set(key, (drinkCountsMap.get(key) || 0) + 1)
    })
  })

  return {
    total: normalized.length,
    attending,
    notAttending,
    drinkCounts: Array.from(drinkCountsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  }
}

export const buildWeddingCsv = (items = []) => {
  const normalized = normalizeWeddingRSVPs(items)
  const rows = [
    ['Дата', 'Имя', 'Статус', 'Напитки', 'Другое', 'Композиция'],
    ...normalized.map((item) => [
      formatWeddingDate(item.createdAt),
      item.fullName,
      item.attendanceLabel,
      item.drinks.join(', '),
      item.otherDrink,
      item.song,
    ]),
  ]

  return `\uFEFF${rows.map((row) => row.map(escapeCsvField).join(';')).join('\n')}`
}

export const formatWeddingDate = (value = '') => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date)
}

const escapeCsvField = (value = '') => `"${String(value).replaceAll('"', '""')}"`
