<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
    <div class="mx-auto flex max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-950">Алиса</h2>
          <p class="mt-1 text-sm text-slate-500">
            Тестовая админ-форма для ручной озвучки на выбранную колонку.
          </p>
        </div>
        <button
          type="button"
          class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          @click="goBack"
        >
          Назад
        </button>
      </div>

      <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div class="mb-5">
          <h3 class="text-lg font-semibold text-slate-950">Озвучить на Алису</h3>
          <p class="mt-1 text-sm text-slate-500">
            Используются текущие Alice-аккаунты и сохранённые значения из профиля, если они уже настроены.
          </p>
        </div>

        <div
          v-if="aliceHint"
          class="mb-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800"
        >
          {{ aliceHint }}
        </div>

        <form class="grid gap-4 lg:grid-cols-2" @submit.prevent="announce">
          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Аккаунт
            </span>
            <select
              v-model="form.accountId"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white"
              :disabled="aliceLoading"
              @change="onAccountChange"
            >
              <option value="">Не выбран</option>
              <option v-for="account in aliceAccounts" :key="account.id" :value="account.id">
                {{ account.title }}
              </option>
            </select>
            <div v-if="selectedAliceAccount" class="mt-1 text-xs text-slate-500">
              Режим: {{ selectedAliceAccount.transport === 'unofficial' ? 'прямая озвучка' : 'через сценарий' }}
            </div>
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Дом
            </span>
            <select
              v-model="form.householdId"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white"
              :disabled="aliceLoading || !form.accountId"
              @change="onHouseholdChange"
            >
              <option value="">Не выбран</option>
              <option v-for="household in aliceHouseholdOptions" :key="household.id" :value="household.id">
                {{ household.label }}
              </option>
            </select>
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Комната
            </span>
            <select
              v-model="form.roomId"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white"
              :disabled="aliceLoading || !form.accountId || !form.householdId"
              @change="onRoomChange"
            >
              <option value="">Не выбрана</option>
              <option v-for="room in filteredAliceRooms" :key="room.id" :value="room.id">
                {{ room.name }}
              </option>
            </select>
          </label>

          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Колонка
            </span>
            <select
              v-model="form.deviceId"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white"
              :disabled="aliceLoading || !form.accountId || !form.householdId || !form.roomId"
            >
              <option value="">Не выбрана</option>
              <option v-for="device in filteredAliceDevices" :key="device.id" :value="device.id">
                {{ device.name }}
              </option>
            </select>
          </label>

          <div class="block lg:col-span-2">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Проверка колонки
            </span>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="sending || !canTestAliceSelection"
              title="Озвучить тестовую фразу"
              @click="testVoice"
            >
              {{ sending ? '…' : '🔊 Тест' }}
            </button>
          </div>

          <label class="block lg:col-span-2">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Текст
            </span>
            <textarea
              v-model="form.text"
              rows="6"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white"
              placeholder="Введите текст для озвучки"
            />
          </label>

          <div class="lg:col-span-2">
            <button
              type="submit"
              class="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="sending"
            >
              {{ sending ? 'Озвучиваем…' : 'Озвучить' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { filterAliceDevices, filterAliceRooms, getAliceHouseholdOptions } from '../lib/alice.js'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationsStore } from '../stores/notifications.js'

const router = useRouter()
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const aliceLoading = ref(false)
const sending = ref(false)
const aliceHint = ref('')
const aliceAccounts = ref([])
const aliceHouseholds = ref([])
const aliceRooms = ref([])
const aliceDevices = ref([])
const form = ref({
  accountId: '',
  householdId: '',
  roomId: '',
  deviceId: '',
  text: '',
})

const fillForm = (user = authStore.user) => {
  form.value = {
    accountId: user?.aliceSettings?.accountId || '',
    householdId: user?.aliceSettings?.householdId || '',
    roomId: user?.aliceSettings?.roomId || '',
    deviceId: user?.aliceSettings?.deviceId || '',
    text: '',
  }
}

const selectedAliceAccount = computed(() =>
  aliceAccounts.value.find((account) => account.id === form.value.accountId) || null,
)

const aliceHouseholdOptions = computed(() =>
  getAliceHouseholdOptions({
    households: aliceHouseholds.value,
    rooms: aliceRooms.value,
    devices: aliceDevices.value,
  }),
)

const filteredAliceRooms = computed(() =>
  filterAliceRooms(aliceRooms.value, form.value.householdId),
)

const filteredAliceDevices = computed(() =>
  filterAliceDevices(aliceDevices.value, form.value.householdId, form.value.roomId),
)

const canTestAliceSelection = computed(
  () =>
    Boolean(form.value.accountId) &&
    Boolean(form.value.householdId) &&
    Boolean(form.value.roomId) &&
    Boolean(form.value.deviceId),
)

const loadAliceAccounts = async () => {
  aliceLoading.value = true
  aliceHint.value = ''
  try {
    aliceAccounts.value = await authStore.fetchAliceAccounts()
    if (!aliceAccounts.value.length) {
      aliceHint.value =
        'Alice service подключён, но аккаунты ещё не добавлены. Их можно будет завести в alice-speaker-service отдельно.'
    }
  } catch (error) {
    aliceAccounts.value = []
    aliceHouseholds.value = []
    aliceRooms.value = []
    aliceDevices.value = []
    aliceHint.value = error?.response?.data?.message || 'Alice service пока не настроен на backend.'
  } finally {
    aliceLoading.value = false
  }
}

const loadAliceResources = async (accountId) => {
  if (!accountId) {
    aliceHouseholds.value = []
    aliceRooms.value = []
    aliceDevices.value = []
    return
  }

  aliceLoading.value = true
  aliceHint.value = ''
  try {
    const resources = await authStore.fetchAliceAccountResources(accountId)
    aliceHouseholds.value = resources.households
    aliceRooms.value = resources.rooms
    aliceDevices.value = resources.devices
  } catch (error) {
    aliceHouseholds.value = []
    aliceRooms.value = []
    aliceDevices.value = []
    aliceHint.value = error?.response?.data?.message || 'Не удалось загрузить комнаты и колонки Алисы.'
  } finally {
    aliceLoading.value = false
  }
}

const onAccountChange = async () => {
  form.value.householdId = ''
  form.value.roomId = ''
  form.value.deviceId = ''
  await loadAliceResources(form.value.accountId)
}

const onHouseholdChange = () => {
  form.value.roomId = ''
  form.value.deviceId = ''
}

const onRoomChange = () => {
  form.value.deviceId = ''
}

const announce = async () => {
  const text = form.value.text.trim()
  if (!text) {
    notifications.info('Добавь текст для озвучки')
    return
  }

  sending.value = true
  try {
    await authStore.announceOnAliceTest({
      text,
      accountId: form.value.accountId,
      householdId: form.value.householdId,
      roomId: form.value.roomId,
      deviceId: form.value.deviceId,
    })
    form.value.text = ''
    notifications.success('Текст отправлен в Алису')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось отправить текст в Алису')
  } finally {
    sending.value = false
  }
}

const testVoice = async () => {
  if (!canTestAliceSelection.value) {
    notifications.info('Сначала выбери аккаунт, дом, комнату и колонку')
    return
  }

  sending.value = true
  try {
    await authStore.announceOnAliceTest({
      text: 'Тест',
      accountId: form.value.accountId,
      householdId: form.value.householdId,
      roomId: form.value.roomId,
      deviceId: form.value.deviceId,
    })
    notifications.success('Тестовая фраза отправлена в Алису')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось отправить тест в Алису')
  } finally {
    sending.value = false
  }
}

const goBack = () => {
  router.push('/dashboard')
}

onMounted(async () => {
  try {
    await authStore.fetchProfile()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось загрузить профиль')
  }

  fillForm()
  await loadAliceAccounts()
  if (form.value.accountId) {
    await loadAliceResources(form.value.accountId)
  }
})
</script>
