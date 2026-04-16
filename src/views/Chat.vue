<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="text-3xl font-bold tracking-tight text-slate-950">Чат</h2>
          <p class="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Быстрые direct-диалоги и командные обсуждения без перезагрузки страницы.
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:min-w-[30rem]">
          <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Сокет</div>
            <div class="mt-1 flex items-center gap-2">
              <span class="inline-flex h-2.5 w-2.5 rounded-full" :class="socketDotClass"></span>
              <span class="text-sm font-medium text-slate-900">{{ socketLabel }}</span>
            </div>
            <div class="mt-1 text-xs text-slate-500">{{ reconnectLabel }}</div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Уведомления</div>
            <button
              type="button"
              class="mt-1 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold transition"
              :class="chatStore.soundEnabled ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
              @click="toggleSoundNotifications"
            >
              {{ chatStore.soundEnabled ? 'Звук включён' : 'Включить звук' }}
            </button>
            <div class="mt-1 text-xs text-slate-500">Toast работает всегда, звук — после включения.</div>
          </div>
        </div>
      </div>

      <div class="mb-5 space-y-3">
        <InlineNotice
          v-if="chatStore.error"
          tone="error"
          title="Не всё синхронизировалось"
          :message="chatErrorMessage"
        />
        <InlineNotice
          v-else-if="chatStore.socketStatus === 'reconnecting'"
          title="Переподключаемся"
          message="Канал обновится автоматически, как только сокет вернётся в онлайн."
        />
        <InlineNotice
          v-else-if="!chatStore.conversations.length && !chatStore.loading.conversations"
          title="Пока пусто"
          message="Найди пользователя или создай группу через плюс в карточке чатов."
        />
      </div>

      <div class="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside>
          <section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 class="text-base font-semibold text-slate-950">Чаты</h3>
                <p class="text-xs text-slate-500">Поиск по логину или email</p>
              </div>
              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-xl font-semibold text-white shadow-sm transition hover:bg-slate-800"
                aria-label="Создать группу"
                @click="openGroupModal"
              >
                +
              </button>
            </div>

            <input
              v-model="chatSearch"
              type="search"
              class="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white"
              placeholder="Найти человека"
            />

            <div v-if="chatStore.loading.users || chatStore.loading.conversations" class="space-y-2">
              <div
                v-for="item in 5"
                :key="item"
                class="h-14 animate-pulse rounded-2xl bg-slate-100"
              ></div>
            </div>

            <div v-else-if="isSearchingChats" class="space-y-2">
              <button
                v-for="user in searchedUsers"
                :key="user.email"
                type="button"
                class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                @click="openDirectConversation(user)"
              >
                <div class="truncate text-sm font-semibold text-slate-950">{{ user.login || user.email }}</div>
                <div class="mt-1 text-xs text-slate-500">Открыть direct-диалог</div>
              </button>

              <div
                v-if="!searchedUsers.length"
                class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
              >
                Никого не нашли. Попробуй другой логин или email.
              </div>
            </div>

            <div v-else class="space-y-2">
              <button
                v-for="conversation in recentChats"
                :key="conversation.id"
                type="button"
                class="w-full rounded-2xl border px-3 py-3 text-left transition"
                :class="conversation.id === chatStore.activeConversationId ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'"
                @click="selectConversation(conversation.id)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div
                      class="truncate text-sm font-semibold"
                      :class="conversation.id === chatStore.activeConversationId ? 'text-white' : 'text-slate-950'"
                    >
                      {{ conversation.title }}
                    </div>
                    <div
                      class="mt-1 truncate text-xs"
                      :class="conversation.id === chatStore.activeConversationId ? 'text-slate-300' : 'text-slate-500'"
                    >
                      {{ conversationPreview(conversation) }}
                    </div>
                  </div>
                  <span
                    v-if="conversation.unreadCount"
                    class="rounded-full bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white"
                  >
                    {{ conversation.unreadCount }}
                  </span>
                </div>
              </button>

              <div
                v-if="!recentChats.length"
                class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
              >
                Последних чатов пока нет. Найди пользователя выше или создай группу.
              </div>
            </div>
          </section>
        </aside>

        <main>
          <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-6 py-5">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0">
                  <h3 class="truncate text-2xl font-bold text-slate-950">
                    {{ activeConversationTitle }}
                  </h3>

                  <div
                    v-if="activeConversation?.type === 'group'"
                    class="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500"
                  >
                    <span>{{ activeConversation.members.length }} участников:</span>
                    <button
                      v-for="member in groupDirectMembers"
                      :key="member.email"
                      type="button"
                      class="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-800 transition hover:bg-indigo-100 hover:text-indigo-800"
                      @click="openDirectConversation(member)"
                    >
                      {{ member.login || member.email }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex min-h-[36rem] flex-col">
              <div class="flex-1 overflow-y-auto px-6 py-5">
                <div
                  v-if="activeConversation && activeMessages.length === 0 && !chatStore.loading.messages"
                  class="flex h-full min-h-[24rem] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500"
                >
                  Пока сообщений нет. Напиши первое сообщение внизу.
                </div>

                <div
                  v-else-if="!activeConversation"
                  class="flex h-full min-h-[24rem] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500"
                >
                  Выбери чат слева или найди пользователя по логину.
                </div>

                <div v-else class="space-y-3">
                  <article
                    v-for="message in activeMessages"
                    :key="message.id"
                    class="flex"
                    :class="message.senderEmail === currentUserEmail ? 'justify-end' : 'justify-start'"
                  >
                    <div
                      class="max-w-[82%] rounded-3xl border px-4 py-3"
                      :class="message.senderEmail === currentUserEmail ? 'border-emerald-100 bg-emerald-50/80' : 'border-slate-200 bg-slate-50'"
                    >
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="text-sm font-semibold text-slate-950">{{ message.senderLogin || message.senderEmail }}</span>
                        <span
                          v-if="message.senderEmail === currentUserEmail"
                          class="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
                        >
                          вы
                        </span>
                      </div>
                      <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {{ message.text }}
                      </p>
                      <div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>{{ formatMessageTime(message.createdAt) }}</span>
                        <span v-if="message.deliveredTo?.length">{{ message.deliveredTo.length }} доставлено</span>
                        <span v-if="message.readBy?.length">{{ message.readBy.length }} прочитали</span>
                      </div>
                    </div>
                  </article>
                </div>
              </div>

              <div class="border-t border-slate-200 px-6 py-5">
                <form class="space-y-3" @submit.prevent="sendCurrentMessage">
                  <textarea
                    v-model="composerText"
                    rows="3"
                    class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white"
                    placeholder="Напиши сообщение"
                  ></textarea>
                  <button
                    type="submit"
                    class="flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="sendingMessage || !composerText.trim() || !activeConversation"
                  >
                    {{ sendingMessage ? 'Отправляем…' : 'Отправить' }}
                  </button>
                </form>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>

    <div
      v-if="groupModalOpen"
      class="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
      @click.self="closeGroupModal"
    >
      <section class="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-xl font-bold text-slate-950">Новая группа</h3>
            <p class="mt-1 text-sm text-slate-500">Укажи название и выбери участников.</p>
          </div>
          <button
            type="button"
            class="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            @click="closeGroupModal"
          >
            Закрыть
          </button>
        </div>

        <form class="space-y-5" @submit.prevent="createGroup">
          <div>
            <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Название
            </label>
            <input
              v-model="groupForm.title"
              type="text"
              class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white"
              placeholder="Команда проекта"
            />
          </div>

          <div class="max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Участники
            </div>
            <label
              v-for="user in otherUsers"
              :key="`group-${user.email}`"
              class="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-white"
            >
              <div class="min-w-0">
                <div class="truncate text-sm font-medium text-slate-950">{{ user.login || user.email }}</div>
              </div>
              <input
                v-model="groupForm.memberEmails"
                type="checkbox"
                :value="user.email"
                class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>

          <button
            type="submit"
            class="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="creatingGroup || !groupForm.title.trim()"
          >
            {{ creatingGroup ? 'Создаём…' : 'Создать группу' }}
          </button>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import InlineNotice from '../components/InlineNotice.vue'
import { getChatReconnectDelayMs } from '../lib/chat.js'
import { filterChatUsersForSearch, getRecentChatItems } from '../lib/chat-ui.js'
import { useAuthStore } from '../stores/auth.js'
import { useChatStore } from '../stores/chat.js'
import { useNotificationsStore } from '../stores/notifications.js'

const authStore = useAuthStore()
const chatStore = useChatStore()
const notifications = useNotificationsStore()

const chatSearch = ref('')
const composerText = ref('')
const creatingGroup = ref(false)
const sendingMessage = ref(false)
const groupModalOpen = ref(false)
const groupForm = ref({
  title: '',
  memberEmails: [],
})

const currentUserEmail = computed(() => authStore.user?.email || '')
const chatErrorMessage = computed(() => chatStore.error?.response?.data?.message || chatStore.error?.message || 'Не удалось загрузить или синхронизировать чат.')
const socketLabel = computed(() => {
  if (chatStore.socketStatus === 'connected') {
    return 'Подключено'
  }

  if (chatStore.socketStatus === 'connecting') {
    return 'Подключаемся'
  }

  if (chatStore.socketStatus === 'reconnecting') {
    return 'Переподключаемся'
  }

  if (chatStore.socketStatus === 'error') {
    return 'Ошибка'
  }

  return 'Отключено'
})
const socketDotClass = computed(() => {
  if (chatStore.socketStatus === 'connected') {
    return 'bg-emerald-500'
  }

  if (chatStore.socketStatus === 'connecting' || chatStore.socketStatus === 'reconnecting') {
    return 'bg-amber-500 animate-pulse'
  }

  if (chatStore.socketStatus === 'error') {
    return 'bg-rose-500'
  }

  return 'bg-slate-400'
})
const reconnectLabel = computed(() => {
  if (chatStore.socketStatus !== 'reconnecting') {
    return 'Realtime-канал готов.'
  }

  return `Следующая попытка через ${Math.round(getChatReconnectDelayMs(chatStore.reconnectAttempts) / 1000)}с`
})
const activeConversation = computed(() => chatStore.activeConversation)
const activeMessages = computed(() => chatStore.activeConversationMessages)
const otherUsers = computed(() =>
  chatStore.users.filter((user) => user.email && user.email !== currentUserEmail.value),
)
const isSearchingChats = computed(() => chatSearch.value.trim().length > 0)
const searchedUsers = computed(() =>
  filterChatUsersForSearch(chatStore.users, chatSearch.value, currentUserEmail.value),
)
const recentChats = computed(() => getRecentChatItems(chatStore.conversations, 5))
const activeConversationTitle = computed(() => activeConversation.value?.title || 'Выбери чат')
const groupDirectMembers = computed(() => {
  if (!activeConversation.value || activeConversation.value.type !== 'group') {
    return []
  }

  return activeConversation.value.members.filter((member) => member.email && member.email !== currentUserEmail.value)
})

const toggleSoundNotifications = () => {
  const enabled = chatStore.setSoundEnabled(!chatStore.soundEnabled)
  notifications.info(enabled ? 'Звуковые уведомления включены' : 'Звуковые уведомления выключены')
}

const formatMessageTime = (value) => {
  if (!value) {
    return 'только что'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const conversationPreview = (conversation) => {
  if (conversation.lastMessageText) {
    return conversation.lastMessageText
  }

  if (conversation.type === 'group') {
    return `${conversation.members.length} участников`
  }

  return 'Direct-диалог'
}

const selectConversation = async (conversationId) => {
  try {
    await chatStore.setActiveConversation(conversationId)
  } catch {
    // notifications already handled in the store
  }
}

const openDirectConversation = async (user) => {
  if (!user?.email || user.email === currentUserEmail.value) {
    return
  }

  try {
    const conversation = await chatStore.ensureDirectConversation(user.email)
    await chatStore.setActiveConversation(conversation.id)
    chatSearch.value = ''
  } catch {
    // notifications already handled in the store
  }
}

const openGroupModal = () => {
  groupModalOpen.value = true
}

const closeGroupModal = () => {
  groupModalOpen.value = false
}

const createGroup = async () => {
  if (!groupForm.value.title.trim()) {
    return
  }

  creatingGroup.value = true
  try {
    const conversation = await chatStore.createGroupConversation({
      title: groupForm.value.title.trim(),
      memberEmails: groupForm.value.memberEmails,
    })
    groupForm.value = { title: '', memberEmails: [] }
    closeGroupModal()
    await chatStore.setActiveConversation(conversation.id)
    notifications.success('Группа создана')
  } catch {
    // notifications already handled in the store
  } finally {
    creatingGroup.value = false
  }
}

const sendCurrentMessage = async () => {
  const text = composerText.value.trim()
  if (!text || !activeConversation.value) {
    return
  }

  sendingMessage.value = true
  try {
    const payload = {
      conversationId: activeConversation.value.id,
      text,
    }

    if (activeConversation.value.type === 'direct') {
      const peer = activeConversation.value.members.find((member) => member.email !== currentUserEmail.value)
      payload.recipientEmail = peer?.email || ''
    }

    const success = chatStore.sendMessage(payload)
    if (!success) {
      throw new Error('Не удалось отправить сообщение')
    }

    composerText.value = ''
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось отправить сообщение')
  } finally {
    sendingMessage.value = false
  }
}

onMounted(async () => {
  try {
    await chatStore.loadInitialState()
    if (!chatStore.activeConversationId && chatStore.conversations[0]) {
      await selectConversation(chatStore.conversations[0].id)
    } else if (chatStore.activeConversationId) {
      await selectConversation(chatStore.activeConversationId)
    }
  } catch {
    // notifications already handled in store
  }
})

watch(
  groupModalOpen,
  (isOpen) => {
    if (!isOpen) {
      groupForm.value = { title: '', memberEmails: [] }
    }
  },
)

onUnmounted(() => {
  chatStore.disconnect()
})
</script>
