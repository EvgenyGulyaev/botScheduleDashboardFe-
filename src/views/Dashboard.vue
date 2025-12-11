<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-900">Dashboard</h2>
      <p class="mt-2 text-lg text-gray-600">Статус ботов по сервисам</p>
    </div>

    <!-- Выбор сервиса -->
    <div class="bg-white p-6 rounded-lg shadow mb-8">
      <div class="flex items-center space-x-4">
        <label class="text-sm font-medium text-gray-700">Сервис:</label>
        <select
          v-model="selectedService"
          @change="loadStatus"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="bot">Bot</option>
        </select>

        <!-- Быстрые действия -->
        <button
          @click="restartBot"
          :disabled="loading"
          class="ml-auto px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 font-medium"
        >
          {{ loading ? '🔄 Перезапуск...' : '🔄 Перезапустить' }}
        </button>
      </div>
    </div>

    <!-- Статус карточка -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white p-8 rounded-xl shadow-lg border-l-8" :class="statusBorderClass">
        <div class="flex items-center justify-between mb-6">
          <div>
            <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">{{ selectedService }}</p>
            <p class="mt-1 text-4xl font-bold text-gray-900">{{ botStatus }}</p>
            <p class="mt-1 text-sm text-gray-500">Статус сервиса</p>
          </div>
          <div :class="statusClass" class="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
            {{ statusIcon }}
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <!-- PID -->
          <div class="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <span class="text-lg font-semibold">PID</span>
            </div>
            <div class="ml-4">
              <div class="text-xs uppercase tracking-wide text-gray-500">Process ID</div>
              <div class="text-xl font-semibold text-blue-700 mt-1">
                {{ stats.pid || '—' }}
              </div>
            </div>
          </div>

          <!-- CPU -->
          <div class="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <span class="text-lg font-semibold">CPU</span>
            </div>
            <div class="ml-4">
              <div class="text-xs uppercase tracking-wide text-gray-500">CPU time</div>
              <div class="text-xl font-semibold text-orange-700 mt-1">
                {{ stats.cpu || '—' }}
              </div>
            </div>
          </div>

          <!-- MEM -->
          <div class="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <div class="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <span class="text-lg font-semibold">RAM</span>
            </div>
            <div class="ml-4">
              <div class="text-xs uppercase tracking-wide text-gray-500">Memory</div>
              <div class="text-xl font-semibold text-green-700 mt-1">
                {{ stats.memory || '—' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Все сервисы (опционально) -->
    <div class="bg-white p-6 rounded-lg shadow">
      <h3 class="text-lg font-semibold mb-4">Все сервисы</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="service in allServices" :key="service"
             @click="selectedService = service; loadStatus()"
             class="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer hover:shadow-md transition-all">
          <div class="text-2xl mb-2">{{ serviceStatus[service]?.icon || '🟡' }}</div>
          <div class="font-medium">{{ service }}</div>
          <div class="text-sm text-gray-500">{{ serviceStatus[service]?.status || 'unknown' }}</div>
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
const serviceStatus = ref({})

// Статистика (заглушки)
const stats = ref({
  pid: '',
  cpu: '',
  memory: '',
})

const services = ['bot']

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

    // Обновляем статистику
    stats.value = res.data.Stats || stats.value
  } catch (error) {
    console.error('Status error:', error)
    botStatus.value = 'error'
  } finally {
    loading.value = false
  }
}

const loadAllServices = async () => {
  for (const service of services) {
    try {
      const res = await authStore.api.get(`/bot/status?service=${service}`)
      serviceStatus.value[service] = {
        status: res.data.status || 'unknown',
        icon: res.data.status === 'active' ? '🟢' : res.data.status === 'error' ? '🔴' : '🟡'
      }
    } catch {
      serviceStatus.value[service] = { status: 'error', icon: '🔴' }
    }
  }
}

const restartBot = async () => {
  loading.value = true
  try {
    await authStore.api.post(`/bot/restart`, {service: selectedService.value})
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
