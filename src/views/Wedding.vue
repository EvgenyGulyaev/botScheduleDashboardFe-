<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-950">Свадьба</h2>
          <p class="mt-1 text-sm text-slate-500">
            Ответы гостей, напитки и экспорт списка для подготовки банкета.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="loading"
            @click="loadWeddingData"
          >
            {{ loading ? 'Обновляем...' : 'Обновить' }}
          </button>
          <button
            type="button"
            class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!rsvps.length"
            @click="downloadCsv"
          >
            Экспорт CSV
          </button>
        </div>
      </div>

      <section class="mb-5 grid gap-3 md:grid-cols-3">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Всего ответов</div>
          <div class="mt-2 text-3xl font-bold text-slate-950">{{ summary.total }}</div>
        </div>
        <div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
          <div class="text-xs font-semibold uppercase tracking-wide text-emerald-700">Придут</div>
          <div class="mt-2 text-3xl font-bold text-emerald-950">{{ summary.attending }}</div>
        </div>
        <div class="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <div class="text-xs font-semibold uppercase tracking-wide text-rose-700">Не придут</div>
          <div class="mt-2 text-3xl font-bold text-rose-950">{{ summary.notAttending }}</div>
        </div>
      </section>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 px-4 py-4 sm:px-6">
            <h3 class="text-lg font-bold text-slate-950">Заявки гостей</h3>
          </div>

          <div v-if="loading && !rsvps.length" class="p-6 text-sm text-slate-500">
            Загружаем ответы...
          </div>
          <div v-else-if="!rsvps.length" class="p-8 text-center text-sm text-slate-500">
            Ответов пока нет. Они появятся здесь после отправки формы на приглашении.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-3">Дата</th>
                  <th class="px-4 py-3">Гость</th>
                  <th class="px-4 py-3">Статус</th>
                  <th class="px-4 py-3">Напитки</th>
                  <th class="px-4 py-3">Другое</th>
                  <th class="px-4 py-3">Композиция</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="item in rsvps" :key="item.id" class="align-top">
                  <td class="whitespace-nowrap px-4 py-4 text-slate-500">
                    {{ formatDate(item.createdAt) }}
                  </td>
                  <td class="px-4 py-4 font-semibold text-slate-950">{{ item.fullName }}</td>
                  <td class="px-4 py-4">
                    <span
                      class="inline-flex rounded-full px-2.5 py-1 text-xs font-bold"
                      :class="item.attendance === 'attending'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'"
                    >
                      {{ item.attendanceLabel }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-slate-600">
                    {{ item.drinks.join(', ') || '—' }}
                  </td>
                  <td class="px-4 py-4 text-slate-600">{{ item.otherDrink || '—' }}</td>
                  <td class="px-4 py-4 text-slate-600">{{ item.song || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside class="space-y-5">
          <section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 class="text-lg font-bold text-slate-950">Напитки</h3>
            <div v-if="!summary.drinkCounts.length" class="mt-3 text-sm text-slate-500">
              Выборы появятся после первых ответов.
            </div>
            <div v-else class="mt-4 space-y-2">
              <div
                v-for="drink in summary.drinkCounts"
                :key="drink.name"
                class="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2"
              >
                <span class="min-w-0 text-sm font-semibold text-slate-700">{{ drink.name }}</span>
                <span class="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                  {{ drink.count }}
                </span>
              </div>
            </div>
          </section>

          <section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 class="text-lg font-bold text-slate-950">Варианты в форме</h3>
            <p class="mt-1 text-sm text-slate-500">
              Каждый вариант с новой строки. Пункт «Другое» лучше оставить, чтобы гости могли вписать свой напиток.
            </p>
            <textarea
              v-model="drinkOptionsText"
              class="mt-4 min-h-56 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:bg-white"
              placeholder="Белое сухое"
            ></textarea>
            <button
              type="button"
              class="mt-3 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="savingSettings"
              @click="saveSettings"
            >
              {{ savingSettings ? 'Сохраняем...' : 'Сохранить напитки' }}
            </button>
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { buildWeddingCsv, summarizeWeddingRSVPs } from '../lib/wedding.js'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationsStore } from '../stores/notifications.js'

const authStore = useAuthStore()
const notifications = useNotificationsStore()

const rsvps = ref([])
const drinkOptionsText = ref('')
const loading = ref(false)
const savingSettings = ref(false)

const summary = computed(() => summarizeWeddingRSVPs(rsvps.value))

const loadWeddingData = async () => {
  loading.value = true
  try {
    const [items, settings] = await Promise.all([
      authStore.fetchWeddingRSVPs(),
      authStore.fetchWeddingSettings(),
    ])
    rsvps.value = items
    drinkOptionsText.value = settings.drinkOptions.join('\n')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось загрузить свадебные заявки')
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  const drinkOptions = drinkOptionsText.value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!drinkOptions.length) {
    notifications.error('Добавь хотя бы один вариант напитка')
    return
  }

  savingSettings.value = true
  try {
    const settings = await authStore.updateWeddingSettings({
      drink_options: drinkOptions,
    })
    drinkOptionsText.value = settings.drinkOptions.join('\n')
    notifications.success('Напитки сохранены')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось сохранить напитки')
  } finally {
    savingSettings.value = false
  }
}

const downloadCsv = () => {
  const csv = buildWeddingCsv(rsvps.value)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'wedding-rsvps.csv'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const formatDate = (value = '') => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

onMounted(loadWeddingData)
</script>
