<template>
  <div
    class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-6 sm:px-6 lg:px-8"
  >
    <div class="mx-auto max-w-7xl">
      <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-950">Рисовалка</h2>
          <p class="mt-1 text-sm text-slate-500">
            Рисуй, сохраняй и возвращайся к своим рисункам.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="saving"
            @click="onSave"
          >
            {{ saving ? 'Сохраняем...' : selected ? 'Сохранить' : 'Создать' }}
          </button>
          <button
            type="button"
            class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!selected || saving"
            @click="onDelete"
          >
            Удалить
          </button>
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="onNew"
          >
            Новый
          </button>
        </div>
      </header>

      <div v-if="store.error" class="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ store.error }}
      </div>

      <div class="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside class="space-y-4">
          <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 class="mb-2 text-sm font-semibold text-slate-700">Список</h3>
            <p v-if="store.loading && !items.length" class="text-sm text-slate-500">
              Загружаем...
            </p>
            <p v-else-if="!items.length" class="text-sm text-slate-500">
              Пока нет ни одного рисунка.
            </p>
            <ul v-else class="space-y-2">
              <li v-for="item in items" :key="item.id">
                <button
                  type="button"
                  class="w-full rounded-2xl border px-3 py-2 text-left text-sm transition"
                  :class="
                    selected?.id === item.id
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                  "
                  @click="onSelect(item)"
                >
                  <div class="font-semibold">{{ item.title || 'Без названия' }}</div>
                  <div
                    class="text-xs"
                    :class="selected?.id === item.id ? 'text-slate-300' : 'text-slate-500'"
                  >
                    {{ item.width }}×{{ item.height }} · {{ formatSize(item.size) }}
                  </div>
                </button>
              </li>
            </ul>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 class="mb-2 text-sm font-semibold text-slate-700">Свойства</h3>
            <label class="mb-3 block">
              <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Название
              </span>
              <input
                v-model="titleInput"
                class="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                :maxlength="titleMaxLength"
                placeholder="Без названия"
              />
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label class="block">
                <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ширина
                </span>
                <input
                  v-model.number="widthInput"
                  type="number"
                  :min="DRAWING_CANVAS_MIN"
                  :max="DRAWING_CANVAS_MAX"
                  class="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label class="block">
                <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Высота
                </span>
                <input
                  v-model.number="heightInput"
                  type="number"
                  :min="DRAWING_CANVAS_MIN"
                  :max="DRAWING_CANVAS_MAX"
                  class="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>
        </aside>

        <section class="space-y-4">
          <div
            class="flex flex-wrap items-center gap-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"
            role="toolbar"
            aria-label="Инструменты рисовалки"
          >
            <button
              v-for="tool in tools"
              :key="tool.key"
              type="button"
              :aria-label="tool.label"
              :title="tool.label"
              :aria-pressed="activeTool === tool.key"
              class="rounded-2xl border px-3 py-2 text-base transition"
              :class="
                activeTool === tool.key
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
              "
              @click="activeTool = tool.key"
            >
              {{ tool.icon }}
            </button>

            <div class="mx-2 hidden h-6 w-px bg-slate-200 sm:block" />

            <label class="flex items-center gap-2 text-sm text-slate-700">
              <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Цвет</span>
              <input v-model="brushColor" type="color" class="h-8 w-8 cursor-pointer rounded border border-slate-200" />
            </label>

            <label class="flex items-center gap-2 text-sm text-slate-700">
              <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">Кисть</span>
              <input
                v-model.number="brushSize"
                type="range"
                min="1"
                max="80"
                class="h-2 w-32 cursor-pointer accent-slate-950"
              />
              <span class="w-6 text-right tabular-nums">{{ brushSize }}</span>
            </label>

            <div class="mx-2 hidden h-6 w-px bg-slate-200 sm:block" />

            <button
              type="button"
              aria-label="Отменить"
              title="Отменить"
              class="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!canUndo"
              @click="undo"
            >
              ↶
            </button>
            <button
              type="button"
              aria-label="Повторить"
              title="Повторить"
              class="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!canRedo"
              @click="redo"
            >
              ↷
            </button>
            <button
              type="button"
              aria-label="Очистить"
              title="Очистить"
              class="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-base text-rose-700 transition hover:bg-rose-100"
              @click="clearCanvas"
            >
              ✕
            </button>
          </div>

          <div
            class="flex justify-center rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <canvas
              ref="canvasRef"
              class="max-w-full touch-none rounded-2xl border border-slate-200 bg-white"
              :width="canvasWidth"
              :height="canvasHeight"
              @pointerdown="onPointerDown"
              @pointermove="onPointerMove"
              @pointerup="onPointerUp"
              @pointerleave="onPointerUp"
              @pointercancel="onPointerUp"
            />
          </div>
        </section>
      </div>
    </div>

    <div
      v-if="confirmDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
    >
      <div class="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
        <h3 class="text-lg font-bold text-slate-950">Удалить рисунок?</h3>
        <p class="mt-2 text-sm text-slate-600">
          Это действие удалит файл и метаданные. Отменить будет нельзя.
        </p>
        <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="confirmDelete = false"
          >
            Отмена
          </button>
          <button
            type="button"
            class="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            @click="confirmDeleteAction"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="pendingResize"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4"
    >
      <div class="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
        <h3 class="text-lg font-bold text-slate-950">Изменить размер холста?</h3>
        <p class="mt-2 text-sm text-slate-600">
          Изменение размеров очистит нарисованное. Отменить будет нельзя.
        </p>
        <div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="cancelResize"
          >
            Отмена
          </button>
          <button
            type="button"
            class="rounded-2xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
            @click="confirmResizeAction"
          >
            Очистить и изменить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDrawingStore } from '../stores/drawing.js'
