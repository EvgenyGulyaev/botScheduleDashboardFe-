<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
    <div class="mx-auto flex max-w-4xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-950">Настройки</h2>
          <p class="mt-1 text-sm text-slate-500">
            Профиль, уведомления и push для чата.
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

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div class="mb-5">
            <h3 class="text-lg font-semibold text-slate-950">Профиль</h3>
            <p class="mt-1 text-sm text-slate-500">
              Можно обновить логин, email и пароль без выхода из системы.
            </p>
          </div>

          <form class="space-y-4" @submit.prevent="saveProfile">
            <label class="block">
              <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Логин
              </span>
              <input
                v-model="profileForm.login"
                type="text"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white"
                placeholder="Твой логин"
              />
            </label>

            <label class="block">
              <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </span>
              <input
                v-model="profileForm.email"
                type="email"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white"
                placeholder="mail@example.com"
              />
            </label>

            <label class="block">
              <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Новый пароль
              </span>
              <input
                v-model="profileForm.password"
                type="password"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white"
                placeholder="Оставь пустым, если менять не нужно"
              />
            </label>

            <label class="block">
              <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Стартовая страница
              </span>
              <select
                v-model="profileForm.defaultApp"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white"
              >
                <option
                  v-for="option in DEFAULT_APP_OPTIONS"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </label>

            <button
              type="submit"
              class="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="profileSaving"
            >
              {{ profileSaving ? 'Сохраняем…' : 'Сохранить профиль' }}
            </button>
          </form>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div class="mb-5">
            <h3 class="text-lg font-semibold text-slate-950">Уведомления</h3>
            <p class="mt-1 text-sm text-slate-500">
              Push-уведомления приходят, когда вкладка закрыта или чат оффлайн.
            </p>
          </div>

          <form class="space-y-4" @submit.prevent="saveNotificationSettings">
            <label class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <div class="text-sm font-semibold text-slate-950">Push-уведомления</div>
                <div class="mt-1 text-xs text-slate-500">
                  {{
                    pushSupported
                      ? 'Системные уведомления о новых сообщениях.'
                      : 'Этот браузер или текущий протокол не поддерживает Web Push.'
                  }}
                </div>
              </div>
              <input
                v-model="notificationForm.pushEnabled"
                type="checkbox"
                class="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                :disabled="!pushSupported || notificationSaving"
              />
            </label>

            <label class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <div class="text-sm font-semibold text-slate-950">Звук в чате</div>
                <div class="mt-1 text-xs text-slate-500">
                  Локальный звук при новых сообщениях на открытой странице.
                </div>
              </div>
              <input
                v-model="notificationForm.soundEnabled"
                type="checkbox"
                class="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                :disabled="notificationSaving"
              />
            </label>

            <label class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <div class="text-sm font-semibold text-slate-950">Toast на странице</div>
                <div class="mt-1 text-xs text-slate-500">
                  Всплывашки внутри открытого приложения.
                </div>
              </div>
              <input
                v-model="notificationForm.toastEnabled"
                type="checkbox"
                class="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                :disabled="notificationSaving"
              />
            </label>

            <div
              v-if="pushHint"
              class="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800"
            >
              {{ pushHint }}
            </div>

            <button
              type="submit"
              class="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="notificationSaving"
            >
              {{ notificationSaving ? 'Сохраняем…' : 'Сохранить уведомления' }}
            </button>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DEFAULT_APP_OPTIONS, resolveDefaultAppValue } from '../lib/default-app.js'
