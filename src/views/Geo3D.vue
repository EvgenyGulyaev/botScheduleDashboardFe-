<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Заголовок -->
      <div class="mb-8 text-center sm:text-left">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">🏔️ 3D Модели</h2>
        <p class="text-base sm:text-lg text-gray-600">Генерация 3D-моделей городов и участков карты</p>
      </div>

      <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-xl">
        <form @submit.prevent="generateModel" class="space-y-8">
          <InlineNotice
            title="Как это работает"
            message="Можно сгенерировать модель по названию места или по координатам. Для больших областей удобно указать email и получить результат асинхронно."
          />
          
          <!-- Режим ввода -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Режим поиска</label>
            <div class="flex space-x-4">
              <label class="inline-flex items-center">
                <input type="radio" v-model="form.mode" value="city" class="text-blue-500 focus:ring-blue-500">
                <span class="ml-2 text-gray-700">По названию (Город)</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" v-model="form.mode" value="coords" class="text-blue-500 focus:ring-blue-500">
                <span class="ml-2 text-gray-700">По координатам</span>
              </label>
            </div>
          </div>

          <!-- Поля ввода -->
          <div v-if="form.mode === 'city'" class="grid grid-cols-1 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Название города / места</label>
              <input 
                v-model="form.city" 
                type="text" 
                required 
                placeholder="Например: Moscow, Kremlin"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-rose-300 ring-rose-100': shouldShowGeoErrors && geoErrors.city }"
              >
              <p v-if="shouldShowGeoErrors && geoErrors.city" class="mt-2 text-sm text-rose-600">
                {{ geoErrors.city }}
              </p>
            </div>
          </div>
          
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Широта (Lat)</label>
              <input 
                v-model.number="form.lat" 
                type="number" 
                step="any" 
                required
                placeholder="55.7558"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-rose-300 ring-rose-100': shouldShowGeoErrors && geoErrors.coords }"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Долгота (Lon)</label>
              <input 
                v-model.number="form.lon" 
                type="number" 
                step="any" 
                required
                placeholder="37.6173"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-rose-300 ring-rose-100': shouldShowGeoErrors && geoErrors.coords }"
              >
            </div>
            <p v-if="shouldShowGeoErrors && geoErrors.coords" class="sm:col-span-2 text-sm text-rose-600">
              {{ geoErrors.coords }}
            </p>
          </div>

          <!-- Размеры и Формат -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Ширина (м)</label>
              <input 
                v-model.number="form.width" 
                type="number" 
                min="100" max="2000"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-rose-300 ring-rose-100': shouldShowGeoErrors && geoErrors.width }"
              >
              <p v-if="shouldShowGeoErrors && geoErrors.width" class="mt-2 text-sm text-rose-600">
                {{ geoErrors.width }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Высота (м)</label>
              <input 
                v-model.number="form.height" 
                type="number" 
                min="100" max="2000"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :class="{ 'border-rose-300 ring-rose-100': shouldShowGeoErrors && geoErrors.height }"
              >
              <p v-if="shouldShowGeoErrors && geoErrors.height" class="mt-2 text-sm text-rose-600">
                {{ geoErrors.height }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Формат</label>
              <select 
                v-model="form.format" 
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="glb">GLB (glTF Binary)</option>
                <option value="obj">OBJ (Wavefront)</option>
                <option value="stl">STL (Stereolithography)</option>
              </select>
            </div>
          </div>

          <!-- Опции чекбоксы -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label class="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" v-model="form.include_roads" class="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500">
              <span class="text-sm font-medium text-gray-700">Включить дороги 🛣️</span>
            </label>
            <label class="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" v-model="form.include_terrain" class="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500">
              <span class="text-sm font-medium text-gray-700">Включить рельеф ⛰️</span>
            </label>
            <label class="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" v-model="form.print_ready" class="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500">
              <span class="text-sm font-medium text-gray-700">Готовность к 3D-печати 🖨️</span>
            </label>
          </div>

          <!-- Настройки для 3D Печати -->
          <div v-if="form.print_ready" class="space-y-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-800 mb-2">Масштаб (мм на 1м)</label>
                <p class="text-[10px] text-gray-500 mb-2">Пример: 2.0 = 1:500 (2мм на 1м)</p>
                <input 
                  v-model.number="form.scale" 
                  type="number" 
                  step="0.1"
                  class="w-full px-4 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-800 mb-2">Коэфф. высоты 🏢</label>
                <p class="text-[10px] text-gray-500 mb-2">Высота зданий. 1.0 - норм, 2.0 - выше.</p>
                <input 
                  v-model.number="form.height_multiplier" 
                  type="number" 
                  step="0.1"
                  min="0.1"
                  class="w-full px-4 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-800 mb-2">Основание (мм)</label>
                <p class="text-[10px] text-gray-500 mb-2">Толщина платформы</p>
                <input 
                  v-model.number="form.base_thickness" 
                  type="number" 
                  step="0.1"
                  class="w-full px-4 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
              </div>
            </div>

            <!-- Разбиение на платы -->
            <div class="pt-4 border-t border-blue-200">
              <label class="flex items-center space-x-3 cursor-pointer mb-4">
                <input type="checkbox" v-model="form.split_board" class="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500">
                <span class="text-sm font-medium text-gray-800">Разбить модель на квадратные печатные платы 🧩</span>
              </label>

                <div v-if="form.split_board" class="animate-fade-in-up">
                  <label class="block text-sm font-medium text-gray-800 mb-2">Размер одной платы (мм)</label>
                  <p class="text-xs text-gray-500 mb-2">Например, 160мм для стандартного стола 3D принтера.</p>
                  <input 
                    v-model.number="form.board_size_mm" 
                    type="number" 
                    step="1"
                    min="10"
                    class="w-full sm:w-1/2 px-4 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                  <p class="text-xs text-gray-500 italic mt-2">Модель будет разбита на несколько файлов и упакована в ZIP с картой сборки.</p>
                </div>
              </div>
            </div>

          <!-- Почта для асинхронной отправки -->
          <div class="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <label class="block text-sm font-medium text-gray-700 mb-2">Отправить результат на Email (опционально)</label>
            <p class="text-xs text-gray-500 mb-2">Если указано, модель будет сгенерирована в фоновом режиме и отправлена вам на почту. Полезно для больших областей.</p>
            <input 
              v-model="form.email" 
              type="email" 
              placeholder="example@mail.com"
              class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :class="{ 'border-rose-300 ring-rose-100': shouldShowGeoErrors && geoErrors.email }"
            >
            <p v-if="shouldShowGeoErrors && geoErrors.email" class="mt-2 text-sm text-rose-600">
              {{ geoErrors.email }}
            </p>
          </div>

          <!-- Кнопка генерации -->
          <div class="pt-4 border-t flex justify-end">
            <button 
              type="submit" 
              :disabled="loading"
              class="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ loading ? 'Генерация...' : '🚀 Сгенерировать и Скачать' }}</span>
            </button>
          </div>

          <InlineNotice
            v-if="shouldShowGeoErrors && firstGeoError"
            tone="error"
            title="Форма пока не готова"
            :message="firstGeoError"
          />
          <InlineNotice
            v-else-if="loading"
            title="Готовим модель"
            message="Запрос уже ушёл на сервер. Генерация больших областей может занять до пары минут."
          />
        </form>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import axios from 'axios'
import InlineNotice from '../components/InlineNotice.vue'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationsStore } from '../stores/notifications.js'
import {
  buildGeoPayload,
  buildGeoRequestConfig,
  resolveGeoDownloadFilename,
} from '../lib/geo3d-request.js'
import { validateGeoForm } from '../lib/view-feedback.js'

const loading = ref(false)
const authStore = useAuthStore()
const notifications = useNotificationsStore()
const submitAttempted = ref(false)

const form = ref({
  mode: 'city',
  city: '',
  lat: null,
  lon: null,
  width: 500,
  height: 500,
  include_roads: true,
  include_terrain: false,
  print_ready: true,
  format: 'stl',
  scale: 1.0,
  height_multiplier: 1.8,
  base_thickness: 3.0,
  split_board: true,
  board_size_mm: 160.0,
  merge_tiles: false,
  merge_gap_mm: 10.0,
  email: '',
})
const geoErrors = computed(() => validateGeoForm(form.value))
const shouldShowGeoErrors = computed(() => submitAttempted.value && Object.keys(geoErrors.value).length > 0)
const firstGeoError = computed(() => Object.values(geoErrors.value)[0] || '')

// Если выбрали print_ready, формат принудительно ставим как STL (обычно так удобнее для слайсеров)
watch(() => form.value.print_ready, (val) => {
  if (val) {
    form.value.format = 'stl'
  }
})

const generateModel = async () => {
  submitAttempted.value = true

  if (Object.keys(geoErrors.value).length > 0) {
    return
  }

  loading.value = true
  try {
    const payload = buildGeoPayload(form.value)
    const response = await axios.post(
      '/geo/api/v1/generate',
      payload,
      buildGeoRequestConfig(authStore.token),
    )
    
    // Если сервер принял задачу в фон (HTTP 202)
    if (response.status === 202) {
      notifications.info(
        'Запрос принят. Модель будет сгенерирована в фоне и отправлена на указанный email.',
        { duration: 6000 },
      )
      return
    }
    
    const filename = resolveGeoDownloadFilename({
      headers: response.headers,
      form: form.value,
    })

    // Создаем ссылку для скачивания
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    notifications.success('Модель готова, скачивание началось.')
    
    // Очистка
    window.URL.revokeObjectURL(url)
    document.body.removeChild(link)
    
  } catch (error) {
    console.error('Generation failed:', error)
    if (error.response?.data instanceof Blob) {
      // Если ответ blob, но пришла ошибка от сервера (с json внутри)
      const text = await error.response.data.text()
      try {
        const json = JSON.parse(text)
        notifications.error(json.error || json.message || 'Ошибка генерации', { duration: 6000 })
      } catch {
        notifications.error('Ошибка генерации: сервер вернул ошибку.', { duration: 6000 })
      }
    } else {
      notifications.errorFrom(error, 'Ошибка генерации', { duration: 6000 })
    }
  } finally {
    loading.value = false
  }
}
</script>
