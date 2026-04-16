<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
    <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="text-3xl font-bold tracking-tight text-slate-950">Чат</h2>
          <p class="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Прямые и групповые диалоги, синхронизированные через WebSocket без перезагрузки.
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:min-w-[24rem]">
          <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Сокет</div>
            <div class="mt-1 flex items-center gap-2">
              <span
                class="inline-flex h-2.5 w-2.5 rounded-full"
                :class="socketDotClass"
              ></span>
              <span class="text-sm font-medium text-slate-900">{{ socketLabel }}</span>
            </div>
            <div class="mt-1 text-xs text-slate-500">
              {{ reconnectLabel }}
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Активный чат</div>
            <div class="mt-1 text-sm font-medium text-slate-900">
              {{ activeConversation?.title || 'Не выбран' }}
            </div>
            <div class="mt-1 text-xs text-slate-500">
              {{ currentUserLabel }}
            </div>
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
          message="Создай первый direct-диалог или группу, чтобы начать общение."
        />
      </div>

      <div class="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)_340px]">
        <aside class="space-y-6">
          <section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-slate-950">Пользователи</h3>
                <p class="text-xs text-slate-500">Кликни, чтобы открыть direct chat</p>
              </div>
              <button
                class="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                type="button"
                @click="refreshUsers"
              >
                Обновить
              </button>
            </div>

            <div v-if="chatStore.loading.users" class="space-y-2">
              <div
                v-for="item in 4"
                :key="item"
                class="h-12 animate-pulse rounded-2xl bg-slate-100"
              ></div>
            </div>

            <div v-else class="space-y-2">
              <button
                v-for="user in otherUsers"
                :key="user.email"
                type="button"
                class="w-full rounded-2xl border px-3 py-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                :class="selectedUserEmail === user.email ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-slate-50'"
                @click="openDirectConversation(user)"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <div class="truncate text-sm font-semibold text-slate-950">{{ user.login }}</div>
                    <div class="truncate text-xs text-slate-500">{{ user.email }}</div>
                  </div>
                  <span
                    class="rounded-full px-2 py-1 text-[11px] font-semibold"
                    :class="user.isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'"
                  >
                    {{ user.isAdmin ? 'admin' : 'user' }}
                  </span>
                </div>
              </button>
            </div>
          </section>

          <section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-slate-950">Диалоги</h3>
                <p class="text-xs text-slate-500">Последние сообщения и непрочитанные</p>
              </div>
              <button
                class="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                type="button"
                @click="refreshConversations"
              >
                Обновить
              </button>
            </div>

            <div v-if="chatStore.loading.conversations" class="space-y-2">
              <div
                v-for="item in 4"
                :key="item"
                class="h-16 animate-pulse rounded-2xl bg-slate-100"
              ></div>
            </div>

            <div v-else class="space-y-2">
              <button
                v-for="conversation in conversations"
                :key="conversation.id"
                type="button"
                class="w-full rounded-2xl border px-3 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50"
                :class="conversation.id === chatStore.activeConversationId ? 'border-slate-950 bg-slate-950 text-white hover:bg-slate-950' : 'border-slate-200 bg-white'"
                @click="selectConversation(conversation.id)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="truncate text-sm font-semibold" :class="conversation.id === chatStore.activeConversationId ? 'text-white' : 'text-slate-950'">
                      {{ conversation.title }}
                    </div>
                    <div class="truncate text-xs" :class="conversation.id === chatStore.activeConversationId ? 'text-slate-300' : 'text-slate-500'">
                      {{ conversationPreview(conversation) }}
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <span
                      v-if="conversation.unreadCount"
                      class="rounded-full bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white"
                    >
                      {{ conversation.unreadCount }}
                    </span>
                    <span class="text-[11px] uppercase tracking-wide" :class="conversation.id === chatStore.activeConversationId ? 'text-slate-300' : 'text-slate-400'">
                      {{ conversation.type }}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="mb-4">
              <h3 class="text-sm font-semibold text-slate-950">Новая группа</h3>
              <p class="text-xs text-slate-500">Название + участники из доступных пользователей</p>
            </div>

            <form class="space-y-4" @submit.prevent="createGroup">
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

              <div class="max-h-52 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Участники
                </div>
                <label
                  v-for="user in otherUsers"
                  :key="`group-${user.email}`"
                  class="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-white"
                >
                  <div class="min-w-0">
                    <div class="truncate text-sm font-medium text-slate-950">{{ user.login }}</div>
                    <div class="truncate text-xs text-slate-500">{{ user.email }}</div>
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
                class="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="creatingGroup || !groupForm.title.trim()"
              >
                {{ creatingGroup ? 'Создаём…' : 'Создать группу' }}
              </button>
            </form>
          </section>
        </aside>

        <main class="space-y-6">
          <section class="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div class="border-b border-slate-200 px-5 py-4">
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Текущий чат</div>
                  <h3 class="mt-1 text-2xl font-bold text-slate-950">
                    {{ activeConversation?.title || 'Выбери диалог слева' }}
                  </h3>
                  <p class="mt-1 text-sm text-slate-500">
                    {{ activeConversationMeta }}
                  </p>
                </div>

                <div
                  v-if="activeConversation?.type === 'group'"
                  class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
                >
                  <div class="font-semibold text-slate-900">Группа</div>
                  <div class="mt-1">{{ activeConversation.members.length }} участников</div>
                </div>
              </div>
            </div>

            <div class="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div class="flex min-h-[32rem] flex-col">
                <div class="flex-1 overflow-y-auto px-5 py-4">
                  <div
                    v-if="activeConversation && activeMessages.length === 0 && !chatStore.loading.messages"
                    class="flex h-full min-h-[20rem] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500"
                  >
                    Пока сообщений нет. Напиши первое сообщение внизу.
                  </div>

                  <div v-else-if="!activeConversation" class="flex h-full min-h-[20rem] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                    Выбери чат слева, чтобы увидеть историю сообщений.
                  </div>

                  <div v-else class="space-y-3">
                    <button
                      v-for="message in activeMessages"
                      :key="message.id"
                      type="button"
                      class="w-full rounded-3xl border px-4 py-3 text-left transition"
                      :class="message.id === selectedMessageId ? 'border-indigo-300 bg-indigo-50' : message.senderEmail === currentUserEmail ? 'border-emerald-100 bg-emerald-50/70' : 'border-slate-200 bg-slate-50 hover:bg-white'"
                      @click="selectedMessageId = message.id"
                    >
                      <div class="flex items-start justify-between gap-4">
                        <div class="min-w-0">
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

                        <div class="text-xs text-slate-400">
                          #{{ message.id }}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div class="border-t border-slate-200 px-5 py-4">
                  <form class="space-y-3" @submit.prevent="sendCurrentMessage">
                    <label class="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Сообщение
                    </label>
                    <textarea
                      v-model="composerText"
                      rows="3"
                      class="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white"
                      placeholder="Напиши сообщение…"
                    ></textarea>
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p class="text-xs text-slate-500">
                        {{ composerHint }}
                      </p>
                      <button
                        type="submit"
                        class="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="sendingMessage || !composerText.trim() || !activeConversation"
                      >
                        {{ sendingMessage ? 'Отправляем…' : 'Отправить' }}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <aside class="border-t border-slate-200 bg-slate-50 px-5 py-4 lg:border-l lg:border-t-0">
                <div class="space-y-4">
                  <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Детали сообщения</div>
                    <div v-if="selectedMessage" class="mt-3 space-y-3">
                      <div>
                        <div class="text-sm font-semibold text-slate-950">
                          {{ selectedMessage.senderLogin || selectedMessage.senderEmail }}
                        </div>
                        <div class="text-xs text-slate-500">{{ selectedMessage.senderEmail }}</div>
                      </div>
                      <p class="whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                        {{ selectedMessage.text }}
                      </p>

                      <div v-if="activeConversation?.type === 'group'" class="space-y-2">
                        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Прочитали
                        </div>
                        <div
                          v-if="selectedMessage.readBy.length"
                          class="space-y-2"
                        >
                          <div
                            v-for="receipt in selectedMessage.readBy"
                            :key="receipt.email"
                            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                          >
                            <div class="text-sm font-medium text-slate-950">{{ receipt.login || receipt.email }}</div>
                            <div class="text-xs text-slate-500">{{ receipt.email }}</div>
                            <div v-if="receipt.at" class="text-xs text-slate-400">{{ formatMessageTime(receipt.at) }}</div>
                          </div>
                        </div>
                        <div v-else class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                          Пока никто не отметил это сообщение прочитанным.
                        </div>
                      </div>
                    </div>
                    <div v-else class="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      Кликни по сообщению в таймлайне, чтобы посмотреть прочтения.
                    </div>
                  </section>

                  <section v-if="activeConversation?.type === 'group'" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Участники</div>
                    <div class="mt-3 space-y-2">
                      <div
                        v-for="member in activeConversation.members"
                        :key="member.email"
                        class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <div class="text-sm font-medium text-slate-950">{{ member.login || member.email }}</div>
                        <div class="text-xs text-slate-500">{{ member.email }}</div>
                      </div>
                    </div>
                  </section>

                  <section v-if="activeConversation?.type === 'group'" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Управление группой</div>
                    <div class="mt-3 space-y-4">
                      <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Переименовать
                        </label>
                        <div class="flex gap-2">
                          <input
                            v-model="renameTitle"
                            type="text"
                            class="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:bg-white"
                            :placeholder="activeConversation.title"
                          />
                          <button
                            type="button"
                            class="rounded-2xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            :disabled="renamingGroup || !renameTitle.trim() || renameTitle.trim() === activeConversation.title"
                            @click="renameGroup"
                          >
                            {{ renamingGroup ? '…' : 'OK' }}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Добавить участников
                        </label>
                        <div class="max-h-40 space-y-2 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <label
                            v-for="user in addableUsers"
                            :key="`add-${user.email}`"
                            class="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-white"
                          >
                            <div class="min-w-0">
                              <div class="truncate text-sm font-medium text-slate-950">{{ user.login }}</div>
                              <div class="truncate text-xs text-slate-500">{{ user.email }}</div>
                            </div>
                            <input
                              v-model="membersToAdd"
                              type="checkbox"
                              :value="user.email"
                              class="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          :disabled="updatingMembers || membersToAdd.length === 0"
                          @click="addGroupMembersAction"
                        >
                          {{ updatingMembers ? 'Добавляем…' : 'Добавить' }}
                        </button>
                      </div>

                      <div>
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Удалить участников
                        </label>
                        <div class="max-h-40 space-y-2 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <label
                            v-for="member in removableMembers"
                            :key="`remove-${member.email}`"
                            class="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-white"
                          >
                            <div class="min-w-0">
                              <div class="truncate text-sm font-medium text-slate-950">{{ member.login || member.email }}</div>
                              <div class="truncate text-xs text-slate-500">{{ member.email }}</div>
                            </div>
                            <input
                              v-model="membersToRemove"
                              type="checkbox"
                              :value="member.email"
                              class="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          class="mt-2 w-full rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                          :disabled="updatingMembers || membersToRemove.length === 0"
                          @click="removeGroupMembersAction"
                        >
                          {{ updatingMembers ? 'Удаляем…' : 'Удалить' }}
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </aside>
            </div>
          </section>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import InlineNotice from '../components/InlineNotice.vue'
