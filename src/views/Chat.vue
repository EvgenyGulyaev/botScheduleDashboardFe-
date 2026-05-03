<template>
  <div
    :class="
      mobileConversationMode
        ? 'fixed inset-x-0 bottom-0 top-16 overflow-hidden bg-white'
        : 'min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 xl:h-[calc(100vh-5rem)] xl:min-h-[calc(100vh-5rem)] xl:overflow-hidden'
    "
  >
    <div
      :class="
        mobileConversationMode
          ? 'flex h-full flex-col px-0 py-0'
          : 'mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8 xl:h-full xl:min-h-0 xl:max-w-none xl:px-6 xl:py-3 2xl:px-8'
      "
    >
      <div v-if="!mobileConversationMode" class="mb-4 flex justify-end gap-2 xl:mb-2">
        <span
          class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm"
          :title="socketLabel"
          :aria-label="socketLabel"
        >
          <span class="inline-flex h-3 w-3 rounded-full" :class="socketDotClass"></span>
        </span>

        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg shadow-sm transition hover:bg-slate-50"
          title="Настройки"
          aria-label="Настройки"
          @click="openSettings"
        >
          ⚙️
        </button>
      </div>

      <div v-if="!mobileConversationMode" class="mb-5 space-y-3 xl:mb-3 xl:space-y-2">
        <InlineNotice
          v-if="showChatErrorNotice"
          tone="error"
          title="Не всё синхронизировалось"
          :message="chatErrorMessage"
        />
        <div
          v-else-if="showSocketRecoveryOverlay"
          class="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800"
        >
          <span
            class="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600"
          ></span>
          <div>
            <div class="font-semibold">{{ socketRecoveryTitle }}</div>
            <div class="text-sky-700/90">{{ socketRecoveryMessage }}</div>
          </div>
        </div>
        <InlineNotice
          v-else-if="!chatStore.conversations.length && !chatStore.loading.conversations"
          title="Пока пусто"
          message="Найди пользователя или создай группу через плюс в карточке чатов."
        />
      </div>

      <div
        :class="
          mobileConversationMode
            ? 'flex min-h-0 flex-1 flex-col'
            : 'grid gap-6 xl:min-h-0 xl:flex-1 xl:grid-cols-[340px_minmax(0,1fr)] xl:gap-4'
        "
      >
        <aside v-if="!mobileConversationMode" class="xl:min-h-0">
          <section
            class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm xl:h-full xl:overflow-y-auto xl:p-3.5"
          >
            <div class="mb-4 flex items-start justify-between gap-3 xl:mb-3">
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
              class="mb-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white xl:mb-3 xl:py-2"
              placeholder="Найти человека"
            />

            <div
              v-if="chatStore.loading.users || chatStore.loading.conversations"
              class="space-y-2"
            >
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
                <div class="truncate text-sm font-semibold text-slate-950">
                  {{ user.login || user.email }}
                </div>
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
                :class="
                  conversation.id === chatStore.activeConversationId
                    ? 'border-slate-950 bg-slate-950 text-white'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                "
                @click="selectConversation(conversation.id)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div
                      class="truncate text-sm font-semibold"
                      :class="
                        conversation.id === chatStore.activeConversationId
                          ? 'text-white'
                          : 'text-slate-950'
                      "
                    >
                      {{ conversation.title }}
                    </div>
                    <div
                      class="mt-1 truncate text-xs"
                      :class="
                        conversation.id === chatStore.activeConversationId
                          ? 'text-slate-300'
                          : 'text-slate-500'
                      "
                    >
                      {{ conversationPreview(conversation) }}
                    </div>
                    <div
                      class="mt-0.5 truncate text-[11px]"
                      :class="
                        conversation.id === chatStore.activeConversationId
                          ? 'text-slate-400'
                          : 'text-slate-400'
                      "
                    >
                      {{ conversationPresence(conversation) }}
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

            <div class="mt-4 border-t border-slate-100 pt-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h4 class="text-sm font-bold text-slate-950">Центр чата</h4>
                  <p class="text-xs text-slate-500">Непрочитанные, важное и напоминания</p>
                </div>
                <span
                  v-if="totalUnreadCount"
                  class="rounded-full bg-sky-600 px-2.5 py-1 text-[11px] font-bold text-white"
                >
                  {{ totalUnreadCount }}
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition"
                  :class="
                    chatCenterMode === 'unread'
                      ? 'border-sky-300 bg-sky-50 text-sky-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                  "
                  @click="openChatCenter('unread')"
                >
                  Непрочитанные
                </button>
                <button
                  type="button"
                  class="rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition"
                  :class="
                    chatCenterMode === 'important'
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                  "
                  @click="openChatCenter('important')"
                >
                  Важное
                </button>
                <button
                  type="button"
                  class="rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition"
                  :class="
                    chatCenterMode === 'reminders'
                      ? 'border-rose-300 bg-rose-50 text-rose-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                  "
                  @click="openChatCenter('reminders')"
                >
                  Напоминания
                </button>
                <button
                  type="button"
                  class="rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition"
                  :class="
                    chatCenterMode === 'search'
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                  "
                  @click="openChatCenter('search')"
                >
                  Поиск
                </button>
              </div>

              <div
                v-if="chatCenterMode"
                class="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-3"
              >
                <div v-if="chatCenterMode === 'unread'" class="space-y-2">
                  <button
                    v-for="conversation in unreadCenterItems"
                    :key="`unread-${conversation.id}`"
                    type="button"
                    class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-sky-200 hover:bg-sky-50"
                    @click="selectUnreadConversation(conversation)"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <span class="truncate text-sm font-semibold text-slate-950">
                        {{ conversation.title }}
                      </span>
                      <span
                        class="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white"
                      >
                        {{ conversation.unreadCount }}
                      </span>
                    </div>
                    <div class="mt-1 truncate text-xs text-slate-500">
                      {{ conversationPreview(conversation) }}
                    </div>
                  </button>
                  <div
                    v-if="!unreadCenterItems.length"
                    class="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-5 text-center text-xs text-slate-500"
                  >
                    Всё прочитано.
                  </div>
                </div>

                <div v-else-if="chatCenterMode === 'important'" class="space-y-2">
                  <input
                    v-model="importantQuery"
                    type="search"
                    class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-300"
                    placeholder="Фильтр важного"
                  />
                  <div
                    v-if="chatStore.loading.favorites"
                    class="rounded-2xl border border-slate-200 bg-white px-3 py-4 text-xs text-slate-500"
                  >
                    Загружаем важное…
                  </div>
                  <button
                    v-for="message in importantMessages"
                    :key="`important-${message.conversationId}-${message.id}`"
                    type="button"
                    class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-amber-200 hover:bg-amber-50"
                    @click="openFavoriteMessage(message)"
                  >
                    <div class="truncate text-xs font-semibold text-amber-700">
                      ★ {{ conversationTitleById(message.conversationId) }}
                    </div>
                    <div class="mt-1 line-clamp-2 text-sm text-slate-700">
                      {{ messagePreviewText(message) }}
                    </div>
                  </button>
                  <div
                    v-if="!chatStore.loading.favorites && !importantMessages.length"
                    class="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-5 text-center text-xs text-slate-500"
                  >
                    Важных сообщений пока нет.
                  </div>
                </div>

                <div v-else-if="chatCenterMode === 'reminders'" class="space-y-2">
                  <div
                    v-if="chatStore.loading.reminders"
                    class="rounded-2xl border border-slate-200 bg-white px-3 py-4 text-xs text-slate-500"
                  >
                    Загружаем напоминания…
                  </div>
                  <div
                    v-for="reminder in reminderItems"
                    :key="`reminder-${reminder.id}`"
                    class="rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <button
                      type="button"
                      class="block w-full text-left"
                      @click="openReminderMessage(reminder)"
                    >
                      <div class="truncate text-xs font-semibold text-rose-700">
                        ⏰ {{ formatReminderDate(reminder.remindAt) }}
                      </div>
                      <div class="mt-1 text-sm text-slate-700">
                        {{ reminder.messageText || 'Сообщение' }}
                      </div>
                      <div class="mt-1 truncate text-xs text-slate-500">
                        {{
                          reminder.conversationTitle ||
                          conversationTitleById(reminder.conversationId)
                        }}
                      </div>
                    </button>
                    <button
                      type="button"
                      class="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                      @click="removeReminder(reminder.id)"
                    >
                      Убрать
                    </button>
                  </div>
                  <div
                    v-if="!chatStore.loading.reminders && !reminderItems.length"
                    class="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-5 text-center text-xs text-slate-500"
                  >
                    Напоминаний пока нет.
                  </div>
                </div>

                <div v-else-if="chatCenterMode === 'search'" class="space-y-2">
                  <input
                    v-model="searchQuery"
                    type="search"
                    class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-300"
                    placeholder="Поиск по всем сообщениям"
                  />
                  <button
                    v-for="result in activeSearchResults"
                    :key="`center-search-${result.conversationId}-${result.messageId}`"
                    type="button"
                    class="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
                    @click="openSearchResult(result)"
                  >
                    <div class="truncate text-xs font-semibold text-indigo-700">
                      {{ result.conversationTitle || 'Чат' }}
                    </div>
                    <div class="mt-1 text-sm text-slate-700">
                      {{ searchResultExcerpt(result) }}
                    </div>
                  </button>
                  <div
                    v-if="
                      searchQuery.trim() && !chatStore.loading.search && !activeSearchResults.length
                    "
                    class="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-5 text-center text-xs text-slate-500"
                  >
                    Ничего не нашли.
                  </div>
                </div>
              </div>
            </div>
          </section>
        </aside>

        <main
          v-if="!isMobileLayout || mobileView === 'conversation'"
          :class="
            mobileConversationMode ? 'min-h-0 flex-1 overflow-hidden' : 'min-h-[30rem] xl:min-h-0'
          "
        >
          <section
            :class="
              mobileConversationMode
                ? 'relative flex h-full min-h-0 flex-col overflow-hidden bg-white'
                : 'relative flex h-[calc(100vh-12rem)] min-h-[30rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:h-full xl:min-h-0'
            "
          >
            <div
              v-if="showSocketRecoveryOverlay"
              class="absolute inset-0 z-20 flex items-center justify-center bg-white/80 px-6 backdrop-blur-[1px]"
            >
              <div
                class="flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-sky-100 bg-white px-5 py-5 text-center shadow-sm"
              >
                <span
                  class="inline-flex h-8 w-8 animate-spin rounded-full border-[3px] border-sky-200 border-t-sky-600"
                ></span>
                <div class="text-base font-semibold text-slate-950">{{ socketRecoveryTitle }}</div>
                <div class="text-sm leading-6 text-slate-600">{{ socketRecoveryMessage }}</div>
              </div>
            </div>
            <div
              v-if="showCallFocusLayout"
              :class="
                mobileConversationMode
                  ? 'fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-slate-950 via-slate-950/90 to-transparent px-3 py-4'
                  : 'border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-4 xl:px-5 xl:py-4'
              "
            >
              <div class="space-y-3">
                <div class="flex items-center justify-between gap-3">
                  <div class="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      :class="
                        mobileConversationMode
                          ? 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-base text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15'
                          : 'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100'
                      "
                      aria-label="Назад к чату"
                      @click="closeCallFocus"
                    >
                      ←
                    </button>
                    <div class="min-w-0">
                      <h3
                        :class="
                          mobileConversationMode
                            ? 'truncate text-lg font-bold text-white sm:text-xl'
                            : 'truncate text-lg font-bold text-slate-950 sm:text-xl'
                        "
                      >
                        {{ focusedCallTile?.login || focusedCallTile?.email || 'Звонок' }}
                      </h3>
                      <div
                        :class="
                          mobileConversationMode
                            ? 'truncate text-xs text-white/70 sm:text-sm'
                            : 'truncate text-xs text-slate-500 sm:text-sm'
                        "
                      >
                        {{ displayedCallConversation?.title || activeConversationTitle }}
                      </div>
                    </div>
                  </div>

                  <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    <button
                      v-if="displayedCall?.joinable && !isCurrentUserInDisplayedCall"
                      type="button"
                      :class="
                        mobileConversationMode
                          ? 'rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50'
                          : 'rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50'
                      "
                      :disabled="joiningCall || Boolean(callActionError)"
                      @click="joinDisplayedCall"
                    >
                      {{ joiningCall ? 'Подключаем…' : 'Подключиться' }}
                    </button>
                    <button
                      v-if="displayedCall?.joinable && isCurrentUserInDisplayedCall"
                      type="button"
                      :class="
                        mobileConversationMode
                          ? 'inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50'
                          : 'inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50'
                      "
                      :title="localCallCameraEnabled ? 'Выключить камеру' : 'Включить камеру'"
                      :aria-label="localCallCameraEnabled ? 'Выключить камеру' : 'Включить камеру'"
                      :disabled="localCallScreenSharing"
                      @click="toggleCallCamera"
                    >
                      {{ localCallCameraEnabled ? '📷' : '🚫' }}
                    </button>
                    <button
                      v-if="displayedCall?.joinable && isCurrentUserInDisplayedCall"
                      type="button"
                      :class="
                        mobileConversationMode
                          ? 'inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15 disabled:cursor-wait disabled:opacity-50'
                          : 'inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-50'
                      "
                      :title="
                        localCallScreenSharing ? 'Остановить демонстрацию экрана' : 'Показать экран'
                      "
                      :aria-label="
                        localCallScreenSharing ? 'Остановить демонстрацию экрана' : 'Показать экран'
                      "
                      :disabled="startingScreenShare"
                      @click="toggleCallScreenShare"
                    >
                      {{ localCallScreenSharing ? '🛑' : '🖥️' }}
                    </button>
                    <button
                      v-if="displayedCall?.joinable && isCurrentUserInDisplayedCall"
                      type="button"
                      :class="
                        mobileConversationMode
                          ? 'inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-lg text-white shadow-sm backdrop-blur-sm transition hover:bg-white/15'
                          : 'inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100'
                      "
                      :title="localCallMuted ? 'Включить микрофон' : 'Выключить микрофон'"
                      :aria-label="localCallMuted ? 'Включить микрофон' : 'Выключить микрофон'"
                      @click="toggleCallMute"
                    >
                      {{ localCallMuted ? '🔇' : '🎤' }}
                    </button>
                    <button
                      v-if="displayedCall?.joinable && isCurrentUserInDisplayedCall"
                      type="button"
                      :class="
                        mobileConversationMode
                          ? 'rounded-2xl border border-rose-300/40 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50'
                          : 'rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50'
                      "
                      :disabled="endingCall"
                      @click="leaveDisplayedCall"
                    >
                      {{ endingCall ? 'Выходим…' : 'Выйти' }}
                    </button>
                  </div>
                </div>

                <div
                  v-if="callActionError"
                  :class="
                    mobileConversationMode
                      ? 'rounded-2xl border border-rose-300/30 bg-rose-500/20 px-3 py-2 text-sm text-white'
                      : 'rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700'
                  "
                >
                  {{ callActionError }}
                </div>
              </div>
            </div>

            <div
              v-else
              :class="
                mobileConversationMode
                  ? 'border-b border-slate-200 px-3 py-3'
                  : 'border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5 xl:px-5 xl:py-4'
              "
            >
              <div :class="mobileConversationMode ? 'space-y-2' : 'flex flex-col gap-3'">
                <div v-if="mobileConversationMode" class="flex items-center gap-2">
                  <button
                    type="button"
                    class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base text-slate-700 shadow-sm"
                    aria-label="Назад к чатам"
                    @click="openChatsScreen"
                  >
                    ←
                  </button>
                  <div class="min-w-0 flex-1">
                    <h3 class="truncate text-lg font-bold text-slate-950">
                      {{ activeConversationTitle }}
                    </h3>
                    <div v-if="activePresenceText" class="truncate text-xs text-slate-500">
                      {{ activePresenceText }}
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="!activePinnedMessage"
                      :title="activePinnedMessage ? 'Перейти к закрепу' : 'Закрепов пока нет'"
                      aria-label="Закреплённое сообщение"
                      @click="jumpToPinnedMessage"
                    >
                      📌
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-100 bg-white text-base text-rose-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="
                        !activeConversation ||
                        !activeMessages.length ||
                        clearingConversationMessages
                      "
                      title="Удалить все сообщения"
                      aria-label="Удалить все сообщения"
                      @click="clearActiveConversationMessages"
                    >
                      🧹
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
                      :title="searchOpen ? 'Закрыть поиск' : 'Поиск по всем чатам'"
                      aria-label="Поиск по чатам"
                      @click="toggleSearch"
                    >
                      🔎
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="!activeConversation"
                      title="Позвонить"
                      aria-label="Позвонить"
                      @click="handleCallAction"
                    >
                      📞
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-base text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
                      title="Настройки"
                      aria-label="Настройки"
                      @click="openSettings"
                    >
                      ⚙️
                    </button>
                  </div>
                </div>
                <div
                  v-else
                  class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div class="min-w-0">
                    <h3 class="truncate text-2xl font-bold text-slate-950">
                      {{ activeConversationTitle }}
                    </h3>

                    <div v-if="activePresenceText" class="mt-1 text-sm text-slate-500">
                      {{ activePresenceText }}
                    </div>

                    <div
                      v-if="activeConversation?.type === 'group'"
                      class="mt-2 text-sm text-slate-500"
                    >
                      {{ activeGroupMembersSummary }}
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="!activePinnedMessage"
                      :title="activePinnedMessage ? 'Перейти к закрепу' : 'Закрепов пока нет'"
                      aria-label="Закреплённое сообщение"
                      @click="jumpToPinnedMessage"
                    >
                      📌
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-100 bg-white text-lg text-rose-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="
                        !activeConversation ||
                        !activeMessages.length ||
                        clearingConversationMessages
                      "
                      title="Удалить все сообщения"
                      aria-label="Удалить все сообщения"
                      @click="clearActiveConversationMessages"
                    >
                      🧹
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
                      :title="searchOpen ? 'Закрыть поиск' : 'Поиск по всем чатам'"
                      aria-label="Поиск по чатам"
                      @click="toggleSearch"
                    >
                      🔎
                    </button>
                    <button
                      type="button"
                      class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="!activeConversation"
                      title="Позвонить"
                      aria-label="Позвонить"
                      @click="handleCallAction"
                    >
                      📞
                    </button>
                    <button
                      v-if="activeConversation?.type === 'group'"
                      type="button"
                      class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
                      title="Настройки группы"
                      aria-label="Настройки группы"
                      @click="openGroupSettings"
                    >
                      👥
                    </button>
                  </div>
                </div>
                <div
                  v-if="mobileConversationMode && activeConversation?.type === 'group'"
                  class="truncate text-xs text-slate-500"
                >
                  {{ activeGroupMembersSummary }}
                </div>
                <div
                  v-if="mobileConversationMode && activeTypingLabel"
                  class="truncate text-xs font-medium text-sky-600"
                >
                  {{ activeTypingLabel }}
                </div>

                <div
                  v-if="activePinnedMessage && !mobileConversationMode"
                  class="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
                >
                  <div class="min-w-0">
                    <div class="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                      Закреплено
                    </div>
                    <button
                      type="button"
                      class="mt-1 block truncate text-left text-sm font-medium text-slate-900 transition hover:text-slate-700"
                      @click="jumpToPinnedMessage"
                    >
                      {{ replyPreviewSender(activePinnedMessage) }}:
                      {{ replyPreviewText(activePinnedMessage) || 'Сообщение' }}
                    </button>
                  </div>
                  <button
                    type="button"
                    class="rounded-xl border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                    @click="clearActivePin"
                  >
                    Убрать
                  </button>
                </div>

                <div
                  v-if="searchOpen"
                  class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      ref="searchInput"
                      v-model="searchQuery"
                      type="search"
                      class="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300"
                      placeholder="Поиск по всем чатам"
                    />
                    <button
                      type="button"
                      class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      @click="closeSearch"
                    >
                      Закрыть
                    </button>
                  </div>

                  <div class="mt-3 max-h-72 space-y-2 overflow-y-auto">
                    <div
                      v-if="chatStore.loading.search"
                      class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500"
                    >
                      Ищем по сообщениям…
                    </div>
                    <div
                      v-else-if="searchQuery.trim() && !activeSearchResults.length"
                      class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500"
                    >
                      Совпадений пока нет.
                    </div>
                    <button
                      v-for="result in activeSearchResults"
                      :key="`${result.conversationId}-${result.messageId}`"
                      type="button"
                      class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                      @click="openSearchResult(result)"
                    >
                      <div class="flex items-center justify-between gap-3">
                        <div class="truncate text-sm font-semibold text-slate-950">
                          {{ result.conversationTitle || 'Чат' }}
                        </div>
                        <div class="truncate text-xs text-slate-500">
                          {{ result.senderLogin || result.senderEmail }}
                        </div>
                      </div>
                      <div class="mt-1 text-sm text-slate-600">
                        {{ searchResultExcerpt(result) }}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="displayedCall && !showCallFocusLayout"
              :class="
                mobileConversationMode
                  ? 'border-b border-slate-200 bg-slate-50/80 px-3 py-3'
                  : 'border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-6 xl:px-5'
              "
            >
              <div
                :class="
                  mobileConversationMode
                    ? 'rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm'
                    : 'rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm'
                "
              >
                <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span
                        class="inline-flex h-2.5 w-2.5 rounded-full"
                        :class="displayedCall.joinable ? 'bg-emerald-500' : 'bg-slate-300'"
                      ></span>
                      <h4 class="text-base font-semibold text-slate-950">
                        {{ displayedCall.joinable ? 'Идёт звонок' : 'Звонок завершён' }}
                      </h4>
                    </div>
                    <p class="mt-1 text-sm text-slate-500">
                      {{ displayedCallStatusText }}
                    </p>
                  </div>

                  <div class="flex flex-wrap items-center gap-2">
                    <button
                      v-if="displayedCall.joinable && !isCurrentUserInDisplayedCall"
                      type="button"
                      class="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="joiningCall || Boolean(callActionError)"
                      @click="joinDisplayedCall"
                    >
                      {{ joiningCall ? 'Подключаем…' : 'Подключиться' }}
                    </button>
                    <button
                      v-if="displayedCall.joinable && isCurrentUserInDisplayedCall"
                      type="button"
                      class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      :title="localCallCameraEnabled ? 'Выключить камеру' : 'Включить камеру'"
                      :aria-label="localCallCameraEnabled ? 'Выключить камеру' : 'Включить камеру'"
                      :disabled="localCallScreenSharing"
                      @click="toggleCallCamera"
                    >
                      {{ localCallCameraEnabled ? '📷' : '🚫' }}
                    </button>
                    <button
                      v-if="displayedCall.joinable && isCurrentUserInDisplayedCall"
                      type="button"
                      class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-50"
                      :title="
                        localCallScreenSharing ? 'Остановить демонстрацию экрана' : 'Показать экран'
                      "
                      :aria-label="
                        localCallScreenSharing ? 'Остановить демонстрацию экрана' : 'Показать экран'
                      "
                      :disabled="startingScreenShare"
                      @click="toggleCallScreenShare"
                    >
                      {{ localCallScreenSharing ? '🛑' : '🖥️' }}
                    </button>
                    <button
                      v-if="displayedCall.joinable && isCurrentUserInDisplayedCall"
                      type="button"
                      class="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      :title="localCallMuted ? 'Включить микрофон' : 'Выключить микрофон'"
                      :aria-label="localCallMuted ? 'Включить микрофон' : 'Выключить микрофон'"
                      @click="toggleCallMute"
                    >
                      {{ localCallMuted ? '🔇' : '🎤' }}
                    </button>
                    <button
                      v-if="displayedCall.joinable && isCurrentUserInDisplayedCall"
                      type="button"
                      class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="endingCall"
                      @click="leaveDisplayedCall"
                    >
                      {{ endingCall ? 'Выходим…' : 'Выйти' }}
                    </button>
                  </div>
                </div>

                <div
                  v-if="displayedCallMediaTiles.length"
                  class="mt-4 grid gap-3"
                  :class="displayedCallVideoGridClass"
                >
                  <button
                    v-for="tile in displayedCallMediaTiles"
                    :key="`${displayedCall.id}-${tile.email}`"
                    type="button"
                    class="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-left transition hover:border-sky-300"
                    @click="openCallFocus(tile.email)"
                  >
                    <video
                      v-if="tile.stream"
                      :ref="
                        tile.isLocal ? setLocalCallVideoElement : setRemoteMediaElement(tile.email)
                      "
                      class="h-44 w-full bg-slate-950 object-cover sm:h-52"
                      :muted="tile.isLocal"
                      autoplay
                      playsinline
                    ></video>
                    <div
                      v-else
                      class="flex h-44 w-full items-center justify-center bg-slate-900 text-5xl text-white/80 sm:h-52"
                    >
                      {{ tile.isLocal ? '🙋' : '👤' }}
                    </div>
                    <div
                      v-if="!tile.cameraEnabled"
                      class="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-4 text-center text-sm font-semibold text-white"
                    >
                      Камера выключена
                    </div>
                    <div
                      class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent px-3 py-2 text-white"
                    >
                      <div class="min-w-0">
                        <div class="truncate text-sm font-semibold">
                          {{ tile.login || tile.email }}
                        </div>
                        <div class="mt-0.5 text-[11px] text-white/70">
                          {{
                            tile.screenSharing
                              ? 'Демонстрация экрана'
                              : tile.isLocal
                                ? 'Вы в звонке'
                                : 'Участник звонка'
                          }}
                        </div>
                      </div>
                      <div class="flex shrink-0 items-center gap-1.5 text-base">
                        <span>{{ tile.muted ? '🔇' : '🎤' }}</span>
                        <span v-if="tile.screenSharing">🖥️</span>
                        <span>{{ tile.cameraEnabled ? '📹' : '🚫' }}</span>
                      </div>
                    </div>
                  </button>
                </div>

                <div
                  v-if="callActionError"
                  class="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {{ callActionError }}
                </div>
              </div>
            </div>

            <div
              :class="
                showCallFocusLayout
                  ? mobileConversationMode
                    ? 'fixed inset-0 z-40 flex min-h-0 flex-1 overflow-hidden bg-slate-950'
                    : 'flex min-h-0 flex-1 overflow-hidden bg-slate-950'
                  : 'flex min-h-0 flex-1 flex-col'
              "
            >
              <div
                :class="
                  showCallFocusLayout
                    ? 'hidden min-h-0 w-[20rem] shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col xl:w-[22rem] 2xl:w-[26rem]'
                    : 'flex min-h-0 flex-1 flex-col'
                "
              >
                <div
                  ref="messagesScroller"
                  @scroll="handleMessagesScroll"
                  :class="
                    showCallFocusLayout
                      ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3'
                      : mobileConversationMode
                        ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-3'
                        : 'min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 xl:px-5 xl:py-4'
                  "
                >
                  <div
                    v-if="activeConversation && activeMessages.length"
                    class="mb-3 rounded-3xl border border-slate-200 bg-white/90 p-2 shadow-sm"
                  >
                    <div class="flex flex-wrap items-center gap-2">
                      <button
                        v-for="option in messageFilterOptions"
                        :key="option.key"
                        type="button"
                        class="rounded-2xl px-3 py-1.5 text-xs font-semibold transition"
                        :class="
                          messageFilterMode === option.key
                            ? 'bg-slate-950 text-white'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        "
                        @click="messageFilterMode = option.key"
                      >
                        {{ option.label }}
                        <span v-if="option.count" class="ml-1 opacity-70">{{ option.count }}</span>
                      </button>
                      <button
                        v-if="activeConversation.unreadCount"
                        type="button"
                        class="ml-auto rounded-2xl border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                        @click="markActiveConversationRead"
                      >
                        Прочитать всё
                      </button>
                    </div>
                  </div>

                  <div
                    v-if="
                      activeConversation &&
                      activeMessages.length === 0 &&
                      !chatStore.loading.messages
                    "
                    :class="
                      mobileConversationMode
                        ? 'flex h-full min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500'
                        : 'flex h-full min-h-[24rem] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500'
                    "
                  >
                    Пока сообщений нет. Напиши первое сообщение внизу.
                  </div>

                  <div
                    v-else-if="!activeConversation"
                    :class="
                      mobileConversationMode
                        ? 'flex h-full min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500'
                        : 'flex h-full min-h-[24rem] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500'
                    "
                  >
                    Выбери чат из списка или найди пользователя по логину.
                  </div>

                  <div
                    v-else-if="
                      activeConversation &&
                      activeMessages.length > 0 &&
                      activeFilteredMessages.length === 0
                    "
                    class="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500"
                  >
                    В этом фильтре пока пусто.
                  </div>

                  <div :class="mobileConversationMode ? 'space-y-2.5' : 'space-y-3'">
                    <template v-for="item in activeTimelineItems" :key="`${item.type}-${item.id}`">
                      <div
                        v-if="item.type === 'unread-separator'"
                        class="flex items-center gap-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-600"
                      >
                        <span class="h-px flex-1 bg-sky-100"></span>
                        <span class="rounded-full border border-sky-100 bg-sky-50 px-3 py-1">
                          Непрочитанные сообщения
                        </span>
                        <span class="h-px flex-1 bg-sky-100"></span>
                      </div>
                      <article
                        v-else
                        class="flex"
                        :class="
                          item.message.senderEmail === currentUserEmail
                            ? 'justify-end'
                            : 'justify-start'
                        "
                      >
                        <template v-if="item.message">
                          <div
                            :ref="setMessageElement(item.message.id)"
                            class="relative min-w-0 max-w-[88vw] rounded-3xl border px-3 py-2.5 transition sm:max-w-[82%] sm:px-4 sm:py-3"
                            :class="[
                              item.message.senderEmail === currentUserEmail
                                ? 'border-emerald-100 bg-emerald-50/80'
                                : 'border-slate-200 bg-slate-50',
                              chatStore.highlightedMessageId === item.message.id
                                ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-white'
                                : '',
                            ]"
                            :style="{
                              transform: swipeOffsetForMessage(item.message.id)
                                ? `translateX(${swipeOffsetForMessage(item.message.id)}px)`
                                : '',
                            }"
                            @touchstart="startSwipeReplyGesture(item.message, $event)"
                            @touchmove="moveSwipeReplyGesture(item.message, $event)"
                            @touchend="endSwipeReplyGesture(item.message, $event)"
                            @touchcancel="resetSwipeReply"
                          >
                            <template v-for="message in [item.message]" :key="message.id">
                              <div
                                v-if="isMobileLayout && swipeOffsetForMessage(message.id)"
                                class="pointer-events-none absolute -left-2 top-1/2 -translate-y-1/2 text-lg text-sky-600"
                              >
                                ↩️
                              </div>
                              <div class="flex items-start justify-between gap-3">
                                <div class="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                                  <span class="text-sm font-semibold text-slate-950">{{
                                    messageSenderLabel(message)
                                  }}</span>
                                  <span
                                    v-if="message.senderEmail === currentUserEmail"
                                    class="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800"
                                  >
                                    вы
                                  </span>
                                  <span
                                    v-if="isPinnedMessage(message)"
                                    class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800"
                                  >
                                    📌
                                  </span>
                                </div>
                                <div class="flex shrink-0 items-center gap-1.5">
                                  <button
                                    type="button"
                                    class="inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm transition"
                                    :class="
                                      isMessageSelected(message)
                                        ? 'border-sky-300 bg-sky-100 text-sky-700'
                                        : 'border-slate-200 bg-white/80 hover:bg-slate-100'
                                    "
                                    aria-label="Выбрать сообщение"
                                    title="Выбрать"
                                    @click="toggleMessageSelected(message)"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 bg-white/80 text-sm transition hover:bg-amber-50"
                                    :aria-label="
                                      message.favorite
                                        ? 'Убрать из избранного'
                                        : 'Добавить в избранное'
                                    "
                                    :title="
                                      message.favorite ? 'Убрать из избранного' : 'В избранное'
                                    "
                                    @click="
                                      message.favorite
                                        ? chatStore.unfavoriteMessage({
                                            conversationId: activeConversation.id,
                                            messageId: message.id,
                                          })
                                        : chatStore.favoriteMessage({
                                            conversationId: activeConversation.id,
                                            messageId: message.id,
                                          })
                                    "
                                  >
                                    {{ message.favorite ? '★' : '☆' }}
                                  </button>
                                  <button
                                    type="button"
                                    class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-sm transition hover:bg-slate-100"
                                    :aria-label="
                                      isPinnedMessage(message)
                                        ? 'Открепить сообщение'
                                        : 'Закрепить сообщение'
                                    "
                                    :title="isPinnedMessage(message) ? 'Открепить' : 'Закрепить'"
                                    @click="toggleMessagePin(message)"
                                  >
                                    📎
                                  </button>
                                  <button
                                    v-if="canEditMessage(message)"
                                    type="button"
                                    class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-sm transition hover:bg-slate-100"
                                    aria-label="Изменить сообщение"
                                    title="Изменить"
                                    @click="startEditing(message)"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-sm text-rose-700 transition hover:bg-rose-100"
                                    aria-label="Удалить сообщение"
                                    title="Удалить"
                                    @click="removeMessage(message)"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              <button
                                v-if="resolveReplyPreview(message)"
                                type="button"
                                class="mt-2.5 block w-full rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 text-left transition hover:border-sky-200 hover:bg-sky-50/70"
                                @click="jumpToReplySource(message)"
                              >
                                <div
                                  class="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                                >
                                  Ответ на {{ replyPreviewSender(resolveReplyPreview(message)) }}
                                </div>
                                <div
                                  class="mt-1 whitespace-pre-wrap break-all text-sm leading-5 text-slate-700 [overflow-wrap:anywhere]"
                                >
                                  {{
                                    replyPreviewText(resolveReplyPreview(message)) || 'Сообщение'
                                  }}
                                </div>
                              </button>
                              <div v-if="editingMessageId === message.id" class="mt-2.5 space-y-3">
                                <textarea
                                  v-model="editingMessageText"
                                  rows="3"
                                  class="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-indigo-300"
                                ></textarea>
                                <div class="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    class="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                    @click="saveEditing(message)"
                                  >
                                    Сохранить
                                  </button>
                                  <button
                                    type="button"
                                    class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                    @click="cancelEditing"
                                  >
                                    Отмена
                                  </button>
                                </div>
                              </div>
                              <div
                                v-else-if="message.type === 'audio'"
                                class="mt-2.5 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2"
                              >
                                <button
                                  type="button"
                                  class="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                  :disabled="audioMessageUnavailable(message)"
                                  @click="playAudioMessage(message)"
                                >
                                  {{ audioMessageButtonLabel(message) }}
                                </button>
                                <span class="text-xs text-slate-500">
                                  {{ formatAudioDuration(message.audio?.durationSeconds) }}
                                </span>
                              </div>
                              <div
                                v-else-if="message.type === 'image'"
                                class="mt-2.5 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2"
                              >
                                <button
                                  type="button"
                                  class="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                  :disabled="imageMessageUnavailable(message)"
                                  @click="openImageMessage(message)"
                                >
                                  {{ imageMessageButtonLabel(message) }}
                                </button>
                                <span class="text-xs text-slate-500">
                                  {{ formatFileSize(message.image?.sizeBytes) }}
                                </span>
                              </div>
                              <div
                                v-else-if="message.type === 'file'"
                                class="mt-2.5 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2"
                              >
                                <button
                                  type="button"
                                  class="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                  :disabled="fileMessageUnavailable(message)"
                                  @click="downloadFileMessage(message)"
                                >
                                  {{ fileMessageButtonLabel(message) }}
                                </button>
                                <span class="min-w-0 truncate text-xs font-semibold text-slate-700">
                                  {{ message.file?.filename || message.text || 'Файл' }}
                                </span>
                                <span class="text-xs text-slate-500">
                                  {{ formatFileSize(message.file?.sizeBytes) }}
                                </span>
                              </div>
                              <div
                                v-else-if="message.type === 'call'"
                                class="mt-2.5 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2"
                              >
                                <button
                                  type="button"
                                  class="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                  :disabled="
                                    !message.call?.joinable ||
                                    (chatStore.activeCall &&
                                      chatStore.activeCall.id &&
                                      chatStore.activeCall.id !== message.call?.id)
                                  "
                                  @click="joinCallFromMessage(message)"
                                >
                                  {{ callMessageButtonLabel(message) }}
                                </button>
                                <span class="text-xs text-slate-500">
                                  {{ callMessageMeta(message) }}
                                </span>
                              </div>
                              <p
                                v-else
                                class="mt-2 whitespace-pre-wrap break-all text-sm leading-6 text-slate-700 [overflow-wrap:anywhere] [&_a]:font-medium [&_a]:text-sky-700 [&_a]:underline [&_a]:decoration-sky-300 [&_a]:underline-offset-2 [&_a]:transition hover:[&_a]:text-sky-800 [&_em]:italic [&_strong]:font-semibold"
                                v-html="renderMessageText(message.text)"
                              ></p>
                              <div
                                v-if="messageMentions(message).length"
                                class="mt-2 flex flex-wrap gap-1.5"
                              >
                                <span
                                  v-for="mention in messageMentions(message)"
                                  :key="`${message.id}-${mention.email}`"
                                  class="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700"
                                >
                                  @{{ mention.login }}
                                </span>
                              </div>
                              <div
                                v-if="messageReactionGroups(message).length"
                                class="mt-2.5 flex flex-wrap gap-1.5 sm:gap-2"
                              >
                                <button
                                  v-for="reaction in messageReactionGroups(message)"
                                  :key="`${message.id}-${reaction.emoji}`"
                                  type="button"
                                  class="rounded-full border px-2 py-1 text-xs font-semibold transition"
                                  :class="
                                    currentUserReactionEmoji(message) === reaction.emoji
                                      ? 'border-indigo-300 bg-indigo-100 text-indigo-700'
                                      : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-100'
                                  "
                                  @click="selectReaction(message, reaction.emoji)"
                                >
                                  {{ reaction.emoji }} {{ reaction.count }}
                                </button>
                              </div>
                              <div
                                v-if="messageCanRetryText(message)"
                                class="mt-2.5 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2"
                              >
                                <div class="text-xs font-semibold text-rose-700">
                                  {{ message.errorMessage || 'Сообщение не отправилось' }}
                                </div>
                                <button
                                  type="button"
                                  class="mt-2 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
                                  @click="retryTextMessage(message)"
                                >
                                  Повторить отправку
                                </button>
                              </div>
                              <div
                                class="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-500 sm:gap-2 sm:text-[11px]"
                              >
                                <button
                                  type="button"
                                  class="hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-sm transition hover:bg-slate-100 sm:inline-flex"
                                  aria-label="Ответить"
                                  title="Ответить"
                                  @click="startReply(message)"
                                >
                                  ↩️
                                </button>
                                <button
                                  type="button"
                                  class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-sm transition hover:bg-slate-100"
                                  aria-label="Реакция"
                                  title="Реакция"
                                  @click="toggleReactionPicker(message)"
                                >
                                  ☺
                                </button>
                                <button
                                  type="button"
                                  class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-sm transition hover:bg-slate-100"
                                  aria-label="Напомнить"
                                  title="Напомнить"
                                  @click="toggleReminderPicker(message)"
                                >
                                  ⏰
                                </button>
                              </div>
                              <div
                                v-if="reactionPickerMessageId === message.id"
                                class="mt-2.5 rounded-2xl border border-slate-200 bg-white/90 px-3 py-3"
                              >
                                <div
                                  class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                                >
                                  Реакция
                                </div>
                                <div class="flex flex-wrap gap-2">
                                  <button
                                    v-for="emoji in composerEmojis"
                                    :key="`${message.id}-reaction-${emoji}`"
                                    type="button"
                                    class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg transition hover:bg-slate-100"
                                    @click="selectReaction(message, emoji)"
                                  >
                                    {{ emoji }}
                                  </button>
                                </div>
                              </div>
                              <div
                                v-if="reminderPickerMessageId === message.id"
                                class="mt-2.5 rounded-2xl border border-rose-100 bg-white/90 px-3 py-3"
                              >
                                <div
                                  class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-rose-500"
                                >
                                  Напомнить
                                </div>
                                <div class="flex flex-wrap gap-2">
                                  <button
                                    v-for="option in reminderPresetOptions()"
                                    :key="`${message.id}-reminder-${option.key}`"
                                    type="button"
                                    class="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                    @click="setMessageReminder(message, option)"
                                  >
                                    {{ option.label }}
                                  </button>
                                </div>
                              </div>
                              <div class="mt-2.5 flex items-center gap-2.5 text-xs text-slate-500">
                                <span>{{ formatMessageTime(message.createdAt) }}</span>
                                <span v-if="message.editedAt">изменено</span>
                                <button
                                  v-if="message.aliceAnnounced && canUseAlice"
                                  type="button"
                                  class="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700 transition hover:bg-violet-200 disabled:cursor-wait disabled:opacity-70"
                                  :disabled="aliceAnnouncementPendingMessageId === message.id"
                                  :title="
                                    aliceAnnouncementPendingMessageId === message.id
                                      ? 'Повторно отправляем в Алису'
                                      : 'Отправить это сообщение в Алису ещё раз'
                                  "
                                  @click="announceMessageOnAlice(message)"
                                >
                                  {{
                                    aliceAnnouncementPendingMessageId === message.id
                                      ? 'Отправляем в Алису…'
                                      : 'Отправлено через Алису'
                                  }}
                                </button>
                                <span
                                  v-if="aliceAnnouncementErrorMessageId === message.id"
                                  class="text-[10px] font-semibold text-rose-600"
                                >
                                  Не удалось повторить
                                </span>
                                <span
                                  v-if="message.senderEmail === currentUserEmail"
                                  class="ml-auto text-sm font-semibold tracking-tight"
                                  :class="messageStatusClass(message)"
                                  :title="messageStatusTitle(message)"
                                >
                                  {{ messageStatusIcon(message) }}
                                </span>
                              </div>
                            </template>
                          </div>
                        </template>
                      </article>
                    </template>
                  </div>
                </div>

                <div
                  :class="
                    showCallFocusLayout
                      ? 'border-t border-slate-200 bg-white px-3 py-3'
                      : mobileConversationMode
                        ? 'sticky bottom-0 z-10 shrink-0 border-t border-slate-200 bg-white px-2.5 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+0.35rem)]'
                        : 'border-t border-slate-200 px-3 py-4 sm:px-6 sm:py-5 xl:px-5 xl:py-4'
                  "
                >
                  <div
                    v-if="selectedMessageActionState.selectedCount"
                    class="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm text-sky-900"
                  >
                    <span class="font-semibold">
                      Выбрано: {{ selectedMessageActionState.selectedCount }}
                    </span>
                    <button
                      type="button"
                      class="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition hover:bg-sky-100"
                      :disabled="!selectedMessageActionState.canFavorite"
                      @click="favoriteSelectedMessages"
                    >
                      ★ Избранное
                    </button>
                    <button
                      type="button"
                      class="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition hover:bg-sky-100"
                      :disabled="!selectedMessageActionState.canForward"
                      @click="forwardPickerOpen = true"
                    >
                      Переслать
                    </button>
                    <button
                      v-if="selectedMessageActionState.canDelete"
                      type="button"
                      class="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      @click="deleteSelectedMessages"
                    >
                      Удалить
                    </button>
                    <button
                      type="button"
                      class="ml-auto rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white"
                      @click="clearSelectedMessages"
                    >
                      Отмена
                    </button>
                  </div>
                  <form
                    :class="mobileConversationMode ? 'space-y-2.5' : 'space-y-3'"
                    @submit.prevent="sendCurrentMessage"
                  >
                    <div
                      v-if="activeTypingLabel && !mobileConversationMode"
                      class="rounded-2xl bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700"
                    >
                      {{ activeTypingLabel }}
                    </div>
                    <div
                      v-if="replyingToMessage"
                      :class="
                        mobileConversationMode
                          ? 'flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5'
                          : 'flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 sm:px-4'
                      "
                    >
                      <div class="min-w-0">
                        <div
                          class="text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                        >
                          Ответ на {{ replyPreviewSender(replyingToMessage) }}
                        </div>
                        <div
                          class="mt-1 whitespace-pre-wrap break-all text-sm text-slate-700 [overflow-wrap:anywhere]"
                        >
                          {{ replyPreviewText(replyingToMessage) || 'Сообщение' }}
                        </div>
                      </div>
                      <button
                        type="button"
                        class="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        @click="clearReplyState"
                      >
                        Отмена
                      </button>
                    </div>
                    <div
                      v-if="activeMentionMembers.length"
                      class="flex flex-wrap items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2"
                    >
                      <span class="text-[11px] font-semibold uppercase tracking-wide text-sky-600">
                        Упомянуть
                      </span>
                      <button
                        v-for="member in activeMentionMembers"
                        :key="member.email"
                        type="button"
                        class="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-sky-700 shadow-sm transition hover:bg-sky-100"
                        @click="insertMention(member)"
                      >
                        @{{ member.login }}
                      </button>
                    </div>
                    <div
                      ref="emojiPickerRoot"
                      class="relative rounded-2xl transition"
                      :class="
                        composerDropActive
                          ? 'bg-sky-50/70 ring-2 ring-sky-300 ring-offset-2 ring-offset-white'
                          : ''
                      "
                      @dragenter="handleComposerDragEnter"
                      @dragover="handleComposerDragOver"
                      @dragleave="handleComposerDragLeave"
                      @drop="handleComposerDrop"
                    >
                      <input
                        ref="imageInput"
                        type="file"
                        accept="image/*"
                        class="hidden"
                        @change="handleImageSelected"
                      />
                      <input
                        ref="fileInput"
                        type="file"
                        class="hidden"
                        @change="handleFileSelected"
                      />
                      <textarea
                        ref="composerTextarea"
                        v-model="composerText"
                        :rows="mobileConversationMode ? 2 : 3"
                        class="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-36 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white sm:pr-44"
                        placeholder="Напиши сообщение"
                        @keydown="handleComposerKeydown"
                        @blur="stopComposerTyping"
                      ></textarea>
                      <div
                        v-if="composerDropActive"
                        class="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-2xl border border-dashed border-sky-300 bg-sky-50/90 px-4 text-center text-sm font-semibold text-sky-700"
                      >
                        Отпусти, чтобы прикрепить изображение
                      </div>
                      <button
                        type="button"
                        class="absolute right-[7.75rem] top-3 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-base text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 sm:right-[9rem] sm:h-9 sm:w-9 sm:text-lg"
                        aria-label="Прикрепить файл"
                        :disabled="!activeConversation || sendingFile"
                        @click="triggerFilePicker"
                      >
                        📄
                      </button>
                      <button
                        type="button"
                        class="absolute right-[5.25rem] top-3 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-base text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 sm:right-[6.25rem] sm:h-9 sm:w-9 sm:text-lg"
                        aria-label="Выбрать изображение"
                        :disabled="!activeConversation || sendingImage"
                        @click="triggerImagePicker"
                      >
                        🖼
                      </button>
                      <button
                        type="button"
                        class="absolute right-11 top-3 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-base text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 sm:right-14 sm:h-9 sm:w-9 sm:text-lg"
                        aria-label="Выбрать смайлик"
                        :aria-expanded="emojiPickerOpen"
                        @click="toggleEmojiPicker"
                      >
                        ☺
                      </button>
                      <button
                        type="button"
                        class="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-xl border text-base shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9 sm:text-lg"
                        :class="
                          isRecordingAudio
                            ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                        "
                        :aria-label="audioRecorderLabel"
                        :title="audioRecorderLabel"
                        :disabled="!activeConversation || sendingAudio"
                        @click="toggleAudioRecording"
                      >
                        {{ isRecordingAudio ? '■' : '🎙' }}
                      </button>

                      <div
                        v-if="emojiPickerOpen"
                        class="absolute bottom-full right-0 z-20 mb-2 w-72 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl"
                      >
                        <div
                          class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                        >
                          Смайлики
                        </div>
                        <div class="grid grid-cols-8 gap-1">
                          <button
                            v-for="emoji in composerEmojis"
                            :key="emoji"
                            type="button"
                            class="inline-flex h-8 w-8 items-center justify-center rounded-xl text-lg transition hover:bg-slate-100"
                            @click="insertEmoji(emoji)"
                          >
                            {{ emoji }}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div v-if="isRecordingAudio" class="text-sm font-semibold text-rose-700">
                      Запись {{ formatAudioDuration(recordingSeconds) }} /
                      {{ formatAudioDuration(chatAudioMaxSeconds) }}. Нажми микрофон ещё раз, чтобы
                      остановить.
                    </div>

                    <div
                      v-if="recordedAudioUrl"
                      class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <div class="text-sm font-semibold text-slate-900">
                        Аудио готово к отправке, {{ formatAudioDuration(recordedAudioDuration) }}
                      </div>
                      <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <audio
                          :src="recordedAudioUrl"
                          controls
                          class="h-10 w-full sm:flex-1"
                        ></audio>
                        <button
                          type="button"
                          class="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          :disabled="sendingAudio || !activeConversation"
                          @click="sendCurrentAudio"
                        >
                          {{ sendingAudio ? 'Отправляем…' : 'Отправить аудио' }}
                        </button>
                        <button
                          type="button"
                          class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
                          @click="discardRecordedAudio"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>

                    <div
                      v-if="selectedImageUrl"
                      class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <div class="text-sm font-semibold text-slate-900">
                        Изображение готово к отправке, {{ selectedImageName }}
                      </div>
                      <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <img
                          :src="selectedImageUrl"
                          alt="Предпросмотр изображения"
                          class="h-24 w-full rounded-2xl object-cover sm:w-36"
                        />
                        <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                          <button
                            type="button"
                            class="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            :disabled="sendingImage || !activeConversation"
                            @click="sendCurrentImage"
                          >
                            {{ sendingImage ? 'Отправляем…' : 'Отправить изображение' }}
                          </button>
                          <button
                            type="button"
                            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
                            @click="discardSelectedImage"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="selectedFileBlob"
                      class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                    >
                      <div class="text-sm font-semibold text-slate-900">Файл готов к отправке</div>
                      <div class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div
                          class="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2"
                        >
                          <div class="truncate text-sm font-semibold text-slate-900">
                            {{ selectedFileName || 'file' }}
                          </div>
                          <div class="text-xs text-slate-500">
                            {{ formatFileSize(selectedFileSize) }}
                          </div>
                        </div>
                        <button
                          type="button"
                          class="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                          :disabled="sendingFile || !activeConversation"
                          @click="sendCurrentFile"
                        >
                          {{ sendingFile ? 'Отправляем…' : 'Отправить файл' }}
                        </button>
                        <button
                          type="button"
                          class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
                          @click="discardSelectedFile"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>

                    <div
                      v-if="activeMediaSendError"
                      class="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-3 text-xs text-rose-700"
                    >
                      {{ activeMediaSendError }}
                    </div>

                    <div
                      v-if="recordingError"
                      class="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-3"
                    >
                      <p class="text-xs text-rose-700">
                        {{ recordingError }}
                      </p>
                      <div class="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          class="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                          @click="startAudioRecording"
                        >
                          Запросить доступ снова
                        </button>
                        <button
                          type="button"
                          class="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          @click="microphoneHelpOpen = true"
                        >
                          Как дать доступ
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      :class="
                        mobileConversationMode
                          ? 'flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50'
                          : 'flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50'
                      "
                      :disabled="sendingMessage || !composerText.trim() || !activeConversation"
                    >
                      {{ sendingMessage ? 'Отправляем…' : 'Отправить' }}
                    </button>
                  </form>
                </div>
              </div>

              <div v-if="showCallFocusLayout" class="flex min-h-0 flex-1 flex-col bg-slate-950">
                <div class="relative min-h-0 flex-1 overflow-hidden">
                  <video
                    v-if="focusedCallTile?.stream"
                    :ref="
                      focusedCallTile.isLocal
                        ? setLocalCallVideoElement
                        : setRemoteMediaElement(focusedCallTile.email)
                    "
                    class="h-full w-full bg-slate-950 object-contain"
                    :muted="focusedCallTile.isLocal"
                    autoplay
                    playsinline
                  ></video>
                  <div
                    v-else
                    class="flex h-full w-full items-center justify-center bg-slate-900 text-7xl text-white/80"
                  >
                    {{ focusedCallTile?.isLocal ? '🙋' : '👤' }}
                  </div>
                  <div
                    v-if="focusedCallTile && !focusedCallTile.cameraEnabled"
                    class="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-6 text-center text-lg font-semibold text-white"
                  >
                    Камера выключена
                  </div>
                  <div
                    class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent px-4 py-4 text-white sm:px-6"
                  >
                    <div class="min-w-0">
                      <div class="truncate text-base font-semibold sm:text-lg">
                        {{ focusedCallTile?.login || focusedCallTile?.email }}
                      </div>
                      <div class="mt-1 text-xs text-white/70 sm:text-sm">
                        {{
                          focusedCallTile?.screenSharing
                            ? 'Демонстрация экрана'
                            : focusedCallTile?.isLocal
                              ? 'Вы в звонке'
                              : 'Участник звонка'
                        }}
                      </div>
                    </div>
                    <div class="flex shrink-0 items-center gap-2 text-lg">
                      <span>{{ focusedCallTile?.muted ? '🔇' : '🎤' }}</span>
                      <span v-if="focusedCallTile?.screenSharing">🖥️</span>
                      <span>{{ focusedCallTile?.cameraEnabled ? '📹' : '🚫' }}</span>
                    </div>
                  </div>
                </div>

                <div
                  v-if="callFocusSidebarTiles.length"
                  :class="
                    mobileConversationMode
                      ? 'hidden'
                      : 'flex gap-3 overflow-x-auto border-t border-slate-800 bg-slate-900/95 px-3 py-3'
                  "
                >
                  <button
                    v-for="tile in callFocusSidebarTiles"
                    :key="`focus-${displayedCall?.id}-${tile.email}`"
                    type="button"
                    class="relative h-24 w-36 shrink-0 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-left transition hover:border-sky-300 sm:h-28 sm:w-44"
                    @click="focusCallTile(tile.email)"
                  >
                    <video
                      v-if="tile.stream"
                      :ref="
                        tile.isLocal ? setLocalCallVideoElement : setRemoteMediaElement(tile.email)
                      "
                      class="h-full w-full bg-slate-950 object-cover"
                      :muted="tile.isLocal"
                      autoplay
                      playsinline
                    ></video>
                    <div
                      v-else
                      class="flex h-full w-full items-center justify-center bg-slate-900 text-4xl text-white/80"
                    >
                      {{ tile.isLocal ? '🙋' : '👤' }}
                    </div>
                    <div
                      v-if="!tile.cameraEnabled"
                      class="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-3 text-center text-xs font-semibold text-white"
                    >
                      Камера выключена
                    </div>
                    <div
                      class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 to-transparent px-3 py-2 text-white"
                    >
                      <div class="truncate text-xs font-semibold sm:text-sm">
                        {{ tile.login || tile.email }}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>

    <div
      v-if="imageViewerOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm"
      @click.self="closeImageViewer"
    >
      <section class="w-full max-w-5xl rounded-3xl bg-white p-4 shadow-2xl">
        <div class="mb-3 flex items-center justify-between gap-4">
          <h3 class="text-lg font-bold text-slate-950">Изображение</h3>
          <button
            type="button"
            class="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            @click="closeImageViewer"
          >
            Закрыть
          </button>
        </div>
        <img
          v-if="imageViewerUrl"
          :src="imageViewerUrl"
          alt="Одноразовое изображение"
          class="max-h-[75vh] w-full rounded-2xl object-contain"
        />
      </section>
    </div>

    <div
      v-if="audioPlayerOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm"
      @click.self="closeAudioPlayer"
    >
      <section class="w-full max-w-xl rounded-3xl bg-white p-4 shadow-2xl">
        <div class="mb-3 flex items-center justify-between gap-4">
          <div class="min-w-0">
            <h3 class="truncate text-lg font-bold text-slate-950">Аудиосообщение</h3>
            <p v-if="audioPlayerTitle" class="mt-1 truncate text-sm text-slate-500">
              {{ audioPlayerTitle }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            @click="closeAudioPlayer"
          >
            Закрыть
          </button>
        </div>

        <audio
          v-if="audioPlayerUrl"
          ref="audioPlayerElement"
          :src="audioPlayerUrl"
          controls
          autoplay
          class="w-full"
        ></audio>

        <p class="mt-3 text-sm leading-6 text-slate-500">
          Если звук не стартовал сам, нажми play на плеере.
        </p>
      </section>
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
                <div class="truncate text-sm font-medium text-slate-950">
                  {{ user.login || user.email }}
                </div>
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

    <div
      v-if="groupSettingsOpen && activeConversation?.type === 'group'"
      class="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
      @click.self="closeGroupSettings"
    >
      <section
        class="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-xl font-bold text-slate-950">Настройки группы</h3>
            <p class="mt-1 text-sm text-slate-500">
              Роли и участники управляются серверными правами.
            </p>
          </div>
          <button
            type="button"
            class="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            @click="closeGroupSettings"
          >
            Закрыть
          </button>
        </div>

        <div class="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div class="space-y-4">
            <section class="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <label
                class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Название
              </label>
              <div class="flex gap-2">
                <input
                  v-model="groupSettingsForm.title"
                  type="text"
                  class="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-sky-300"
                  :disabled="!activeConversation.permissions?.canRename || savingGroupSettings"
                />
                <button
                  type="button"
                  class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="
                    !activeConversation.permissions?.canRename ||
                    savingGroupSettings ||
                    !groupSettingsForm.title.trim()
                  "
                  @click="saveGroupTitle"
                >
                  Сохранить
                </button>
              </div>
            </section>

            <section
              v-if="activeConversation.permissions?.canAddMembers"
              class="rounded-3xl border border-slate-200 bg-slate-50 p-4"
            >
              <div class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Добавить участников
              </div>
              <div class="max-h-52 overflow-auto rounded-2xl border border-slate-200 bg-white p-2">
                <label
                  v-for="user in groupInviteUsers"
                  :key="`invite-${user.email}`"
                  class="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-slate-50"
                >
                  <span class="truncate text-sm font-medium text-slate-900">
                    {{ user.login || user.email }}
                  </span>
                  <input
                    v-model="groupSettingsForm.memberEmails"
                    type="checkbox"
                    :value="user.email"
                    class="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                </label>
                <div v-if="!groupInviteUsers.length" class="px-2 py-3 text-sm text-slate-500">
                  Все доступные пользователи уже в группе.
                </div>
              </div>
              <button
                type="button"
                class="mt-3 w-full rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="savingGroupSettings || groupSettingsForm.memberEmails.length === 0"
                @click="addSelectedGroupMembers"
              >
                Добавить выбранных
              </button>
            </section>
          </div>

          <section class="rounded-3xl border border-slate-200 bg-white p-4">
            <div class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Участники
            </div>
            <div class="space-y-2">
              <div
                v-for="member in activeConversation.members"
                :key="`settings-member-${member.email}`"
                class="rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="truncate text-sm font-semibold text-slate-950">
                      {{ member.login || member.email }}
                    </div>
                    <div class="mt-1 text-xs text-slate-500">
                      {{ groupRoleLabel(member.role) }}
                    </div>
                  </div>
                  <div class="flex flex-wrap justify-end gap-2">
                    <select
                      v-if="groupMemberActionState(member).canChangeRole"
                      class="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                      :value="member.role"
                      :disabled="savingGroupSettings"
                      @change="updateGroupMemberRole(member, $event.target.value)"
                    >
                      <option
                        v-for="role in groupMemberActionState(member).roleOptions"
                        :key="`${member.email}-${role}`"
                        :value="role"
                      >
                        {{ groupRoleLabel(role) }}
                      </option>
                    </select>
                    <button
                      v-if="groupMemberActionState(member).canRemove"
                      type="button"
                      class="rounded-xl border border-rose-100 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="savingGroupSettings"
                      @click="removeGroupMember(member)"
                    >
                      Удалить
                    </button>
                    <button
                      v-if="groupMemberActionState(member).canLeave"
                      type="button"
                      class="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="savingGroupSettings"
                      @click="removeGroupMember(member)"
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              v-if="activeConversation.permissions?.canDelete"
              type="button"
              class="mt-4 w-full rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="deletingGroup"
              @click="deleteActiveGroup"
            >
              {{ deletingGroup ? 'Удаляем…' : 'Удалить группу' }}
            </button>
          </section>
        </div>
      </section>
    </div>

    <div
      v-if="forwardPickerOpen"
      class="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
      @click.self="forwardPickerOpen = false"
    >
      <section class="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-xl font-bold text-slate-950">Переслать сообщения</h3>
            <p class="mt-1 text-sm text-slate-500">
              Выбрано: {{ selectedMessageActionState.selectedCount }}.
            </p>
          </div>
          <button
            type="button"
            class="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            @click="forwardPickerOpen = false"
          >
            Закрыть
          </button>
        </div>
        <div class="max-h-80 space-y-2 overflow-auto">
          <button
            v-for="conversation in forwardTargetConversations"
            :key="`forward-${conversation.id}`"
            type="button"
            class="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50 disabled:cursor-wait disabled:opacity-60"
            :disabled="forwardingMessages"
            @click="forwardSelectedMessages(conversation.id)"
          >
            <span class="min-w-0">
              <span class="block truncate text-sm font-semibold text-slate-950">
                {{ conversation.title }}
              </span>
              <span class="mt-0.5 block truncate text-xs text-slate-500">
                {{ conversationPreview(conversation) }}
              </span>
            </span>
            <span class="text-sky-600">→</span>
          </button>
          <div
            v-if="!forwardTargetConversations.length"
            class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500"
          >
            Нет другого чата для пересылки.
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="microphoneHelpOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
      @click.self="microphoneHelpOpen = false"
    >
      <section class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-xl font-bold text-slate-950">Доступ к микрофону</h3>
            <p class="mt-1 text-sm text-slate-500">
              Окно разрешения показывает сам браузер после нажатия “Записать”.
            </p>
          </div>
          <button
            type="button"
            class="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            @click="microphoneHelpOpen = false"
          >
            Закрыть
          </button>
        </div>

        <div class="space-y-3 text-sm leading-6 text-slate-700">
          <p>
            Если popup не появился, нажми на значок замка слева от адреса сайта и выбери “Микрофон”
            → “Разрешить”.
          </p>
          <p>
            Если сайт открыт по HTTP, браузер может полностью блокировать микрофон. Для прода нужен
            HTTPS, иначе окно доступа может не появляться.
          </p>
          <p>После изменения разрешения обнови страницу и нажми “Записать” ещё раз.</p>
        </div>

        <button
          type="button"
          class="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          @click="requestMicrophoneFromHelp"
        >
          Запросить доступ
        </button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import InlineNotice from '../components/InlineNotice.vue'
import {
  buildCallMediaConstraints,
  getCallFocusSidebarTiles,
  getCallFocusTile,
  getCallVideoGridClass,
  mergeCallMediaEntry,
  replacePeerConnectionsVideoTrack,
  setStreamTracksEnabled,
  streamHasActiveVideo,
  streamHasVideo,
  streamVideoTrack,
} from '../lib/chat-call-ui.js'
import { getChatDraftPreview } from '../lib/chat.js'
import { renderChatMarkdown } from '../lib/chat-markdown.js'
import {
  buildUnreadCenterItems,
  filterChatMessagesByMode,
  filterImportantMessages,
  getChatReminderPresetOptions,
  getTotalUnreadCount,
} from '../lib/chat-power-tools.js'
import {
  buildChatSearchExcerpt,
  buildChatTimelineItems,
  extractChatMentions,
  getChatAudioRecorderLabel,
  getChatUnreadScrollAction,
  getChatPresenceText,
  getAudioMessageButtonLabel,
  getFirstUnreadMessageId,
  getChatSwipeReplyState,
  getFileMessageButtonLabel,
  getImageMessageButtonLabel,
  filterChatUsersForSearch,
  getChatMessageSenderLabel,
  getChatMessageStatusIcon,
  getChatMessageStatusTone,
  getChatMessageStatusTitle,
  getChatMicrophoneErrorMessage,
  getChatReplyPreviewText,
  getGroupMemberActionState,
  getSelectedChatMessagesActionState,
  getConversationMembersSummary,
  getDroppedImageFile,
  getCurrentUserReactionEmoji,
  getRecentChatItems,
  getTypingIndicatorLabel,
  groupChatReactions,
  insertEmojiIntoText,
  isChatMessageEditable,
  isChatSendShortcut,
  shouldHandleUnreadScrollRead,
  shouldMarkReadAfterUnreadScrollAction,
  shouldRefreshChatTyping,
} from '../lib/chat-ui.js'
import { useAuthStore } from '../stores/auth.js'
import { useChatStore } from '../stores/chat.js'
import { useNotificationsStore } from '../stores/notifications.js'

const authStore = useAuthStore()
const chatStore = useChatStore()
const notifications = useNotificationsStore()
const router = useRouter()

const chatSearch = ref('')
const composerText = ref('')
const composerTextarea = ref(null)
const searchInput = ref(null)
const imageInput = ref(null)
const fileInput = ref(null)
const emojiPickerRoot = ref(null)
const emojiPickerOpen = ref(false)
const creatingGroup = ref(false)
const deletingGroup = ref(false)
const savingGroupSettings = ref(false)
const forwardingMessages = ref(false)
const sendingMessage = ref(false)
const sendingAudio = ref(false)
const sendingImage = ref(false)
const sendingFile = ref(false)
const groupModalOpen = ref(false)
const groupSettingsOpen = ref(false)
const forwardPickerOpen = ref(false)
const messagesScroller = ref(null)
const isRecordingAudio = ref(false)
const recordingSeconds = ref(0)
const recordedAudioDuration = ref(0)
const recordedAudioBlob = ref(null)
const recordedAudioUrl = ref('')
const selectedImageBlob = ref(null)
const selectedImageUrl = ref('')
const selectedImageName = ref('')
const selectedFileBlob = ref(null)
const selectedFileName = ref('')
const selectedFileSize = ref(0)
const composerDropActive = ref(false)
const composerDragDepth = ref(0)
const recordingError = ref('')
const microphoneHelpOpen = ref(false)
const playingAudioMessageId = ref('')
const viewingImageMessageId = ref('')
const downloadingFileMessageId = ref('')
const imageViewerOpen = ref(false)
const imageViewerUrl = ref('')
const audioPlayerOpen = ref(false)
const audioPlayerUrl = ref('')
const audioPlayerTitle = ref('')
const audioPlayerElement = ref(null)
const localCallVideo = ref(null)
const startingCall = ref(false)
const joiningCall = ref(false)
const endingCall = ref(false)
const callActionError = ref('')
const localCallMuted = ref(false)
const localCallCameraEnabled = ref(false)
const localCallStream = ref(null)
const localCallScreenStream = ref(null)
const startingScreenShare = ref(false)
const remoteCallMedia = ref([])
const callFocusMode = ref(false)
const focusedCallParticipantEmail = ref('')
const mediaRecorder = ref(null)
const recordingStream = ref(null)
const recordingTimer = ref(null)
const searchOpen = ref(false)
const searchQuery = ref('')
const searchTimer = ref(null)
const chatCenterMode = ref('')
const messageFilterMode = ref('all')
const importantQuery = ref('')
const replyingToMessageId = ref('')
const editingMessageId = ref('')
const editingMessageText = ref('')
const reactionPickerMessageId = ref('')
const reminderPickerMessageId = ref('')
const aliceAnnouncementPendingMessageId = ref('')
const aliceAnnouncementErrorMessageId = ref('')
const isMobileLayout = ref(false)
const mobileView = ref('list')
const swipeReplyState = ref({
  messageId: '',
  startX: 0,
  startY: 0,
  offsetX: 0,
})
const groupForm = ref({
  title: '',
  memberEmails: [],
})
const groupSettingsForm = ref({
  title: '',
  memberEmails: [],
})
const selectedMessageIds = ref([])
const clearingConversationMessages = ref(false)
const messageElements = new Map()
const remoteMediaElements = new Map()
const peerConnections = new Map()
let highlightTimerId = null
let mobileMediaQuery = null
let unsubscribeSocketEnvelope = null
let typingStopTimer = null
let typingActiveConversationId = ''
let typingStartedSentAt = 0
let suppressDraftAutosave = false
let pendingInitialUnreadScrollConversationId = ''
let preferBottomForPendingInitialScroll = false
let programmaticUnreadScrollGuardTimer = null
let programmaticUnreadScrollActive = false
let reminderDueTimer = null
const notifiedReminderIds = new Set()

const chatAudioMaxSeconds = Math.max(1, Number(import.meta.env.VITE_CHAT_AUDIO_MAX_SECONDS || 60))
const composerEmojis = [
  '😊',
  '😂',
  '😍',
  '🔥',
  '❤️',
  '👍',
  '🙏',
  '🎉',
  '😎',
  '🤔',
  '😅',
  '🥲',
  '😌',
  '😡',
  '💪',
  '👏',
  '✅',
  '❌',
  '👀',
  '💬',
  '🚀',
  '⭐',
  '⚡',
  '🍀',
]

const currentUserEmail = computed(() => authStore.user?.email || '')
const canUseAlice = computed(() =>
  (Array.isArray(authStore.user?.appPermissions) ? authStore.user.appPermissions : []).includes(
    'alice',
  ),
)
const shouldAutoAnnounceOnAlice = computed(
  () => canUseAlice.value && ['direct', 'group'].includes(activeConversation.value?.type || ''),
)
const currentUserLogin = computed(() => authStore.user?.login || authStore.user?.email || '')
const chatErrorMessage = computed(
  () =>
    chatStore.error?.response?.data?.message ||
    chatStore.error?.message ||
    'Не удалось загрузить или синхронизировать чат.',
)
const socketLabel = computed(() => {
  if (chatStore.socketStatus === 'connected') {
    return 'Сокет подключён'
  }

  if (chatStore.socketStatus === 'connecting') {
    return 'Сокет подключается'
  }

  if (chatStore.socketStatus === 'reconnecting') {
    return 'Сокет переподключается'
  }

  if (chatStore.socketStatus === 'error') {
    return 'Ошибка сокета'
  }

  return 'Сокет отключён'
})
const socketDotClass = computed(() => {
  if (chatStore.socketStatus === 'connected') {
    return 'bg-emerald-500'
  }

  return 'bg-rose-500'
})
const socketRecoveryActive = computed(() =>
  ['connecting', 'reconnecting', 'error'].includes(chatStore.socketStatus),
)
const showSocketRecoveryOverlay = computed(
  () =>
    socketRecoveryActive.value &&
    Boolean(chatStore.conversations.length || activeConversation.value),
)
const showChatErrorNotice = computed(() => Boolean(chatStore.error) && !socketRecoveryActive.value)
const socketRecoveryTitle = computed(() => {
  if (chatStore.socketStatus === 'error') {
    return 'Переподключаем чат'
  }

  if (chatStore.socketStatus === 'connecting') {
    return 'Подключаем чат'
  }

  return 'Возвращаем соединение'
})
const socketRecoveryMessage = computed(
  () => 'Если сеть моргнула, чат сам попробует подключиться снова через 2 секунды.',
)
const mobileConversationMode = computed(
  () => isMobileLayout.value && mobileView.value === 'conversation',
)
const activeConversation = computed(() => chatStore.activeConversation)
const activeMessages = computed(() => chatStore.activeConversationMessages)
const activeMessagesLoaded = computed(
  () =>
    Boolean(chatStore.activeConversationId) &&
    Object.prototype.hasOwnProperty.call(
      chatStore.messagesByConversation,
      chatStore.activeConversationId,
    ),
)
const activeLastReadMessageId = computed(
  () =>
    chatStore.lastReadMessageIdByConversation[chatStore.activeConversationId] ||
    activeConversation.value?.lastReadMessageId ||
    '',
)
const activeFirstUnreadMessageId = computed(() =>
  getFirstUnreadMessageId(
    activeMessages.value,
    activeLastReadMessageId.value,
    currentUserEmail.value,
  ),
)
const activeFilteredMessages = computed(() =>
  filterChatMessagesByMode(activeMessages.value, messageFilterMode.value, {
    lastReadMessageId: activeLastReadMessageId.value,
    currentUserEmail: currentUserEmail.value,
  }),
)
const activeTimelineItems = computed(() =>
  buildChatTimelineItems(
    activeFilteredMessages.value,
    activeLastReadMessageId.value,
    currentUserEmail.value,
  ),
)
const messageFilterOptions = computed(() => [
  { key: 'all', label: 'Все', count: activeMessages.value.length },
  { key: 'unread', label: 'Новые', count: activeConversation.value?.unreadCount || 0 },
  {
    key: 'important',
    label: 'Важные',
    count: activeMessages.value.filter((message) => message.favorite).length,
  },
  {
    key: 'media',
    label: 'Медиа',
    count: activeMessages.value.filter((message) =>
      ['audio', 'image', 'file'].includes(message.type),
    ).length,
  },
  {
    key: 'audio',
    label: 'Голосовые',
    count: activeMessages.value.filter((message) => message.type === 'audio').length,
  },
  {
    key: 'files',
    label: 'Файлы',
    count: activeMessages.value.filter((message) => message.type === 'file').length,
  },
])
const selectedMessageActionState = computed(() =>
  getSelectedChatMessagesActionState({
    selectedMessageIds: selectedMessageIds.value,
    messages: activeMessages.value,
    currentUserEmail: currentUserEmail.value,
  }),
)
const selectedMessages = computed(() => {
  const selectedIds = new Set(selectedMessageIds.value)
  return activeMessages.value.filter((message) => selectedIds.has(message.id))
})
const forwardTargetConversations = computed(() =>
  chatStore.conversations.filter(
    (conversation) => conversation.id !== activeConversation.value?.id,
  ),
)
const activeMediaSendError = computed(
  () => chatStore.mediaSendErrorByConversation[chatStore.activeConversationId] || '',
)
const otherUsers = computed(() =>
  chatStore.users.filter((user) => user.email && user.email !== currentUserEmail.value),
)
const activeGroupMemberEmails = computed(
  () => new Set((activeConversation.value?.members || []).map((member) => member.email)),
)
const groupInviteUsers = computed(() =>
  otherUsers.value.filter((user) => !activeGroupMemberEmails.value.has(user.email)),
)
const isSearchingChats = computed(() => chatSearch.value.trim().length > 0)
const searchedUsers = computed(() =>
  filterChatUsersForSearch(chatStore.users, chatSearch.value, currentUserEmail.value),
)
const recentChats = computed(() => getRecentChatItems(chatStore.conversations, 5))
const activeConversationTitle = computed(() => activeConversation.value?.title || 'Выбери чат')
const activePinnedMessage = computed(() => activeConversation.value?.pinnedMessage || null)
const audioRecorderLabel = computed(() => getChatAudioRecorderLabel(isRecordingAudio.value))
const activeSearchResults = computed(() => chatStore.searchResults)
const unreadCenterItems = computed(() => buildUnreadCenterItems(chatStore.conversations))
const totalUnreadCount = computed(() => getTotalUnreadCount(chatStore.conversations))
const importantMessages = computed(() =>
  filterImportantMessages(chatStore.favoriteMessages, importantQuery.value),
)
const reminderItems = computed(() => chatStore.reminders)
const activePresenceText = computed(() =>
  activeConversation.value ? getChatPresenceText(activeConversation.value) : '',
)
const activeTypingLabel = computed(() =>
  getTypingIndicatorLabel(chatStore.activeConversationTypers),
)
const displayedCall = computed(
  () => chatStore.activeCall || chatStore.activeConversationCall || null,
)
const displayedCallConversation = computed(
  () =>
    chatStore.conversations.find(
      (conversation) => conversation.id === displayedCall.value?.conversationId,
    ) || null,
)
const isCurrentUserInDisplayedCall = computed(() =>
  Boolean(
    displayedCall.value?.participants?.some(
      (participant) => participant.email === currentUserEmail.value,
    ),
  ),
)
const displayedCallStatusText = computed(() => {
  if (!displayedCall.value) {
    return ''
  }

  const callChatTitle = displayedCallConversation.value?.title || ''
  if (!displayedCall.value.joinable) {
    return callChatTitle
      ? `Звонок в чате «${callChatTitle}» уже завершён.`
      : 'Кнопка подключения больше неактивна.'
  }

  if (isCurrentUserInDisplayedCall.value) {
    return callChatTitle
      ? `Звонок в чате «${callChatTitle}». Участников сейчас: ${displayedCall.value.participants.length}`
      : `Участников сейчас: ${displayedCall.value.participants.length}`
  }

  if (chatStore.activeCall?.id && chatStore.activeCall.id !== displayedCall.value.id) {
    return 'У тебя уже есть другой активный звонок. Сначала выйди из него.'
  }

  return callChatTitle
    ? `Звонок в чате «${callChatTitle}». Участников сейчас: ${displayedCall.value.participants.length}. Можно подключиться.`
    : `Участников сейчас: ${displayedCall.value.participants.length}. Можно подключиться.`
})
const displayedCallVideoGridClass = computed(() =>
  getCallVideoGridClass(displayedCallMediaTiles.value.length),
)
const localCallScreenSharing = computed(() => Boolean(localCallScreenStream.value))
const displayedCallMediaTiles = computed(() => {
  if (!displayedCall.value) {
    return []
  }

  const tiles = []
  if (isCurrentUserInDisplayedCall.value && localCallStream.value) {
    const localStream = localCallScreenStream.value || localCallStream.value
    tiles.push({
      email: currentUserEmail.value,
      login: currentUserLogin.value,
      muted: localCallMuted.value,
      stream: localStream,
      cameraEnabled: localCallScreenSharing.value || localCallCameraEnabled.value,
      hasVideo: streamHasVideo(localStream),
      screenSharing: localCallScreenSharing.value,
      isLocal: true,
    })
  }

  for (const participant of displayedCall.value.participants || []) {
    if (!participant?.email || participant.email === currentUserEmail.value) {
      continue
    }

    const mediaEntry = remoteCallMedia.value.find((item) => item.email === participant.email)
    tiles.push({
      email: participant.email,
      login: participant.login || participant.email,
      muted: Boolean(participant.muted),
      stream: mediaEntry?.stream || null,
      cameraEnabled: mediaEntry?.cameraEnabled ?? false,
      hasVideo: mediaEntry?.hasVideo ?? false,
      screenSharing: mediaEntry?.screenSharing ?? false,
      isLocal: false,
    })
  }

  return tiles
})
const focusedCallTile = computed(() =>
  getCallFocusTile(displayedCallMediaTiles.value, focusedCallParticipantEmail.value),
)
const callFocusSidebarTiles = computed(() =>
  getCallFocusSidebarTiles(displayedCallMediaTiles.value, focusedCallTile.value?.email || ''),
)
const shouldAutoOpenCallFocus = computed(() =>
  Boolean(
    displayedCall.value?.joinable &&
      isCurrentUserInDisplayedCall.value &&
      displayedCallMediaTiles.value.length &&
      displayedCallMediaTiles.value.some(
        (tile) => tile?.stream || tile?.hasVideo || tile?.cameraEnabled,
      ),
  ),
)
const showCallFocusLayout = computed(() =>
  Boolean(callFocusMode.value && displayedCall.value?.joinable && focusedCallTile.value),
)
const replyingToMessage = computed(() => {
  if (!replyingToMessageId.value) {
    return null
  }

  return activeMessages.value.find((message) => message.id === replyingToMessageId.value) || null
})
const activeGroupMembersSummary = computed(() => {
  if (!activeConversation.value || activeConversation.value.type !== 'group') {
    return ''
  }

  return getConversationMembersSummary(activeConversation.value, currentUserEmail.value)
})
const activeMentionMembers = computed(() => {
  if (activeConversation.value?.type !== 'group') {
    return []
  }

  return (activeConversation.value.members || []).filter(
    (member) => member.email && member.email !== currentUserEmail.value && member.login,
  )
})
const groupRoleLabel = (role = 'member') => {
  switch (role) {
    case 'owner':
      return 'Владелец'
    case 'admin':
      return 'Админ'
    default:
      return 'Участник'
  }
}
const groupMemberActionState = (member) =>
  getGroupMemberActionState({
    conversation: activeConversation.value || {},
    member,
    currentUserEmail: currentUserEmail.value,
  })
const isMessageSelected = (message) => selectedMessageIds.value.includes(message?.id)
const toggleMessageSelected = (message) => {
  if (!message?.id) {
    return
  }

  selectedMessageIds.value = isMessageSelected(message)
    ? selectedMessageIds.value.filter((id) => id !== message.id)
    : [...selectedMessageIds.value, message.id]
}
const clearSelectedMessages = () => {
  selectedMessageIds.value = []
  forwardPickerOpen.value = false
}

const openConversationScreen = () => {
  if (isMobileLayout.value) {
    mobileView.value = 'conversation'
  }
}

const openChatsScreen = () => {
  if (isMobileLayout.value) {
    mobileView.value = 'list'
  }
}

const openSettings = () => {
  router.push('/settings')
}

const openChatCenter = async (mode) => {
  chatCenterMode.value = chatCenterMode.value === mode ? '' : mode
  if (!chatCenterMode.value) {
    return
  }

  try {
    if (mode === 'important') {
      await chatStore.loadFavoriteMessages()
    } else if (mode === 'reminders') {
      await chatStore.loadReminders()
    } else if (mode === 'search' && searchQuery.value.trim()) {
      await chatStore.searchMessages(searchQuery.value)
    }
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось загрузить центр чата')
  }
}

const selectUnreadConversation = async (conversation) => {
  if (!conversation?.id) {
    return
  }

  try {
    await chatStore.setActiveConversation(conversation.id)
    openConversationScreen()
    await nextTick()
    if (activeFirstUnreadMessageId.value) {
      await scrollToMessage(activeFirstUnreadMessageId.value, { behavior: 'auto' })
    }
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось открыть непрочитанный чат')
  }
}

const openStoredMessage = async ({ conversationId, messageId }) => {
  if (!conversationId || !messageId) {
    return
  }

  try {
    await chatStore.setActiveConversation(conversationId)
    openConversationScreen()
    await scrollToMessage(messageId)
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось перейти к сообщению')
  }
}

const openFavoriteMessage = (message) =>
  openStoredMessage({ conversationId: message?.conversationId, messageId: message?.id })

const openReminderMessage = (reminder) =>
  openStoredMessage({ conversationId: reminder?.conversationId, messageId: reminder?.messageId })

const removeReminder = async (reminderId) => {
  try {
    await chatStore.deleteReminder(reminderId)
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось убрать напоминание')
  }
}

const openCallFocus = (email = '') => {
  if (!displayedCall.value?.joinable || !displayedCallMediaTiles.value.length) {
    return
  }

  const tile = getCallFocusTile(displayedCallMediaTiles.value, email)
  focusedCallParticipantEmail.value = tile?.email || ''
  callFocusMode.value = true
}

const closeCallFocus = () => {
  callFocusMode.value = false
  focusedCallParticipantEmail.value = ''
}

const focusCallTile = (email = '') => {
  if (!email) {
    return
  }

  focusedCallParticipantEmail.value = email
  if (!callFocusMode.value) {
    callFocusMode.value = true
  }
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
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatAudioDuration = (value) => {
  const totalSeconds = Math.max(0, Math.round(Number(value) || 0))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const conversationPreview = (conversation) => {
  const typingLabel = getTypingIndicatorLabel(
    chatStore.activeTypersByConversation[conversation.id] || [],
  )
  if (typingLabel) {
    return typingLabel
  }

  const draftPreview = getChatDraftPreview(conversation)
  if (draftPreview) {
    return draftPreview
  }

  if (conversation.type === 'group') {
    return getConversationMembersSummary(conversation, currentUserEmail.value)
  }

  if (conversation.lastMessageText) {
    return conversation.lastMessageText
  }

  return 'Direct-диалог'
}

const conversationPresence = (conversation) => getChatPresenceText(conversation)

const conversationTitleById = (conversationId) =>
  chatStore.conversations.find((conversation) => conversation.id === conversationId)?.title || 'Чат'

const messagePreviewText = (message = {}) => {
  if (message.type === 'audio') {
    return 'Голосовое сообщение'
  }
  if (message.type === 'image') {
    return 'Изображение'
  }
  if (message.type === 'file') {
    return message.file?.filename ? `Файл: ${message.file.filename}` : 'Файл'
  }
  if (message.type === 'call') {
    return 'Звонок'
  }
  return String(message.text || message.messageText || '').trim() || 'Сообщение'
}

const formatReminderDate = (value) => {
  if (!value) {
    return 'без времени'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const checkDueReminders = () => {
  const now = Date.now()
  for (const reminder of chatStore.reminders) {
    if (!reminder?.id || notifiedReminderIds.has(reminder.id)) {
      continue
    }
    const dueAt = new Date(reminder.remindAt).getTime()
    if (!Number.isFinite(dueAt) || dueAt > now) {
      continue
    }
    notifiedReminderIds.add(reminder.id)
    notifications.info(`Напоминание: ${reminder.messageText || 'сообщение в чате'}`, {
      duration: 8000,
    })
  }
}

const messageSenderLabel = (message) =>
  getChatMessageSenderLabel(message, {
    email: currentUserEmail.value,
    login: currentUserLogin.value,
  })

const messageStatusIcon = (message) => getChatMessageStatusIcon(message, currentUserEmail.value)

const messageStatusTitle = (message) => getChatMessageStatusTitle(message, currentUserEmail.value)

const messageStatusClass = (message) => {
  const tone = getChatMessageStatusTone(message, currentUserEmail.value)
  if (tone === 'read') {
    return 'text-sky-500'
  }
  if (tone === 'failed') {
    return 'text-rose-500'
  }
  if (tone === 'pending') {
    return 'text-slate-400'
  }
  return 'text-slate-500'
}

const messageCanRetryText = (message) =>
  message?.type === 'text' &&
  message?.senderEmail === currentUserEmail.value &&
  message?.deliveryStatus === 'failed' &&
  Boolean(message.clientMessageId)

const retryTextMessage = (message) => {
  const retried = chatStore.retryFailedTextMessage({
    conversationId: message.conversationId || activeConversation.value?.id,
    clientMessageId: message.clientMessageId,
    messageId: message.id,
  })
  if (!retried) {
    notifications.error('Не удалось повторить отправку')
  }
}

const renderMessageText = (text) => renderChatMarkdown(text)

const searchResultExcerpt = (result) => buildChatSearchExcerpt(result?.text, searchQuery.value, 88)

const messageReactionGroups = (message) => groupChatReactions(message?.reactions || [])

const currentUserReactionEmoji = (message) =>
  getCurrentUserReactionEmoji(message?.reactions || [], currentUserEmail.value)

const canEditMessage = (message) => isChatMessageEditable(message, currentUserEmail.value)

const resolveReplyPreview = (message) => {
  if (message?.replyPreview?.id) {
    return message.replyPreview
  }

  if (!message?.replyToMessageId) {
    return null
  }

  const source = activeMessages.value.find((item) => item.id === message.replyToMessageId)
  if (!source) {
    return null
  }

  return {
    id: source.id,
    type: source.type,
    text: source.text,
    senderEmail: source.senderEmail,
    senderLogin: source.senderLogin,
  }
}

const replyPreviewSender = (preview) =>
  getChatMessageSenderLabel(preview, {
    email: currentUserEmail.value,
    login: currentUserLogin.value,
  })

const replyPreviewText = (preview) => getChatReplyPreviewText(preview)

const isPinnedMessage = (message) =>
  Boolean(message?.id) && activeConversation.value?.pinnedMessageId === message.id

const clearHighlightLater = () => {
  if (highlightTimerId) {
    clearTimeout(highlightTimerId)
  }
  highlightTimerId = setTimeout(() => {
    chatStore.setHighlightedMessage('')
    highlightTimerId = null
  }, 2600)
}

const setMessageElement = (messageId) => (element) => {
  if (element) {
    messageElements.set(messageId, element)
    return
  }

  messageElements.delete(messageId)
}

const scrollToMessage = async (messageId, options = {}) => {
  if (!messageId) {
    return
  }

  await nextTick()
  const element = messageElements.get(messageId)
  if (!element) {
    return
  }

  element.scrollIntoView({
    block: 'center',
    behavior: options.behavior || 'smooth',
  })
  chatStore.setHighlightedMessage(messageId)
  clearHighlightLater()
}

const swipeOffsetForMessage = (messageId) =>
  swipeReplyState.value.messageId === messageId ? swipeReplyState.value.offsetX : 0

const resetSwipeReply = () => {
  swipeReplyState.value = {
    messageId: '',
    startX: 0,
    startY: 0,
    offsetX: 0,
  }
}

const updateMobileLayout = () => {
  if (typeof window === 'undefined') {
    isMobileLayout.value = false
    return
  }

  isMobileLayout.value = window.innerWidth < 640
  if (!isMobileLayout.value) {
    mobileView.value = 'conversation'
    return
  }

  if (!chatStore.activeConversationId) {
    mobileView.value = 'list'
  }
}

const startSwipeReplyGesture = (message, event) => {
  if (!isMobileLayout.value || !message?.id || editingMessageId.value === message.id) {
    return
  }

  const touch = event?.touches?.[0]
  if (!touch) {
    return
  }

  swipeReplyState.value = {
    messageId: message.id,
    startX: touch.clientX,
    startY: touch.clientY,
    offsetX: 0,
  }
}

const moveSwipeReplyGesture = (message, event) => {
  if (!isMobileLayout.value || swipeReplyState.value.messageId !== message?.id) {
    return
  }

  const touch = event?.touches?.[0]
  if (!touch) {
    return
  }

  const nextState = getChatSwipeReplyState({
    startX: swipeReplyState.value.startX,
    startY: swipeReplyState.value.startY,
    currentX: touch.clientX,
    currentY: touch.clientY,
    isMobile: isMobileLayout.value,
  })

  swipeReplyState.value = {
    ...swipeReplyState.value,
    offsetX: nextState.offsetX,
  }
}

const endSwipeReplyGesture = async (message, event) => {
  if (!isMobileLayout.value || swipeReplyState.value.messageId !== message?.id) {
    return
  }

  const touch = event?.changedTouches?.[0]
  const nextState = getChatSwipeReplyState({
    startX: swipeReplyState.value.startX,
    startY: swipeReplyState.value.startY,
    currentX: touch?.clientX ?? swipeReplyState.value.startX,
    currentY: touch?.clientY ?? swipeReplyState.value.startY,
    isMobile: isMobileLayout.value,
  })

  resetSwipeReply()
  if (nextState.shouldReply) {
    await startReply(message)
  }
}

const focusComposer = async (cursor = null) => {
  await nextTick()
  const textarea = composerTextarea.value
  if (!textarea) {
    return
  }

  textarea.focus()
  if (cursor != null) {
    textarea.setSelectionRange(cursor, cursor)
  }
}

const toggleEmojiPicker = () => {
  emojiPickerOpen.value = !emojiPickerOpen.value
}

const closeEmojiPicker = () => {
  emojiPickerOpen.value = false
}

const openSearch = async () => {
  searchOpen.value = true
  await nextTick()
  searchInput.value?.focus()
  if (searchQuery.value.trim()) {
    try {
      await chatStore.searchMessages(searchQuery.value)
    } catch {
      // notifications already handled in store
    }
  }
}

const closeSearch = () => {
  searchOpen.value = false
  reactionPickerMessageId.value = ''
}

const toggleSearch = () => {
  if (searchOpen.value) {
    closeSearch()
    return
  }

  openSearch()
}

const clearReplyState = () => {
  replyingToMessageId.value = ''
}

const startReply = async (message) => {
  if (!message?.id) {
    return
  }

  editingMessageId.value = ''
  reactionPickerMessageId.value = ''
  replyingToMessageId.value = message.id
  await focusComposer()
}

const startEditing = async (message) => {
  if (!canEditMessage(message)) {
    return
  }

  clearReplyState()
  reactionPickerMessageId.value = ''
  editingMessageId.value = message.id
  editingMessageText.value = String(message.text || '')
  await nextTick()
}

const cancelEditing = () => {
  editingMessageId.value = ''
  editingMessageText.value = ''
}

const saveEditing = async (message) => {
  const text = editingMessageText.value.trim()
  if (!activeConversation.value || !message?.id || !text) {
    return
  }

  try {
    await chatStore.editMessage({
      conversationId: activeConversation.value.id,
      messageId: message.id,
      text,
    })
    cancelEditing()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось изменить сообщение')
  }
}

const removeMessage = async (message) => {
  if (!activeConversation.value || !message?.id) {
    return
  }

  const confirmed =
    typeof window === 'undefined' || window.confirm('Удалить это сообщение для всех участников?')
  if (!confirmed) {
    return
  }

  try {
    await chatStore.deleteMessage({
      conversationId: activeConversation.value.id,
      messageId: message.id,
    })
    if (replyingToMessageId.value === message.id) {
      clearReplyState()
    }
    if (editingMessageId.value === message.id) {
      cancelEditing()
    }
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось удалить сообщение')
  }
}

const toggleReactionPicker = (message) => {
  if (!message?.id) {
    return
  }

  reactionPickerMessageId.value = reactionPickerMessageId.value === message.id ? '' : message.id
  reminderPickerMessageId.value = ''
}

const reminderPresetOptions = () => getChatReminderPresetOptions(new Date())

const toggleReminderPicker = (message) => {
  if (!message?.id) {
    return
  }

  reminderPickerMessageId.value = reminderPickerMessageId.value === message.id ? '' : message.id
  reactionPickerMessageId.value = ''
}

const setMessageReminder = async (message, option) => {
  if (!activeConversation.value || !message?.id || !option?.remindAt) {
    return
  }

  try {
    await chatStore.createReminder({
      conversationId: activeConversation.value.id,
      messageId: message.id,
      remindAt: option.remindAt,
    })
    reminderPickerMessageId.value = ''
    notifications.success(`Напомню: ${option.label}`)
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось поставить напоминание')
  }
}

const selectReaction = async (message, emoji) => {
  if (!activeConversation.value || !message?.id || !emoji) {
    return
  }

  try {
    if (currentUserReactionEmoji(message) === emoji) {
      await chatStore.removeReaction({
        conversationId: activeConversation.value.id,
        messageId: message.id,
      })
    } else {
      await chatStore.setReaction({
        conversationId: activeConversation.value.id,
        messageId: message.id,
        emoji,
      })
    }
    reactionPickerMessageId.value = ''
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось обновить реакцию')
  }
}

const toggleMessagePin = async (message) => {
  if (!activeConversation.value || !message?.id) {
    return
  }

  try {
    if (isPinnedMessage(message)) {
      await chatStore.clearPin(activeConversation.value.id)
    } else {
      await chatStore.pinMessage({
        conversationId: activeConversation.value.id,
        messageId: message.id,
      })
    }
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось обновить закреп')
  }
}

const jumpToPinnedMessage = async () => {
  if (!activePinnedMessage.value?.id) {
    return
  }

  await scrollToMessage(activePinnedMessage.value.id)
}

const jumpToReplySource = async (message) => {
  const preview = resolveReplyPreview(message)
  if (!preview?.id) {
    return
  }

  await scrollToMessage(preview.id)
}

const clearActivePin = async () => {
  if (!activeConversation.value) {
    return
  }

  try {
    await chatStore.clearPin(activeConversation.value.id)
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось снять закреп')
  }
}

const clearActiveConversationMessages = async () => {
  if (
    !activeConversation.value ||
    !activeMessages.value.length ||
    clearingConversationMessages.value
  ) {
    return
  }

  const confirmed =
    typeof window === 'undefined' ||
    window.confirm(
      `Удалить все сообщения в чате «${activeConversationTitle.value}»? Это действие нельзя отменить.`,
    )
  if (!confirmed) {
    return
  }

  clearingConversationMessages.value = true
  try {
    await chatStore.clearConversationMessages(activeConversation.value.id)
    clearSelectedMessages()
    clearReplyState()
    cancelEditing()
    notifications.success('Сообщения в чате удалены')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось очистить чат')
  } finally {
    clearingConversationMessages.value = false
  }
}

const openSearchResult = async (result) => {
  if (!result?.conversationId || !result?.messageId) {
    return
  }

  try {
    await chatStore.setActiveConversation(result.conversationId)
    openConversationScreen()
    closeSearch()
    await scrollToMessage(result.messageId)
  } catch {
    // notifications already handled in store
  }
}

const setRemoteMediaElement = (email) => (element) => {
  if (element) {
    remoteMediaElements.set(email, element)
    const remote = remoteCallMedia.value.find((item) => item.email === email)
    if (remote?.stream) {
      element.srcObject = remote.stream
    }
    return
  }

  remoteMediaElements.delete(email)
}

const setLocalCallVideoElement = (element) => {
  localCallVideo.value = element || null
  attachLocalMedia()
}

const resetRemoteMedia = () => {
  for (const entry of remoteCallMedia.value) {
    const tracks = entry.stream?.getTracks?.() || []
    for (const track of tracks) {
      track.stop()
    }
  }
  remoteCallMedia.value = []
}

const attachLocalMedia = () => {
  if (localCallVideo.value) {
    localCallVideo.value.srcObject = localCallScreenStream.value || localCallStream.value
  }
}

const updateRemoteMediaState = (email, patch = {}) => {
  if (!email) {
    return
  }

  let updated = false
  remoteCallMedia.value = remoteCallMedia.value.map((entry) => {
    if (entry.email !== email) {
      return entry
    }
    updated = true
    return {
      ...entry,
      ...patch,
    }
  })
  if (!updated) {
    remoteCallMedia.value = [
      ...remoteCallMedia.value,
      {
        email,
        login: email,
        muted: false,
        stream: null,
        cameraEnabled: false,
        hasVideo: false,
        screenSharing: false,
        ...patch,
      },
    ]
  }
}

const upsertRemoteMediaStream = (participant, stream) => {
  if (!participant?.email) {
    return
  }

  const next = [...remoteCallMedia.value]
  const index = next.findIndex((item) => item.email === participant.email)
  const entry = mergeCallMediaEntry(next[index], participant, stream)

  if (index === -1) {
    next.push(entry)
  } else {
    next[index] = entry
  }
  remoteCallMedia.value = next

  const element = remoteMediaElements.get(participant.email)
  if (element) {
    element.srcObject = stream
  }
}

const syncRemoteMediaMeta = (call) => {
  if (!call) {
    resetRemoteMedia()
    return
  }

  remoteCallMedia.value = remoteCallMedia.value
    .filter((entry) =>
      call.participants.some(
        (participant) =>
          participant.email === entry.email && participant.email !== currentUserEmail.value,
      ),
    )
    .map((entry) => {
      const participant = call.participants.find((item) => item.email === entry.email) || {}
      return mergeCallMediaEntry(entry, participant, entry.stream)
    })
}

const stopLocalScreenStreamTracks = () => {
  const tracks = localCallScreenStream.value?.getTracks?.() || []
  for (const track of tracks) {
    track.onended = null
    track.stop()
  }
  localCallScreenStream.value = null
}

const stopLocalCallStream = () => {
  stopLocalScreenStreamTracks()
  const tracks = localCallStream.value?.getTracks?.() || []
  for (const track of tracks) {
    track.stop()
  }
  localCallStream.value = null
  localCallCameraEnabled.value = false
  if (localCallVideo.value) {
    localCallVideo.value.srcObject = null
  }
}

const closePeerConnection = (email) => {
  const connection = peerConnections.get(email)
  if (!connection) {
    return
  }
  connection.onicecandidate = null
  connection.ontrack = null
  connection.onconnectionstatechange = null
  connection.close()
  peerConnections.delete(email)
}

const resetCallSession = () => {
  for (const email of peerConnections.keys()) {
    closePeerConnection(email)
  }
  resetRemoteMedia()
  stopLocalCallStream()
  localCallMuted.value = false
  startingScreenShare.value = false
}

const ensureCallConfig = async () => {
  try {
    return await chatStore.loadCallConfig()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось загрузить конфиг звонков')
    throw error
  }
}

const ensureLocalCallStream = async ({ preferVideo = true } = {}) => {
  if (localCallStream.value) {
    return localCallStream.value
  }
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices?.getUserMedia ||
    (typeof window !== 'undefined' && window.isSecureContext === false)
  ) {
    throw new Error('Браузер не дал доступ к микрофону для звонка')
  }

  let stream = null
  try {
    stream = await navigator.mediaDevices.getUserMedia(
      buildCallMediaConstraints({ video: preferVideo }),
    )
  } catch (error) {
    if (!preferVideo) {
      throw error
    }

    stream = await navigator.mediaDevices.getUserMedia(buildCallMediaConstraints({ video: false }))
    notifications.info('Камера недоступна, подключили звонок только с аудио')
  }
  localCallStream.value = stream
  localCallMuted.value = false
  localCallCameraEnabled.value = streamHasActiveVideo(stream)
  attachLocalMedia()
  return stream
}

const localCallOutgoingTracks = () => [
  ...(localCallStream.value?.getAudioTracks?.() || []),
  ...(localCallScreenStream.value?.getVideoTracks?.() ||
    localCallStream.value?.getVideoTracks?.() ||
    []),
]

const localCallOutgoingStream = () => {
  const tracks = localCallOutgoingTracks()
  if (typeof MediaStream !== 'undefined') {
    return new MediaStream(tracks)
  }
  return localCallScreenStream.value || localCallStream.value
}

const shouldInitiateOffer = (call, remoteParticipant) => {
  const localParticipant = call?.participants?.find(
    (participant) => participant.email === currentUserEmail.value,
  )
  if (!localParticipant || !remoteParticipant?.email) {
    return false
  }

  const localJoinedAt = localParticipant.joinedAt || ''
  const remoteJoinedAt = remoteParticipant.joinedAt || ''
  if (localJoinedAt !== remoteJoinedAt) {
    return localJoinedAt > remoteJoinedAt
  }

  return currentUserEmail.value > remoteParticipant.email
}

const sendRtcSignal = (call, remoteParticipant, kind, payload) =>
  chatStore.sendCallSignal({
    callId: call?.id,
    conversationId: call?.conversationId,
    recipientEmail: remoteParticipant?.email,
    kind,
    payload,
  })

const broadcastLocalMediaState = (call) => {
  if (!call?.participants?.length) {
    return
  }

  for (const participant of call.participants) {
    if (!participant?.email || participant.email === currentUserEmail.value) {
      continue
    }

    sendRtcSignal(call, participant, 'media-state', {
      camera_enabled: localCallScreenSharing.value || localCallCameraEnabled.value,
      screen_sharing: localCallScreenSharing.value,
    })
  }
}

const ensurePeerConnection = async (call, remoteParticipant, createOffer = false) => {
  if (
    !call?.id ||
    !remoteParticipant?.email ||
    remoteParticipant.email === currentUserEmail.value
  ) {
    return null
  }

  let connection = peerConnections.get(remoteParticipant.email)
  if (!connection) {
    await ensureCallConfig()
    await ensureLocalCallStream()
    connection = new RTCPeerConnection({
      iceServers: chatStore.callConfig?.iceServers || [{ urls: ['stun:stun.l.google.com:19302'] }],
    })
    peerConnections.set(remoteParticipant.email, connection)

    const outgoingStream = localCallOutgoingStream()
    for (const track of localCallOutgoingTracks()) {
      connection.addTrack(track, outgoingStream)
    }

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        sendRtcSignal(call, remoteParticipant, 'ice-candidate', event.candidate.toJSON())
      }
    }
    connection.ontrack = (event) => {
      const [streamValue] = event.streams
      if (streamValue) {
        upsertRemoteMediaStream(remoteParticipant, streamValue)
      }
    }
    connection.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(connection.connectionState)) {
        closePeerConnection(remoteParticipant.email)
      }
    }
  }

  if (createOffer) {
    const offer = await connection.createOffer()
    await connection.setLocalDescription(offer)
    sendRtcSignal(call, remoteParticipant, 'offer', {
      type: offer.type,
      sdp: offer.sdp,
    })
  }

  return connection
}

