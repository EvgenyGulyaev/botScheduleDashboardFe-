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
                  <th class="px-4 py-3 text-right">Действия</th>
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
                  <td class="whitespace-nowrap px-4 py-4 text-right">
                    <div class="inline-flex items-center justify-end gap-2">
                      <button
                        type="button"
                        class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
                        aria-label="Редактировать заявку"
                        :title="`Редактировать заявку: ${item.fullName || 'без имени'}`"
                        :disabled="savingRSVPId === item.id || deletingRSVPId === item.id"
                        @click="editRSVP(item)"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-wait disabled:opacity-50"
                        :disabled="deletingRSVPId === item.id || savingRSVPId === item.id"
                        @click="deleteRSVP(item)"
                      >
                        {{ deletingRSVPId === item.id ? 'Удаляем...' : 'Удалить' }}
                      </button>
                    </div>
                  </td>
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
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="text-lg font-bold text-slate-950">Защита приглашения</h3>
                <p class="mt-1 text-sm text-slate-500">
                  Код появляется только на входе в сайт. Анкета гостей отправляется без кода.
                </p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input v-model="accessCodeEnabled" type="checkbox" class="peer sr-only" />
                <span class="h-7 w-12 rounded-full bg-slate-200 transition peer-checked:bg-slate-950"></span>
                <span class="absolute left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"></span>
              </label>
            </div>
            <label class="mt-4 block">
              <span class="text-sm font-semibold text-slate-700">Код доступа</span>
              <input
                v-model.trim="accessCode"
                inputmode="numeric"
                maxlength="6"
                pattern="[0-9]{6}"
                class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold tracking-[0.28em] text-slate-950 outline-none transition focus:border-slate-400 focus:bg-white"
                placeholder="171026"
              />
            </label>
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
              {{ savingSettings ? 'Сохраняем...' : 'Сохранить настройки' }}
            </button>
          </section>
        </aside>
      </div>
    </div>

    <div
      v-if="editingRSVP"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wedding-edit-title"
      @click.self="closeEditModal"
    >
      <form class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6" @submit.prevent="saveRSVP">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 id="wedding-edit-title" class="text-xl font-bold text-slate-950">Редактировать заявку</h3>
            <p class="mt-1 text-sm text-slate-500">Можно поправить имя, статус, напитки и композицию гостя.</p>
          </div>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            aria-label="Закрыть окно редактирования"
            @click="closeEditModal"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div class="mt-6 grid gap-5">
          <label class="block">
            <span class="text-sm font-semibold text-slate-700">Имя гостя</span>
            <input
              v-model.trim="editForm.fullName"
              class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              name="full_name"
              autocomplete="name"
              required
            />
          </label>

          <fieldset class="grid gap-3">
            <legend class="text-sm font-semibold text-slate-700">Статус</legend>
            <div class="grid gap-2 sm:grid-cols-2">
              <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <input v-model="editForm.attendance" type="radio" name="edit_attendance" value="attending" required />
                Буду
              </label>
              <label class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <input v-model="editForm.attendance" type="radio" name="edit_attendance" value="not_attending" required />
                Не буду
              </label>
            </div>
          </fieldset>

          <fieldset class="grid gap-3">
            <legend class="text-sm font-semibold text-slate-700">Напитки</legend>
            <div class="grid gap-2 sm:grid-cols-2">
              <label
                v-for="drink in editDrinkOptions"
                :key="drink"
                class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
              >
                <input v-model="editForm.drinks" type="checkbox" name="edit_drinks" :value="drink" />
                {{ drink }}
              </label>
            </div>
          </fieldset>

          <label class="block">
            <span class="text-sm font-semibold text-slate-700">Другой напиток</span>
            <input
              v-model.trim="editForm.otherDrink"
              class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              name="other_drink"
              autocomplete="off"
            />
          </label>

          <label class="block">
            <span class="text-sm font-semibold text-slate-700">Композиция</span>
            <input
              v-model.trim="editForm.song"
              class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              name="song"
              autocomplete="off"
              placeholder="Исполнитель - песня"
            />
          </label>
        </div>

        <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="closeEditModal"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
            :disabled="!canSaveRSVP || savingRSVPId === editingRSVP.id"
          >
            {{ savingRSVPId === editingRSVP.id ? 'Сохраняем...' : 'Сохранить изменения' }}
          </button>
        </div>
      </form>
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
const accessCodeEnabled = ref(false)
const accessCode = ref('171026')
const loading = ref(false)
const savingSettings = ref(false)
const savingRSVPId = ref('')
const deletingRSVPId = ref('')
const editingRSVP = ref(null)
const editForm = ref({
  fullName: '',
  attendance: 'attending',
  drinks: [],
  otherDrink: '',
  song: '',
})

