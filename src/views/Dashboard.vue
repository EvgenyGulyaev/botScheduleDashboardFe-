<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <!-- Заголовок -->
      <div
        class="mb-8 flex flex-col gap-4 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left"
      >
        <div>
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p class="text-base sm:text-lg text-gray-600">Статус ботов по сервисам</p>
        </div>
        <div
          class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"
        >
          <div class="font-semibold text-slate-900">{{ dashboardTimestampLabel }}</div>
          <div class="mt-1">
            {{
              loadingAll
                ? 'Обновляем список сервисов…'
                : 'Данные подтягиваются без перезагрузки страницы.'
            }}
          </div>
        </div>
      </div>

      <div class="mb-6 space-y-3">
        <InlineNotice
          v-if="loading && !hasLoadedStatus"
          title="Загружаем статус сервиса"
          message="Сейчас подтянем актуальные показатели и состояние процесса."
        />
        <InlineNotice
          v-else-if="statusError"
          tone="error"
          title="Не удалось обновить статус"
          :message="statusError"
        />
        <InlineNotice
          v-if="allServicesError"
          tone="error"
          title="Список сервисов обновился не полностью"
          :message="allServicesError"
        />
      </div>

      <!-- Выбор сервиса + быстрые действия -->
      <div class="bg-white p-4 sm:p-6 rounded-2xl shadow-lg mb-6 sm:mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
          <div class="flex items-center w-full sm:w-auto">
            <label class="text-sm font-medium text-gray-700 whitespace-nowrap mr-3 sm:mr-4"
              >Сервис:</label
            >
            <select
              v-model="selectedService"
              @change="loadStatus"
              class="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white min-w-0"
            >
              <option value="bot">Бот для расписания</option>
              <option value="dashboard-chat">Чат</option>
              <option value="dashboard">Панель</option>
              <option value="bot-nickname">Бот для Дискорда</option>
              <option value="shotener">Сервис для ссылок</option>
              <option value="geo3d">Сервис для 3d городов</option>
              <option value="alice-speaker-service">Сервис для Алисы</option>
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
        <div
          class="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border-l-4 lg:border-l-8"
          :class="statusBorderClass"
        >
          <div v-if="loading && !hasLoadedStatus" class="animate-pulse space-y-4">
            <div class="h-4 w-28 rounded-full bg-slate-200"></div>
            <div class="h-12 w-48 rounded-2xl bg-slate-200"></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="item in 3" :key="item" class="h-24 rounded-xl bg-slate-100"></div>
            </div>
          </div>

          <div
            v-else
            class="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8 space-y-4 lg:space-y-0"
          >
            <div class="space-y-2">
              <p class="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                {{ selectedService }}
              </p>
              <p class="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                {{ botStatus }}
              </p>
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex rounded-full border px-3 py-1 text-xs font-bold"
                  :class="healthBadge.classes"
                >
                  {{ healthBadge.label }}
                </span>
                <span class="text-xs sm:text-sm text-gray-500">
                  {{ selectedStatus.subState || 'substate unknown' }}
                </span>
              </div>
              <p v-if="selectedStatus.description" class="text-sm text-slate-500">
                {{ selectedStatus.description }}
              </p>
            </div>
            <div
              :class="statusClass"
              class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-lg self-center lg:self-auto mx-auto lg:mx-0"
            >
              {{ statusIcon }}
            </div>
          </div>

          <!-- Статистика -->
          <div v-if="hasLoadedStatus" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- PID -->
            <div
              class="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-sm border"
            >
              <div
                class="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white text-lg font-bold"
              >
                PID
              </div>
              <div class="ml-4 min-w-0 flex-1">
                <div class="text-xs uppercase tracking-wide text-blue-700 font-medium">
                  Process ID
                </div>
                <div class="text-lg sm:text-xl font-bold text-blue-900 mt-1 truncate">
                  {{ stats.pid || '—' }}
                </div>
              </div>
            </div>

            <!-- CPU -->
            <div
              class="flex items-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl shadow-sm border"
            >
              <div
                class="flex-shrink-0 w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white text-lg font-bold"
              >
                CPU
              </div>
              <div class="ml-4 min-w-0 flex-1">
                <div class="text-xs uppercase tracking-wide text-orange-700 font-medium">
                  CPU time
                </div>
                <div class="text-lg sm:text-xl font-bold text-orange-900 mt-1 truncate">
                  {{ stats.cpu || '—' }}
                </div>
              </div>
            </div>

            <!-- MEM -->
            <div
              class="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl shadow-sm border"
            >
              <div
                class="flex-shrink-0 w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white text-lg font-bold"
              >
                RAM
              </div>
              <div class="ml-4 min-w-0 flex-1">
                <div class="text-xs uppercase tracking-wide text-green-700 font-medium">Memory</div>
                <div class="text-lg sm:text-xl font-bold text-green-900 mt-1 truncate">
                  {{ stats.memory || '—' }}
                </div>
              </div>
            </div>

            <!-- UPTIME -->
            <div
              class="flex items-center p-4 bg-gradient-to-r from-sky-50 to-sky-100 rounded-xl shadow-sm border"
            >
              <div
                class="flex-shrink-0 w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white text-sm font-bold"
              >
                UP
              </div>
              <div class="ml-4 min-w-0 flex-1">
                <div class="text-xs uppercase tracking-wide text-sky-700 font-medium">Uptime</div>
                <div class="text-lg sm:text-xl font-bold text-sky-900 mt-1 truncate">
                  {{ stats.uptime || '—' }}
                </div>
              </div>
            </div>

            <!-- RESTARTS -->
            <div
              class="flex items-center p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl shadow-sm border"
            >
              <div
                class="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white text-sm font-bold"
              >
                RST
              </div>
              <div class="ml-4 min-w-0 flex-1">
                <div class="text-xs uppercase tracking-wide text-amber-700 font-medium">
                  Restarts
                </div>
                <div class="text-lg sm:text-xl font-bold text-amber-900 mt-1 truncate">
                  {{ stats.restarts || '0' }}
                </div>
              </div>
            </div>

            <!-- TASKS -->
            <div
              class="flex items-center p-4 bg-gradient-to-r from-violet-50 to-violet-100 rounded-xl shadow-sm border"
            >
              <div
                class="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-white text-sm font-bold"
              >
                TSK
              </div>
              <div class="ml-4 min-w-0 flex-1">
                <div class="text-xs uppercase tracking-wide text-violet-700 font-medium">Tasks</div>
                <div class="text-lg sm:text-xl font-bold text-violet-900 mt-1 truncate">
                  {{ stats.tasks || '—' }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="hasLoadedStatus" class="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Детали systemd
              </div>
              <dl class="mt-3 space-y-2 text-sm">
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500">Loaded</dt>
                  <dd class="font-semibold text-slate-900">{{ selectedStatus.loaded || '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500">Active since</dt>
                  <dd class="text-right font-semibold text-slate-900">
                    {{ stats.activeSince || '—' }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-slate-500">Unit file</dt>
                  <dd class="truncate text-right font-semibold text-slate-900">
                    {{ stats.fragmentPath || '—' }}
                  </dd>
                </div>
              </dl>
            </div>

            <div class="rounded-2xl border border-slate-900 bg-slate-950 p-4 text-slate-100">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Последние логи
                </div>
                <div class="text-xs text-slate-500">{{ selectedStatus.logs.length }} строк</div>
              </div>
              <div v-if="selectedStatus.logs.length" class="max-h-52 space-y-1 overflow-y-auto font-mono text-xs leading-relaxed">
                <div v-for="line in selectedStatus.logs" :key="line" class="break-words">
                  {{ line }}
                </div>
              </div>
              <div v-else class="text-sm text-slate-400">Логи пока не подтянулись.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Все сервисы -->
      <div class="bg-white p-6 sm:p-8 rounded-2xl shadow-xl">
        <h3
          class="text-xl sm:text-2xl font-bold mb-6 text-gray-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0"
        >
          <span>Все сервисы</span>
          <button
            @click="loadAllServices"
            :disabled="loadingAll"
            class="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors w-full sm:w-auto"
          >
            🔄 Обновить
          </button>
        </h3>
        <div
          v-if="loadingAll && !hasLoadedServices"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        >
          <div
            v-for="item in 4"
            :key="item"
            class="h-32 animate-pulse rounded-2xl border-2 border-slate-100 bg-slate-50"
          ></div>
        </div>
        <div
          v-else
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
        >
	          <div
	            v-for="service in services"
	            :key="service"
	            @click="
	              selectedService = service;
	              loadStatus()
	            "
            class="group p-5 sm:p-6 rounded-2xl hover:shadow-2xl cursor-pointer transition-all border-2 hover:border-blue-300 hover:bg-blue-50 border-gray-200 bg-gradient-to-br from-white/80 to-gray-50"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="text-3xl sm:text-4xl">{{ serviceTile(service).icon }}</div>
              <div
                class="w-6 h-6 rounded-full bg-gray-200 group-hover:bg-blue-200 flex items-center justify-center transition-colors"
              >
                <svg
                  class="w-3 h-3 text-gray-500 group-hover:text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </div>
            </div>
            <div class="font-semibold text-gray-900 text-sm sm:text-base mb-1 leading-tight">
              {{ service }}
            </div>
            <div class="text-xs sm:text-sm text-gray-500 leading-tight">
              {{ serviceTile(service).status }}
            </div>
            <div class="mt-3 flex flex-wrap gap-1">
              <span
                v-for="item in serviceTile(service).meta"
                :key="item"
                class="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600"
              >
                {{ item }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import InlineNotice from '../components/InlineNotice.vue'
import {
  getServiceHealthBadge,
  normalizeServiceStatus,
  summarizeServiceTile,
} from '../lib/dashboard-service-status.js'
import { formatLastUpdatedLabel } from '../lib/view-feedback.js'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationsStore } from '../stores/notifications.js'
import { isUnauthorizedError } from '../lib/auth-session.js'

const authStore = useAuthStore()
const notifications = useNotificationsStore()
const selectedService = ref('bot')
const selectedStatus = ref(normalizeServiceStatus({ service: selectedService.value }))
const loading = ref(false)
const loadingAll = ref(false)
const serviceStatus = ref({})
const statusError = ref('')
const allServicesError = ref('')
const lastUpdatedAt = ref(null)
const hasLoadedStatus = ref(false)
const hasLoadedServices = ref(false)

const services = [
  'bot',
  'dashboard',
  'bot-nickname',
  'shotener',
  'geo3d',
  'dashboard-chat',
  'alice-speaker-service',
]
const dashboardTimestampLabel = computed(() => formatLastUpdatedLabel(lastUpdatedAt.value))
const botStatus = computed(() => selectedStatus.value.status)
const stats = computed(() => selectedStatus.value.stats)
const healthBadge = computed(() => getServiceHealthBadge(selectedStatus.value.health?.level))

// Статусы
const statusClass = computed(() =>
  selectedStatus.value.health?.level === 'ok'
    ? 'bg-green-100 border-green-400'
    : selectedStatus.value.health?.level === 'error'
      ? 'bg-red-100 border-red-400'
      : 'bg-yellow-100 border-yellow-400',
)

const statusBorderClass = computed(() =>
  selectedStatus.value.health?.level === 'ok'
    ? 'border-green-500'
    : selectedStatus.value.health?.level === 'error'
      ? 'border-red-500'
      : 'border-yellow-500',
)

const statusIcon = computed(() => healthBadge.value.icon)

const serviceTile = (service) =>
  summarizeServiceTile(serviceStatus.value[service] || normalizeServiceStatus({ service }))

const loadStatus = async () => {
  loading.value = true
  try {
    const res = await authStore.api.get(`/bot/status?service=${selectedService.value}`)
    const normalized = normalizeServiceStatus(res.data)
    selectedStatus.value = normalized
    serviceStatus.value[selectedService.value] = normalized
    statusError.value = ''
    lastUpdatedAt.value = new Date()
    hasLoadedStatus.value = true
  } catch (error) {
    console.error('Status error:', error)
    if (isUnauthorizedError(error)) {
      return
    }
    selectedStatus.value = normalizeServiceStatus({
      service: selectedService.value,
      status: 'error',
      health: { level: 'error', message: 'Не получилось получить данные по выбранному сервису.' },
    })
    statusError.value =
      error.response?.data?.message || 'Не получилось получить данные по выбранному сервису.'
  } finally {
    loading.value = false
  }
}

const loadAllServices = async () => {
  loadingAll.value = true
  try {
    allServicesError.value = ''
    await Promise.all(
      services.map(async (service) => {
        try {
          const res = await authStore.api.get(`/bot/status?service=${service}`)
          serviceStatus.value[service] = normalizeServiceStatus(res.data)
        } catch (error) {
          if (isUnauthorizedError(error)) {
            return
          }
          serviceStatus.value[service] = normalizeServiceStatus({
            service,
            status: 'error',
            health: { level: 'error' },
          })
          allServicesError.value =
            'Часть сервисов не ответила. Можно повторить обновление через кнопку выше.'
        }
      }),
    )
    hasLoadedServices.value = true
  } finally {
    loadingAll.value = false
  }
}

const restartBot = async () => {
  loading.value = true
  try {
    await authStore.api.post(`/bot/restart`, { service: selectedService.value })
    notifications.success(`Сервис ${selectedService.value} перезапущен`)
    await loadStatus()
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return
    }
    notifications.errorFrom(error, 'Ошибка рестарта', { duration: 5000 })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadStatus()
  await loadAllServices()
})
</script>