const syncDisplayedCallPeers = async (call) => {
  if (!call || !isCurrentUserInDisplayedCall.value || !call.joinable) {
    return
  }

  const localParticipant = call.participants.find(
    (participant) => participant.email === currentUserEmail.value,
  )
  if (localParticipant) {
    localCallMuted.value = Boolean(localParticipant.muted)
    const tracks = localCallStream.value?.getAudioTracks?.() || []
    for (const track of tracks) {
      track.enabled = !localCallMuted.value
    }
  }

  syncRemoteMediaMeta(call)

  const remoteParticipants = call.participants.filter(
    (participant) => participant.email && participant.email !== currentUserEmail.value,
  )

  for (const participant of [...peerConnections.keys()]) {
    if (!remoteParticipants.some((item) => item.email === participant)) {
      closePeerConnection(participant)
    }
  }

  for (const participant of remoteParticipants) {
    if (peerConnections.has(participant.email)) {
      continue
    }
    if (shouldInitiateOffer(call, participant)) {
      await ensurePeerConnection(call, participant, true)
    }
  }
}

const handleIncomingCallSignal = async (envelope) => {
  const data = envelope?.data || {}
  const targetConversationId = data.conversation_id || data.conversationId || ''
  const activeCall = chatStore.activeCall
  const call =
    (activeCall?.id && activeCall.id === (data.call_id || data.callId) && activeCall) ||
    chatStore.activeCallsByConversation[targetConversationId] ||
    null

  if (!call || !activeCall || activeCall.id !== call.id) {
    return
  }

  const remoteParticipant = call.participants.find(
    (participant) => participant.email === data.sender_email,
  ) || {
    email: data.sender_email || '',
    login: data.sender_login || data.sender_email || '',
    muted: false,
  }

  const connection = await ensurePeerConnection(call, remoteParticipant, false)
  if (!connection) {
    return
  }

  if (data.kind === 'media-state') {
    updateRemoteMediaState(remoteParticipant.email, {
      cameraEnabled: Boolean(data.payload?.camera_enabled),
      screenSharing: Boolean(data.payload?.screen_sharing),
    })
    return
  }

  if (data.kind === 'offer') {
    await ensureLocalCallStream()
    await connection.setRemoteDescription(new RTCSessionDescription(data.payload))
    const answer = await connection.createAnswer()
    await connection.setLocalDescription(answer)
    sendRtcSignal(call, remoteParticipant, 'answer', {
      type: answer.type,
      sdp: answer.sdp,
    })
    return
  }

  if (data.kind === 'answer') {
    await connection.setRemoteDescription(new RTCSessionDescription(data.payload))
    return
  }

  if (data.kind === 'ice-candidate' && data.payload) {
    await connection.addIceCandidate(new RTCIceCandidate(data.payload))
  }
}

