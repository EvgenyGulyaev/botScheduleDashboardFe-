<template>
  <div class="min-h-screen bg-gray-50">
    <div class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 sm:py-8">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 sm:text-3xl">Короткие ссылки</h2>
          <p class="mt-2 text-base text-gray-600 sm:text-lg">
            Создание, копирование и управление ссылками сервиса `urlShotener`.
          </p>
        </div>
        <div
          class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"
        >
          <div class="font-semibold text-slate-900">{{ links.length }} ссылок в базе</div>
          <div class="mt-1">{{ totalClicks }} переходов суммарно</div>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div class="space-y-6">
          <div class="rounded-2xl bg-white p-6 shadow-xl">
            <div class="mb-5">
              <h3 class="text-xl font-bold text-gray-900">Новая короткая ссылка</h3>
              <p class="mt-1 text-sm text-gray-500">
                Вставь оригинальный URL, и админка сразу покажет готовую короткую ссылку.
              </p>
            </div>

            <form class="space-y-4" @submit.prevent="createLink">
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-700"
                  >Оригинальный URL</label
                >
                <input
                  v-model="form.originalUrl"
                  type="url"
                  placeholder="https://example.com/some/long/path"
                  class="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  :class="{ 'border-rose-300 ring-rose-100': shouldShowFormError }"
                />
                <p v-if="shouldShowFormError" class="mt-2 text-sm text-rose-600">{{ formError }}</p>
              </div>

              <button
                type="submit"
                :disabled="createLoading"
                class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50"
              >
                {{ createLoading ? 'Создаём ссылку...' : 'Создать короткую ссылку' }}
              </button>
            </form>

            <InlineNotice
              v-if="latestCreatedLink"
              class="mt-4"
              tone="success"
              title="Последняя созданная ссылка"
              :message="buildPublicUrl(latestCreatedLink.shortCode)"
            />

            <div v-if="latestCreatedLink" class="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                @click="copyShortLink(latestCreatedLink.shortCode)"
              >
                Скопировать
              </button>
              <a
                :href="buildPublicUrl(latestCreatedLink.shortCode)"
                target="_blank"
                rel="noreferrer"
                class="rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Открыть короткую ссылку
              </a>
            </div>
          </div>

          <div class="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
            <h3 class="text-lg font-bold text-rose-950">Опасная зона</h3>
            <p class="mt-2 text-sm text-rose-800">
              Очистка удалит все короткие ссылки из сервиса. Используй только если уверен.
            </p>
            <button
              type="button"
              :disabled="clearLoading || links.length === 0"
              class="mt-4 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
              @click="clearLinks"
            >
              {{ clearLoading ? 'Очищаем...' : 'Очистить все ссылки' }}
            </button>
          </div>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-xl">
          <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-xl font-bold text-gray-900">Список ссылок</h3>
              <p class="mt-1 text-sm text-gray-500">
                Последние созданные ссылки и статистика переходов.
              </p>
            </div>
            <button
              type="button"
              :disabled="listLoading"
              class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              @click="loadLinks"
            >
              {{ listLoading ? 'Обновляем...' : 'Обновить список' }}
            </button>
          </div>

          <InlineNotice
            v-if="listError"
            tone="error"
            title="Не удалось загрузить ссылки"
            :message="listError"
          />

          <div v-if="listLoading && links.length === 0" class="space-y-3">
            <div
              v-for="item in 4"
              :key="item"
              class="h-24 animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
            ></div>
          </div>

          <InlineNotice
            v-else-if="!listLoading && links.length === 0"
            title="Ссылок пока нет"
            message="Создай первую короткую ссылку через форму слева, и она сразу появится в списке."
          />

          <div v-else class="space-y-4">
            <article
              v-for="link in links"
              :key="link.shortCode"
              class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div class="min-w-0 space-y-3">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Short code
                    </p>
                    <p class="mt-1 text-lg font-bold text-slate-900">{{ link.shortCode }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Короткая ссылка
                    </p>
                    <a
                      :href="buildPublicUrl(link.shortCode)"
                      target="_blank"
                      rel="noreferrer"
                      class="mt-1 block break-all text-sm font-medium text-blue-700 hover:text-blue-800"
                    >
                      {{ buildPublicUrl(link.shortCode) }}
                    </a>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Оригинал
                    </p>
                    <a
                      :href="link.originalUrl"
                      target="_blank"
                      rel="noreferrer"
                      class="mt-1 block break-all text-sm text-slate-700 hover:text-slate-900"
                    >
                      {{ link.originalUrl }}
                    </a>
                  </div>
                </div>

                <div class="flex w-full flex-col gap-3 lg:w-64">
                  <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-xl bg-white px-3 py-3 shadow-sm">
                      <div class="text-xs uppercase tracking-wide text-slate-500">Переходы</div>
                      <div class="mt-1 text-lg font-bold text-slate-900">{{ link.clicks }}</div>
                    </div>
                    <div class="rounded-xl bg-white px-3 py-3 shadow-sm">
                      <div class="text-xs uppercase tracking-wide text-slate-500">Создано</div>
                      <div class="mt-1 text-sm font-semibold text-slate-900">
                        {{ formatShortLinkDate(link.createdAt) }}
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      @click="copyShortLink(link.shortCode)"
                    >
                      Копировать
                    </button>
                    <button
                      type="button"
                      class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                      :disabled="deletingShortCode === link.shortCode"
                      @click="deleteLink(link)"
                    >
                      {{ deletingShortCode === link.shortCode ? 'Удаляем...' : 'Удалить' }}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import InlineNotice from '../components/InlineNotice.vue'
import {
  buildShortLinkUrl,
  formatShortLinkDate,
  normalizeShortLinks,
  validateOriginalUrl,
} from '../lib/short-links.js'
import { useNotificationsStore } from '../stores/notifications.js'

const notifications = useNotificationsStore()

const links = ref([])
const listLoading = ref(false)
const createLoading = ref(false)
const clearLoading = ref(false)
const deletingShortCode = ref('')
const listError = ref('')
const form = ref({
  originalUrl: '',
})
const submitAttempted = ref(false)
const latestCreatedLink = ref(null)

const formError = computed(() => validateOriginalUrl(form.value.originalUrl))
const shouldShowFormError = computed(() => submitAttempted.value && !!formError.value)
const totalClicks = computed(() => links.value.reduce((sum, link) => sum + link.clicks, 0))

const shortApi = axios.create({
  baseURL: '/short/api',
})

const buildPublicUrl = (shortCode) => buildShortLinkUrl(window.location.origin, shortCode)

const loadLinks = async () => {
  listLoading.value = true
  try {
    const { data } = await shortApi.get('/urls')
    links.value = normalizeShortLinks(Array.isArray(data) ? data : [])
    listError.value = ''
  } catch (error) {
    listError.value = error.response?.data?.message || 'Сервис коротких ссылок сейчас не ответил.'
    notifications.errorFrom(error, 'Не удалось загрузить список ссылок', { duration: 5000 })
  } finally {
    listLoading.value = false
  }
}

const createLink = async () => {
  submitAttempted.value = true
  if (formError.value) {
    return
  }

  createLoading.value = true
  try {
    const payload = { url: form.value.originalUrl.trim() }
    const { data } = await shortApi.post('/urls', payload)
    latestCreatedLink.value = normalizeShortLinks([data])[0] || null
    form.value.originalUrl = ''
    submitAttempted.value = false
    notifications.success('Короткая ссылка создана')
    await loadLinks()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось создать короткую ссылку', { duration: 5000 })
  } finally {
    createLoading.value = false
  }
}

const copyShortLink = async (shortCode) => {
  const shortUrl = buildPublicUrl(shortCode)

  try {
    await navigator.clipboard.writeText(shortUrl)
    notifications.success('Короткая ссылка скопирована')
  } catch {
    notifications.info(shortUrl, { duration: 7000 })
  }
}

const deleteLink = async (link) => {
  if (!window.confirm(`Удалить короткую ссылку ${link.shortCode}?`)) {
    return
  }

  deletingShortCode.value = link.shortCode
  try {
    await shortApi.delete('/urls', {
      params: {
        short: link.shortCode,
      },
    })
    links.value = links.value.filter((item) => item.shortCode !== link.shortCode)
    if (latestCreatedLink.value?.shortCode === link.shortCode) {
      latestCreatedLink.value = null
    }
    notifications.success('Ссылка удалена')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось удалить ссылку', { duration: 5000 })
  } finally {
    deletingShortCode.value = ''
  }
}

const clearLinks = async () => {
  if (!window.confirm('Очистить все короткие ссылки? Это действие необратимо.')) {
    return
  }

  clearLoading.value = true
  try {
    await shortApi.delete('/urls/all')
    links.value = []
    latestCreatedLink.value = null
    notifications.success('Все короткие ссылки очищены')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось очистить список ссылок', { duration: 5000 })
  } finally {
    clearLoading.value = false
  }
}

onMounted(() => {
  loadLinks()
})
</script>
