<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Вход в админку</h2>
        <p class="mt-3 text-center text-sm text-gray-500">
          Введи рабочие учётные данные или зайди через Google.
        </p>
      </div>

      <form @submit.prevent="login" class="mt-8 space-y-6">
        <InlineNotice
          v-if="authStore.error"
          tone="error"
          title="Не получилось войти"
          :message="authStore.error"
        />

        <div class="space-y-4">
          <div>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="admin@example.com"
              class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :class="{ 'border-rose-300 ring-rose-100': shouldShowErrors && validationErrors.email }"
            />
            <p v-if="shouldShowErrors && validationErrors.email" class="mt-2 text-sm text-rose-600">
              {{ validationErrors.email }}
            </p>
          </div>

          <div>
            <input
              v-model="form.password"
              type="password"
              required
              placeholder="Пароль"
              class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              :class="{ 'border-rose-300 ring-rose-100': shouldShowErrors && validationErrors.password }"
            />
            <p
              v-if="shouldShowErrors && validationErrors.password"
              class="mt-2 text-sm text-rose-600"
            >
              {{ validationErrors.password }}
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end">
          <router-link
            to="/forgot-password"
            class="text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            Забыли пароль?
          </router-link>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {{ loading ? 'Входим...' : 'Войти' }}
        </button>
      </form>

      <div class="space-y-4">
        <div class="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
          <span class="h-px flex-1 bg-gray-200"></span>
          <span>или</span>
          <span class="h-px flex-1 bg-gray-200"></span>
        </div>

        <div
          v-if="googleConfig.enabled && googleConfig.clientId"
          ref="googleButtonRoot"
          class="flex justify-center"
        ></div>

        <div
          v-else
          class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500"
        >
          {{ googleUnavailableMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import InlineNotice from '../components/InlineNotice.vue'
import { validateLoginForm } from '../lib/view-feedback.js'
import { useNotificationsStore } from '../stores/notifications.js'
import { renderGoogleLoginButton, loadGoogleIdentityScript } from '../lib/google-identity.js'

const router = useRouter()
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const form = ref({ email: '', password: '' })
const loading = ref(false)
const googleLoading = ref(false)
const submitAttempted = ref(false)
const googleButtonRoot = ref(null)
const googleConfig = ref({
  enabled: false,
  clientId: '',
})

const isRawIpHost = (host = '') =>
  /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || /^\[[0-9a-fA-F:]+\]$/.test(host)

const validationErrors = computed(() => validateLoginForm(form.value))
const shouldShowErrors = computed(
  () => submitAttempted.value && Object.keys(validationErrors.value).length > 0,
)
const googleUnavailableMessage = computed(() => {
  const host = globalThis?.window?.location?.hostname || ''

  if (isRawIpHost(host)) {
    return 'Вход через Google недоступен на IP-адресе. Сначала подключи домен с HTTPS для админки, затем добавь этот домен в Authorized JavaScript origins в Google Cloud Console и укажи GOOGLE_CLIENT_ID на сервере.'
  }

  return 'Вход через Google пока не настроен. Проверь GOOGLE_CLIENT_ID на сервере и добавь текущий домен в Authorized JavaScript origins в Google Cloud Console.'
})

const goToDefaultApp = () => router.push(authStore.getDefaultRoute())

const login = async () => {
  submitAttempted.value = true
  authStore.error = null

  if (Object.keys(validationErrors.value).length > 0) {
    return
  }

  loading.value = true
  try {
    await authStore.login(form.value)
    notifications.success('Вход выполнен')
    await goToDefaultApp()
  } catch (error) {
    notifications.errorFrom(error, 'Ошибка входа', { duration: 5000 })
  } finally {
    loading.value = false
  }
}

const loginWithGoogle = async (credential) => {
  if (!credential || googleLoading.value) {
    return
  }

  googleLoading.value = true
  authStore.error = null
  try {
    await authStore.loginWithGoogle(credential)
    notifications.success('Вход через Google выполнен')
    await goToDefaultApp()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось войти через Google', { duration: 5000 })
  } finally {
    googleLoading.value = false
  }
}

onMounted(async () => {
  try {
    googleConfig.value = await authStore.fetchGoogleAuthConfig()
    if (!googleConfig.value.enabled || !googleConfig.value.clientId) {
      return
    }

    await loadGoogleIdentityScript()
    await nextTick()
    renderGoogleLoginButton({
      element: googleButtonRoot.value,
      clientId: googleConfig.value.clientId,
      onCredential: loginWithGoogle,
    })
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось подготовить вход через Google')
  }
})
</script>