const handleCallEnvelope = async (envelope) => {
  if (!envelope?.event) {
    return
  }

  if (envelope.event === 'call_signal') {
    try {
      await handleIncomingCallSignal(envelope)
    } catch (error) {
      console.error('call signal handling failed', error)
      callActionError.value = error?.message || 'Не удалось обработать сигнал звонка'
    }
    return
  }

  if (['call_started', 'call_updated', 'call_ended'].includes(envelope.event)) {
    const call = chatStore.activeCall || chatStore.activeConversationCall
    const isCurrentUserInCall = Boolean(
      call?.participants?.some((participant) => participant.email === currentUserEmail.value),
    )
    if (!call?.joinable || !isCurrentUserInCall) {
      if (!chatStore.activeCall?.joinable) {
        resetCallSession()
        closeCallFocus()
      }
      return
    }

    try {
      await syncDisplayedCallPeers(call)
      broadcastLocalMediaState(call)
    } catch (error) {
      callActionError.value = error?.message || 'Не удалось синхронизировать звонок'
    }
  }
}

const startDisplayedCall = async () => {
  if (!activeConversation.value) {
    return
  }
  if (
    chatStore.activeCall?.id &&
    chatStore.activeCall.conversationId !== activeConversation.value.id
  ) {
    notifications.info('Сначала выйди из текущего звонка')
    return
  }

  startingCall.value = true
  callActionError.value = ''
  try {
    await ensureLocalCallStream()
    const call = await chatStore.startCall(activeConversation.value.id)
    await syncDisplayedCallPeers(call)
    broadcastLocalMediaState(call)
    openCallFocus(currentUserEmail.value)
  } catch (error) {
    callActionError.value = error?.message || 'Не удалось начать звонок'
    notifications.errorFrom(error, 'Не удалось начать звонок')
    resetCallSession()
  } finally {
    startingCall.value = false
  }
}