import { useAuthStore } from '../stores/auth.js'
import { useChatStore } from '../stores/chat.js'
import { useNotificationsStore } from '../stores/notifications.js'
import { getChatReconnectDelayMs } from '../lib/chat.js'

const authStore = useAuthStore()
const chatStore = useChatStore()
const notifications = useNotificationsStore()

const composerText = ref('')
const selectedMessageId = ref('')
const creatingGroup = ref(false)
const sendingMessage = ref(false)
const renamingGroup = ref(false)
const updatingMembers = ref(false)
const groupForm = ref({
  title: '',
  memberEmails: [],
})
const renameTitle = ref('')
const membersToAdd = ref([])
const membersToRemove = ref([])

const currentUserEmail = computed(() => authStore.user?.email || '')
const currentUserLabel = computed(() => authStore.user?.login || authStore.user?.email || 'Пользователь')
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
    return 'Realtime-канал готов к отправке.'
  }

  return `Следующая попытка через ${Math.round(getChatReconnectDelayMs(chatStore.reconnectAttempts) / 1000)}с`
})
const activeConversation = computed(() => chatStore.activeConversation)
const activeMessages = computed(() => chatStore.activeConversationMessages)
const otherUsers = computed(() =>
  chatStore.users.filter((user) => user.email && user.email !== currentUserEmail.value),
)
const selectedUserEmail = computed(() => {
  if (!activeConversation.value || activeConversation.value.type !== 'direct') {
    return ''
  }

  const peer = activeConversation.value.members.find((member) => member.email !== currentUserEmail.value)
  return peer?.email || ''
})
const selectedMessage = computed(() =>
  activeMessages.value.find((message) => message.id === selectedMessageId.value) || null,
)
const groupMembers = computed(() => activeConversation.value?.members || [])
const addableUsers = computed(() =>
  otherUsers.value.filter(
    (user) => !groupMembers.value.some((member) => member.email === user.email),
  ),
)
const removableMembers = computed(() =>
  groupMembers.value.filter((member) => member.email && member.email !== currentUserEmail.value),
)
const activeConversationMeta = computed(() => {
  if (!activeConversation.value) {
    return 'Выбери диалог слева, чтобы загрузить сообщения.'
  }

  if (activeConversation.value.type === 'direct') {
    const peer = activeConversation.value.members.find((member) => member.email !== currentUserEmail.value)
    return peer ? `Direct chat с ${peer.login || peer.email}` : 'Direct chat'
  }

  return `Группа · ${activeConversation.value.members.length} участников`
})
const composerHint = computed(() => {
  if (!activeConversation.value) {
    return 'Сначала выбери чат.'
  }

  if (activeConversation.value.type === 'direct') {
    return 'Сообщение уйдёт в direct-диалог через текущий WebSocket.'
  }

  return 'В группе сообщение увидят все участники онлайн.'
})

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

