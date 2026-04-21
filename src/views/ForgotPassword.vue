<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900">Сброс пароля</h2>
        <p class="mt-3 text-sm text-gray-500">
          Введи email, и мы отправим ссылку для установки нового пароля.
        </p>
      </div>

      <form class="space-y-6" @submit.prevent="submit">
        <InlineNotice
          v-if="errorMessage"
          tone="error"
          title="Не получилось отправить письмо"
          :message="errorMessage"
        />

        <InlineNotice
          v-if="successMessage"
          tone="success"
          title="Проверь почту"
          :message="successMessage"
        />

        <div>
          <input
            v-model="email"
            type="email"
            required
            placeholder="admin@example.com"
            class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="group relative flex w-full justify-center rounded-lg border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {{ loading ? 'Отправляем…' : 'Отправить ссылку' }}
        </button>
      </form>

      <div class="text-center">
        <router-link
          to="/login"
          class="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          Вернуться ко входу
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import InlineNotice from '../components/InlineNotice.vue'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()

const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const submit = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await authStore.forgotPassword(email.value.trim())
    successMessage.value =
      response?.data?.message ||
      'Если такой аккаунт существует, мы отправили письмо со ссылкой для сброса.'
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message || 'Не удалось отправить письмо для сброса пароля.'
  } finally {
    loading.value = false
  }
}
</script>
