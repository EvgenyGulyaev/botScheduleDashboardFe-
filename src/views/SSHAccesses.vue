<template>
  <div class="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <RouterLink
            to="/dashboard"
            class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            Назад
          </RouterLink>
          <div>
            <h2 class="text-2xl font-bold text-slate-950">SSH доступы</h2>
            <p class="mt-1 text-sm text-slate-500">
              Выдача входа на сервер по публичному ключу без передачи приватных ключей.
            </p>
          </div>
        </div>
        <button
          type="button"
          class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
          @click="loadAccesses"
        >
          Обновить
        </button>
      </div>

      <div class="mb-5 grid gap-3 lg:grid-cols-3">
        <InlineNotice
          class="lg:col-span-2"
          title="Загружай только публичный ключ"
          message="Нужен файл id_rsa.pub или строка вида ssh-ed25519 ... . Приватный id_rsa никогда не должен попадать в админку."
        />
        <InlineNotice
          tone="info"
          title="Права на папки"
          message="Без галочки пользователь не сможет пройти в /var/go или /var/www."
        />
      </div>

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div class="border-b border-slate-100 px-5 py-4">
            <div class="text-sm font-semibold text-slate-950">Активные доступы</div>
            <div class="mt-1 text-xs text-slate-500">{{ accessCountLabel }}</div>
          </div>

          <div v-if="loading && !accesses.length" class="p-6 text-sm text-slate-500">
            Загружаем SSH доступы...
          </div>
          <div v-else-if="!accesses.length" class="p-6 text-sm text-slate-500">
            Доступов пока нет.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-3">Пользователь</th>
                  <th class="px-4 py-3">Подключение</th>
                  <th class="px-4 py-3">Папки</th>
                  <th class="px-4 py-3">Ключ</th>
                  <th class="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="access in accesses" :key="access.username" class="align-top">
                  <td class="px-4 py-4 font-semibold text-slate-950">{{ access.username }}</td>
                  <td class="px-4 py-4">
                    <code class="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700">
                      {{ access.connectionString }}
                    </code>
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex flex-wrap gap-1.5">
                      <span
                        class="rounded-full px-2 py-1 text-xs font-bold"
                        :class="access.varGoAccess ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'"
                      >
                        /var/go
                      </span>
                      <span
                        class="rounded-full px-2 py-1 text-xs font-bold"
                        :class="access.varWWWAccess ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'"
                      >
                        /var/www
                      </span>
                    </div>
                  </td>
                  <td class="max-w-xs px-4 py-4 text-slate-600">
                    <div class="truncate" :title="access.keyPreview">{{ access.keyPreview }}</div>
                    <div class="mt-1 text-xs text-slate-400">
                      {{ updatedLabel(access.updatedAt) }}
                    </div>
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        @click="editAccess(access)"
                      >
                        Изменить
                      </button>
                      <button
                        type="button"
                        class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="saving"
                        @click="deleteAccess(access)"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <form
          class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          @submit.prevent="saveAccess"
        >
          <div class="mb-5">
            <h3 class="text-lg font-bold text-slate-950">
              {{ editingUsername ? 'Обновить доступ' : 'Новый доступ' }}
            </h3>
            <p class="mt-1 text-sm text-slate-500">
              После сохранения человек сможет подключиться командой из таблицы.
            </p>
          </div>

          <div class="space-y-4">
            <label class="block">
              <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Username
              </span>
              <input
                v-model="form.username"
                class="field"
                placeholder="deploy_user"
                :disabled="Boolean(editingUsername)"
                required
              />
            </label>

            <label class="block">
              <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Публичный ключ
              </span>
              <textarea
                v-model="form.publicKey"
                class="field min-h-32 resize-y font-mono text-xs"
                placeholder="ssh-ed25519 AAAA..."
                :required="!editingUsername"
              ></textarea>
            </label>

            <label class="block">
              <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Загрузить .pub
              </span>
              <input
                type="file"
                accept=".pub,.txt"
                class="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                @change="readPublicKeyFile"
              />
            </label>

            <div class="grid gap-3">
              <label class="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span class="text-sm font-semibold text-slate-900">Доступ к /var/go</span>
                <input v-model="form.varGoAccess" type="checkbox" class="h-5 w-5" />
              </label>
              <label class="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span class="text-sm font-semibold text-slate-900">Доступ к /var/www</span>
                <input v-model="form.varWWWAccess" type="checkbox" class="h-5 w-5" />
              </label>
            </div>
          </div>

          <InlineNotice
            v-if="formHint"
            class="mt-4"
            title="Можно не менять ключ"
            :message="formHint"
          />

          <InlineNotice
            v-if="error"
            class="mt-4"
            tone="error"
            title="Не удалось сохранить"
            :message="error"
          />

          <div class="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              @click="resetForm"
            >
              Очистить
            </button>
            <button
              type="submit"
              class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="saving"
            >
              {{ saving ? 'Сохраняем...' : 'Сохранить доступ' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import InlineNotice from '../components/InlineNotice.vue'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationsStore } from '../stores/notifications.js'
import { formatLastUpdatedLabel } from '../lib/view-feedback.js'

const authStore = useAuthStore()
const notifications = useNotificationsStore()

const accesses = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const formHint = ref('')
const editingUsername = ref('')
const form = ref({
  username: '',
  publicKey: '',
  varGoAccess: false,
  varWWWAccess: false,
})

const normalizeAccess = (payload = {}) => ({
  username: String(payload.username || ''),
  keyPreview: String(payload.key_preview || payload.keyPreview || ''),
  varGoAccess: Boolean(payload.var_go_access ?? payload.varGoAccess),
  varWWWAccess: Boolean(payload.var_www_access ?? payload.varWWWAccess),
  connectionString: String(payload.connection_string || payload.connectionString || ''),
  updatedAt: payload.updated_at || payload.updatedAt || '',
})

const accessCountLabel = computed(() => {
  const count = accesses.value.length
  if (count === 1) return '1 пользователь с SSH доступом'
  return `${count} пользователей с SSH доступом`
})

const updatedLabel = (value) => formatLastUpdatedLabel(value ? new Date(value) : null)

const loadAccesses = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await authStore.api.get('/server/ssh-accesses')
    accesses.value = (response.data?.items || []).map(normalizeAccess)
  } catch (err) {
    error.value = err.response?.data?.message || 'Не удалось загрузить SSH доступы'
  } finally {
    loading.value = false
  }
}

