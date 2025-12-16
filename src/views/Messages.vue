<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-900">Отправка сообщений</h2>
      <p class="mt-2 text-lg text-gray-600">Быстрая отправка в Telegram</p>
    </div>

    <form @submit.prevent="sendMessage" class="bg-white p-8 rounded-2xl shadow-xl space-y-6">
      <!-- выбор чата -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-3">Чат</label>

        <div v-if="loadingChats" class="text-sm text-gray-500">
          Загружаем доступные чаты...
        </div>

        <div v-else-if="chats.length === 0" class="text-sm text-red-500">
          Нет доступных чатов
        </div>

        <select
          v-else
          v-model="selectedChatId"
          required
          class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="" disabled>Выберите чат</option>
          <option
            v-for="chat in chats"
            :key="chat.id"
            :value="chat.id"
          >
            {{ chat.username }} ({{ chat.network }})
          </option>
        </select>
      </div>

      <!-- сообщение -->
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-3">Сообщение</label>
        <textarea
          v-model="message"
          rows="5"
          required
          placeholder="Введите текст сообщения..."
          class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
        />
      </div>

      <!-- кнопка -->
      <button
        type="submit"
        :disabled="loading || !selectedChatId || !message"
        class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 font-semibold text-lg shadow-lg"
      >
        📤 {{ loading ? 'Отправляем...' : 'Отправить сообщение' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()

const chats = ref([])              // [{ id, username, network }]
const loadingChats = ref(false)
const loading = ref(false)

const selectedChatId = ref('')     // user = id из массива
const message = ref('')

// выбранный объект чата, чтобы взять network
const selectedChat = computed(() =>
  chats.value.find(c => String(c.id) === String(selectedChatId.value))
)

const loadChats = async () => {
  loadingChats.value = true
  try {
    const { data } = await authStore.api.get('/social/user')
    chats.value = data || []
  } catch (e) {
    alert('❌ Не удалось загрузить чаты')
  } finally {
    loadingChats.value = false
  }
}

const sendMessage = async () => {
  if (!selectedChat.value) return

  loading.value = true
  try {
    await authStore.api.post('/message/send', {
      user: selectedChat.value.id,   // чат id → поле user
      message: message.value,               // текст → поле message
      network: selectedChat.value.network,  // из ответа /social/user
    })

    alert('✅ Сообщение отправлено!')
    message.value = ''
  } catch (error) {
    alert('❌ ' + (error.response?.data?.message || 'Ошибка отправки'))
  } finally {
    loading.value = false
  }
}

onMounted(loadChats)
</script>
