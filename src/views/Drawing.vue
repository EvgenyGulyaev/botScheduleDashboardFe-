<template>
  <div class="min-h-screen bg-[#f5f7fb] text-slate-950">
    <div
      v-if="store.error"
      class="fixed left-1/2 top-20 z-50 w-[min(92vw,520px)] -translate-x-1/2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-700 shadow-lg"
    >
      {{ store.error }}
    </div>

    <section
      v-if="viewMode === 'gallery'"
      class="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6"
    >
      <div class="flex min-h-11 items-center justify-between border-b border-slate-200/80 pb-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Назад"
            title="Назад"
            @click="goBack"
          >
            ←
          </button>
          <button
            type="button"
            class="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            @click="onNew"
          >
            Новый
          </button>
        </div>
        <div class="text-sm font-semibold text-slate-500">
          {{ items.length ? `${items.length} изображ.` : 'Изображения' }}
        </div>
      </div>

      <div
        v-if="store.loading && !items.length"
        class="grid flex-1 place-items-center py-16 text-sm text-slate-500"
      >
        Загружаем изображения...
      </div>

      <div v-else-if="!items.length" class="grid flex-1 place-items-center py-16">
        <div class="max-w-sm text-center">
          <div
            class="mx-auto mb-5 grid h-28 w-28 place-items-center rounded-[2rem] border border-dashed border-slate-300 bg-white text-4xl text-slate-300"
          >
            ✎
          </div>
          <div class="text-lg font-semibold text-slate-950">Пока пусто</div>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            Создай новый холст, сохрани его, и он появится здесь.
          </p>
          <button
            type="button"
            class="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            @click="onNew"
          >
            Новый холст
          </button>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 gap-4 py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <article
          v-for="item in items"
          :key="item.id"
          class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
          <button type="button" class="block w-full text-left" @click="openExisting(item)">
            <div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                v-if="galleryThumbs[item.id]"
                :src="galleryThumbs[item.id]"
                :alt="item.title || 'Изображение'"
                class="h-full w-full object-contain"
              />
              <div v-else class="grid h-full place-items-center text-sm text-slate-400">
                {{ galleryThumbLoading[item.id] ? 'Загружаем...' : 'Нет превью' }}
              </div>
              <div
                class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/20 to-transparent opacity-0 transition group-hover:opacity-100"
              />
            </div>
            <div class="p-4">
              <div class="truncate text-sm font-semibold text-slate-950">
                {{ item.title || 'Без названия' }}
              </div>
              <div class="mt-1 text-xs text-slate-500">
                {{ item.width }}×{{ item.height }} · {{ formatSize(item.size) }}
              </div>
            </div>
          </button>
          <div class="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <button
              type="button"
              class="text-xs font-semibold text-slate-500 transition hover:text-slate-950"
              @click="openExisting(item)"
            >
              Открыть
            </button>
            <button
              type="button"
              class="text-xs font-semibold text-rose-500 transition hover:text-rose-700"
              :disabled="saving"
              @click="onDelete(item)"
            >
              Удалить
            </button>
          </div>
        </article>
      </div>
    </section>

    <section v-else class="flex min-h-screen flex-col">
      <div
        class="flex min-h-12 items-center justify-between border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-5"
      >
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg text-slate-700 transition hover:bg-slate-100"
            aria-label="Назад"
            title="Назад"
            @click="openGallery"
          >
            ←
          </button>
          <button
            type="button"
            class="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            @click="openGallery"
          >
            Изображения
          </button>
        </div>
        <button
          type="button"
          class="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="saving"
          @click="openSaveModal"
        >
          {{ saving ? 'Сохраняем...' : 'Сохранить' }}
        </button>
      </div>

      <div
        class="flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-[#f8fafc] px-3 py-2 sm:px-5"
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
          class="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-base transition"
          :class="
            activeTool === tool.key
              ? 'border-slate-950 bg-slate-950 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          "
          @click="activeTool = tool.key"
        >
          {{ tool.icon }}
        </button>

        <div class="mx-1 h-6 w-px shrink-0 bg-slate-200" />

        <label
          class="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase text-slate-500"
        >
          Цвет
          <input
            v-model="brushColor"
            type="color"
            class="h-8 w-8 cursor-pointer rounded border border-slate-200 bg-white"
          />
        </label>

        <label
          class="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase text-slate-500"
        >
          Кисть
          <input
            v-model.number="brushSize"
            type="range"
            min="1"
            max="80"
            class="h-2 w-28 cursor-pointer accent-slate-950 sm:w-40"
          />
          <span class="w-6 text-right text-sm font-medium text-slate-700 tabular-nums">{{
            brushSize
          }}</span>
        </label>

        <div class="mx-1 h-6 w-px shrink-0 bg-slate-200" />

        <button
          type="button"
          aria-label="Отменить"
          title="Отменить"
          class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-base text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!canUndo"
          @click="undo"
        >
          ↶
        </button>
        <button
          type="button"
          aria-label="Повторить"
          title="Повторить"
          class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-base text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!canRedo"
          @click="redo"
        >
          ↷
        </button>
        <button
          type="button"
          aria-label="Очистить"
          title="Очистить"
          class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rose-200 bg-white text-base text-rose-600 transition hover:bg-rose-50"
          @click="clearCanvas"
        >
          ×
        </button>
      </div>

      <div class="flex flex-1 items-center justify-center overflow-hidden px-3 py-3 sm:px-5">
        <canvas
          ref="canvasRef"
          class="touch-none rounded-xl border border-slate-200 bg-white shadow-sm"
          :style="canvasDisplayStyle"
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

    <div
      v-if="saveModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
    >
      <form
        class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        @submit.prevent="confirmSave"
      >
        <div class="text-base font-semibold text-slate-950">Сохранить изображение</div>
        <label class="mt-4 block">
          <span class="mb-1 block text-xs font-semibold uppercase text-slate-500">Название</span>
          <input
            ref="saveTitleRef"
            v-model="titleInput"
            class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            :maxlength="titleMaxLength"
            placeholder="Без названия"
          />
        </label>
        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="saveModalOpen = false"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="saving"
          >
            {{ saving ? 'Сохраняем...' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </div>

    <div
      v-if="confirmDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
    >
      <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div class="text-base font-semibold text-slate-950">Удалить изображение?</div>
        <p class="mt-2 text-sm leading-6 text-slate-600">
          Файл будет удален из Google Drive и пропадет из галереи.
        </p>
        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="confirmDelete = false"
          >
            Отмена
          </button>
          <button
            type="button"
            class="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            @click="confirmDeleteAction"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
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
import { DRAWING_DEFAULT_CANVAS_HEIGHT, DRAWING_DEFAULT_CANVAS_WIDTH } from '../lib/drawing.js'

const store = useDrawingStore()
const router = useRouter()

const titleMaxLength = DRAWING_TITLE_MAX_LENGTH
const canvasRef = ref(null)
const saveTitleRef = ref(null)
const canvasWidth = ref(DRAWING_DEFAULT_CANVAS_WIDTH)
const canvasHeight = ref(DRAWING_DEFAULT_CANVAS_HEIGHT)
const activeTool = ref('pencil')
const brushColor = ref('#0f172a')
const brushSize = ref(4)
const titleInput = ref('')
const selected = ref(null)
const saving = ref(false)
const confirmDelete = ref(false)
const deleteTarget = ref(null)
const saveModalOpen = ref(false)
const viewMode = ref('gallery')
const galleryThumbs = ref({})
const galleryThumbLoading = ref({})

const undoStack = createUndoStack()
const redoStack = createUndoStack()
const undoCount = ref(0)
const redoCount = ref(0)
const hasCanvasContent = ref(false)

const canUndo = computed(() => undoCount.value > 0)
const canRedo = computed(() => redoCount.value > 0)

const tools = [
  { key: 'pencil', label: 'Карандаш', icon: '✎' },
  { key: 'eraser', label: 'Ластик', icon: '⌫' },
]

const items = computed(() => store.items)
const canvasDisplayStyle = computed(() => ({
  aspectRatio: `${canvasWidth.value} / ${canvasHeight.value}`,
  width: `${canvasWidth.value}px`,
  maxWidth: '100%',
  maxHeight: 'calc(100vh - 10.25rem)',
}))

const drawing = ref(false)
let lastPoint = null

const isEraser = () => activeTool.value === 'eraser'

const getContext = () => canvasRef.value?.getContext('2d')

const viewportCanvasSize = () => {
  if (typeof window === 'undefined') {
    return { width: DRAWING_DEFAULT_CANVAS_WIDTH, height: DRAWING_DEFAULT_CANVAS_HEIGHT }
  }
  const horizontalPadding = window.innerWidth < 640 ? 24 : 40
  const reservedHeight = 48 + 58 + 24
  const width = Math.min(
    DRAWING_CANVAS_MAX,
    Math.max(DRAWING_CANVAS_MIN, Math.floor(window.innerWidth - horizontalPadding)),
  )
  const height = Math.min(
    DRAWING_CANVAS_MAX,
    Math.max(DRAWING_CANVAS_MIN, Math.floor(window.innerHeight - reservedHeight)),
  )
  return { width, height }
}

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

const resetHistory = () => {
  undoStack.clear()
  redoStack.clear()
  undoCount.value = 0
  redoCount.value = 0
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
  hasCanvasContent.value = false
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

const fillCanvasBackground = () => {
  const ctx = getContext()
  const canvas = canvasRef.value
  if (!ctx || !canvas) return
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.restore()
}

const onNew = async () => {
  selected.value = null
  titleInput.value = ''
  saveModalOpen.value = false
  const size = viewportCanvasSize()
  canvasWidth.value = size.width
  canvasHeight.value = size.height
  hasCanvasContent.value = false
  resetHistory()
  viewMode.value = 'editor'
  await nextTick()
  fillCanvasBackground()
}

const openExisting = async (item) => {
  await onSelect(item)
  viewMode.value = 'editor'
}

const openGallery = async () => {
  viewMode.value = 'gallery'
  saveModalOpen.value = false
  try {
    await store.fetchImages()
  } catch (err) {
    // error already exposed
  }
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/dashboard')
}

const onSelect = async (item) => {
  if (!item) return
  selected.value = item
  titleInput.value = item.title || ''
  const dim = validateCanvasDimensions(
    item.width || DRAWING_DEFAULT_CANVAS_WIDTH,
    item.height || DRAWING_DEFAULT_CANVAS_HEIGHT,
  )
  canvasWidth.value = dim.ok ? dim.width : DRAWING_DEFAULT_CANVAS_WIDTH
  canvasHeight.value = dim.ok ? dim.height : DRAWING_DEFAULT_CANVAS_HEIGHT
  await nextTick()
  fillCanvasBackground()
  try {
    const blob = await store.fetchImageContent(item.id)
    const dims = await loadImageToCanvas(canvasRef.value, blob)
    if (dims) {
      canvasWidth.value = dims.width
      canvasHeight.value = dims.height
      hasCanvasContent.value = true
    }
  } catch (err) {
    hasCanvasContent.value = false
  }
  resetHistory()
}

const openSaveModal = async () => {
  if (!canvasRef.value) return
  saveModalOpen.value = true
  await nextTick()
  saveTitleRef.value?.focus()
}

const confirmSave = async () => {
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
    saveModalOpen.value = false
    await store.fetchImages()
    await loadGalleryThumbnails(items.value)
  } catch (err) {
    // store already set error
  } finally {
    saving.value = false
  }
}

const onDelete = (item = selected.value) => {
  if (!item) return
  deleteTarget.value = item
  confirmDelete.value = true
}

const confirmDeleteAction = async () => {
  if (!deleteTarget.value) {
    confirmDelete.value = false
    return
  }
  const id = deleteTarget.value.id
  confirmDelete.value = false
  saving.value = true
  try {
    await store.deleteImage(id)
    revokeThumb(id)
    if (selected.value?.id === id) {
      selected.value = null
      hasCanvasContent.value = false
      titleInput.value = ''
      resetHistory()
      viewMode.value = 'gallery'
    }
    deleteTarget.value = null
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

const revokeThumb = (id) => {
  const current = galleryThumbs.value[id]
  if (current) URL.revokeObjectURL(current)
  const nextThumbs = { ...galleryThumbs.value }
  const nextLoading = { ...galleryThumbLoading.value }
  delete nextThumbs[id]
  delete nextLoading[id]
  galleryThumbs.value = nextThumbs
  galleryThumbLoading.value = nextLoading
}

const loadGalleryThumbnail = async (item) => {
  if (!item?.id || galleryThumbs.value[item.id] || galleryThumbLoading.value[item.id]) return
  galleryThumbLoading.value = { ...galleryThumbLoading.value, [item.id]: true }
  try {
    const blob = await store.fetchImageContent(item.id)
    const url = URL.createObjectURL(blob)
    galleryThumbs.value = { ...galleryThumbs.value, [item.id]: url }
  } catch (err) {
    // stale drive files are cleaned by fetchImages; missing preview is acceptable here
  } finally {
    galleryThumbLoading.value = { ...galleryThumbLoading.value, [item.id]: false }
  }
}

const loadGalleryThumbnails = async (nextItems) => {
  const ids = new Set(nextItems.map((item) => item.id))
  Object.keys(galleryThumbs.value).forEach((id) => {
    if (!ids.has(id)) revokeThumb(id)
  })
  await Promise.all(nextItems.slice(0, 24).map((item) => loadGalleryThumbnail(item)))
}

watch(brushSize, (value) => {
  brushSize.value = clampBrushSize(value)
})

watch(
  items,
  (nextItems) => {
    loadGalleryThumbnails(nextItems)
  },
  { deep: true },
)

onMounted(async () => {
  try {
    await store.fetchImages()
  } catch (err) {
    // error already exposed
  }
})

onBeforeUnmount(() => {
  Object.values(galleryThumbs.value).forEach((url) => URL.revokeObjectURL(url))
  store.clearError()
})
</script>
