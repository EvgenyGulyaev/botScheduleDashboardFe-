<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <!-- Заголовок -->
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <span
            class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
          >
            {{ loadingAll ? 'Обновляем...' : dashboardTimestampLabel }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="canRunMaintenanceCleanup"
            type="button"
            class="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="maintenanceLoading || maintenanceCleaning"
            @click="runMaintenanceCleanup"
          >
            {{
              maintenanceCleaning ? 'Очищаем...' : `Очистить ${maintenancePlan.totalReclaimable}`
            }}
          </button>
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
        <InlineNotice
          v-if="systemError"
          tone="error"
          title="Системная информация не обновилась"
          :message="systemError"
        />
        <InlineNotice
          v-if="maintenanceError"
          tone="error"
          title="Очистка недоступна"
          :message="maintenanceError"
        />
      </div>

      <!-- Сервер -->
      <div
        class="mb-8 rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl sm:p-6"
      >
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Сервер</p>
            <h3 class="mt-1 text-2xl font-bold">
              {{ systemInfo.hostname || 'server' }}
            </h3>
            <p class="mt-1 text-sm text-slate-400">
              {{ systemInfo.os }}/{{ systemInfo.arch }} · uptime
              {{ systemInfo.uptime.human || '—' }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="systemLoading"
            @click="loadSystemInfo"
          >
            {{ systemLoading ? 'Обновляем...' : 'Обновить сервер' }}
          </button>
        </div>

        <div class="grid gap-4 lg:grid-cols-4">
          <div class="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div class="text-xs uppercase tracking-wide text-slate-400">CPU</div>
            <div class="mt-2 text-2xl font-bold">{{ systemInfo.cpu.cores || '—' }} cores</div>
            <div class="mt-1 text-sm text-slate-300">
              load {{ systemInfo.cpu.load.one.toFixed(2) }} /
              {{ systemInfo.cpu.load.five.toFixed(2) }} /
              {{ systemInfo.cpu.load.fifteen.toFixed(2) }}
            </div>
          </div>

          <div class="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="text-xs uppercase tracking-wide text-slate-400">RAM</div>
              <span
                class="rounded-full px-2 py-1 text-xs font-bold"
                :class="usageBadgeClass(systemInfo.memory.usedPercent)"
              >
                {{ systemInfo.memory.usedPercent.toFixed(0) }}%
              </span>
            </div>
            <div class="mt-2 text-2xl font-bold">{{ systemInfo.memory.used || '—' }}</div>
            <div class="mt-1 text-sm text-slate-300">
              из {{ systemInfo.memory.total || '—' }}, свободно
              {{ systemInfo.memory.available || '—' }}
            </div>
            <div class="mt-3 h-2 rounded-full bg-white/10">
              <div
                class="h-2 rounded-full bg-emerald-400"
                :style="{ width: `${boundedPercent(systemInfo.memory.usedPercent)}%` }"
              ></div>
            </div>
          </div>

          <div class="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="text-xs uppercase tracking-wide text-slate-400">
                Диск {{ systemInfo.disk.path }}
              </div>
              <span
                class="rounded-full px-2 py-1 text-xs font-bold"
                :class="usageBadgeClass(systemInfo.disk.usedPercent)"
              >
                {{ systemInfo.disk.usedPercent.toFixed(0) }}%
              </span>
            </div>
            <div class="mt-2 text-2xl font-bold">{{ systemInfo.disk.used || '—' }}</div>
            <div class="mt-1 text-sm text-slate-300">
              из {{ systemInfo.disk.total || '—' }}, свободно {{ systemInfo.disk.free || '—' }}
            </div>
            <div class="mt-3 h-2 rounded-full bg-white/10">
              <div
                class="h-2 rounded-full bg-sky-400"
                :style="{ width: `${boundedPercent(systemInfo.disk.usedPercent)}%` }"
              ></div>
            </div>
          </div>

          <div class="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div class="text-xs uppercase tracking-wide text-slate-400">Swap</div>
            <div class="mt-2 text-2xl font-bold">{{ systemInfo.memory.swapUsed || '—' }}</div>
            <div class="mt-1 text-sm text-slate-300">Полезно, если RAM внезапно заканчивается.</div>
          </div>
        </div>

        <div v-if="systemAlerts.length" class="mt-5 grid gap-3 lg:grid-cols-2">
          <div
            v-for="alert in systemAlerts"
            :key="`${alert.metric}-${alert.message}`"
            class="rounded-2xl border px-4 py-3 text-sm font-semibold"
            :class="alertClass(alert.level)"
          >
            {{ alert.message }}
          </div>
        </div>

        <div
          v-if="compactSystemHistory.length > 1"
          class="mt-5 rounded-2xl border border-white/10 bg-white/10 p-4"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">
              История последних замеров
            </div>
            <div class="text-xs text-slate-500">RAM / Disk</div>
          </div>
          <div class="flex h-24 items-end gap-2">
            <div
              v-for="sample in compactSystemHistory"
              :key="sample.at"
              class="flex flex-1 items-end gap-1"
              :title="`${Math.round(sample.memory)}% RAM, ${Math.round(sample.disk)}% disk`"
            >
              <span
                class="w-full rounded-t bg-emerald-400/80"
                :style="{ height: historyBarHeight(sample.memory) }"
              ></span>
              <span
                class="w-full rounded-t bg-sky-400/80"
                :style="{ height: historyBarHeight(sample.disk) }"
              ></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Все сервисы -->
      <div class="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
        <div class="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-3">
              <h3 class="text-2xl font-black tracking-tight text-slate-950">Все сервисы</h3>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
                RAM всего {{ servicesMemoryTotalLabel }}
              </span>
            </div>
            <p class="mt-1 text-sm text-slate-500">
              Быстрый обзор процессов. Нажми на сервис, чтобы открыть детали и логи.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div class="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Активны
              </div>
              <div class="text-lg font-black text-slate-950">
                {{ activeServicesCount }}/{{ services.length }}
              </div>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              <div class="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Проблемы
              </div>
              <div
                class="text-lg font-black"
                :class="serviceProblemCount ? 'text-rose-600' : 'text-emerald-600'"
              >
                {{ serviceProblemCount }}
              </div>
            </div>
            <button
              @click="loadAllServices"
              :disabled="loadingAll"
              class="col-span-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 sm:col-span-1"
            >
              {{ loadingAll ? 'Обновляем...' : 'Обновить' }}
            </button>
          </div>
        </div>

        <div
          v-if="loadingAll && !hasLoadedServices"
          class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <div
            v-for="item in 4"
            :key="item"
            class="h-32 animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
          ></div>
        </div>
        <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <button
            v-for="service in services"
            :key="service"
            type="button"
            @click="selectService(service)"
            class="group rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
            :class="
              selectedService === service
                ? 'border-blue-400 bg-blue-50 shadow-md'
                : 'border-slate-200 bg-white'
            "
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-xl">{{ serviceTile(service).icon }}</span>
                  <span class="truncate font-black text-slate-950">{{ service }}</span>
                </div>
              </div>
            </div>
            <div class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="item in serviceTile(service).meta"
                :key="item"
                class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600"
              >
                {{ item }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Детали выбранного сервиса -->
      <div class="mb-8 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
          <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Выбранный сервис
              </p>
              <h3 class="mt-1 break-words text-3xl font-black tracking-tight text-slate-950">
                {{ selectedService }}
              </h3>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex rounded-full border px-3 py-1 text-xs font-bold"
                  :class="healthBadge.classes"
                >
                  {{ healthBadge.label }}
                </span>
                <span class="text-sm font-semibold text-slate-500">
                  {{ botStatus }}
                </span>
                <span class="text-sm text-slate-400">
                  {{ selectedStatus.subState || 'substate unknown' }}
                </span>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                type="button"
                @click="restartBot"
                :disabled="loading"
                class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
              >
                {{ loading ? 'Перезапуск...' : 'Перезапустить' }}
              </button>
            </div>
          </div>

          <div v-if="hasLoadedStatus" class="grid grid-cols-2 gap-3">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div class="text-[11px] font-bold uppercase tracking-wide text-slate-500">PID</div>
              <div class="mt-1 truncate text-lg font-black text-slate-950">
                {{ stats.pid || '—' }}
              </div>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div class="text-[11px] font-bold uppercase tracking-wide text-slate-500">RAM</div>
              <div class="mt-1 truncate text-lg font-black text-slate-950">
                {{ stats.memory || '—' }}
              </div>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div class="text-[11px] font-bold uppercase tracking-wide text-slate-500">CPU</div>
              <div class="mt-1 truncate text-lg font-black text-slate-950">
                {{ stats.cpu || '—' }}
              </div>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div class="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Рестарты
              </div>
              <div class="mt-1 truncate text-lg font-black text-slate-950">
                {{ stats.restarts || '0' }}
              </div>
            </div>
          </div>
          <div
            v-else
            class="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500"
          >
            Выбери сервис или обнови список, чтобы увидеть детали.
          </div>

          <dl v-if="hasLoadedStatus" class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Uptime</dt>
              <dd class="text-right font-semibold text-slate-900">{{ stats.uptime || '—' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-slate-500">Loaded</dt>
              <dd class="text-right font-semibold text-slate-900">
                {{ selectedStatus.loaded || '—' }}
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

        <div
          class="rounded-3xl border border-slate-900 bg-slate-950 p-5 text-slate-100 shadow-xl sm:p-6"
        >
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Логи</p>
              <h3 class="mt-1 text-xl font-black text-white">Последние строки</h3>
            </div>
            <div
              class="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2"
            >
              <label class="text-xs font-bold uppercase tracking-wide text-slate-400">Строк</label>
              <select
                v-model.number="logLines"
                @change="loadStatus"
                class="rounded-xl border border-white/10 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none"
              >
                <option :value="8">8</option>
                <option :value="30">30</option>
                <option :value="80">80</option>
                <option :value="200">200</option>
              </select>
            </div>
          </div>
          <div
            v-if="selectedStatus.logs.length"
            class="max-h-72 space-y-1 overflow-y-auto font-mono text-xs leading-relaxed"
          >
            <div v-for="line in selectedStatus.logs" :key="line" class="break-words">
              {{ line }}
            </div>
          </div>
          <div
            v-else
            class="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400"
          >
            Логи пока не подтянулись.
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
  formatServiceMemoryTotal,
  getServiceHealthBadge,
  getServicesMemoryTotalBytes,
  normalizeServiceStatus,
  summarizeServiceTile,
} from '../lib/dashboard-service-status.js'
import {
  emptySystemInfo,
  normalizeSystemInfo,
  systemUsageTone,
} from '../lib/dashboard-system-info.js'
import { normalizeMaintenancePlan } from '../lib/dashboard-maintenance.js'
import { formatLastUpdatedLabel } from '../lib/view-feedback.js'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationsStore } from '../stores/notifications.js'
import { isUnauthorizedError } from '../lib/auth-session.js'

const authStore = useAuthStore()
const notifications = useNotificationsStore()
const selectedService = ref('dashboard')
const selectedStatus = ref(normalizeServiceStatus({ service: selectedService.value }))
const loading = ref(false)
const loadingAll = ref(false)
const serviceStatus = ref({})
const systemInfo = ref(emptySystemInfo())
const systemHistory = ref([])
const systemLoading = ref(false)
const maintenancePlan = ref(normalizeMaintenancePlan())
const maintenanceLoading = ref(false)
const maintenanceCleaning = ref(false)
const logLines = ref(30)
const statusError = ref('')
const allServicesError = ref('')
const systemError = ref('')
const maintenanceError = ref('')
const lastUpdatedAt = ref(null)
const hasLoadedStatus = ref(false)
const hasLoadedServices = ref(false)

const services = [
  'dashboard',
  'chat',
  'alice-TTS',
  'drawyer',
  'proxy',
  'shotener',
  'geo3d',
  'lawyer',
  'bot',
  'bot-discord',
]
const dashboardTimestampLabel = computed(() => formatLastUpdatedLabel(lastUpdatedAt.value))
const botStatus = computed(() => selectedStatus.value.status)
const stats = computed(() => selectedStatus.value.stats)
const healthBadge = computed(() => getServiceHealthBadge(selectedStatus.value.health?.level))
const systemAlerts = computed(() => [
  ...(systemInfo.value.alerts || []),
  ...services
    .map((service) => serviceStatus.value[service])
    .filter((status) => status?.health?.level === 'error')
    .map((status) => ({
      level: 'danger',
      metric: 'service',
      message: `Сервис ${status.service} сейчас в ошибке.`,
    })),
])
const compactSystemHistory = computed(() => systemHistory.value.slice(-12))
const servicesMemoryTotalBytes = computed(() => getServicesMemoryTotalBytes(serviceStatus.value))
const servicesMemoryTotalLabel = computed(() =>
  formatServiceMemoryTotal(servicesMemoryTotalBytes.value),
)
const loadedServiceStatuses = computed(() =>
  services.map((service) => serviceStatus.value[service]).filter(Boolean),
)
const activeServicesCount = computed(
  () => loadedServiceStatuses.value.filter((status) => status.status === 'active').length,
)
const serviceProblemCount = computed(
  () => loadedServiceStatuses.value.filter((status) => status.health?.level === 'error').length,
)
const maintenanceCleanupItems = computed(() =>
  maintenancePlan.value.items.filter((item) => item.enabled).map((item) => item.key),
)
const canRunMaintenanceCleanup = computed(
  () => maintenancePlan.value.totalReclaimableBytes > 0 && maintenanceCleanupItems.value.length > 0,
)

const serviceTile = (service) =>
  summarizeServiceTile(serviceStatus.value[service] || normalizeServiceStatus({ service }))

const boundedPercent = (value = 0) => Math.max(0, Math.min(100, Number(value) || 0))

const usageBadgeClass = (percent = 0) => {
  const tone = systemUsageTone(percent)
  if (tone === 'danger') {
    return 'bg-rose-400/20 text-rose-100'
  }
  if (tone === 'warning') {
    return 'bg-amber-400/20 text-amber-100'
  }
  return 'bg-emerald-400/20 text-emerald-100'
}

const alertClass = (level = 'warning') =>
  level === 'danger'
    ? 'border-rose-400/30 bg-rose-400/10 text-rose-100'
    : 'border-amber-400/30 bg-amber-400/10 text-amber-100'

const historyBarHeight = (value = 0) => `${Math.max(8, Math.min(100, Number(value) || 0))}%`

const loadSystemInfo = async () => {
  systemLoading.value = true
  try {
    const res = await authStore.api.get('/server/status')
    const normalized = normalizeSystemInfo(res.data)
    systemInfo.value = normalized
    systemHistory.value = [
      ...systemHistory.value.slice(-19),
      {
        at: new Date().toISOString(),
        memory: normalized.memory.usedPercent,
        disk: normalized.disk.usedPercent,
        load: normalized.cpu.load.one,
      },
    ]
    systemError.value = ''
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return
    }
    systemError.value =
      error.response?.data?.message || 'Не получилось получить системную информацию сервера.'
  } finally {
    systemLoading.value = false
  }
}

const loadMaintenancePreview = async () => {
  maintenanceLoading.value = true
  try {
    const res = await authStore.api.get('/server/maintenance/preview')
    const normalized = normalizeMaintenancePlan(res.data)
    maintenancePlan.value = normalized
    maintenanceError.value = ''
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return
    }
    maintenanceError.value =
      error.response?.data?.message || 'Не получилось получить план очистки сервера.'
  } finally {
    maintenanceLoading.value = false
  }
}

const runMaintenanceCleanup = async () => {
  if (!canRunMaintenanceCleanup.value) {
    notifications.error('Сейчас нечего очищать')
    return
  }
  maintenanceCleaning.value = true
  try {
    const res = await authStore.api.post('/server/maintenance/cleanup', {
      items: maintenanceCleanupItems.value,
    })
    const normalized = normalizeMaintenancePlan(res.data)
    maintenancePlan.value = normalized
    maintenanceError.value = ''
    notifications.success(`Очистка завершена, освобождено ${normalized.cleaned || '0B'}`)
    await loadSystemInfo()
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return
    }
    maintenanceError.value = error.response?.data?.message || 'Не получилось выполнить очистку.'
    notifications.errorFrom(error, 'Не удалось очистить сервер')
  } finally {
    maintenanceCleaning.value = false
  }
}

const loadStatus = async () => {
  loading.value = true
  try {
    const res = await authStore.api.get(
      `/bot/status?service=${selectedService.value}&lines=${logLines.value}`,
    )
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
          const res = await authStore.api.get(
            `/bot/status?service=${service}&lines=${logLines.value}`,
          )
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

const selectService = (service) => {
  selectedService.value = service
  loadStatus()
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
  await loadSystemInfo()
  await loadMaintenancePreview()
  await loadStatus()
  await loadAllServices()
})
</script>
