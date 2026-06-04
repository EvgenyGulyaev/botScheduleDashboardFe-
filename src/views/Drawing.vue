<template>
  <div class="h-[100dvh] overflow-hidden bg-[#f5f7fb] text-slate-950">
    <div
      v-if="combinedError"
      class="fixed left-1/2 top-20 z-50 w-[min(92vw,520px)] -translate-x-1/2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-700 shadow-lg"
    >
      {{ combinedError }}
    </div>

    <section
      v-if="viewMode === 'gallery'"
      class="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col px-4 py-4 sm:px-6"
    >
      <div class="flex min-h-11 items-center justify-between border-b border-slate-200/80 pb-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Назад"
            title="Назад"
            @click="goBack"
          >
            ←
          </button>
          <button
            type="button"
            class="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            @click="onNew"
          >
            Новый
          </button>
          <button
            type="button"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            @click="openStampsScreen"
          >
            Кисти
          </button>
        </div>
        <div class="text-sm font-semibold text-slate-500">
          {{ items.length ? `${items.length} изображ.` : 'Изображения' }}
        </div>
      </div>

      <div
        v-if="store.loading && !items.length"
        class="grid flex-1 place-items-center py-16 text-sm text-slate-500"
      >
        Загружаем изображения...
      </div>

      <div v-else-if="!items.length" class="grid flex-1 place-items-center py-16">
        <div class="max-w-sm text-center">
          <div
            class="mx-auto mb-5 grid h-28 w-28 place-items-center rounded-[2rem] border border-dashed border-slate-300 bg-white text-4xl text-slate-300"
          >
            ✎
          </div>
          <div class="text-lg font-semibold text-slate-950">Пока пусто</div>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            Создай новый холст, сохрани его, и он появится здесь.
          </p>
          <button
            type="button"
            class="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            @click="onNew"
          >
            Новый холст
          </button>
          <button
            type="button"
            class="mt-3 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            @click="openStampsScreen"
          >
            Кисти
          </button>
        </div>
      </div>

      <div
        v-else
        class="grid min-h-0 flex-1 grid-cols-1 content-start gap-4 overflow-y-auto overscroll-contain py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <article
          v-for="item in items"
          :key="item.id"
          class="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
        >
          <button type="button" class="block w-full text-left" @click="openExisting(item)">
            <div class="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                v-if="galleryThumbs[item.id]"
                :src="galleryThumbs[item.id]"
                :alt="item.title || 'Изображение'"
                class="h-full w-full object-contain"
              />
              <div v-else class="grid h-full place-items-center text-sm text-slate-400">
                {{ galleryThumbLoading[item.id] ? 'Загружаем...' : 'Нет превью' }}
              </div>
              <div
                class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/20 to-transparent opacity-0 transition group-hover:opacity-100"
              />
            </div>
            <div class="p-4">
              <div class="truncate text-sm font-semibold text-slate-950">
                {{ item.title || 'Без названия' }}
              </div>
              <div class="mt-1 text-xs text-slate-500">
                {{ item.width }}×{{ item.height }} · {{ formatSize(item.size) }}
              </div>
            </div>
          </button>
          <div class="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <button
              type="button"
              class="text-xs font-semibold text-slate-500 transition hover:text-slate-950"
              @click="openExisting(item)"
            >
              Открыть
            </button>
            <button
              type="button"
              class="text-xs font-semibold text-rose-500 transition hover:text-rose-700"
              :disabled="saving"
              @click="onDelete(item)"
            >
              Удалить
            </button>
          </div>
        </article>
      </div>
    </section>

    <section
      v-else-if="viewMode === 'stamps'"
      class="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col px-4 py-4 sm:px-6"
    >
      <div class="flex min-h-11 items-center justify-between border-b border-slate-200/80 pb-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Назад"
            title="Назад"
            @click="closeStampsScreen"
          >
            ←
          </button>
          <div class="text-lg font-semibold text-slate-950">Кисти</div>
        </div>
        <button
          type="button"
          class="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          @click="openStampForm()"
        >
          Добавить
        </button>
      </div>

      <div v-if="stampsStore.loading && !stamps.length" class="grid flex-1 place-items-center py-16 text-sm text-slate-500">
        Загружаем кисти...
      </div>
      <div v-else-if="!stamps.length" class="grid flex-1 place-items-center py-16">
        <div class="max-w-sm text-center">
          <div
            class="mx-auto mb-5 grid h-28 w-28 place-items-center rounded-[2rem] border border-dashed border-slate-300 bg-white text-4xl text-slate-300"
          >
            ▣
          </div>
          <div class="text-lg font-semibold text-slate-950">Кистей пока нет</div>
          <p class="mt-2 text-sm leading-6 text-slate-500">
            Добавь текстовый штамп или загрузи картинку, чтобы быстро ставить ее на холст.
          </p>
          <button
            type="button"
            class="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            @click="openStampForm()"
          >
            Добавить кисть
          </button>
        </div>
      </div>
      <div
        v-else
        class="grid min-h-0 flex-1 grid-cols-1 content-start gap-4 overflow-y-auto overscroll-contain py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <article
          v-for="stamp in stamps"
          :key="stamp.id"
          class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div class="flex min-h-32 items-center justify-center bg-slate-50 p-4">
            <img
              v-if="stamp.hasImage && stampThumbs[stamp.id]"
              :src="stampThumbs[stamp.id]"
              :alt="stamp.name"
              class="max-h-28 max-w-full object-contain"
            />
            <div v-else class="text-center">
              <div class="text-2xl font-bold text-slate-950">{{ stamp.textValue || stamp.name }}</div>
              <div class="mt-2 text-xs font-semibold uppercase text-slate-400">
                {{ stamp.hasImage ? 'Картинка' : 'Имя' }}
              </div>
            </div>
          </div>
          <div class="p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold text-slate-950">{{ stamp.name }}</div>
                <div class="mt-1 text-xs text-slate-500">
                  Приоритет: {{ stampPriorityLabel(stamp.priority) }}
                </div>
              </div>
              <span class="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                {{ stampPriorityLabel(stamp.priority) }}
              </span>
            </div>
            <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                type="button"
                class="text-xs font-semibold text-slate-500 transition hover:text-slate-950"
                @click="openStampForm(stamp)"
              >
                Редактировать
              </button>
              <button
                type="button"
                class="text-xs font-semibold text-rose-500 transition hover:text-rose-700"
                @click="confirmStampDelete(stamp)"
              >
                Удалить
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="viewMode === 'editor'" class="flex h-full min-h-0 flex-col overflow-hidden">
      <div
        class="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-[#f8fafc] px-3 py-2 sm:px-5"
        role="toolbar"
        aria-label="Инструменты рисовалки"
      >
        <div class="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overscroll-contain">
          <button
            type="button"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            aria-label="Назад к изображениям"
            title="Назад к изображениям"
            @click="openGallery"
          >
            ←
          </button>

          <div class="mx-1 h-6 w-px shrink-0 bg-slate-200" />

          <button
            v-for="tool in tools"
            :key="tool.key"
            type="button"
            :aria-label="tool.label"
            :title="tool.label"
            :aria-pressed="activeTool === tool.key"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-base transition"
            :class="
              activeTool === tool.key
                ? 'border-slate-950 bg-slate-950 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            "
            @click="activeTool = tool.key"
          >
            <svg
              v-if="tool.icon === 'eraser'"
              aria-hidden="true"
              viewBox="0 0 24 24"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m7 21-4-4 11-11a2.8 2.8 0 0 1 4 0l2 2a2.8 2.8 0 0 1 0 4L9 21H7Z" />
              <path d="m11 10 6 6" />
              <path d="M17 21h4" />
            </svg>
            <svg
              v-else-if="tool.icon === 'hand'"
              aria-hidden="true"
              viewBox="0 0 24 24"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 11V6a2 2 0 0 0-4 0v5" />
              <path d="M14 10V4a2 2 0 0 0-4 0v10" />
              <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
              <path d="M6 14v-2a2 2 0 0 0-4 0v3a7 7 0 0 0 7 7h3a8 8 0 0 0 8-8v-3a2 2 0 1 0-4 0" />
            </svg>
            <span v-else aria-hidden="true">{{ tool.icon }}</span>
          </button>

          <div class="relative shrink-0">
            <button
              ref="stampButtonRef"
              type="button"
              :aria-pressed="activeTool === 'stamp'"
              :title="selectedStamp ? `Штамп: ${selectedStamp.name}` : 'Штамп'"
              class="inline-flex h-10 items-center gap-2 rounded-full border px-3 text-sm font-semibold transition"
              :class="
                activeTool === 'stamp'
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              "
              @click="toggleStampDropdown"
            >
              ▣
              <span class="max-w-28 truncate">{{ selectedStamp?.name || 'Штамп' }}</span>
              <span aria-hidden="true">▾</span>
            </button>
            <div
              v-if="stampDropdownOpen"
              class="fixed z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
              :style="stampDropdownStyle"
            >
              <div class="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase text-slate-400">
                Штампы
              </div>
              <button
                v-for="stamp in stamps"
                :key="stamp.id"
                type="button"
                class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-slate-50"
                @click="selectStamp(stamp)"
              >
                <span class="min-w-0 truncate font-semibold text-slate-800">{{ stamp.name }}</span>
                <span class="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                  {{ stampPriorityLabel(stamp.priority) }}
                </span>
              </button>
              <div v-if="!stamps.length" class="px-3 py-4 text-sm text-slate-500">
                Штампов пока нет
              </div>
              <button
                type="button"
                class="w-full border-t border-slate-100 px-3 py-3 text-left text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                @click="openStampsScreen"
              >
                Управление кистями
              </button>
            </div>
          </div>

          <div class="mx-1 h-6 w-px shrink-0 bg-slate-200" />

          <label
            class="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase text-slate-500"
          >
            Цвет
            <input
              v-model="brushColor"
              type="color"
              class="h-8 w-8 cursor-pointer rounded border border-slate-200 bg-white"
            />
          </label>

          <label
            class="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase text-slate-500"
          >
            {{ sliderLabel }}
            <input
              :value="sliderValue"
              type="range"
              :min="sliderMin"
              :max="sliderMax"
              class="h-2 w-28 cursor-pointer accent-slate-950 sm:w-40"
              @input="onSliderInput"
            />
            <span class="w-6 text-right text-sm font-medium text-slate-700 tabular-nums">{{
              sliderValue
            }}</span>
          </label>

          <div class="mx-1 h-6 w-px shrink-0 bg-slate-200" />

          <button
            type="button"
            aria-label="Подогнать холст под экран"
            title="Подогнать холст под экран"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-base text-slate-700 transition hover:bg-slate-50"
            @click="resizeCanvasToViewport"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M8 3H3v5" />
              <path d="M3 3l7 7" />
              <path d="M16 3h5v5" />
              <path d="M21 3l-7 7" />
              <path d="M8 21H3v-5" />
              <path d="M3 21l7-7" />
              <path d="M16 21h5v-5" />
              <path d="M21 21l-7-7" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Отменить"
            title="Отменить"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-base text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!canUndo"
            @click="undo"
          >
            ↶
          </button>
          <button
            type="button"
            aria-label="Повторить"
            title="Повторить"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-base text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!canRedo"
            @click="redo"
          >
            ↷
          </button>
          <button
            type="button"
            aria-label="Очистить холст"
            title="Очистить холст"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-rose-200 bg-white text-base text-rose-600 transition hover:bg-rose-50"
            @click="clearCanvas"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              class="h-5 w-5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m7 21-4-4 11-11a2.8 2.8 0 0 1 4 0l2 2a2.8 2.8 0 0 1 0 4L9 21H7Z" />
              <path d="m11 10 6 6" />
              <path d="M17 21h4" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          class="shrink-0 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="saving"
          @click="openSaveModal"
        >
          {{ saving ? 'Сохраняем...' : 'Сохранить' }}
        </button>
      </div>

      <div
        ref="editorStageRef"
        class="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3 py-3 sm:px-5"
      >
        <canvas
          ref="canvasRef"
          class="touch-none rounded-xl border border-slate-200 bg-white shadow-sm"
          :class="activeTool === 'hand' ? 'cursor-grab' : 'cursor-crosshair'"
          :style="canvasDisplayStyle"
          :width="canvasWidth"
          :height="canvasHeight"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointerleave="onPointerUp"
          @pointercancel="onPointerUp"
        />
      </div>
    </section>

    <div
      v-if="saveModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
    >
      <form
        class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        @submit.prevent="confirmSave"
      >
        <div class="text-base font-semibold text-slate-950">Сохранить изображение</div>
        <label class="mt-4 block">
          <span class="mb-1 block text-xs font-semibold uppercase text-slate-500">Название</span>
          <input
            ref="saveTitleRef"
            v-model="titleInput"
            class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            :maxlength="titleMaxLength"
            placeholder="Без названия"
          />
        </label>
        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="saveModalOpen = false"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="saving"
          >
            {{ saving ? 'Сохраняем...' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </div>

    <div
      v-if="confirmDelete"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
    >
      <div class="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div class="text-base font-semibold text-slate-950">Удалить изображение?</div>
        <p class="mt-2 text-sm leading-6 text-slate-600">
          Файл будет удален из Google Drive и пропадет из галереи.
        </p>
        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="confirmDelete = false"
          >
            Отмена
          </button>
          <button
            type="button"
            class="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            @click="confirmDeleteAction"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="stampFormOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
    >
      <form
        class="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        @submit.prevent="saveStamp"
      >
        <div class="text-base font-semibold text-slate-950">
          {{ editingStamp ? 'Редактировать кисть' : 'Добавить кисть' }}
        </div>
        <div class="mt-4 grid gap-3">
          <label>
            <span class="mb-1 block text-xs font-semibold uppercase text-slate-500">Название</span>
            <input
              v-model="stampDraft.name"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              placeholder="Евгений"
            />
          </label>
          <label>
            <span class="mb-1 block text-xs font-semibold uppercase text-slate-500">Текст</span>
            <input
              v-model="stampDraft.textValue"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              placeholder="Текстовый штамп"
            />
          </label>
          <label>
            <span class="mb-1 block text-xs font-semibold uppercase text-slate-500">Картинка</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              @change="onStampFileChange"
            />
          </label>
          <div v-if="showStampPriority" class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold uppercase text-slate-500">Приоритет</span>
            <button
              type="button"
              class="rounded-full px-3 py-2 text-sm font-semibold transition"
              :class="stampDraft.priority === 'text' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'"
              @click="stampDraft.priority = 'text'"
            >
              Имя
            </button>
            <button
              type="button"
              class="rounded-full px-3 py-2 text-sm font-semibold transition"
              :class="stampDraft.priority === 'image' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'"
              @click="stampDraft.priority = 'image'"
            >
              Картинка
            </button>
          </div>
          <div v-if="editingStamp?.hasImage" class="flex justify-end">
            <button
              type="button"
              class="text-sm font-semibold text-rose-500"
              @click="stampDraft.removeImage = true"
            >
              Удалить картинку
            </button>
          </div>
        </div>
        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="stampFormOpen = false"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="stampsStore.saving"
          >
            {{ stampsStore.saving ? 'Сохраняем...' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDrawingStore } from '../stores/drawing.js'
import { useDrawingStampsStore } from '../stores/drawing-stamps.js'
import {
  canvasToPngBlob,
  clampBrushSize,
  createUndoStack,
  DRAWING_CANVAS_MAX,
  DRAWING_CANVAS_MIN,
  DRAWING_TITLE_MAX_LENGTH,
  loadImageToCanvas,
  normalizeDrawingTitle,
  validateCanvasDimensions,
} from '../lib/drawing-canvas.js'
import { DRAWING_DEFAULT_CANVAS_HEIGHT, DRAWING_DEFAULT_CANVAS_WIDTH } from '../lib/drawing.js'
import {
  clampStampSize,
  DRAWING_STAMP_SIZE_DEFAULT,
  DRAWING_STAMP_SIZE_MAX,
  DRAWING_STAMP_SIZE_MIN,
  priorityLabel,
  resolveStampPriority,
  resolveStampText,
  shouldShowStampPriorityControls,
  STAMP_PRIORITY_IMAGE,
  STAMP_PRIORITY_TEXT,
  validateDrawingStampDraft,
} from '../lib/drawing-stamps.js'

const store = useDrawingStore()
const stampsStore = useDrawingStampsStore()
const router = useRouter()

const titleMaxLength = DRAWING_TITLE_MAX_LENGTH
const canvasRef = ref(null)
const editorStageRef = ref(null)
const saveTitleRef = ref(null)
const canvasWidth = ref(DRAWING_DEFAULT_CANVAS_WIDTH)
const canvasHeight = ref(DRAWING_DEFAULT_CANVAS_HEIGHT)
const activeTool = ref('pencil')
const brushColor = ref('#0f172a')
const brushSize = ref(4)
const stampSize = ref(DRAWING_STAMP_SIZE_DEFAULT)
const stampButtonRef = ref(null)
const stampDropdownStyle = ref({})
const selectedStampId = ref('')
const stampDropdownOpen = ref(false)
const stampFormOpen = ref(false)
const editingStamp = ref(null)
const stampImageFile = ref(null)
const stampDraft = ref({
  name: '',
  textValue: '',
  priority: STAMP_PRIORITY_TEXT,
  removeImage: false,
})
const titleInput = ref('')
const selected = ref(null)
const saving = ref(false)
const confirmDelete = ref(false)
const deleteTarget = ref(null)
const saveModalOpen = ref(false)
const viewMode = ref('gallery')
const stampsReturnMode = ref('gallery')
const galleryThumbs = ref({})
const galleryThumbLoading = ref({})
const stampThumbs = ref({})
const stampThumbLoading = ref({})

const undoStack = createUndoStack()
const redoStack = createUndoStack()
const undoCount = ref(0)
const redoCount = ref(0)
const hasCanvasContent = ref(false)

const canUndo = computed(() => undoCount.value > 0)
const canRedo = computed(() => redoCount.value > 0)
const combinedError = computed(() => store.error || stampsStore.error)

const tools = [
  { key: 'pencil', label: 'Карандаш', icon: '✎' },
  { key: 'eraser', label: 'Ластик', icon: 'eraser' },
  { key: 'hand', label: 'Рука', icon: 'hand' },
]

const items = computed(() => store.items)
const stamps = computed(() => stampsStore.items)
const selectedStamp = computed(() => stamps.value.find((stamp) => stamp.id === selectedStampId.value) || null)
const isStampTool = computed(() => activeTool.value === 'stamp')
const isHandTool = computed(() => activeTool.value === 'hand')
const stampDraftHasImage = computed(() =>
  Boolean(stampImageFile.value || (editingStamp.value?.hasImage && !stampDraft.value.removeImage)),
)
const showStampPriority = computed(() =>
  shouldShowStampPriorityControls({ ...stampDraft.value, hasImage: stampDraftHasImage.value }),
)
const sliderLabel = computed(() => (isStampTool.value ? 'Размер' : 'Кисть'))
const sliderValue = computed(() => (isStampTool.value ? stampSize.value : brushSize.value))
const sliderMin = computed(() => (isStampTool.value ? DRAWING_STAMP_SIZE_MIN : 1))
const sliderMax = computed(() => (isStampTool.value ? DRAWING_STAMP_SIZE_MAX : 80))
const canvasDisplayStyle = computed(() => ({
  aspectRatio: `${canvasWidth.value} / ${canvasHeight.value}`,
  width: `${canvasWidth.value}px`,
  maxWidth: '100%',
  maxHeight: '100%',
}))

const drawing = ref(false)
const stampObjects = ref([])
let baseCanvas = null
let draggingStamp = null
let lastPoint = null
let stampObjectSeq = 0
const stampImageCache = new Map()

const isEraser = () => activeTool.value === 'eraser'
const stampPriorityLabel = (priority) => priorityLabel(priority)

const getContext = () => canvasRef.value?.getContext('2d')
const getBaseCanvas = () => {
  if (!baseCanvas && typeof document !== 'undefined') {
    baseCanvas = document.createElement('canvas')
  }
  return baseCanvas
}

const getBaseContext = () => getBaseCanvas()?.getContext('2d')

const cloneStampObjects = () =>
  stampObjects.value.map((item) => ({
    ...item,
    stamp: { ...item.stamp },
  }))

const resetStampObjects = () => {
  stampObjects.value = []
  draggingStamp = null
}

const viewportCanvasSize = () => {
  const stage = editorStageRef.value
  if (stage) {
    const rect = stage.getBoundingClientRect()
    const width = Math.min(
      DRAWING_CANVAS_MAX,
      Math.max(DRAWING_CANVAS_MIN, Math.floor(rect.width)),
    )
    const height = Math.min(
      DRAWING_CANVAS_MAX,
      Math.max(DRAWING_CANVAS_MIN, Math.floor(rect.height)),
    )
    return { width, height }
  }
  if (typeof window === 'undefined') {
    return { width: DRAWING_DEFAULT_CANVAS_WIDTH, height: DRAWING_DEFAULT_CANVAS_HEIGHT }
  }
  const horizontalPadding = window.innerWidth < 640 ? 24 : 40
  const reservedHeight = 48 + 58 + 24
  const width = Math.min(
    DRAWING_CANVAS_MAX,
    Math.max(DRAWING_CANVAS_MIN, Math.floor(window.innerWidth - horizontalPadding)),
  )
  const height = Math.min(
    DRAWING_CANVAS_MAX,
    Math.max(DRAWING_CANVAS_MIN, Math.floor(window.innerHeight - reservedHeight)),
  )
  return { width, height }
}

const resizeBaseCanvas = (width, height, preserve = false) => {
  const base = getBaseCanvas()
  if (!base) return null
  const nextWidth = Math.max(1, Math.floor(Number(width) || DRAWING_DEFAULT_CANVAS_WIDTH))
  const nextHeight = Math.max(1, Math.floor(Number(height) || DRAWING_DEFAULT_CANVAS_HEIGHT))
  if (base.width === nextWidth && base.height === nextHeight) return base
  let previous = null
  if (preserve && base.width && base.height && typeof document !== 'undefined') {
    previous = document.createElement('canvas')
    previous.width = base.width
    previous.height = base.height
    previous.getContext('2d')?.drawImage(base, 0, 0)
  }
  base.width = nextWidth
  base.height = nextHeight
  if (previous) {
    base.getContext('2d')?.drawImage(previous, 0, 0)
  }
  return base
}

const ensureBaseCanvasForVisible = () => {
  const canvas = canvasRef.value
  if (!canvas) return null
  return resizeBaseCanvas(canvas.width, canvas.height, true)
}

const drawTextStampObject = (ctx, object) => {
  const text = object.text || object.stamp?.textValue || object.stamp?.name
  if (!ctx || !text) return
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = object.color || brushColor.value
  ctx.font = `700 ${object.size}px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, object.x, object.y)
  ctx.restore()
}

const imageBoundsForStampObject = (object, image = null) => {
  const naturalWidth = image?.naturalWidth || image?.width || object.stamp?.imageWidth || object.size
  const naturalHeight = image?.naturalHeight || image?.height || object.stamp?.imageHeight || object.size
  const scale = object.size / Math.max(naturalWidth, naturalHeight, 1)
  return {
    width: naturalWidth * scale,
    height: naturalHeight * scale,
  }
}

const drawImageStampObject = (ctx, object) => {
  if (!ctx) return
  const image = stampImageCache.get(object.stampId)
  if (!image) {
    drawTextStampObject(ctx, object)
    return
  }
  const { width, height } = imageBoundsForStampObject(object, image)
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.drawImage(image, object.x - width / 2, object.y - height / 2, width, height)
  ctx.restore()
}

const renderCanvas = () => {
  const canvas = canvasRef.value
  const ctx = getContext()
  const base = ensureBaseCanvasForVisible()
  if (!canvas || !ctx || !base) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(base, 0, 0)
  stampObjects.value.forEach((object) => {
    if (object.kind === 'image') {
      drawImageStampObject(ctx, object)
      return
    }
    drawTextStampObject(ctx, object)
  })
}

const snapshotCanvas = () => {
  const base = ensureBaseCanvasForVisible()
  if (!base) return null
  try {
    return {
      base: base.toDataURL('image/png'),
      width: base.width,
      height: base.height,
      stamps: cloneStampObjects(),
      hasContent: hasCanvasContent.value,
    }
  } catch (err) {
    return null
  }
}

const restoreSnapshot = (snapshot) => {
  if (!snapshot?.base) return
  const base = getBaseCanvas()
  if (!base) return
  const image = new Image()
  image.onload = () => {
    canvasWidth.value = snapshot.width || image.naturalWidth || image.width
    canvasHeight.value = snapshot.height || image.naturalHeight || image.height
    resizeBaseCanvas(canvasWidth.value, canvasHeight.value)
    const baseCtx = getBaseContext()
    baseCtx?.clearRect(0, 0, base.width, base.height)
    baseCtx?.drawImage(image, 0, 0)
    stampObjects.value = snapshot.stamps || []
    hasCanvasContent.value = Boolean(snapshot.hasContent)
    nextTick(() => {
      const canvas = canvasRef.value
      if (canvas) {
        canvas.width = canvasWidth.value
        canvas.height = canvasHeight.value
      }
      renderCanvas()
    })
  }
  image.src = snapshot.base
}

const pushUndo = () => {
  const snap = snapshotCanvas()
  if (snap) {
    undoStack.push(snap)
    undoCount.value = undoStack.size()
    redoStack.clear()
    redoCount.value = 0
  }
}

const resetHistory = () => {
  undoStack.clear()
  redoStack.clear()
  undoCount.value = 0
  redoCount.value = 0
}

const pointFromEvent = (event) => {
  const canvas = canvasRef.value
  if (!canvas) return null
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  }
}

const drawSegment = (from, to) => {
  ensureBaseCanvasForVisible()
  const ctx = getBaseContext()
  if (!ctx) return
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = brushSize.value
  if (isEraser()) {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = brushColor.value
  }
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  ctx.globalCompositeOperation = 'source-over'
  renderCanvas()
}

const updateStampDropdownPosition = () => {
  if (typeof window === 'undefined') {
    stampDropdownStyle.value = {}
    return
  }
  const rect = stampButtonRef.value?.getBoundingClientRect()
  if (!rect) {
    stampDropdownStyle.value = {}
    return
  }
  const width = Math.min(256, Math.max(220, window.innerWidth - 24))
  const left = Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - width - 12))
  stampDropdownStyle.value = {
    left: `${left}px`,
    top: `${rect.bottom + 8}px`,
    width: `${width}px`,
    maxWidth: 'calc(100vw - 24px)',
  }
}

const toggleStampDropdown = async () => {
  activeTool.value = 'stamp'
  if (stampDropdownOpen.value) {
    stampDropdownOpen.value = false
    return
  }
  updateStampDropdownPosition()
  stampDropdownOpen.value = true
  if (!stamps.value.length && !stampsStore.loading) {
    try {
      await stampsStore.fetchStamps()
    } catch (err) {
      // error already exposed
    }
  }
  await nextTick()
  updateStampDropdownPosition()
}

const selectStamp = (stamp) => {
  selectedStampId.value = stamp?.id || ''
  activeTool.value = 'stamp'
  stampDropdownOpen.value = false
}

const openStampsScreen = async () => {
  stampDropdownOpen.value = false
  stampsReturnMode.value = viewMode.value === 'editor' ? 'editor' : 'gallery'
  viewMode.value = 'stamps'
  try {
    await stampsStore.fetchStamps()
    await loadStampThumbnails(stamps.value)
  } catch (err) {
    // error already exposed
  }
}

const closeStampsScreen = () => {
  viewMode.value = stampsReturnMode.value === 'editor' ? 'editor' : 'gallery'
}

const drawTextStamp = (point, stamp) => {
  drawTextStampObject(getContext(), {
    x: point.x,
    y: point.y,
    size: stampSize.value,
    color: brushColor.value,
    text: stamp.textValue || stamp.name,
    stamp,
  })
}

const imageFromBlob = async (blob) => {
  const url = URL.createObjectURL(blob)
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('failed to decode stamp image'))
      img.src = url
    })
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

const drawImageStamp = async (point, stamp) => {
  await ensureStampImage(stamp)
  drawImageStampObject(getContext(), {
    x: point.x,
    y: point.y,
    size: stampSize.value,
    stampId: stamp.id,
    stamp,
  })
}

const ensureStampImage = async (stamp) => {
  if (!stamp?.id || !stamp.hasImage) return null
  if (stampImageCache.has(stamp.id)) {
    return stampImageCache.get(stamp.id)
  }
  const blob = await stampsStore.fetchStampContent(stamp.id)
  const image = await imageFromBlob(blob)
  stampImageCache.set(stamp.id, image)
  return image
}

const createStampObject = async (point, stamp) => {
  const kind = stamp.priority === STAMP_PRIORITY_IMAGE && stamp.hasImage ? 'image' : 'text'
  if (kind === 'image') {
    await ensureStampImage(stamp)
  }
  return {
    id: `stamp-${Date.now()}-${++stampObjectSeq}`,
    stampId: stamp.id,
    kind,
    x: point.x,
    y: point.y,
    size: stampSize.value,
    color: brushColor.value,
    text: stamp.textValue || stamp.name,
    stamp: { ...stamp },
  }
}

const placeStamp = async (point) => {
  const stamp = selectedStamp.value
  if (!stamp) {
    stampDropdownOpen.value = true
    return
  }
  pushUndo()
  try {
    const object = await createStampObject(point, stamp)
    stampObjects.value = [...stampObjects.value, object]
    renderCanvas()
    hasCanvasContent.value = true
  } catch (err) {
    store.setError('Не удалось поставить штамп')
  }
}

const stampObjectBounds = (object) => {
  const ctx = getContext()
  if (object.kind === 'image') {
    const image = stampImageCache.get(object.stampId)
    const { width, height } = imageBoundsForStampObject(object, image)
    return {
      left: object.x - width / 2,
      right: object.x + width / 2,
      top: object.y - height / 2,
      bottom: object.y + height / 2,
    }
  }
  const text = object.text || object.stamp?.textValue || object.stamp?.name || ''
  if (ctx) {
    ctx.save()
    ctx.font = `700 ${object.size}px system-ui, sans-serif`
    const width = Math.max(ctx.measureText(text).width, object.size)
    ctx.restore()
    const height = object.size * 1.25
    return {
      left: object.x - width / 2,
      right: object.x + width / 2,
      top: object.y - height / 2,
      bottom: object.y + height / 2,
    }
  }
  const width = Math.max(text.length * object.size * 0.6, object.size)
  const height = object.size * 1.25
  return {
    left: object.x - width / 2,
    right: object.x + width / 2,
    top: object.y - height / 2,
    bottom: object.y + height / 2,
  }
}

const findStampObjectAt = (point) => {
  for (let index = stampObjects.value.length - 1; index >= 0; index -= 1) {
    const object = stampObjects.value[index]
    const bounds = stampObjectBounds(object)
    if (
      point.x >= bounds.left &&
      point.x <= bounds.right &&
      point.y >= bounds.top &&
      point.y <= bounds.bottom
    ) {
      return object
    }
  }
  return null
}

const onPointerDown = (event) => {
  if (!canvasRef.value) return
  event.preventDefault()
  const point = pointFromEvent(event)
  if (!point) return
  if (isStampTool.value) {
    void placeStamp(point)
    return
  }
  if (isHandTool.value) {
    const object = findStampObjectAt(point)
    if (!object) return
    canvasRef.value.setPointerCapture?.(event.pointerId)
    pushUndo()
    draggingStamp = {
      id: object.id,
      offsetX: point.x - object.x,
      offsetY: point.y - object.y,
    }
    return
  }
  canvasRef.value.setPointerCapture?.(event.pointerId)
  pushUndo()
  drawing.value = true
  lastPoint = point
  drawSegment(point, point)
  hasCanvasContent.value = true
}

const onPointerMove = (event) => {
  if (draggingStamp) {
    const point = pointFromEvent(event)
    if (!point) return
    stampObjects.value = stampObjects.value.map((object) =>
      object.id === draggingStamp.id
        ? { ...object, x: point.x - draggingStamp.offsetX, y: point.y - draggingStamp.offsetY }
        : object,
    )
    renderCanvas()
    return
  }
  if (!drawing.value) return
  const point = pointFromEvent(event)
  if (!point || !lastPoint) return
  drawSegment(lastPoint, point)
  lastPoint = point
}

const onPointerUp = (event) => {
  if (draggingStamp) {
    draggingStamp = null
    canvasRef.value?.releasePointerCapture?.(event.pointerId)
    return
  }
  if (!drawing.value) return
  drawing.value = false
  lastPoint = null
  canvasRef.value?.releasePointerCapture?.(event.pointerId)
}

const clearCanvas = () => {
  const base = ensureBaseCanvasForVisible()
  const ctx = getBaseContext()
  if (!ctx || !base) return
  pushUndo()
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, base.width, base.height)
  ctx.restore()
  resetStampObjects()
  renderCanvas()
  hasCanvasContent.value = false
}

const undo = () => {
  const current = snapshotCanvas()
  const prev = undoStack.pop()
  if (!prev) return
  if (current) redoStack.push(current)
  redoCount.value = redoStack.size()
  undoCount.value = undoStack.size()
  restoreSnapshot(prev)
}

const redo = () => {
  const current = snapshotCanvas()
  const next = redoStack.pop()
  if (!next) return
  if (current) undoStack.push(current)
  undoCount.value = undoStack.size()
  redoCount.value = redoStack.size()
  restoreSnapshot(next)
}

const fillCanvasBackground = () => {
  const base = ensureBaseCanvasForVisible()
  const ctx = getBaseContext()
  if (!ctx || !base) return
  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, base.width, base.height)
  ctx.restore()
  renderCanvas()
}

const resizeCanvasToViewport = async () => {
  const canvas = canvasRef.value
  if (!canvas || typeof document === 'undefined') return
  const nextSize = viewportCanvasSize()
  const currentWidth = canvas.width || canvasWidth.value
  const currentHeight = canvas.height || canvasHeight.value
  if (currentWidth === nextSize.width && currentHeight === nextSize.height) return
  const base = ensureBaseCanvasForVisible()
  if (!base) return

  pushUndo()
  const previous = document.createElement('canvas')
  previous.width = base.width
  previous.height = base.height
  previous.getContext('2d')?.drawImage(base, 0, 0)

  const scaleX = nextSize.width / Math.max(currentWidth, 1)
  const scaleY = nextSize.height / Math.max(currentHeight, 1)
  const sizeScale = Math.min(scaleX, scaleY)

  canvasWidth.value = nextSize.width
  canvasHeight.value = nextSize.height
  await nextTick()

  const nextBase = resizeBaseCanvas(nextSize.width, nextSize.height)
  const ctx = getBaseContext()
  if (!nextBase || !ctx) return
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, nextBase.width, nextBase.height)
  ctx.drawImage(previous, 0, 0, previous.width, previous.height, 0, 0, nextBase.width, nextBase.height)
  ctx.restore()

  stampObjects.value = stampObjects.value.map((object) => ({
    ...object,
    x: object.x * scaleX,
    y: object.y * scaleY,
    size: Math.max(1, object.size * sizeScale),
  }))
  renderCanvas()
}

const onNew = async () => {
  selected.value = null
  titleInput.value = ''
  saveModalOpen.value = false
  viewMode.value = 'editor'
  await nextTick()
  const size = viewportCanvasSize()
  canvasWidth.value = size.width
  canvasHeight.value = size.height
  hasCanvasContent.value = false
  resetStampObjects()
  resetHistory()
  await nextTick()
  resizeBaseCanvas(canvasWidth.value, canvasHeight.value)
  fillCanvasBackground()
}

const openExisting = async (item) => {
  viewMode.value = 'editor'
  await nextTick()
  await onSelect(item)
}

const openGallery = async () => {
  viewMode.value = 'gallery'
  saveModalOpen.value = false
  try {
    await store.fetchImages()
  } catch (err) {
    // error already exposed
  }
}

const openStampForm = (stamp = null) => {
  editingStamp.value = stamp
  stampImageFile.value = null
  stampDraft.value = {
    name: stamp?.name || '',
    textValue: stamp?.textValue || '',
    priority: stamp?.priority || STAMP_PRIORITY_TEXT,
    removeImage: false,
  }
  stampFormOpen.value = true
}

const onStampFileChange = (event) => {
  stampImageFile.value = event.target.files?.[0] || null
  if (stampImageFile.value) {
    stampDraft.value.removeImage = false
  }
}

const saveStamp = async () => {
  const hasImage = stampDraftHasImage.value
  const validation = validateDrawingStampDraft({ ...stampDraft.value, hasImage })
  if (!validation.ok) {
    stampsStore.setError(validation.message)
    return
  }
  const payload = {
    name: stampDraft.value.name,
    textValue: resolveStampText(stampDraft.value),
    priority: resolveStampPriority({ ...stampDraft.value, hasImage }),
    removeImage: stampDraft.value.removeImage,
    hasImage,
    file: stampImageFile.value,
    filename: stampImageFile.value?.name || 'stamp.png',
  }
  try {
    if (editingStamp.value) {
      await stampsStore.updateStamp(editingStamp.value.id, payload)
      revokeStampThumb(editingStamp.value.id)
    } else {
      await stampsStore.createStamp(payload)
    }
    stampFormOpen.value = false
    editingStamp.value = null
    await loadStampThumbnails(stamps.value)
  } catch (err) {
    // error already exposed
  }
}

const confirmStampDelete = async (stamp) => {
  if (!stamp) return
  const ok =
    typeof window === 'undefined' || window.confirm(`Удалить кисть «${stamp.name || 'без названия'}»?`)
  if (!ok) return
  try {
    await stampsStore.deleteStamp(stamp.id)
    revokeStampThumb(stamp.id)
    if (selectedStampId.value === stamp.id) {
      selectedStampId.value = ''
    }
  } catch (err) {
    // error already exposed
  }
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/dashboard')
}

const onSelect = async (item) => {
  if (!item) return
  selected.value = item
  titleInput.value = item.title || ''
  const dim = validateCanvasDimensions(
    item.width || DRAWING_DEFAULT_CANVAS_WIDTH,
    item.height || DRAWING_DEFAULT_CANVAS_HEIGHT,
  )
  canvasWidth.value = dim.ok ? dim.width : DRAWING_DEFAULT_CANVAS_WIDTH
  canvasHeight.value = dim.ok ? dim.height : DRAWING_DEFAULT_CANVAS_HEIGHT
  resetStampObjects()
  await nextTick()
  resizeBaseCanvas(canvasWidth.value, canvasHeight.value)
  fillCanvasBackground()
  try {
    const blob = await store.fetchImageContent(item.id)
    const dims = await loadImageToCanvas(getBaseCanvas(), blob)
    if (dims) {
      canvasWidth.value = dims.width
      canvasHeight.value = dims.height
      await nextTick()
      renderCanvas()
      hasCanvasContent.value = true
    }
  } catch (err) {
    hasCanvasContent.value = false
  }
  resetHistory()
}

const openSaveModal = async () => {
  if (!canvasRef.value) return
  saveModalOpen.value = true
  await nextTick()
  saveTitleRef.value?.focus()
}

const confirmSave = async () => {
  const title = normalizeDrawingTitle(titleInput.value)
  if (!title) {
    store.setError('Название обязательно')
    return
  }
  if (titleInput.value.trim().length > DRAWING_TITLE_MAX_LENGTH) {
    store.setError('Слишком длинное название')
    return
  }
  saving.value = true
  try {
    renderCanvas()
    const blob = await canvasToPngBlob(canvasRef.value)
    const width = canvasRef.value?.width || canvasWidth.value
    const height = canvasRef.value?.height || canvasHeight.value
    if (selected.value) {
      await store.updateImage(selected.value.id, { title, width, height, blob })
    } else {
      await store.createImage({ title, width, height, blob })
    }
    selected.value = store.selected
    titleInput.value = store.selected?.title || title
    saveModalOpen.value = false
    await store.fetchImages()
    await loadGalleryThumbnails(items.value)
  } catch (err) {
    // store already set error
  } finally {
    saving.value = false
  }
}

const onDelete = (item = selected.value) => {
  if (!item) return
  deleteTarget.value = item
  confirmDelete.value = true
}

const confirmDeleteAction = async () => {
  if (!deleteTarget.value) {
    confirmDelete.value = false
    return
  }
  const id = deleteTarget.value.id
  confirmDelete.value = false
  saving.value = true
  try {
    await store.deleteImage(id)
    revokeThumb(id)
    if (selected.value?.id === id) {
      selected.value = null
      hasCanvasContent.value = false
      titleInput.value = ''
      resetHistory()
      viewMode.value = 'gallery'
    }
    deleteTarget.value = null
  } finally {
    saving.value = false
  }
}

const isEditableKeyboardTarget = (target) => {
  const tag = String(target?.tagName || '').toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || Boolean(target?.isContentEditable)
}

const handleEditorKeydown = (event) => {
  if (viewMode.value !== 'editor' || saveModalOpen.value || stampFormOpen.value) return
  if (isEditableKeyboardTarget(event.target)) return
  if (!(event.ctrlKey || event.metaKey)) return
  if (event.key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) {
      redo()
      return
    }
    undo()
    return
  }
  if (event.key.toLowerCase() === 'y') {
    event.preventDefault()
    redo()
  }
}

const formatSize = (bytes) => {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} Б`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} КБ`
  return `${(n / (1024 * 1024)).toFixed(1)} МБ`
}

const revokeThumb = (id) => {
  const current = galleryThumbs.value[id]
  if (current) URL.revokeObjectURL(current)
  const nextThumbs = { ...galleryThumbs.value }
  const nextLoading = { ...galleryThumbLoading.value }
  delete nextThumbs[id]
  delete nextLoading[id]
  galleryThumbs.value = nextThumbs
  galleryThumbLoading.value = nextLoading
}

const loadGalleryThumbnail = async (item) => {
  if (!item?.id || galleryThumbs.value[item.id] || galleryThumbLoading.value[item.id]) return
  galleryThumbLoading.value = { ...galleryThumbLoading.value, [item.id]: true }
  try {
    const blob = await store.fetchImageContent(item.id)
    const url = URL.createObjectURL(blob)
    galleryThumbs.value = { ...galleryThumbs.value, [item.id]: url }
  } catch (err) {
    // stale drive files are cleaned by fetchImages; missing preview is acceptable here
  } finally {
    galleryThumbLoading.value = { ...galleryThumbLoading.value, [item.id]: false }
  }
}

const loadGalleryThumbnails = async (nextItems) => {
  const ids = new Set(nextItems.map((item) => item.id))
  Object.keys(galleryThumbs.value).forEach((id) => {
    if (!ids.has(id)) revokeThumb(id)
  })
  await Promise.all(nextItems.slice(0, 24).map((item) => loadGalleryThumbnail(item)))
}

const revokeStampThumb = (id) => {
  const current = stampThumbs.value[id]
  if (current) URL.revokeObjectURL(current)
  const nextThumbs = { ...stampThumbs.value }
  const nextLoading = { ...stampThumbLoading.value }
  delete nextThumbs[id]
  delete nextLoading[id]
  stampThumbs.value = nextThumbs
  stampThumbLoading.value = nextLoading
}

const loadStampThumbnail = async (stamp) => {
  if (!stamp?.id || !stamp.hasImage || stampThumbs.value[stamp.id] || stampThumbLoading.value[stamp.id]) return
  stampThumbLoading.value = { ...stampThumbLoading.value, [stamp.id]: true }
  try {
    const blob = await stampsStore.fetchStampContent(stamp.id)
    stampThumbs.value = { ...stampThumbs.value, [stamp.id]: URL.createObjectURL(blob) }
  } catch (err) {
    // missing preview is acceptable
  } finally {
    stampThumbLoading.value = { ...stampThumbLoading.value, [stamp.id]: false }
  }
}

const loadStampThumbnails = async (nextStamps) => {
  const ids = new Set(nextStamps.map((stamp) => stamp.id))
  Object.keys(stampThumbs.value).forEach((id) => {
    if (!ids.has(id)) revokeStampThumb(id)
  })
  await Promise.all(nextStamps.slice(0, 48).map((stamp) => loadStampThumbnail(stamp)))
}

const onSliderInput = (event) => {
  const value = Number(event.target.value)
  if (isStampTool.value) {
    stampSize.value = clampStampSize(value)
    return
  }
  brushSize.value = clampBrushSize(value)
}

watch(brushSize, (value) => {
  brushSize.value = clampBrushSize(value)
})

watch(stampSize, (value) => {
  stampSize.value = clampStampSize(value)
})

watch(
  items,
  (nextItems) => {
    loadGalleryThumbnails(nextItems)
  },
  { deep: true },
)

onMounted(async () => {
  window.addEventListener('keydown', handleEditorKeydown)
  try {
    await Promise.all([store.fetchImages(), stampsStore.fetchStamps()])
  } catch (err) {
    // error already exposed
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEditorKeydown)
  Object.values(galleryThumbs.value).forEach((url) => URL.revokeObjectURL(url))
  Object.values(stampThumbs.value).forEach((url) => URL.revokeObjectURL(url))
  store.clearError()
  stampsStore.clearError()
})
</script>