const joinDisplayedCall = async () => {
  if (!displayedCall.value?.id || !activeConversation.value) {
    return
  }
  if (chatStore.activeCall?.id && chatStore.activeCall.id !== displayedCall.value.id) {
    notifications.info('Сначала выйди из текущего звонка')
    return
  }

  joiningCall.value = true
  callActionError.value = ''
  try {
    await ensureLocalCallStream()
    const call = await chatStore.joinCall({
      conversationId: activeConversation.value.id,
      callId: displayedCall.value.id,
    })
    await syncDisplayedCallPeers(call)
    broadcastLocalMediaState(call)
    openCallFocus(currentUserEmail.value)
  } catch (error) {
    callActionError.value = error?.message || 'Не удалось подключиться к звонку'
    notifications.errorFrom(error, 'Не удалось подключиться к звонку')
    resetCallSession()
  } finally {
    joiningCall.value = false
  }
}

const leaveDisplayedCall = async () => {
  if (!displayedCall.value?.id || !activeConversation.value) {
    return
  }

  endingCall.value = true
  callActionError.value = ''
  try {
    await chatStore.leaveCall({
      conversationId: activeConversation.value.id,
      callId: displayedCall.value.id,
    })
  } catch (error) {
    callActionError.value = error?.message || 'Не удалось выйти из звонка'
    notifications.errorFrom(error, 'Не удалось выйти из звонка')
  } finally {
    endingCall.value = false
    resetCallSession()
  }
}

