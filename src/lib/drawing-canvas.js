// src/lib/drawing-canvas.js
export const DRAWING_TITLE_MAX_LENGTH = 120
export const DRAWING_BRUSH_MIN = 1
export const DRAWING_BRUSH_MAX = 80
export const DRAWING_UNDO_STACK_MAX = 50
export const DRAWING_DEFAULT_BACKGROUND = '#ffffff'
export const DRAWING_CANVAS_MIN = 50
export const DRAWING_CANVAS_MAX = 4096

export const normalizeDrawingTitle = (value = '') => {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return ''
  if ([...trimmed].length > DRAWING_TITLE_MAX_LENGTH) {
    return [...trimmed].slice(0, DRAWING_TITLE_MAX_LENGTH).join('')
  }
  return trimmed
}

export const clampBrushSize = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return DRAWING_BRUSH_MIN
  if (num < DRAWING_BRUSH_MIN) return DRAWING_BRUSH_MIN
  if (num > DRAWING_BRUSH_MAX) return DRAWING_BRUSH_MAX
  return Math.round(num)
}

export const clampCanvasDimension = (value) => {
  const num = Math.floor(Number(value))
  if (!Number.isFinite(num)) return DRAWING_CANVAS_MIN
  if (num < DRAWING_CANVAS_MIN) return DRAWING_CANVAS_MIN
  if (num > DRAWING_CANVAS_MAX) return DRAWING_CANVAS_MAX
  return num
}

export const validateCanvasDimensions = (width, height) => {
  const w = Math.floor(Number(width))
  const h = Math.floor(Number(height))
  if (!Number.isFinite(w) || !Number.isFinite(h)) {
    return { ok: false, message: 'Ширина и высота должны быть числами' }
  }
  if (w < DRAWING_CANVAS_MIN || h < DRAWING_CANVAS_MIN) {
    return { ok: false, message: `Минимальный размер ${DRAWING_CANVAS_MIN}×${DRAWING_CANVAS_MIN}` }
  }
  if (w > DRAWING_CANVAS_MAX || h > DRAWING_CANVAS_MAX) {
    return { ok: false, message: `Максимальный размер ${DRAWING_CANVAS_MAX}×${DRAWING_CANVAS_MAX}` }
  }
  return { ok: true, width: w, height: h }
}

export const createBlankCanvasState = (width = 0, height = 0) => ({
  width: clampCanvasDimension(width),
  height: clampCanvasDimension(height),
  background: DRAWING_DEFAULT_BACKGROUND,
})

export const createUndoStack = ({ max = DRAWING_UNDO_STACK_MAX } = {}) => {
  const items = []
  return {
    push(snapshot) {
      if (snapshot == null) return
      items.push(snapshot)
      while (items.length > max) {
        items.shift()
      }
    },
    pop() {
      if (items.length === 0) return null
      return items.pop()
    },
    clear() {
      items.length = 0
    },
    size() {
      return items.length
    },
    canUndo() {
      return items.length > 0
    },
  }
}

export const canvasToPngBlob = async (canvas) => {
  if (!canvas) {
    throw new Error('canvas is required')
  }
  if (typeof canvas.toBlob !== 'function') {
    throw new Error('canvas.toBlob is not available')
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('failed to encode canvas to PNG'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

export const loadImageToCanvas = async (canvas, blob) => {
  if (!canvas) {
    throw new Error('canvas is required')
  }
  if (!blob) {
    throw new Error('blob is required')
  }
  const url = URL.createObjectURL(blob)
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('failed to decode image'))
      img.src = url
    })
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('2d context is not available')
    }
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height
    ctx.drawImage(image, 0, 0)
    return { width: canvas.width, height: canvas.height }
  } finally {
    URL.revokeObjectURL(url)
  }
}
