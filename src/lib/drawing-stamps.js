export const STAMP_PRIORITY_TEXT = 'text'
export const STAMP_PRIORITY_IMAGE = 'image'
export const DRAWING_STAMP_SIZE_MIN = 16
export const DRAWING_STAMP_SIZE_MAX = 240
export const DRAWING_STAMP_SIZE_DEFAULT = 72

export const normalizeDrawingStamp = (payload = {}) => ({
  id: String(payload?.id ?? ''),
  name: String(payload?.name ?? ''),
  textValue: String(payload?.textValue ?? payload?.text_value ?? ''),
  hasImage: Boolean(payload?.hasImage ?? payload?.has_image ?? false),
  imageMimeType: String(payload?.imageMimeType ?? payload?.image_mime_type ?? ''),
  imageSize: Number(payload?.imageSize ?? payload?.image_size ?? 0),
  imageWidth: Number(payload?.imageWidth ?? payload?.image_width ?? 0),
  imageHeight: Number(payload?.imageHeight ?? payload?.image_height ?? 0),
  priority: String(payload?.priority ?? STAMP_PRIORITY_TEXT),
  createdBy: String(payload?.createdBy ?? payload?.created_by ?? ''),
  updatedBy: String(payload?.updatedBy ?? payload?.updated_by ?? ''),
  createdAt: String(payload?.createdAt ?? payload?.created_at ?? ''),
  updatedAt: String(payload?.updatedAt ?? payload?.updated_at ?? ''),
})

export const normalizeDrawingStamps = (items = []) =>
  (Array.isArray(items) ? items : []).map((item) => normalizeDrawingStamp(item))

export const priorityLabel = (priority = '') =>
  priority === STAMP_PRIORITY_IMAGE ? 'Картинка' : 'Имя'

export const clampStampSize = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return DRAWING_STAMP_SIZE_DEFAULT
  if (num < DRAWING_STAMP_SIZE_MIN) return DRAWING_STAMP_SIZE_MIN
  if (num > DRAWING_STAMP_SIZE_MAX) return DRAWING_STAMP_SIZE_MAX
  return Math.round(num)
}

export const validateDrawingStampDraft = ({
  name = '',
  textValue = '',
  priority = STAMP_PRIORITY_TEXT,
  hasImage = false,
} = {}) => {
  if (!String(name).trim()) {
    return { ok: false, message: 'Название обязательно' }
  }
  const text = String(textValue).trim()
  if (!text && !hasImage) {
    return { ok: false, message: 'Укажи имя или загрузи картинку' }
  }
  if (priority === STAMP_PRIORITY_TEXT && !text) {
    return { ok: false, message: 'Для приоритета Имя нужен текст' }
  }
  if (priority === STAMP_PRIORITY_IMAGE && !hasImage) {
    return { ok: false, message: 'Для приоритета Картинка нужна картинка' }
  }
  return { ok: true }
}
