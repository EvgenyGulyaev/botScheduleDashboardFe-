<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <div>
      <h2 class="text-3xl font-bold text-gray-900">Отправка сообщений</h2>
      <p class="mt-2 text-lg text-gray-600">Быстрая отправка</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Левая колонка: выбор чата + сообщения -->
      <div class="space-y-4">
        <!-- выбор чата -->
        <div class="bg-white p-5 rounded-2xl shadow">
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

        <!-- сообщения по выбранному чату -->
        <div class="bg-white p-5 rounded-2xl shadow h-96 flex flex-col">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700">
              Сообщения
            </h3>
            <span
              v-if="selectedChat"
              class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600"
            >
              {{ selectedChat.username }} · {{ selectedChat.network }}
            </span>
          </div>

          <div class="flex-1 overflow-y-auto space-y-3 pr-1">
            <div
              v-if="!selectedChat"
              class="text-sm text-gray-400 h-full flex items-center justify-center"
            >
              Выберите чат, чтобы увидеть сообщения
            </div>

            <template v-else>
              <div
                v-if="combinedMessages.length === 0"
                class="text-sm text-gray-400 h-full flex items-center justify-center"
              >
                Пока нет сообщений
              </div>

              <div
                v-for="msg in combinedMessages"
                :key="msg.localId"
                class="flex"
                :class="msg.isOutgoing ? 'justify-end' : 'justify-start'"
              >
                <div
                  class="max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm"
                  :class="msg.isOutgoing
                    ? 'bg-green-500 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'"
                >
                  <div class="whitespace-pre-wrap break-words">
                    {{ msg.text }}
                  </div>
                  <div
                    class="mt-1 text-[10px]"
                    :class="msg.isOutgoing ? 'text-green-100' : 'text-gray-400'"
                  >
                    {{ msg.id ? ('ID: ' + msg.id) : 'локальное' }}
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Правая колонка: форма отправки + блокировка -->
      <div class="space-y-6">
        <!-- форма отправки -->
        <form
          @submit.prevent="sendMessage"
          class="bg-white p-8 rounded-2xl shadow-xl space-y-6"
        >
          <div style="margin-bottom: 5px">
            <label class="block text-sm font-semibold text-gray-700 mb-3">
              Сообщение
            </label>
            <textarea
              style="margin-bottom: 10px"
              v-model="message"
              rows="2"
              required
              placeholder="Введите текст сообщения..."
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
          </div>

          <button
            type="submit"
            :disabled="loading || !selectedChat || !message"
            class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 font-semibold text-lg shadow-lg"
          >
            📤 {{ loading ? 'Отправляем...' : 'Отправить сообщение' }}
          </button>
        </form>

        <!-- кнопка блокировки -->
        <div v-if="selectedChat" class="bg-white p-8 rounded-2xl shadow-xl">
          <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 2a1 1 0 10-2 0v6a1 1 0 102 0V7zm-6 3a1 1 0 10-2 0v3a1 1 0 102 0v-3z" clip-rule="evenodd"></path>
            </svg>
            Блокировка пользователя
          </h4>
          <p class="text-sm text-gray-600 mb-6">
            Заблокировать пользователя <strong>{{ selectedChat.username }}</strong> ({{ selectedChat.network }})
          </p>
          <button
            @click="blockUser"
            :disabled="blocking"
            class="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-6 rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 font-semibold shadow-lg flex items-center justify-center"
          >
            <svg v-if="blocking" class="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ blocking ? '🔒 Блокируем...' : '🔒 Заблокировать пользователя' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const authStore = useAuthStore()

// [{ id, messages: { [msgId]: text }, network, username }]
const chats = ref([])
const loadingChats = ref(false)
const loading = ref(false)
const blocking = ref(false)  // состояние блокировки

const selectedChatId = ref('')
const message = ref('')

// локальные (отправленные с этой страницы) сообщения:
const localMessages = ref([])

const refreshInterval = ref(null)

// выбранный чат
const selectedChat = computed(() =>
  chats.value.find(c => String(c.id) === String(selectedChatId.value))
)

// сообщения из поле messages выбранного чата (с сервера)
const serverMessages = computed(() => {
  if (!selectedChat.value || !selectedChat.value.messages) return []

  const msgs = selectedChat.value.messages
  return Object.entries(msgs).map(([id, text]) => ({
    localId: `srv-${id}`,
    id,
    text: String(text),
    isOutgoing: false,
  }))
})

// локальные сообщения только для выбранного чата
const outgoingMessages = computed(() => {
  if (!selectedChat.value) return []
  return localMessages.value
    .filter(m => String(m.chatId) === String(selectedChat.value.id))
    .map(m => ({
      localId: `loc-${m.localId}`,
      id: null,
      text: m.text,
      isOutgoing: true,
    }))
})

// объединённый список
const combinedMessages = computed(() => [
  ...serverMessages.value,
  ...outgoingMessages.value,
])

const loadChats = async () => {
  loadingChats.value = true
  try {
    const { data } = await authStore.api.get('/social/user')
    chats.value = Array.isArray(data) ? data : []

    // если ничего не выбрано — выбрать первый чат
    if (!selectedChatId.value && chats.value.length > 0) {
      selectedChatId.value = chats.value[0].id
    }
  } catch (e) {
    console.error('Ошибка загрузки чатов:', e)
  } finally {
    loadingChats.value = false
  }
}

const startAutoRefresh = () => {
  if (refreshInterval.value) return

  loadChats()
  refreshInterval.value = setInterval(() => {
    loadChats()
  }, 10000)
}

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

const sendMessage = async () => {
  if (!selectedChat.value || !message.value.trim()) return

  const chat = selectedChat.value
  const text = message.value.trim()

  loading.value = true

  const localId = Date.now().toString() + Math.random().toString(16).slice(2)
  localMessages.value.push({
    localId,
    chatId: chat.id,
    text,
    createdAt: new Date(),
  })

  try {
    await authStore.api.post('/message/send', {
      user: chat.id,
      message: text,
      network: chat.network,
    })

    message.value = ''
  } catch (error) {
    alert('❌ ' + (error.response?.data?.message || 'Ошибка отправки'))
  } finally {
    loading.value = false
  }
}

const blockUser = async () => {
  if (!selectedChat.value) return

  const chat = selectedChat.value

  blocking.value = true
  try {
    await authStore.api.post('/user/block', {
      user: chat.id,
      net: chat.network,
    })

    alert(`✅ Пользователь ${chat.username} (${chat.network}) заблокирован!`)
  } catch (error) {
    alert('❌ ' + (error.response?.data?.message || 'Ошибка блокировки'))
  } finally {
    blocking.value = false
  }
}

onMounted(() => {
  loadChats()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>
