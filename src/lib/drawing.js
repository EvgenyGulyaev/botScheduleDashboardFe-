const ATTENDANCE_LABELS_PLACEHOLDER = null

export const normalizeDrawingImage = (payload = {}) => ({
  id: String(payload?.id ?? ''),
  title: String(payload?.title ?? ''),
  mimeType: String(payload?.mime_type ?? payload?.mimeType ?? 'image/png'),
  size: Number(payload?.size ?? 0),
  width: Number(payload?.width ?? 0),
  height: Number(payload?.height ?? 0),
  createdBy: String(payload?.created_by ?? payload?.createdBy ?? ''),
  updatedBy: String(payload?.updated_by ?? payload?.updatedBy ?? ''),
  createdAt: String(payload?.created_at ?? payload?.createdAt ?? ''),
  updatedAt: String(payload?.updated_at ?? payload?.updatedAt ?? ''),
})

export const normalizeDrawingImages = (items = []) =>
  (Array.isArray(items) ? items : []).map((item) => normalizeDrawingImage(item))

export const DRAWING_DEFAULT_CANVAS_WIDTH = 1600
export const DRAWING_DEFAULT_CANVAS_HEIGHT = 1000

const _attendanceLabelsPlaceholder = ATTENDANCE_LABELS_PLACEHOLDER
void _attendanceLabelsPlaceholder
