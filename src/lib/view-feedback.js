const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const pad = (value) => String(value).padStart(2, '0')

export const validateLoginForm = ({ email, password }) => {
  const errors = {}
  const normalizedEmail = email.trim()

  if (!normalizedEmail) {
    errors.email = 'Укажи email для входа.'
  } else if (!EMAIL_RE.test(normalizedEmail)) {
    errors.email = 'Похоже, email введён не полностью.'
  }

  if (!password) {
    errors.password = 'Введи пароль.'
  }

  return errors
}

export const validateGeoForm = ({ mode, city, lat, lon, width, height, email }) => {
  const errors = {}

  if (mode === 'city') {
    if (!String(city ?? '').trim()) {
      errors.city = 'Укажи город или место для генерации.'
    }
  } else if (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) {
    errors.coords = 'Для режима координат нужны и широта, и долгота.'
  }

  if (width < 100 || width > 2000) {
    errors.width = 'Ширина должна быть от 100 до 2000 метров.'
  }

  if (height < 100 || height > 2000) {
    errors.height = 'Высота должна быть от 100 до 2000 метров.'
  }

  const normalizedEmail = String(email ?? '').trim()
  if (normalizedEmail && !EMAIL_RE.test(normalizedEmail)) {
    errors.email = 'Проверь email, если хочешь получить результат на почту.'
  }

  return errors
}

export const formatLastUpdatedLabel = (value) => {
  if (!value) {
    return 'Ещё не обновляли'
  }

  const date = value instanceof Date ? value : new Date(value)

  return `Обновлено в ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