const toggleCallMute = async () => {
  if (!displayedCall.value?.id || !isCurrentUserInDisplayedCall.value) {
    return
  }

  localCallMuted.value = !localCallMuted.value
  const tracks = localCallStream.value?.getAudioTracks?.() || []
  for (const track of tracks) {
    track.enabled = !localCallMuted.value
  }

  try {
    await chatStore.setCallMuted({
      conversationId: displayedCall.value.conversationId,
      callId: displayedCall.value.id,
      muted: localCallMuted.value,
    })
  } catch (error) {
    localCallMuted.value = !localCallMuted.value
    for (const track of tracks) {
      track.enabled = !localCallMuted.value
    }
    notifications.errorFrom(error, 'Не удалось обновить состояние микрофона')
  }
}

const toggleCallCamera = async () => {
  if (!displayedCall.value?.id || !isCurrentUserInDisplayedCall.value || !localCallStream.value) {
    return
  }
  if (localCallScreenSharing.value) {
    notifications.info('Сначала останови демонстрацию экрана')
    return
  }

  const nextEnabled = !localCallCameraEnabled.value
  const changed = setStreamTracksEnabled(localCallStream.value, 'video', nextEnabled)
  if (!changed) {
    notifications.info('Камера недоступна в текущем звонке')
    return
  }

  localCallCameraEnabled.value = nextEnabled
  broadcastLocalMediaState(displayedCall.value)
}

