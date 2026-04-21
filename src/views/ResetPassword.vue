<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900">Новый пароль</h2>
        <p class="mt-3 text-sm text-gray-500">
          Задай новый пароль, и мы сразу вернём тебя в систему.
        </p>
      </div>

      <form class="space-y-6" @submit.prevent="submit">
        <InlineNotice
          v-if="errorMessage"
          tone="error"
          title="Не получилось обновить пароль"
          :message="errorMessage"
        />

        <div>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            placeholder="Новый пароль"
            class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          :disabled="loading || !resetToken"
          class="group relative flex w-full justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {{ loading ? 'Сохраняем…' : 'Сохранить пароль' }}
        </button>
      </form>

      <div v-if="!resetToken" class="text-center text-sm text-rose-600">
        Токен сброса не найден. Запроси новую ссылку.
      </div>

      <div class="text-center">
        <router-link
          to="/forgot-password"
          class="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          Запросить новую ссылку
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InlineNotice from '../components/InlineNotice.vue'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationsStore } from '../stores/notifications.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notifications = useNotificationsStore()

const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const resetToken = computed(() =>
  typeof route.query.token === 'string' ? route.query.token.trim() : '',
)

const submit = async () => {
  if (!resetToken.value) {
    errorMessage.value = 'Ссылка для сброса пароля неполная или уже недействительна.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await authStore.resetPassword({
      token: resetToken.value,
      password: password.value.trim(),
    })
    notifications.success('Пароль обновлён')
    await router.push(authStore.getDefaultRoute())
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message || 'Не удалось обновить пароль. Запроси новую ссылку.'
  } finally {
    loading.value = false
  }
}
</script>