const saveAccess = async () => {
  saving.value = true
  error.value = ''
  try {
    const response = await authStore.api.post('/server/ssh-accesses', {
      username: form.value.username,
      public_key: form.value.publicKey,
      var_go_access: form.value.varGoAccess,
      var_www_access: form.value.varWWWAccess,
    })
    const saved = normalizeAccess(response.data)
    accesses.value = [saved, ...accesses.value.filter((item) => item.username !== saved.username)].sort((left, right) =>
      left.username.localeCompare(right.username),
    )
    notifications.success(`SSH доступ ${saved.username} сохранён`)
    resetForm()
  } catch (err) {
    error.value = err.response?.data?.message || 'Не удалось сохранить SSH доступ'
  } finally {
    saving.value = false
  }
}

const editAccess = (access) => {
  editingUsername.value = access.username
  form.value = {
    username: access.username,
    publicKey: '',
    varGoAccess: access.varGoAccess,
    varWWWAccess: access.varWWWAccess,
  }
  error.value = ''
  formHint.value = 'Оставь поле публичного ключа пустым, если нужно поменять только доступ к папкам.'
}

const deleteAccess = async (access) => {
  if (!window.confirm(`Удалить SSH доступ ${access.username}?`)) return
  saving.value = true
  error.value = ''
  try {
    await authStore.api.delete(`/server/ssh-accesses/${encodeURIComponent(access.username)}`)
    accesses.value = accesses.value.filter((item) => item.username !== access.username)
    notifications.success(`SSH доступ ${access.username} удалён`)
    if (editingUsername.value === access.username) resetForm()
  } catch (err) {
    error.value = err.response?.data?.message || 'Не удалось удалить SSH доступ'
  } finally {
    saving.value = false
  }
}

const readPublicKeyFile = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  form.value.publicKey = (await file.text()).trim()
}

const resetForm = () => {
  editingUsername.value = ''
  form.value = {
    username: '',
    publicKey: '',
    varGoAccess: false,
    varWWWAccess: false,
  }
  error.value = ''
  formHint.value = ''
}

onMounted(loadAccesses)
</script>

<style scoped>
.field {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid rgb(203 213 225);
  background: white;
  padding: 0.75rem 1rem;
  color: rgb(15 23 42);
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.field:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 3px rgb(191 219 254);
}

.field:disabled {
  cursor: not-allowed;
  background: rgb(248 250 252);
  color: rgb(100 116 139);
}
</style>