import {
  getBrowserPushPermission,
  getExistingPushSubscription,
  isWebPushSupported,
  serializePushSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '../lib/push-notifications.js'
import { useAuthStore } from '../stores/auth.js'
import { useChatStore } from '../stores/chat.js'
import { useNotificationsStore } from '../stores/notifications.js'

const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()
const notifications = useNotificationsStore()

const profileSaving = ref(false)
const notificationSaving = ref(false)
const pushHint = ref('')
const profileForm = ref({
  login: '',
  email: '',
  password: '',
  defaultApp: 'chat',
})
const notificationForm = ref({
  pushEnabled: false,
  soundEnabled: true,
  toastEnabled: true,
})

const pushSupported = computed(
  () => isWebPushSupported() && Boolean(authStore.user?.push?.supported),
)

const fillForms = (user = authStore.user) => {
  profileForm.value = {
    login: user?.login || '',
    email: user?.email || '',
    password: '',
    defaultApp: resolveDefaultAppValue(user?.defaultApp),
  }
  notificationForm.value = {
    pushEnabled: Boolean(user?.notificationSettings?.pushEnabled),
    soundEnabled: user?.notificationSettings?.soundEnabled ?? true,
    toastEnabled: user?.notificationSettings?.toastEnabled ?? true,
  }
}

const saveProfile = async () => {
  const previousLogin = authStore.user?.login || ''
  const previousEmail = authStore.user?.email || ''
  const payload = {}
  const nextLogin = profileForm.value.login.trim()
  const nextEmail = profileForm.value.email.trim()
  const nextPassword = profileForm.value.password.trim()
  const nextDefaultApp = resolveDefaultAppValue(profileForm.value.defaultApp)

  if (nextLogin && nextLogin !== authStore.user?.login) {
    payload.login = nextLogin
  }
  if (nextEmail && nextEmail !== authStore.user?.email) {
    payload.email = nextEmail
  }
  if (nextPassword) {
    payload.password = nextPassword
  }
  if (nextDefaultApp !== resolveDefaultAppValue(authStore.user?.defaultApp)) {
    payload.default_app = nextDefaultApp
  }

  if (!Object.keys(payload).length) {
    notifications.info('В профиле пока нечего сохранять')
    return
  }

  profileSaving.value = true
  try {
    await authStore.updateProfile(payload)
    if (
      previousLogin !== (authStore.user?.login || '') ||
      previousEmail !== (authStore.user?.email || '')
    ) {
      chatStore.disconnect()
      chatStore.connect()
      void Promise.allSettled([chatStore.loadUsers(), chatStore.loadConversations()])
    }
    fillForms()
    chatStore.syncNotificationSettings(authStore.user)
    notifications.success('Профиль обновлён')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось сохранить профиль')
  } finally {
    profileSaving.value = false
  }
}

const saveNotificationSettings = async () => {
  notificationSaving.value = true
  pushHint.value = ''

  try {
    const nextSettings = {
      push_enabled: Boolean(notificationForm.value.pushEnabled),
      sound_enabled: Boolean(notificationForm.value.soundEnabled),
      toast_enabled: Boolean(notificationForm.value.toastEnabled),
    }

    const existingSubscription = await getExistingPushSubscription().catch(() => null)

    if (nextSettings.push_enabled) {
      if (!pushSupported.value) {
        throw new Error('Push-уведомления недоступны в этом браузере')
      }

      const subscription = existingSubscription || (await subscribeToPushNotifications(authStore.user?.push?.publicKey || ''))
      await authStore.savePushSubscription(serializePushSubscription(subscription))
      pushHint.value =
        getBrowserPushPermission() === 'granted'
          ? 'Push включён. Новые сообщения придут даже при закрытой вкладке.'
          : ''
    } else {
      const payload = serializePushSubscription(existingSubscription)
      await authStore.deletePushSubscription(payload?.endpoint || '')
      if (existingSubscription) {
        await unsubscribeFromPushNotifications()
      }
    }

    await authStore.updateProfile(nextSettings)
    chatStore.syncNotificationSettings(authStore.user)
    notifications.success('Настройки уведомлений обновлены')
  } catch (error) {
    pushHint.value = error?.message || 'Не удалось обновить push-уведомления'
    notifications.errorFrom(error, 'Не удалось сохранить настройки уведомлений')
    fillForms()
  } finally {
    notificationSaving.value = false
  }
}

const goBack = () => {
  router.push('/chat')
}

onMounted(async () => {
  try {
    await authStore.fetchProfile()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось загрузить настройки')
  }
  fillForms()
})
</script>