const conversationPreview = (conversation) =>
  conversation.lastMessageText || `Участников: ${conversation.members.length}`

const refreshUsers = async () => {
  try {
    await chatStore.loadUsers()
  } catch {
    // handled in store notifications
  }
}

const refreshConversations = async () => {
  try {
    await chatStore.loadConversations()
  } catch {
    // handled in store notifications
  }
}

const selectConversation = async (conversationId) => {
  try {
    await chatStore.setActiveConversation(conversationId)
    const messages = chatStore.messagesByConversation[conversationId] || []
    selectedMessageId.value = messages[messages.length - 1]?.id || ''
  } catch {
    // notifications already handled in the store
  }
}

const openDirectConversation = async (user) => {
  selectedMessageId.value = ''
  try {
    const conversation = await chatStore.ensureDirectConversation(user.email)
    await chatStore.setActiveConversation(conversation.id)
  } catch {
    // notifications already handled in the store
  }
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
    selectedMessageId.value = ''
    await chatStore.setActiveConversation(conversation.id)
    notifications.success('Группа создана')
  } catch {
    // notifications already handled in the store
  } finally {
    creatingGroup.value = false
  }
}

const renameGroup = async () => {
  if (!activeConversation.value || activeConversation.value.type !== 'group') {
    return
  }

  renamingGroup.value = true
  try {
    const conversation = await chatStore.renameGroupConversation({
      conversationId: activeConversation.value.id,
      title: renameTitle.value.trim(),
    })
    if (conversation) {
      renameTitle.value = conversation.title
    }
    notifications.success('Название группы обновлено')
  } catch {
    // notifications already handled in the store
  } finally {
    renamingGroup.value = false
  }
}

