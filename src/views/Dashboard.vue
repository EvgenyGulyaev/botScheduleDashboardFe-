<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Заголовок -->
      <div class="mb-8 text-center sm:text-left">
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p class="text-base sm:text-lg text-gray-600">Статус ботов по сервисам</p>
      </div>

      <!-- Выбор сервиса + быстрые действия -->
      <div class="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-6 sm:mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
          <div class="flex items-center w-full sm:w-auto">
            <label class="text-sm font-medium text-gray-700 whitespace-nowrap mr-3 sm:mr-4">Сервис:</label>
            <select
              v-model="selectedService"
              @change="loadStatus"
              class="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-0"
            >
              <option value="bot">Бот для расписания</option>
              <option value="dashboard">Панель</option>
              <option value="bot-nickname">Бот для Дискорда</option>
              <option value="shotener">Сервис для ссылок</option>
            </select>
          </div>

          <!-- Кнопка перезапуска -->
          <button
            @click="restartBot"
            :disabled="loading"
            class="w-full sm:w-auto px-6 py-2.5 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 disabled:opacity-50 font-medium text-sm shadow-md transition-colors whitespace-nowrap"
          >
            {{ loading ? '🔄 Перезапуск...' : '🔄 Перезапустить' }}
          </button>
        </div>
      </div>

      <!-- Статус карточка (полная ширина) -->
      <div class="grid grid-cols-1 gap-6 mb-8">
        <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border-l-4 lg:border-l-8" :class="statusBorderClass">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8 space-y-4 lg:space-y-0">
            <div class="space-y-2">
              <p class="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                {{ selectedService }}
              </p>
              <p class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                {{ botStatus }}
              </p>
              <p class="text-xs sm:text-sm text-gray-500">Статус сервиса</p>
            </div>
            <div :class="statusClass" class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-lg self-center lg:self-auto mx-auto lg:mx-0">
              {{ statusIcon }}
            </div>
          </div>

          <!-- Статистика -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- PID -->
            <div class="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm border">
              <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white text-lg font-bold">
                PID
              </div>
              <div class="ml-4 min-w-0 flex-1">
                <div class="text-xs uppercase tracking-wide text-blue-700 font-medium">Process ID</div>
                <div class="text-lg sm:text-xl font-bold text-blue-900 mt-1 truncate">
                  {{ stats.pid || '—' }}
                </div>
              </div>
            </div>

            <!-- CPU -->
            <div class="flex items-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl shadow-sm border">
              <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white text-lg font-bold">
                CPU
              </div>
              <div class="ml-4 min-w-0 flex-1">
                <div class="text-xs uppercase tracking-wide text-orange-700 font-medium">CPU time</div>
                <div class="text-lg sm:text-xl font-bold text-orange-900 mt-1 truncate">
                  {{ stats.cpu || '—' }}
                </div>
              </div>
            </div>

            <!-- MEM -->
            <div class="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl shadow-sm border">
              <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white text-lg font-bold">
                RAM
              </div>
              <div class="ml-4 min-w-0 flex-1">
                <div class="text-xs uppercase tracking-wide text-green-700 font-medium">Memory</div>
                <div class="text-lg sm:text-xl font-bold text-green-900 mt-1 truncate">
                  {{ stats.memory || '—' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Все сервисы -->
      <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-xl">
        <h3 class="text-xl sm:text-2xl font-bold mb-6 text-gray-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <span>Все сервисы</span>
          <button
            @click="loadAllServices"
            :disabled="loadingAll"
            class="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors w-full sm:w-auto"
          >
            🔄 Обновить
          </button>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          <div
            v-for="service in services"
            :key="service"
            @click="selectedService = service; loadStatus()"
            class="group p-5 sm:p-6 rounded-2xl hover:shadow-2xl cursor-pointer transition-all border-2 hover:border-blue-300 hover:bg-blue-50 border-gray-200 bg-gradient-to-br from-white/80 to-gray-50"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="text-3xl sm:text-4xl">{{ serviceStatus[service]?.icon || '🟡' }}</div>
              <div class="w-6 h-6 rounded-full bg-gray-200 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                <svg class="w-3 h-3 text-gray-500 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </div>
            <div class="font-semibold text-gray-900 text-sm sm:text-base mb-1 leading-tight">
              {{ service }}
            </div>
            <div class="text-xs sm:text-sm text-gray-500 leading-tight">
              {{ serviceStatus[service]?.status || 'unknown' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()
const selectedService = ref('bot')
const botStatus = ref('unknown')
const loading = ref(false)
const loadingAll = ref(false)
const serviceStatus = ref({})

// Статистика
const stats = ref({
  pid: '',
  cpu: '',
  memory: '',
})

const services = ['bot', 'dashboard', 'bot-nickname', 'shotener']

// Статусы
const statusClass = computed(() =>
  botStatus.value === 'active' ? 'bg-green-100 border-green-400' :
    botStatus.value === 'error' ? 'bg-red-100 border-red-400' :
      'bg-yellow-100 border-yellow-400'
)

const statusBorderClass = computed(() =>
  botStatus.value === 'active' ? 'border-green-500' :
    botStatus.value === 'error' ? 'border-red-500' :
      'border-yellow-500'
)

const statusIcon = computed(() =>
  botStatus.value === 'active' ? '🟢' :
    botStatus.value === 'error' ? '🔴' : '🟡'
)

const loadStatus = async () => {
  loading.value = true
  try {
    const res = await authStore.api.get(`/bot/status?service=${selectedService.value}`)
    botStatus.value = res.data.status || 'unknown'
    stats.value = res.data.Stats || stats.value
  } catch (error) {
    console.error('Status error:', error)
    botStatus.value = 'error'
  } finally {
    loading.value = false
  }
}

const loadAllServices = async () => {
  loadingAll.value = true
  try {
    await Promise.all(
      services.map(async (service) => {
        try {
          const res = await authStore.api.get(`/bot/status?service=${service}`)
          serviceStatus.value[service] = {
            status: res.data.status || 'unknown',
            icon: res.data.status === 'active' ? '🟢' : res.data.status === 'error' ? '🔴' : '🟡'
          }
        } catch {
          serviceStatus.value[service] = { status: 'error', icon: '🔴' }
        }
      })
    )
  } finally {
    loadingAll.value = false
  }
}

const restartBot = async () => {
  loading.value = true
  try {
    await authStore.api.post(`/bot/restart`, { service: selectedService.value })
    alert(`✅ Сервис ${selectedService.value} перезапущен!`)
    await loadStatus()
  } catch (error) {
    alert('❌ Ошибка рестарта: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadStatus()
  await loadAllServices()
})
</script>