import {
  canvasToPngBlob,
  clampBrushSize,
  createUndoStack,
  DRAWING_CANVAS_MAX,
  DRAWING_CANVAS_MIN,
  DRAWING_TITLE_MAX_LENGTH,
  loadImageToCanvas,
  normalizeDrawingTitle,
  validateCanvasDimensions,
} from '../lib/drawing-canvas.js'
import {
  DRAWING_DEFAULT_CANVAS_HEIGHT,
  DRAWING_DEFAULT_CANVAS_WIDTH,
} from '../lib/drawing.js'

const store = useDrawingStore()

const titleMaxLength = DRAWING_TITLE_MAX_LENGTH
const canvasRef = ref(null)
const canvasWidth = ref(DRAWING_DEFAULT_CANVAS_WIDTH)
const canvasHeight = ref(DRAWING_DEFAULT_CANVAS_HEIGHT)
const widthInput = ref(DRAWING_DEFAULT_CANVAS_WIDTH)
const heightInput = ref(DRAWING_DEFAULT_CANVAS_HEIGHT)
const activeTool = ref('pencil')
const brushColor = ref('#0f172a')
const brushSize = ref(4)
const titleInput = ref('')
const selected = ref(null)
const saving = ref(false)
const confirmDelete = ref(false)
const pendingResize = ref(null)

const undoStack = createUndoStack()
const redoStack = createUndoStack()
const undoCount = ref(0)
const redoCount = ref(0)
const hasCanvasContent = ref(false)


const canUndo = computed(() => undoCount.value > 0)
const canRedo = computed(() => redoCount.value > 0)

const tools = [
  { key: 'pencil', label: 'Карандаш', icon: '✏️' },
  { key: 'eraser', label: 'Ластик', icon: '🩹' },
]

const items = computed(() => store.items)

const drawing = ref(false)
let lastPoint = null

const isEraser = () => activeTool.value === 'eraser'

const getContext = () => canvasRef.value?.getContext('2d')

const snapshotCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return null
  try {
    return canvas.toDataURL('image/png')
  } catch (err) {
    return null
  }
}

const restoreSnapshot = (dataUrl) => {
  if (!dataUrl) return
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = getContext()
  if (!ctx) return
  const image = new Image()
  image.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0)
  }
  image.src = dataUrl
}

const pushUndo = () => {
  const snap = snapshotCanvas()
  if (snap) {
    undoStack.push(snap)
    undoCount.value = undoStack.size()
    redoStack.clear()
    redoCount.value = 0
  }
}

const pointFromEvent = (event) => {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  }
}

const drawSegment = (from, to) => {
  const ctx = getContext()
  if (!ctx) return
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = brushSize.value
  if (isEraser()) {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = brushColor.value
  }
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  ctx.globalCompositeOperation = 'source-over'
}

const onPointerDown = (event) => {
  if (!canvasRef.value) return
  event.preventDefault()
  canvasRef.value.setPointerCapture?.(event.pointerId)
  pushUndo()
  const point = pointFromEvent(event)
  if (!point) return
  drawing.value = true
  lastPoint = point
  drawSegment(point, point)
    hasCanvasContent.value = true
}

const onPointerMove = (event) => {
  if (!drawing.value) return
  const point = pointFromEvent(event)
  if (!point || !lastPoint) return
  drawSegment(lastPoint, point)
  lastPoint = point
}

const onPointerUp = (event) => {
  if (!drawing.value) return
  drawing.value = false
  lastPoint = null
  canvasRef.value?.releasePointerCapture?.(event.pointerId)
}

const clearCanvas = () => {
  const ctx = getContext()
  const canvas = canvasRef.value
  if (!ctx || !canvas) return
  pushUndo()
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.restore()
}

const undo = () => {
  const current = snapshotCanvas()
  const prev = undoStack.pop()
  if (!prev) return
  if (current) redoStack.push(current)
  redoCount.value = redoStack.size()
  undoCount.value = undoStack.size()
  restoreSnapshot(prev)
}