const startCallScreenShare = async () => {
  if (!displayedCall.value?.id || !isCurrentUserInDisplayedCall.value) {
    return
  }
  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices?.getDisplayMedia ||
    (typeof window !== 'undefined' && window.isSecureContext === false)
  ) {
    throw new Error('Браузер не поддерживает демонстрацию экрана для этого сайта')
  }

  startingScreenShare.value = true
  let stream = null
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
      },
      audio: false,
    })
    const screenTrack = streamVideoTrack(stream)
    if (!screenTrack) {
      throw new Error('Не удалось получить видео экрана')
    }

    screenTrack.onended = () => {
      if (localCallScreenStream.value === stream) {
        void stopCallScreenShare()
      }
    }

    localCallScreenStream.value = stream
    const replaced = await replacePeerConnectionsVideoTrack(peerConnections, screenTrack)
    if (peerConnections.size > 0 && replaced === 0) {
      throw new Error('В этом звонке нет video-канала для демонстрации экрана')
    }
    attachLocalMedia()
    broadcastLocalMediaState(displayedCall.value)
    openCallFocus(currentUserEmail.value)
  } catch (error) {
    if (localCallScreenStream.value === stream) {
      localCallScreenStream.value = null
    }
    const tracks = stream?.getTracks?.() || []
    for (const track of tracks) {
      track.onended = null
      track.stop()
    }
    attachLocalMedia()
    throw error
  } finally {
    startingScreenShare.value = false
  }
}