const summary = computed(() => summarizeWeddingRSVPs(rsvps.value))
const canSaveRSVP = computed(() => Boolean(editForm.value.fullName && editForm.value.attendance))
const editDrinkOptions = computed(() => {
  const options = new Set()
  drinkOptionsText.value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => options.add(item))
  editForm.value.drinks.forEach((item) => {
    if (item) {
      options.add(item)
    }
  })
  options.add('Другое')
  return Array.from(options)
})

const loadWeddingData = async () => {
  loading.value = true
  try {
    const [items, settings] = await Promise.all([
      authStore.fetchWeddingRSVPs(),
      authStore.fetchWeddingSettings(),
    ])
    rsvps.value = items
    drinkOptionsText.value = settings.drinkOptions.join('\n')
    accessCodeEnabled.value = settings.accessCodeEnabled
    accessCode.value = settings.accessCode || '171026'
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
  if (accessCodeEnabled.value && !/^\d{6}$/.test(accessCode.value)) {
    notifications.error('Код приглашения должен состоять из 6 цифр')
    return
  }

  savingSettings.value = true
  try {
    const settings = await authStore.updateWeddingSettings({
      drink_options: drinkOptions,
      access_code_enabled: accessCodeEnabled.value,
      access_code: accessCode.value || '171026',
    })
    drinkOptionsText.value = settings.drinkOptions.join('\n')
    accessCodeEnabled.value = settings.accessCodeEnabled
    accessCode.value = settings.accessCode || '171026'
    notifications.success('Настройки свадьбы сохранены')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось сохранить настройки свадьбы')
  } finally {
    savingSettings.value = false
  }
}

const deleteRSVP = async (item) => {
  if (!item?.id) {
    return
  }
  const confirmed = window.confirm(`Удалить заявку гостя «${item.fullName || 'без имени'}»?`)
  if (!confirmed) {
    return
  }

  deletingRSVPId.value = item.id
  try {
    await authStore.deleteWeddingRSVP(item.id)
    rsvps.value = rsvps.value.filter((rsvp) => rsvp.id !== item.id)
    notifications.success('Заявка удалена')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось удалить заявку')
  } finally {
    deletingRSVPId.value = ''
  }
}

const editRSVP = (item) => {
  editingRSVP.value = item
  editForm.value = {
    fullName: item.fullName || '',
    attendance: item.attendance || 'attending',
    drinks: [...(item.drinks || [])],
    otherDrink: item.otherDrink || '',
    song: item.song || '',
  }
}

const closeEditModal = () => {
  if (savingRSVPId.value) {
    return
  }
  editingRSVP.value = null
}

const saveRSVP = async () => {
  if (!editingRSVP.value?.id || !canSaveRSVP.value) {
    return
  }

  savingRSVPId.value = editingRSVP.value.id
  try {
    const updated = await authStore.updateWeddingRSVP(editingRSVP.value.id, {
      full_name: editForm.value.fullName,
      attendance: editForm.value.attendance,
      drinks: [...editForm.value.drinks],
      other_drink: editForm.value.otherDrink,
      song: editForm.value.song,
    })
    rsvps.value = rsvps.value.map((item) => (item.id === updated.id ? updated : item))
    editingRSVP.value = null
    notifications.success('Заявка обновлена')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось обновить заявку')
  } finally {
    savingRSVPId.value = ''
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