const redo = () => {
  const current = snapshotCanvas()
  const next = redoStack.pop()
  if (!next) return
  if (current) undoStack.push(current)
  undoCount.value = undoStack.size()
  redoCount.value = redoStack.size()
  restoreSnapshot(next)
}

const onNew = () => {
  selected.value = null
  titleInput.value = ''
  hasCanvasContent.value = false
  widthInput.value = DRAWING_DEFAULT_CANVAS_WIDTH
  heightInput.value = DRAWING_DEFAULT_CANVAS_HEIGHT
  nextTick(() => {
    clearCanvas()
  })
}

const fillCanvasBackground = () => {
  const ctx = getContext()
  const canvas = canvasRef.value
  if (!ctx || !canvas) return
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.restore()
}

const onSelect = async (item) => {
  if (!item) return
  selected.value = item
  titleInput.value = item.title || ''
  const w = item.width || DRAWING_DEFAULT_CANVAS_WIDTH
  const h = item.height || DRAWING_DEFAULT_CANVAS_HEIGHT
  canvasWidth.value = w
  canvasHeight.value = h
  widthInput.value = w
  heightInput.value = h
  await nextTick()
  fillCanvasBackground()
  try {
    const blob = await store.fetchImageContent(item.id)
    const dims = await loadImageToCanvas(canvasRef.value, blob)
    if (dims) {
      canvasWidth.value = dims.width
      canvasHeight.value = dims.height
    }
  } catch (err) {
    // ignore — fresh canvas remains
  }
  undoStack.clear()
  redoStack.clear()
  undoCount.value = 0
  redoCount.value = 0
}

const onSave = async () => {
  const title = normalizeDrawingTitle(titleInput.value)
  if (!title) {
    store.setError('Название обязательно')
    return
  }
  if (titleInput.value.trim().length > DRAWING_TITLE_MAX_LENGTH) {
    store.setError('Слишком длинное название')
    return
  }
  saving.value = true
  try {
    const blob = await canvasToPngBlob(canvasRef.value)
    const width = canvasRef.value?.width || canvasWidth.value
    const height = canvasRef.value?.height || canvasHeight.value
    if (selected.value) {
      await store.updateImage(selected.value.id, { title, width, height, blob })
    } else {
      await store.createImage({ title, width, height, blob })
    }
    selected.value = store.selected
    titleInput.value = store.selected?.title || title
  } catch (err) {
    // store already set error
  } finally {
    saving.value = false
  }
}

const onDelete = () => {
  if (!selected.value) return
  confirmDelete.value = true
}

const confirmDeleteAction = async () => {
  if (!selected.value) {
    confirmDelete.value = false
    return
  }
  const id = selected.value.id
  confirmDelete.value = false
  saving.value = true
  try {
    await store.deleteImage(id)
    selected.value = null
    hasCanvasContent.value = false
    titleInput.value = ''
    await nextTick()
    fillCanvasBackground()
  } finally {
    saving.value = false
  }
}

const formatSize = (bytes) => {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} Б`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} КБ`
  return `${(n / (1024 * 1024)).toFixed(1)} МБ`
}

watch(brushSize, (value) => {
  brushSize.value = clampBrushSize(value)
})

const requestResize = (width, height) => {
  const dim = validateCanvasDimensions(width, height)
  if (!dim.ok) {
    store.setError(dim.message)
    widthInput.value = canvasWidth.value
    heightInput.value = canvasHeight.value
    return
  }
  if (dim.width === canvasWidth.value && dim.height === canvasHeight.value) {
    return
  }
  if (hasCanvasContent.value) {
    pendingResize.value = { width: dim.width, height: dim.height }
    return
  }
  applyResize(dim.width, dim.height)
}

const applyResize = (width, height) => {
  canvasWidth.value = width
  canvasHeight.value = height
  undoStack.clear()
  redoStack.clear()
  undoCount.value = 0
  redoCount.value = 0
  hasCanvasContent.value = false
  nextTick(() => {
    fillCanvasBackground()
  })
}

const cancelResize = () => {
  if (pendingResize.value) {
    widthInput.value = canvasWidth.value
    heightInput.value = canvasHeight.value
  }
  pendingResize.value = null
}

const confirmResizeAction = () => {
  if (!pendingResize.value) return
  const { width, height } = pendingResize.value
  pendingResize.value = null
  applyResize(width, height)
}

watch(widthInput, (value) => {
  requestResize(value, heightInput.value)
})
watch(heightInput, (value) => {
  requestResize(widthInput.value, value)
})

onMounted(async () => {
  await nextTick()
  fillCanvasBackground()
  try {
    await store.fetchImages()
  } catch (err) {
    // error already exposed
  }
})

onBeforeUnmount(() => {
  store.clearError()
})
</script>