const stopCallScreenShare = async () => {
  if (!localCallScreenStream.value) {
    return
  }

  stopLocalScreenStreamTracks()
  const cameraTrack = localCallCameraEnabled.value ? streamVideoTrack(localCallStream.value) : null
  await replacePeerConnectionsVideoTrack(peerConnections, cameraTrack)
  attachLocalMedia()
  broadcastLocalMediaState(displayedCall.value)
}

const toggleCallScreenShare = async () => {
  if (!displayedCall.value?.id || !isCurrentUserInDisplayedCall.value) {
    return
  }

  callActionError.value = ''
  try {
    if (localCallScreenSharing.value) {
      await stopCallScreenShare()
      return
    }
    await startCallScreenShare()
  } catch (error) {
    callActionError.value = error?.message || 'Не удалось запустить демонстрацию экрана'
    notifications.errorFrom(error, 'Не удалось запустить демонстрацию экрана')
  }
}

const handleCallAction = async () => {
  if (!displayedCall.value) {
    await startDisplayedCall()
    return
  }

  if (!displayedCall.value.joinable) {
    await startDisplayedCall()
    return
  }

  if (isCurrentUserInDisplayedCall.value) {
    notifications.info('Звонок уже идёт в этом чате')
    return
  }

  await joinDisplayedCall()
}

const joinCallFromMessage = async (message) => {
  if (!message?.call?.id || !message.call.joinable || !activeConversation.value) {
    return
  }
  if (displayedCall.value?.id !== message.call.id) {
    await chatStore.loadConversationCall(activeConversation.value.id)
  }
  await joinDisplayedCall()
}

const callMessageButtonLabel = (message) => {
  if (!message?.call?.joinable) {
    return 'Звонок завершён'
  }
  if (displayedCall.value?.id === message.call.id && isCurrentUserInDisplayedCall.value) {
    return 'Вы в звонке'
  }
  if (chatStore.activeCall?.id && chatStore.activeCall.id !== message.call.id) {
    return 'Уже в другом звонке'
  }
  return 'Подключиться'
}

const callMessageMeta = (message) => {
  const count = Number(message?.call?.participantCount || 0)
  if (!message?.call?.joinable) {
    return 'Звонок уже завершён'
  }
  return count > 0 ? `${count} в звонке` : 'Можно подключиться'
}

const insertEmoji = (emoji) => {
  const textarea = composerTextarea.value
  const selectionStart = textarea?.selectionStart ?? composerText.value.length
  const selectionEnd = textarea?.selectionEnd ?? selectionStart
  const next = insertEmojiIntoText(composerText.value, emoji, selectionStart, selectionEnd)

  composerText.value = next.text
  closeEmojiPicker()
  focusComposer(next.cursor)
}

const handleDocumentPointerDown = (event) => {
  if (!emojiPickerOpen.value || emojiPickerRoot.value?.contains(event.target)) {
    return
  }

  closeEmojiPicker()
}

const requestMicrophoneFromHelp = () => {
  microphoneHelpOpen.value = false
  startAudioRecording()
}

const audioMessageButtonLabel = (message) =>
  getAudioMessageButtonLabel(message, playingAudioMessageId.value, message?.id)

const audioMessageUnavailable = (message) =>
  audioMessageButtonLabel(message) === 'Недоступно' || playingAudioMessageId.value === message?.id

const imageMessageButtonLabel = (message) =>
  getImageMessageButtonLabel(message, viewingImageMessageId.value, message?.id)

const imageMessageUnavailable = (message) =>
  imageMessageButtonLabel(message) === 'Недоступно' || viewingImageMessageId.value === message?.id

const fileMessageButtonLabel = (message) =>
  getFileMessageButtonLabel(message, downloadingFileMessageId.value, message?.id)

const fileMessageUnavailable = (message) =>
  fileMessageButtonLabel(message) === 'Недоступно' || downloadingFileMessageId.value === message?.id

const messageMentions = (message) =>
  extractChatMentions(message?.text || '', activeConversation.value?.members || [])

const insertMention = (member) => {
  const login = String(member?.login || '').trim()
  if (!login) {
    return
  }

  const mention = `@${login} `
  const textarea = composerTextarea.value
  const selectionStart = textarea?.selectionStart ?? composerText.value.length
  const selectionEnd = textarea?.selectionEnd ?? selectionStart
  const next = insertEmojiIntoText(composerText.value, mention, selectionStart, selectionEnd)
  composerText.value = next.text
  focusComposer(next.cursor)
}

const markActiveConversationRead = () => {
  const lastPeerMessage = [...activeMessages.value]
    .reverse()
    .find((message) => message?.id && message.senderEmail !== currentUserEmail.value)
  if (!lastPeerMessage) {
    return
  }
  chatStore.markRead({
    conversationId: activeConversation.value?.id,
    messageId: lastPeerMessage.id,
  })
}

const clearRecordingTimer = () => {
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }
}

const stopRecordingTracks = () => {
  if (!recordingStream.value) {
    return
  }

  for (const track of recordingStream.value.getTracks()) {
    track.stop()
  }
  recordingStream.value = null
}

const discardRecordedAudio = () => {
  if (recordedAudioUrl.value) {
    URL.revokeObjectURL(recordedAudioUrl.value)
  }
  recordedAudioBlob.value = null
  recordedAudioUrl.value = ''
  recordedAudioDuration.value = 0
  recordingError.value = ''
}