const addGroupMembersAction = async () => {
  if (
    !activeConversation.value ||
    activeConversation.value.type !== 'group' ||
    membersToAdd.value.length === 0
  ) {
    return
  }

  updatingMembers.value = true
  try {
    await chatStore.addGroupMembers({
      conversationId: activeConversation.value.id,
      memberEmails: [...membersToAdd.value],
    })
    membersToAdd.value = []
    notifications.success('Участники добавлены')
  } catch {
    // notifications already handled in the store
  } finally {
    updatingMembers.value = false
  }
}

const removeGroupMembersAction = async () => {
  if (
    !activeConversation.value ||
    activeConversation.value.type !== 'group' ||
    membersToRemove.value.length === 0
  ) {
    return
  }

  updatingMembers.value = true
  try {
    await chatStore.removeGroupMembers({
      conversationId: activeConversation.value.id,
      memberEmails: [...membersToRemove.value],
    })
    membersToRemove.value = []
    notifications.success('Участники удалены')
  } catch {
    // notifications already handled in the store
  } finally {
    updatingMembers.value = false
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
      conversationId: activeConversation.value.type === 'group' ? activeConversation.value.id : activeConversation.value.id,
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
  activeConversation,
  (conversation) => {
    if (!conversation) {
      renameTitle.value = ''
      membersToAdd.value = []
      membersToRemove.value = []
      return
    }

    renameTitle.value = conversation.title
    membersToAdd.value = []
    membersToRemove.value = []
  },
  { immediate: true },
)

onUnmounted(() => {
  chatStore.disconnect()
})
</script>
