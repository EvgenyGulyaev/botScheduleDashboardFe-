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
          :title="soundLabel"
          :aria-label="soundLabel"
          @click="toggleSoundNotifications"
        >
          {{ chatStore.soundEnabled ? '🔔' : '🔕' }}
        </button>
      </div>

      <div v-if="!mobileConversationMode" class="mb-5 space-y-3 xl:mb-3 xl:space-y-2">
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

        <main
          v-if="!isMobileLayout || mobileView === 'conversation'"
          :class="
            mobileConversationMode
              ? 'min-h-0 flex-1 overflow-hidden'
              : 'min-h-[30rem] xl:min-h-0'
          "
        >
          <section
            :class="
              mobileConversationMode
                ? 'flex h-full min-h-0 flex-col overflow-hidden bg-white'
                : 'flex h-[calc(100vh-12rem)] min-h-[30rem] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:h-full xl:min-h-0'
            "
          >
            <div
              :class="
                mobileConversationMode
                  ? 'border-b border-slate-200 px-3 py-3'
                  : 'border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5 xl:px-5 xl:py-4'
              "
            >
              <div :class="mobileConversationMode ? 'space-y-2' : 'flex flex-col gap-3'">
                <div
                  v-if="mobileConversationMode"
                  class="flex items-center gap-2"
                >
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
                      class="inline-flex items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-200 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="deletingGroup"
                      @click="deleteActiveGroup"
                    >
                      {{ deletingGroup ? 'Удаляем…' : 'Удалить группу' }}
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
              v-if="displayedCall"
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
                      <span class="inline-flex h-2.5 w-2.5 rounded-full" :class="displayedCall.joinable ? 'bg-emerald-500' : 'bg-slate-300'"></span>
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
                  :class="
                    mobileConversationMode
                      ? 'mt-3 grid gap-2'
                      : 'mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3'
                  "
                >
                  <div
                    v-for="participant in displayedCall.participants"
                    :key="`${displayedCall.id}-${participant.email}`"
                    class="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <div class="truncate text-sm font-semibold text-slate-950">
                          {{ participant.login || participant.email }}
                        </div>
                        <div class="mt-1 text-xs text-slate-500">
                          {{ participant.email === currentUserEmail ? 'Вы в звонке' : 'Участник звонка' }}
                        </div>
                      </div>
                      <span class="text-base">
                        {{ participant.muted ? '🔇' : '🎤' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  v-if="callActionError"
                  class="mt-3 rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {{ callActionError }}
                </div>
              </div>

              <audio
                v-if="localCallStream"
                ref="localCallAudio"
                class="hidden"
                autoplay
                muted
                playsinline
              ></audio>
              <audio
                v-for="remote in remoteCallAudios"
                :key="`${displayedCall.id}-${remote.email}`"
                :ref="setRemoteAudioElement(remote.email)"
                class="hidden"
                autoplay
                playsinline
              ></audio>
            </div>

            <div class="flex min-h-0 flex-1 flex-col">
              <div
                ref="messagesScroller"
                :class="
                  mobileConversationMode
                    ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-3'
                    : 'min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-5 xl:px-5 xl:py-4'
                "
              >
                <div
                  v-if="
                    activeConversation && activeMessages.length === 0 && !chatStore.loading.messages
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

                <div :class="mobileConversationMode ? 'space-y-2.5' : 'space-y-3'">
                  <article
                    v-for="message in activeMessages"
                    :key="message.id"
                    class="flex"
                    :class="
                      message.senderEmail === currentUserEmail ? 'justify-end' : 'justify-start'
                    "
                  >
                    <div
                      :ref="setMessageElement(message.id)"
                      class="relative min-w-0 max-w-[88vw] rounded-3xl border px-3 py-2.5 transition sm:max-w-[82%] sm:px-4 sm:py-3"
                      :class="
                        [
                          message.senderEmail === currentUserEmail
                            ? 'border-emerald-100 bg-emerald-50/80'
                            : 'border-slate-200 bg-slate-50',
                          chatStore.highlightedMessageId === message.id
                            ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-white'
                            : '',
                        ]
                      "
                      :style="{
                        transform: swipeOffsetForMessage(message.id)
                          ? `translateX(${swipeOffsetForMessage(message.id)}px)`
                          : '',
                      }"
                      @touchstart="startSwipeReplyGesture(message, $event)"
                      @touchmove="moveSwipeReplyGesture(message, $event)"
                      @touchend="endSwipeReplyGesture(message, $event)"
                      @touchcancel="resetSwipeReply"
                    >
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
                            class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-sm transition hover:bg-slate-100"
                            :aria-label="isPinnedMessage(message) ? 'Открепить сообщение' : 'Закрепить сообщение'"
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
                        <div class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Ответ на {{ replyPreviewSender(resolveReplyPreview(message)) }}
                        </div>
                        <div class="mt-1 whitespace-pre-wrap break-all text-sm leading-5 text-slate-700 [overflow-wrap:anywhere]">
                          {{ replyPreviewText(resolveReplyPreview(message)) || 'Сообщение' }}
                        </div>
                      </button>
                      <div
                        v-if="editingMessageId === message.id"
                        class="mt-2.5 space-y-3"
                      >
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
                        v-else-if="message.type === 'call'"
                        class="mt-2.5 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2"
                      >
                        <button
                          type="button"
                          class="rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          :disabled="!message.call?.joinable || (chatStore.activeCall && chatStore.activeCall.id && chatStore.activeCall.id !== message.call?.id)"
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
                      <div class="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-slate-500 sm:gap-2 sm:text-[11px]">
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
                          ☺️
                        </button>
                      </div>
                      <div
                        v-if="reactionPickerMessageId === message.id"
                        class="mt-2.5 rounded-2xl border border-slate-200 bg-white/90 px-3 py-3"
                      >
                        <div class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
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
                      <div class="mt-2.5 flex items-center gap-2.5 text-xs text-slate-500">
                        <span>{{ formatMessageTime(message.createdAt) }}</span>
                        <span v-if="message.editedAt">изменено</span>
                        <span
                          v-if="message.senderEmail === currentUserEmail"
                          class="ml-auto text-sm font-semibold tracking-tight text-slate-500"
                          :title="messageStatusTitle(message)"
                        >
                          {{ messageStatusIcon(message) }}
                        </span>
                      </div>
                    </div>
                  </article>
                </div>
              </div>

              <div
                :class="
                  mobileConversationMode
                    ? 'sticky bottom-0 z-10 shrink-0 border-t border-slate-200 bg-white px-2.5 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+0.35rem)]'
                    : 'border-t border-slate-200 px-3 py-4 sm:px-6 sm:py-5 xl:px-5 xl:py-4'
                "
              >
                <form :class="mobileConversationMode ? 'space-y-2.5' : 'space-y-3'" @submit.prevent="sendCurrentMessage">
                  <div
                    v-if="replyingToMessage"
                    :class="
                      mobileConversationMode
                        ? 'flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5'
                        : 'flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 sm:px-4'
                    "
                  >
                    <div class="min-w-0">
                      <div class="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Ответ на {{ replyPreviewSender(replyingToMessage) }}
                      </div>
                      <div class="mt-1 whitespace-pre-wrap break-all text-sm text-slate-700 [overflow-wrap:anywhere]">
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
                    <textarea
                      ref="composerTextarea"
                      v-model="composerText"
                      :rows="mobileConversationMode ? 2 : 3"
                      class="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-28 text-sm text-slate-950 outline-none transition focus:border-indigo-300 focus:bg-white sm:pr-36"
                      placeholder="Напиши сообщение"
                      @keydown="handleComposerKeydown"
                    ></textarea>
                    <div
                      v-if="composerDropActive"
                      class="pointer-events-none absolute inset-3 z-10 flex items-center justify-center rounded-2xl border border-dashed border-sky-300 bg-sky-50/90 px-4 text-center text-sm font-semibold text-sky-700"
                    >
                      Отпусти, чтобы прикрепить изображение
                    </div>
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
                  <div
                    v-if="isRecordingAudio"
                    class="text-sm font-semibold text-rose-700"
                  >
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
                      <audio :src="recordedAudioUrl" controls class="h-10 w-full sm:flex-1"></audio>
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
import InlineNotice from '../components/InlineNotice.vue'
import { renderChatMarkdown } from '../lib/chat-markdown.js'
import {
  buildChatSearchExcerpt,
  getChatAudioRecorderLabel,
  getAudioMessageButtonLabel,
  getChatSwipeReplyState,
  getImageMessageButtonLabel,
  filterChatUsersForSearch,
  getChatMessageSenderLabel,
  getChatMessageStatusIcon,
  getChatMessageStatusTitle,
  getChatMicrophoneErrorMessage,
  getChatReplyPreviewText,
  getConversationMembersSummary,
  getDroppedImageFile,
  getCurrentUserReactionEmoji,
  getRecentChatItems,
  groupChatReactions,
  insertEmojiIntoText,
  isChatMessageEditable,
  isChatSendShortcut,
} from '../lib/chat-ui.js'
import { useAuthStore } from '../stores/auth.js'
import { useChatStore } from '../stores/chat.js'
import { useNotificationsStore } from '../stores/notifications.js'

const authStore = useAuthStore()
const chatStore = useChatStore()
const notifications = useNotificationsStore()

const chatSearch = ref('')
const composerText = ref('')
const composerTextarea = ref(null)
const searchInput = ref(null)
const imageInput = ref(null)
const emojiPickerRoot = ref(null)
const emojiPickerOpen = ref(false)
const creatingGroup = ref(false)
const deletingGroup = ref(false)
const sendingMessage = ref(false)
const sendingAudio = ref(false)
const sendingImage = ref(false)
const groupModalOpen = ref(false)
const messagesScroller = ref(null)
const isRecordingAudio = ref(false)
const recordingSeconds = ref(0)
const recordedAudioDuration = ref(0)
const recordedAudioBlob = ref(null)
const recordedAudioUrl = ref('')
const selectedImageBlob = ref(null)
const selectedImageUrl = ref('')
const selectedImageName = ref('')
const composerDropActive = ref(false)
const composerDragDepth = ref(0)
const recordingError = ref('')
const microphoneHelpOpen = ref(false)
const playingAudioMessageId = ref('')
const viewingImageMessageId = ref('')
const imageViewerOpen = ref(false)
const imageViewerUrl = ref('')
const localCallAudio = ref(null)
const startingCall = ref(false)
const joiningCall = ref(false)
const endingCall = ref(false)
const callActionError = ref('')
const localCallMuted = ref(false)
const localCallStream = ref(null)
const remoteCallAudios = ref([])
const mediaRecorder = ref(null)
const recordingStream = ref(null)
const recordingTimer = ref(null)
const searchOpen = ref(false)
const searchQuery = ref('')
const searchTimer = ref(null)
const replyingToMessageId = ref('')
const editingMessageId = ref('')
const editingMessageText = ref('')
const reactionPickerMessageId = ref('')
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
const messageElements = new Map()
const remoteAudioElements = new Map()
const peerConnections = new Map()
let highlightTimerId = null
let mobileMediaQuery = null
let unsubscribeSocketEnvelope = null

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
const soundLabel = computed(() =>
  chatStore.soundEnabled ? 'Звуковые уведомления включены' : 'Звуковые уведомления выключены',
)
const mobileConversationMode = computed(
  () => isMobileLayout.value && mobileView.value === 'conversation',
)
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
const activePinnedMessage = computed(() => activeConversation.value?.pinnedMessage || null)
const audioRecorderLabel = computed(() => getChatAudioRecorderLabel(isRecordingAudio.value))
const activeSearchResults = computed(() => chatStore.searchResults)
const displayedCall = computed(() => chatStore.activeConversationCall || null)
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

  if (!displayedCall.value.joinable) {
    return 'Кнопка подключения больше неактивна.'
  }

  if (isCurrentUserInDisplayedCall.value) {
    return `Участников сейчас: ${displayedCall.value.participants.length}`
  }

  if (chatStore.activeCall?.id && chatStore.activeCall.id !== displayedCall.value.id) {
    return 'У тебя уже есть другой активный звонок. Сначала выйди из него.'
  }

  return `Участников сейчас: ${displayedCall.value.participants.length}. Можно подключиться.`
})
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
  if (conversation.type === 'group') {
    return getConversationMembersSummary(conversation, currentUserEmail.value)
  }

  if (conversation.lastMessageText) {
    return conversation.lastMessageText
  }

  return 'Direct-диалог'
}