const discardSelectedImage = () => {
  if (selectedImageUrl.value) {
    URL.revokeObjectURL(selectedImageUrl.value)
  }
  selectedImageBlob.value = null
  selectedImageUrl.value = ''
  selectedImageName.value = ''
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

const discardSelectedFile = () => {
  selectedFileBlob.value = null
  selectedFileName.value = ''
  selectedFileSize.value = 0
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const stopAudioRecording = () => {
  clearRecordingTimer()
  isRecordingAudio.value = false

  const recorder = mediaRecorder.value
  if (recorder && recorder.state !== 'inactive') {
    recorder.stop()
  } else {
    stopRecordingTracks()
  }
}

const toggleAudioRecording = () => {
  if (isRecordingAudio.value) {
    stopAudioRecording()
    return
  }

  startAudioRecording()
}

const triggerImagePicker = () => {
  imageInput.value?.click()
}

const triggerFilePicker = () => {
  fileInput.value?.click()
}

const applySelectedImageFile = (file) => {
  if (!file) {
    return false
  }

  if (!String(file.type || '').startsWith('image/')) {
    notifications.error('Можно прикреплять только изображения')
    return false
  }

  discardSelectedImage()
  selectedImageBlob.value = file
  selectedImageName.value = file.name || 'image.png'
  selectedImageUrl.value = URL.createObjectURL(file)
  return true
}

const resetComposerDropState = () => {
  composerDragDepth.value = 0
  composerDropActive.value = false
}

const handleImageSelected = (event) => {
  const file = event?.target?.files?.[0]
  applySelectedImageFile(file)
}

const handleFileSelected = (event) => {
  const file = event?.target?.files?.[0]
  if (!file) {
    return
  }

  selectedFileBlob.value = file
  selectedFileName.value = file.name || 'file'
  selectedFileSize.value = file.size || 0
}

const handleComposerDragEnter = (event) => {
  if (!activeConversation.value || !getDroppedImageFile(event?.dataTransfer)) {
    return
  }

  event.preventDefault()
  composerDragDepth.value += 1
  composerDropActive.value = true
}

const handleComposerDragOver = (event) => {
  if (!activeConversation.value || !getDroppedImageFile(event?.dataTransfer)) {
    return
  }

  event.preventDefault()
  composerDropActive.value = true
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const handleComposerDragLeave = (event) => {
  if (!composerDropActive.value) {
    return
  }

  event.preventDefault()
  composerDragDepth.value = Math.max(0, composerDragDepth.value - 1)
  if (!composerDragDepth.value) {
    composerDropActive.value = false
  }
}

const handleComposerDrop = (event) => {
  const imageFile = getDroppedImageFile(event?.dataTransfer)
  const droppedFilesCount = Array.from(event?.dataTransfer?.files || []).length
  event.preventDefault()
  resetComposerDropState()

  if (!activeConversation.value) {
    return
  }

  if (!imageFile) {
    if (droppedFilesCount) {
      notifications.error('Можно прикреплять только изображения')
    }
    return
  }

  applySelectedImageFile(imageFile)
}

const startAudioRecording = async () => {
  recordingError.value = ''
  discardRecordedAudio()

  const hasMediaDevices =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined'
  const isSecureContext = typeof window === 'undefined' || window.isSecureContext !== false
  if (!hasMediaDevices || !isSecureContext) {
    recordingError.value = getChatMicrophoneErrorMessage(null, {
      isSecureContext,
      hasMediaDevices,
    })
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const chunks = []
    const options = MediaRecorder.isTypeSupported?.('audio/webm;codecs=opus')
      ? { mimeType: 'audio/webm;codecs=opus' }
      : undefined
    const recorder = new MediaRecorder(stream, options)

    recordingStream.value = stream
    mediaRecorder.value = recorder
    recordingSeconds.value = 0
    isRecordingAudio.value = true

    recorder.addEventListener('dataavailable', (event) => {
      if (event.data?.size) {
        chunks.push(event.data)
      }
    })

    recorder.addEventListener('stop', () => {
      clearRecordingTimer()
      stopRecordingTracks()
      isRecordingAudio.value = false
      recordedAudioDuration.value = Math.max(1, recordingSeconds.value)

      if (!chunks.length) {
        recordingError.value = 'Не получилось записать аудио.'
        return
      }

      const type = recorder.mimeType || 'audio/webm'
      recordedAudioBlob.value = new Blob(chunks, { type })
      recordedAudioUrl.value = URL.createObjectURL(recordedAudioBlob.value)
    })

    recorder.start()
    recordingTimer.value = setInterval(() => {
      recordingSeconds.value += 1
      if (recordingSeconds.value >= chatAudioMaxSeconds) {
        stopAudioRecording()
      }
    }, 1000)
  } catch (error) {
    isRecordingAudio.value = false
    stopRecordingTracks()
    clearRecordingTimer()
    recordingError.value = getChatMicrophoneErrorMessage(error, {
      isSecureContext,
      hasMediaDevices,
    })
  }
}

const sendCurrentAudio = async () => {
  if (!activeConversation.value || !recordedAudioBlob.value) {
    return
  }

  sendingAudio.value = true
  try {
    await chatStore.sendAudioMessage({
      conversationId: activeConversation.value.id,
      audioBlob: recordedAudioBlob.value,
      durationSeconds: recordedAudioDuration.value,
      announceOnAlice: shouldAutoAnnounceOnAlice.value,
    })
    discardRecordedAudio()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось отправить аудио')
  } finally {
    sendingAudio.value = false
  }
}

const sendCurrentImage = async () => {
  if (!activeConversation.value || !selectedImageBlob.value) {
    return
  }

  sendingImage.value = true
  try {
    await chatStore.sendImageMessage({
      conversationId: activeConversation.value.id,
      imageBlob: selectedImageBlob.value,
      filename: selectedImageName.value || 'image.png',
    })
    discardSelectedImage()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось отправить изображение')
  } finally {
    sendingImage.value = false
  }
}

const sendCurrentFile = async () => {
  if (!activeConversation.value || !selectedFileBlob.value) {
    return
  }

  sendingFile.value = true
  try {
    await chatStore.sendFileMessage({
      conversationId: activeConversation.value.id,
      fileBlob: selectedFileBlob.value,
      filename: selectedFileName.value || 'file',
    })
    discardSelectedFile()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось отправить файл')
  } finally {
    sendingFile.value = false
  }
}

const playAudioMessage = async (message) => {
  if (!activeConversation.value || !message?.id || message.audio?.consumed) {
    return
  }

  playingAudioMessageId.value = message.id
  try {
    const blob = await chatStore.consumeAudioMessage({
      conversationId: activeConversation.value.id,
      messageId: message.id,
    })

    closeAudioPlayer()
    audioPlayerUrl.value = URL.createObjectURL(blob)
    audioPlayerTitle.value = `${getChatMessageSenderLabel(message, currentUserEmail.value)} · ${formatAudioDuration(message.audio?.durationSeconds)}`
    audioPlayerOpen.value = true

    await nextTick()
    const player = audioPlayerElement.value
    if (player) {
      player.currentTime = 0
      const playback = player.play()
      if (playback && typeof playback.catch === 'function') {
        playback.catch(() => {})
      }
    }
  } catch (error) {
    closeAudioPlayer()
    notifications.errorFrom(error, 'Не удалось воспроизвести аудио')
  } finally {
    playingAudioMessageId.value = ''
  }
}

const closeImageViewer = () => {
  if (imageViewerUrl.value) {
    URL.revokeObjectURL(imageViewerUrl.value)
  }
  imageViewerUrl.value = ''
  imageViewerOpen.value = false
}

const closeAudioPlayer = () => {
  if (audioPlayerElement.value) {
    audioPlayerElement.value.pause()
    audioPlayerElement.value.removeAttribute('src')
    audioPlayerElement.value.load()
  }
  if (audioPlayerUrl.value) {
    URL.revokeObjectURL(audioPlayerUrl.value)
  }
  audioPlayerUrl.value = ''
  audioPlayerTitle.value = ''
  audioPlayerOpen.value = false
}

const openImageMessage = async (message) => {
  if (!activeConversation.value || !message?.id || message.image?.consumed) {
    return
  }

  viewingImageMessageId.value = message.id
  try {
    const blob = await chatStore.consumeImageMessage({
      conversationId: activeConversation.value.id,
      messageId: message.id,
    })
    imageViewerUrl.value = URL.createObjectURL(blob)
    imageViewerOpen.value = true
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось открыть изображение')
  } finally {
    viewingImageMessageId.value = ''
  }
}

const downloadFileMessage = async (message) => {
  if (!activeConversation.value || !message?.id || message.file?.consumed) {
    return
  }

  downloadingFileMessageId.value = message.id
  try {
    const blob = await chatStore.consumeFileMessage({
      conversationId: activeConversation.value.id,
      messageId: message.id,
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = message.file?.filename || 'file'
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось скачать файл')
  } finally {
    downloadingFileMessageId.value = ''
  }
}

const announceMessageOnAlice = async (message) => {
  if (
    !activeConversation.value?.id ||
    !message?.id ||
    aliceAnnouncementPendingMessageId.value === message.id
  ) {
    return
  }

  aliceAnnouncementPendingMessageId.value = message.id
  aliceAnnouncementErrorMessageId.value = ''

  try {
    await chatStore.announceOnAlice({
      conversationId: activeConversation.value.id,
      messageId: message.id,
    })
  } catch {
    aliceAnnouncementErrorMessageId.value = message.id
  } finally {
    aliceAnnouncementPendingMessageId.value = ''
  }
}

const formatFileSize = (value) => {
  const size = Math.max(0, Number(value) || 0)
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }
  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`
  }
  return `${size} B`
}

const scrollMessagesToBottom = async () => {
  await nextTick()
  const scroller = messagesScroller.value
  if (!scroller) {
    return
  }

  scroller.scrollTop = scroller.scrollHeight
}

const isMessagesScrollerNearBottom = (threshold = 96) => {
  const scroller = messagesScroller.value
  if (!scroller) {
    return true
  }

  return scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= threshold
}

const hasFocusedChatViewport = () => {
  if (typeof document === 'undefined') {
    return true
  }

  return document.visibilityState !== 'hidden' && document.hasFocus()
}

const clearProgrammaticUnreadScrollGuard = () => {
  if (programmaticUnreadScrollGuardTimer) {
    clearTimeout(programmaticUnreadScrollGuardTimer)
    programmaticUnreadScrollGuardTimer = null
  }
  programmaticUnreadScrollActive = false
}

const startProgrammaticUnreadScrollGuard = (durationMs = 1200) => {
  clearProgrammaticUnreadScrollGuard()
  programmaticUnreadScrollActive = true
  programmaticUnreadScrollGuardTimer = setTimeout(() => {
    programmaticUnreadScrollGuardTimer = null
    programmaticUnreadScrollActive = false
  }, durationMs)
}

const applyUnreadScrollAction = async (action = 'none') => {
  if (action === 'first-unread' && activeFirstUnreadMessageId.value) {
    startProgrammaticUnreadScrollGuard()
    await scrollToMessage(activeFirstUnreadMessageId.value, { behavior: 'auto' })
    return
  }

  if (action === 'bottom') {
    await scrollMessagesToBottom()
  }

  if (shouldMarkReadAfterUnreadScrollAction(action)) {
    markVisibleFirstUnreadRead()
  }
}

const isMessageElementVisible = (messageId) => {
  const scroller = messagesScroller.value
  const element = messageElements.get(messageId)
  if (!scroller || !element) {
    return false
  }

  const scrollerRect = scroller.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()
  return elementRect.bottom >= scrollerRect.top && elementRect.top <= scrollerRect.bottom
}

const markVisibleFirstUnreadRead = () => {
  const messageId = activeFirstUnreadMessageId.value
  const firstUnreadVisible = Boolean(messageId) && isMessageElementVisible(messageId)
  if (
    !shouldHandleUnreadScrollRead({
      firstUnreadVisible,
      programmaticUnreadScrollActive,
    })
  ) {
    return false
  }

  return chatStore.markRead({
    conversationId: chatStore.activeConversationId,
    messageId,
  })
}

const handleMessagesScroll = () => {
  markVisibleFirstUnreadRead()
}

const applyComposerDraft = async (conversationId = chatStore.activeConversationId) => {
  suppressDraftAutosave = true
  composerText.value = conversationId ? chatStore.draftTextByConversation[conversationId] || '' : ''
  await nextTick()
  suppressDraftAutosave = false
}

const selectConversation = async (conversationId) => {
  try {
    await chatStore.setActiveConversation(conversationId)
    await applyComposerDraft(conversationId)
    openConversationScreen()
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
    await applyComposerDraft(conversation.id)
    chatSearch.value = ''
    openConversationScreen()
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

const openGroupSettings = () => {
  if (!activeConversation.value || activeConversation.value.type !== 'group') {
    return
  }

  groupSettingsForm.value = {
    title: activeConversation.value.title || '',
    memberEmails: [],
  }
  groupSettingsOpen.value = true
}

const closeGroupSettings = () => {
  groupSettingsOpen.value = false
  groupSettingsForm.value = { title: '', memberEmails: [] }
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
    await applyComposerDraft(conversation.id)
    openConversationScreen()
    notifications.success('Группа создана')
  } catch {
    // notifications already handled in the store
  } finally {
    creatingGroup.value = false
  }
}

const deleteActiveGroup = async () => {
  if (!activeConversation.value || activeConversation.value.type !== 'group') {
    return
  }

  const confirmed =
    typeof window === 'undefined' ||
    window.confirm(`Удалить группу «${activeConversation.value.title}»?`)
  if (!confirmed) {
    return
  }

  deletingGroup.value = true
  try {
    await chatStore.deleteGroupConversation(activeConversation.value.id)
    closeGroupSettings()
    notifications.success('Группа удалена')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось удалить группу')
  } finally {
    deletingGroup.value = false
  }
}

const saveGroupTitle = async () => {
  if (!activeConversation.value || !groupSettingsForm.value.title.trim()) {
    return
  }

  savingGroupSettings.value = true
  try {
    await chatStore.renameGroupConversation({
      conversationId: activeConversation.value.id,
      title: groupSettingsForm.value.title.trim(),
    })
    notifications.success('Название группы обновлено')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось обновить группу')
  } finally {
    savingGroupSettings.value = false
  }
}

const addSelectedGroupMembers = async () => {
  if (!activeConversation.value || groupSettingsForm.value.memberEmails.length === 0) {
    return
  }

  savingGroupSettings.value = true
  try {
    await chatStore.addGroupMembers({
      conversationId: activeConversation.value.id,
      memberEmails: groupSettingsForm.value.memberEmails,
    })
    groupSettingsForm.value.memberEmails = []
    notifications.success('Участники добавлены')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось добавить участников')
  } finally {
    savingGroupSettings.value = false
  }
}

const removeGroupMember = async (member) => {
  if (!activeConversation.value || !member?.email) {
    return
  }

  savingGroupSettings.value = true
  try {
    await chatStore.removeGroupMembers({
      conversationId: activeConversation.value.id,
      memberEmails: [member.email],
    })
    notifications.success(
      member.email === currentUserEmail.value ? 'Вы вышли из группы' : 'Участник удалён',
    )
    if (member.email === currentUserEmail.value) {
      closeGroupSettings()
    }
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось обновить участников')
  } finally {
    savingGroupSettings.value = false
  }
}

const updateGroupMemberRole = async (member, role) => {
  if (!activeConversation.value || !member?.email || !role || role === member.role) {
    return
  }

  savingGroupSettings.value = true
  try {
    await chatStore.updateGroupMemberRole({
      conversationId: activeConversation.value.id,
      memberEmail: member.email,
      role,
    })
    notifications.success('Роль участника обновлена')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось обновить роль')
  } finally {
    savingGroupSettings.value = false
  }
}

const favoriteSelectedMessages = async () => {
  if (!activeConversation.value || selectedMessages.value.length === 0) {
    return
  }

  try {
    await Promise.all(
      selectedMessages.value.map((message) =>
        message.favorite
          ? chatStore.unfavoriteMessage({
              conversationId: activeConversation.value.id,
              messageId: message.id,
            })
          : chatStore.favoriteMessage({
              conversationId: activeConversation.value.id,
              messageId: message.id,
            }),
      ),
    )
    notifications.success('Избранное обновлено')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось обновить избранное')
  }
}

const deleteSelectedMessages = async () => {
  if (!activeConversation.value || !selectedMessageActionState.value.canDelete) {
    return
  }

  try {
    for (const message of selectedMessages.value) {
      await chatStore.deleteMessage({
        conversationId: activeConversation.value.id,
        messageId: message.id,
      })
    }
    clearSelectedMessages()
    notifications.success('Сообщения удалены')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось удалить сообщения')
  }
}

const forwardSelectedMessages = async (targetConversationId) => {
  if (!activeConversation.value || !targetConversationId || selectedMessageIds.value.length === 0) {
    return
  }
  const messageIds = selectedMessages.value.map((message) => message.id)
  if (messageIds.length === 0) {
    clearSelectedMessages()
    return
  }

  forwardingMessages.value = true
  try {
    await chatStore.forwardMessages({
      sourceConversationId: activeConversation.value.id,
      targetConversationId,
      messageIds,
    })
    clearSelectedMessages()
    notifications.success('Сообщения пересланы')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось переслать сообщения')
  } finally {
    forwardingMessages.value = false
  }
}

const clearTypingStopTimer = () => {
  if (typingStopTimer) {
    clearTimeout(typingStopTimer)
    typingStopTimer = null
  }
}

const stopComposerTyping = () => {
  clearTypingStopTimer()
  if (!typingActiveConversationId) {
    return
  }
  chatStore.sendTypingStopped(typingActiveConversationId)
  typingActiveConversationId = ''
  typingStartedSentAt = 0
}

const scheduleComposerTypingStop = () => {
  clearTypingStopTimer()
  typingStopTimer = setTimeout(() => {
    stopComposerTyping()
  }, 1800)
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
      replyToMessageId: replyingToMessageId.value,
      announceOnAlice: shouldAutoAnnounceOnAlice.value,
    }

    if (activeConversation.value.type === 'direct') {
      const peer = activeConversation.value.members.find(
        (member) => member.email !== currentUserEmail.value,
      )
      payload.recipientEmail = peer?.email || ''
    }

    const success = chatStore.sendMessage(payload)
    if (!success) {
      throw new Error('Не удалось отправить сообщение')
    }

    stopComposerTyping()
    suppressDraftAutosave = true
    composerText.value = ''
    await nextTick()
    suppressDraftAutosave = false
    clearReplyState()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось отправить сообщение')
  } finally {
    sendingMessage.value = false
  }
}

const handleComposerKeydown = (event) => {
  if (!isChatSendShortcut(event)) {
    return
  }

  event.preventDefault()
  if (sendingMessage.value || !composerText.value.trim() || !activeConversation.value) {
    return
  }

  sendCurrentMessage()
}

onMounted(async () => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  unsubscribeSocketEnvelope = chatStore.addSocketEnvelopeListener((envelope) => {
    handleCallEnvelope(envelope)
  })
  updateMobileLayout()
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    mobileMediaQuery = window.matchMedia('(max-width: 639px)')
    if (typeof mobileMediaQuery.addEventListener === 'function') {
      mobileMediaQuery.addEventListener('change', updateMobileLayout)
    } else if (typeof mobileMediaQuery.addListener === 'function') {
      mobileMediaQuery.addListener(updateMobileLayout)
    }
    window.addEventListener('resize', updateMobileLayout)
  }
  try {
    await chatStore.loadInitialState()
    chatStore
      .loadReminders()
      .then(checkDueReminders)
      .catch(() => {})
    reminderDueTimer = setInterval(checkDueReminders, 30000)
    if (!isMobileLayout.value && !chatStore.activeConversationId && chatStore.conversations[0]) {
      await selectConversation(chatStore.conversations[0].id)
    } else if (chatStore.activeConversationId) {
      await chatStore.setActiveConversation(chatStore.activeConversationId)
      await applyComposerDraft(chatStore.activeConversationId)
      if (!isMobileLayout.value) {
        mobileView.value = 'conversation'
      } else {
        mobileView.value = 'list'
      }
    }
  } catch {
    // notifications already handled in store
  }
})

watch(groupModalOpen, (isOpen) => {
  if (!isOpen) {
    groupForm.value = { title: '', memberEmails: [] }
  }
})

watch(searchQuery, (value) => {
  if (searchTimer.value) {
    clearTimeout(searchTimer.value)
    searchTimer.value = null
  }

  if (!searchOpen.value && chatCenterMode.value !== 'search') {
    return
  }

  const query = String(value || '').trim()
  if (!query) {
    chatStore.searchMessages('')
    return
  }

  searchTimer.value = setTimeout(() => {
    chatStore.searchMessages(query).catch(() => {
      // notifications already handled in store
    })
  }, 180)
})

watch(
  () => chatStore.activeConversationId,
  (conversationId) => {
    if (conversationId) {
      pendingInitialUnreadScrollConversationId = conversationId
    } else {
      pendingInitialUnreadScrollConversationId = ''
      preferBottomForPendingInitialScroll = false
    }
    stopComposerTyping()
    cancelEditing()
    clearReplyState()
    clearSelectedMessages()
    reactionPickerMessageId.value = ''
    reminderPickerMessageId.value = ''
    messageFilterMode.value = 'all'
    void applyComposerDraft(conversationId)
    if (isMobileLayout.value && !chatStore.activeConversationId) {
      mobileView.value = 'list'
    }
  },
)

watch(
  () => composerText.value,
  (value) => {
    const conversationId = activeConversation.value?.id || ''
    if (!suppressDraftAutosave && conversationId) {
      chatStore.queueDraftSave(conversationId, value)
    }
    if (!conversationId || !String(value || '').trim()) {
      stopComposerTyping()
      return
    }

    if (typingActiveConversationId !== conversationId) {
      stopComposerTyping()
      if (chatStore.sendTypingStarted(conversationId)) {
        typingActiveConversationId = conversationId
        typingStartedSentAt = Date.now()
      }
    } else if (shouldRefreshChatTyping(typingStartedSentAt)) {
      if (chatStore.sendTypingStarted(conversationId)) {
        typingStartedSentAt = Date.now()
      }
    }
    scheduleComposerTypingStop()
  },
)

watch(
  () => activeMessages.value.map((message) => message.id).join('|'),
  () => {
    if (
      replyingToMessageId.value &&
      !activeMessages.value.some((message) => message.id === replyingToMessageId.value)
    ) {
      clearReplyState()
    }

    if (
      editingMessageId.value &&
      !activeMessages.value.some((message) => message.id === editingMessageId.value)
    ) {
      cancelEditing()
    }
  },
)

watch(
  () => [chatStore.activeConversationId, activeMessages.value.length, activeMessagesLoaded.value],
  async (
    [conversationId, messageCount, messagesLoaded],
    [previousConversationId, previousMessageCount] = [],
  ) => {
    const conversationChanged = Boolean(conversationId && conversationId !== previousConversationId)
    if (conversationChanged) {
      pendingInitialUnreadScrollConversationId = conversationId
      preferBottomForPendingInitialScroll = previousConversationId == null
    }
    const isInitialScroll =
      Boolean(conversationId) && pendingInitialUnreadScrollConversationId === conversationId
    const messageCountChanged =
      Boolean(conversationId) &&
      !conversationChanged &&
      Number(messageCount || 0) !== Number(previousMessageCount || 0)
    const wasNearBottom = isMessagesScrollerNearBottom()
    await nextTick()
    const action = getChatUnreadScrollAction({
      conversationChanged: isInitialScroll,
      messageCountChanged,
      hasFirstUnread: Boolean(activeFirstUnreadMessageId.value),
      messagesLoaded: Boolean(messagesLoaded),
      wasNearBottom,
      hasFocusedViewport: hasFocusedChatViewport(),
      preferBottomOnInitialOpen: preferBottomForPendingInitialScroll,
    })
    if (action !== 'none' && action !== 'defer') {
      pendingInitialUnreadScrollConversationId = ''
      preferBottomForPendingInitialScroll = false
    }
    await applyUnreadScrollAction(action)
  },
)

watch(
  () => mobileConversationMode.value,
  (isConversationMode) => {
    if (!isConversationMode || !chatStore.activeConversationId) {
      return
    }

    void applyUnreadScrollAction(
      getChatUnreadScrollAction({
        conversationChanged: true,
        hasFirstUnread: Boolean(activeFirstUnreadMessageId.value),
        wasNearBottom: true,
        hasFocusedViewport: hasFocusedChatViewport(),
      }),
    )
  },
  { flush: 'post' },
)

watch(
  () => displayedCall.value,
  async (call) => {
    callActionError.value = ''
    if (!call?.joinable || !isCurrentUserInDisplayedCall.value) {
      if (!call?.joinable) {
        resetCallSession()
        closeCallFocus()
      }
      return
    }

    try {
      await syncDisplayedCallPeers(call)
    } catch (error) {
      callActionError.value = error?.message || 'Не удалось подготовить звонок'
    }
  },
  { deep: true },
)

watch(
  () => [localCallStream.value, localCallScreenStream.value],
  () => {
    attachLocalMedia()
  },
)

watch(
  () =>
    [
      displayedCall.value?.id || '',
      displayedCallMediaTiles.value.map((tile) => tile.email).join('|'),
    ].join('::'),
  () => {
    if (!displayedCall.value?.joinable || !displayedCallMediaTiles.value.length) {
      closeCallFocus()
      return
    }

    const focusedTileStillExists = displayedCallMediaTiles.value.some(
      (tile) => tile.email === focusedCallParticipantEmail.value,
    )
    if (!focusedTileStillExists) {
      focusedCallParticipantEmail.value =
        getCallFocusTile(displayedCallMediaTiles.value)?.email || ''
    }
  },
  { flush: 'post' },
)

watch(
  () =>
    [shouldAutoOpenCallFocus.value, isMobileLayout.value, mobileConversationMode.value].join('::'),
  () => {
    if (!shouldAutoOpenCallFocus.value) {
      return
    }

    if (isMobileLayout.value || !callFocusMode.value) {
      openCallFocus(currentUserEmail.value)
    }
  },
  { flush: 'post' },
)

onUnmounted(() => {
  stopComposerTyping()
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateMobileLayout)
  }
  if (mobileMediaQuery) {
    if (typeof mobileMediaQuery.removeEventListener === 'function') {
      mobileMediaQuery.removeEventListener('change', updateMobileLayout)
    } else if (typeof mobileMediaQuery.removeListener === 'function') {
      mobileMediaQuery.removeListener(updateMobileLayout)
    }
    mobileMediaQuery = null
  }
  resetComposerDropState()
  resetSwipeReply()
  clearRecordingTimer()
  if (searchTimer.value) {
    clearTimeout(searchTimer.value)
    searchTimer.value = null
  }
  if (reminderDueTimer) {
    clearInterval(reminderDueTimer)
    reminderDueTimer = null
  }
  if (highlightTimerId) {
    clearTimeout(highlightTimerId)
    highlightTimerId = null
  }
  clearProgrammaticUnreadScrollGuard()
  stopRecordingTracks()
  discardRecordedAudio()
  discardSelectedImage()
  discardSelectedFile()
  closeImageViewer()
  closeAudioPlayer()
  if (unsubscribeSocketEnvelope) {
    unsubscribeSocketEnvelope()
    unsubscribeSocketEnvelope = null
  }
  resetCallSession()
  chatStore.disconnect()
})
</script>
