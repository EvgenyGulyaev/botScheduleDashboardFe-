<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-950">Аудит</h2>
          <p class="mt-1 text-sm text-slate-500">
            Последние 20 операций super-admin. Старые записи очищаются автоматически.
          </p>
        </div>
        <button
          type="button"
          class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading"
          @click="loadAudit"
        >
          {{ loading ? 'Обновляем...' : 'Обновить' }}
        </button>
      </div>

      <section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div v-if="loading && !entries.length" class="space-y-3">
          <div v-for="item in 4" :key="item" class="h-20 animate-pulse rounded-2xl bg-slate-100"></div>
        </div>

        <div v-else-if="!entries.length" class="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          Лог пока пуст. Первые операции появятся после создания, редактирования или удаления пользователя.
        </div>

        <ol v-else class="relative space-y-3">
          <li
            v-for="entry in entries"
            :key="entry.id"
            class="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="inline-flex rounded-full border px-2.5 py-1 text-xs font-bold"
                    :class="entry.badge.classes"
                  >
                    {{ entry.badge.label }}
                  </span>
                  <span class="font-semibold text-slate-950">{{ entry.summary || entry.action }}</span>
                </div>
                <div class="mt-2 text-sm text-slate-500">
                  {{ entry.actorLogin || entry.actorEmail || 'system' }}
                  <span v-if="entry.target"> -> {{ entry.target }}</span>
                </div>
              </div>
              <time class="shrink-0 text-sm font-semibold text-slate-500">
                {{ formatAuditDate(entry.createdAt) }}
              </time>
            </div>

            <div v-if="metadataItems(entry).length" class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="meta in metadataItems(entry)"
                :key="meta"
                class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500"
              >
                {{ meta }}
              </span>
            </div>
          </li>
        </ol>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationsStore } from '../stores/notifications.js'

const authStore = useAuthStore()
const notifications = useNotificationsStore()

const entries = ref([])
const loading = ref(false)

const loadAudit = async () => {
  loading.value = true
  try {
    entries.value = await authStore.fetchAdminAudit()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось загрузить аудит')
  } finally {
    loading.value = false
  }
}

const formatAuditDate = (value = '') => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const metadataItems = (entry) =>
  Object.entries(entry.metadata || {})
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)

onMounted(loadAudit)
</script>