const messageSenderLabel = (message) =>
  getChatMessageSenderLabel(message, {
    email: currentUserEmail.value,
    login: currentUserLogin.value,
  })

const messageStatusIcon = (message) => getChatMessageStatusIcon(message, currentUserEmail.value)

const messageStatusTitle = (message) => getChatMessageStatusTitle(message, currentUserEmail.value)

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

const scrollToMessage = async (messageId) => {
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
    behavior: 'smooth',
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
    typeof window === 'undefined' ||
    window.confirm('Удалить это сообщение для всех участников?')
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

  reactionPickerMessageId.value =
    reactionPickerMessageId.value === message.id ? '' : message.id
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

const setRemoteAudioElement = (email) => (element) => {
  if (element) {
    remoteAudioElements.set(email, element)
    const remote = remoteCallAudios.value.find((item) => item.email === email)
    if (remote?.stream) {
      element.srcObject = remote.stream
    }
    return
  }

  remoteAudioElements.delete(email)
}

const resetRemoteAudios = () => {
  for (const entry of remoteCallAudios.value) {
    const tracks = entry.stream?.getTracks?.() || []
    for (const track of tracks) {
      track.stop()
    }
  }
  remoteCallAudios.value = []
}

const attachLocalAudio = () => {
  if (localCallAudio.value) {
    localCallAudio.value.srcObject = localCallStream.value
  }
}

const upsertRemoteAudioStream = (participant, stream) => {
  if (!participant?.email) {
    return
  }

  const next = [...remoteCallAudios.value]
  const index = next.findIndex((item) => item.email === participant.email)
  const entry = {
    email: participant.email,
    login: participant.login || participant.email,
    muted: Boolean(participant.muted),
    stream,
  }

  if (index === -1) {
    next.push(entry)
  } else {
    next[index] = {
      ...next[index],
      ...entry,
    }
  }
  remoteCallAudios.value = next

  const element = remoteAudioElements.get(participant.email)
  if (element) {
    element.srcObject = stream
  }
}

const syncRemoteAudioMeta = (call) => {
  if (!call) {
    resetRemoteAudios()
    return
  }

  remoteCallAudios.value = remoteCallAudios.value
    .filter((entry) =>
      call.participants.some(
        (participant) =>
          participant.email === entry.email && participant.email !== currentUserEmail.value,
      ),
    )
    .map((entry) => {
      const participant = call.participants.find((item) => item.email === entry.email) || {}
      return {
        ...entry,
        login: participant.login || entry.login,
        muted: Boolean(participant.muted),
      }
    })
}

const stopLocalCallStream = () => {
  const tracks = localCallStream.value?.getTracks?.() || []
  for (const track of tracks) {
    track.stop()
  }
  localCallStream.value = null
  if (localCallAudio.value) {
    localCallAudio.value.srcObject = null
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
  resetRemoteAudios()
  stopLocalCallStream()
  localCallMuted.value = false
}

const ensureCallConfig = async () => {
  try {
    return await chatStore.loadCallConfig()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось загрузить конфиг звонков')
    throw error
  }
}

const ensureLocalCallStream = async () => {
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

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  localCallStream.value = stream
  localCallMuted.value = false
  attachLocalAudio()
  return stream
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

const ensurePeerConnection = async (call, remoteParticipant, createOffer = false) => {
  if (!call?.id || !remoteParticipant?.email || remoteParticipant.email === currentUserEmail.value) {
    return null
  }

  let connection = peerConnections.get(remoteParticipant.email)
  if (!connection) {
    await ensureCallConfig()
    const stream = await ensureLocalCallStream()
    connection = new RTCPeerConnection({
      iceServers: chatStore.callConfig?.iceServers || [{ urls: ['stun:stun.l.google.com:19302'] }],
    })
    peerConnections.set(remoteParticipant.email, connection)

    for (const track of stream.getTracks()) {
      connection.addTrack(track, stream)
    }

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        sendRtcSignal(call, remoteParticipant, 'ice-candidate', event.candidate.toJSON())
      }
    }
    connection.ontrack = (event) => {
      const [streamValue] = event.streams
      if (streamValue) {
        upsertRemoteAudioStream(remoteParticipant, streamValue)
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

  syncRemoteAudioMeta(call)

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

  const remoteParticipant =
    call.participants.find((participant) => participant.email === data.sender_email) || {
      email: data.sender_email || '',
      login: data.sender_login || data.sender_email || '',
      muted: false,
    }

  const connection = await ensurePeerConnection(call, remoteParticipant, false)
  if (!connection) {
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
    const call = chatStore.activeConversationCall
    if (!call?.joinable || !isCurrentUserInDisplayedCall.value) {
      if (chatStore.activeCall?.conversationId !== activeConversation.value?.id) {
        resetCallSession()
      }
      return
    }

    try {
      await syncDisplayedCallPeers(call)
    } catch (error) {
      callActionError.value = error?.message || 'Не удалось синхронизировать звонок'
    }
  }
}

const startDisplayedCall = async () => {
  if (!activeConversation.value) {
    return
  }
  if (chatStore.activeCall?.id && chatStore.activeCall.conversationId !== activeConversation.value.id) {
    notifications.info('Сначала выйди из текущего звонка')
    return
  }

  startingCall.value = true
  callActionError.value = ''
  try {
    await ensureLocalCallStream()
    const call = await chatStore.startCall(activeConversation.value.id)
    await syncDisplayedCallPeers(call)
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

const playAudioMessage = async (message) => {
  if (!activeConversation.value || !message?.id || message.audio?.consumed) {
    return
  }

  playingAudioMessageId.value = message.id
  let objectUrl = ''
  try {
    const blob = await chatStore.consumeAudioMessage({
      conversationId: activeConversation.value.id,
      messageId: message.id,
    })
    objectUrl = URL.createObjectURL(blob)
    const audio = new Audio(objectUrl)
    audio.addEventListener(
      'ended',
      () => {
        URL.revokeObjectURL(objectUrl)
        if (playingAudioMessageId.value === message.id) {
          playingAudioMessageId.value = ''
        }
      },
      { once: true },
    )
    await audio.play()
  } catch (error) {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
    }
    playingAudioMessageId.value = ''
    notifications.errorFrom(error, 'Не удалось воспроизвести аудио')
  }
}

const closeImageViewer = () => {
  if (imageViewerUrl.value) {
    URL.revokeObjectURL(imageViewerUrl.value)
  }
  imageViewerUrl.value = ''
  imageViewerOpen.value = false
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

const selectConversation = async (conversationId) => {
  try {
    await chatStore.setActiveConversation(conversationId)
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
    notifications.success('Группа удалена')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось удалить группу')
  } finally {
    deletingGroup.value = false
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
      replyToMessageId: replyingToMessageId.value,
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

    composerText.value = ''
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
    if (!isMobileLayout.value && !chatStore.activeConversationId && chatStore.conversations[0]) {
      await selectConversation(chatStore.conversations[0].id)
    } else if (chatStore.activeConversationId) {
      await chatStore.setActiveConversation(chatStore.activeConversationId)
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

  if (!searchOpen.value) {
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
  () => {
    cancelEditing()
    clearReplyState()
    reactionPickerMessageId.value = ''
    if (isMobileLayout.value && !chatStore.activeConversationId) {
      mobileView.value = 'list'
    }
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
  () => [chatStore.activeConversationId, activeMessages.value.length],
  () => {
    scrollMessagesToBottom()
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
  () => localCallStream.value,
  () => {
    attachLocalAudio()
  },
)

onUnmounted(() => {
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
  if (highlightTimerId) {
    clearTimeout(highlightTimerId)
    highlightTimerId = null
  }
  stopRecordingTracks()
  discardRecordedAudio()
  discardSelectedImage()
  closeImageViewer()
  if (unsubscribeSocketEnvelope) {
    unsubscribeSocketEnvelope()
    unsubscribeSocketEnvelope = null
  }
  resetCallSession()
  chatStore.disconnect()
})
</script>
