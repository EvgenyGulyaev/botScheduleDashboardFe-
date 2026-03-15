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
              >
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
              >
            </div>
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
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Высота (м)</label>
              <input 
                v-model.number="form.height" 
                type="number" 
                min="100" max="2000"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
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
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-800 mb-2">Масштаб (Scale)</label>
                <p class="text-xs text-gray-500 mb-2">Пример: 0.002 = 1:500 (2мм на 1м)</p>
                <input 
                  v-model.number="form.scale" 
                  type="number" 
                  step="0.001"
                  class="w-full px-4 py-2 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-800 mb-2">Толщина платформы (мм)</label>
                <p class="text-xs text-gray-500 mb-2">Учитывается при генерации основания</p>
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
              </div>
            </div>
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
        </form>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'

const loading = ref(false)

const form = ref({
  mode: 'city',
  city: '',
  lat: null,
  lon: null,
  width: 500,
  height: 500,
  format: 'glb',
  include_roads: false,
  include_terrain: false,
  print_ready: false,
  scale: 1.0,
  base_thickness: 3.0,
  split_board: false,
  board_size_mm: 160.0
})

// Если выбрали print_ready, формат принудительно ставим как STL (обычно так удобнее для слайсеров)
watch(() => form.value.print_ready, (val) => {
  if (val) {
    form.value.format = 'stl'
  }
})

const generateModel = async () => {
  loading.value = true
  try {
    const payload = {
      width: form.value.width,
      height: form.value.height,
      format: form.value.format,
      include_roads: form.value.include_roads,
      include_terrain: form.value.include_terrain,
    }

    if (form.value.mode === 'city') {
      payload.city = form.value.city
    } else {
      payload.lat = form.value.lat
      payload.lon = form.value.lon
    }

    if (form.value.print_ready) {
      payload.print_ready = form.value.print_ready
      payload.scale = form.value.scale
      payload.base_thickness = form.value.base_thickness
      
      if (form.value.split_board) {
        payload.split_board = form.value.split_board
        payload.board_size_mm = form.value.board_size_mm
      }
    }

    const response = await axios.post('/geo/api/v1/generate', payload, {
      responseType: 'blob', // Важно для получения бинарного файла
      timeout: 120000 // 2 минуты, генерация может быть долгой
    })
    
    // Получаем имя файла из заголовков ответа, если сервер его отправляет
    let ext = form.value.format
    if (form.value.print_ready && form.value.split_board) {
      ext = 'zip'
    }
    
    let filename = `model_${form.value.mode === 'city' ? form.value.city : 'coords'}.${ext}`
    const disposition = response.headers['content-disposition']
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      const matches = filenameRegex.exec(disposition)
      if (matches != null && matches[1]) { 
        filename = matches[1].replace(/['"]/g, '')
      }
    }

    // Создаем ссылку для скачивания
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    
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
        alert('Ошибка генерации: ' + (json.error || json.message || 'Неизвестная ошибка'))
      } catch {
        alert('Ошибка генерации: Сервер вернул ошибку.')
      }
    } else {
      alert('Ошибка генерации: ' + error.message)
    }
  } finally {
    loading.value = false
  }
}
</script>
