<template>
  <div
    class="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-6 sm:px-6 lg:px-8"
  >
    <div class="mx-auto max-w-7xl">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-slate-950">Пользователи</h2>
          <p class="mt-1 text-sm text-slate-500">
            CRUD, роли, доступные приложения и стартовая страница.
          </p>
        </div>
        <button
          type="button"
          class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          @click="startCreate"
        >
          + Добавить пользователя
        </button>
      </div>

      <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div v-if="loading" class="p-6 text-sm text-slate-500">Загружаем пользователей...</div>
        <div v-else-if="!users.length" class="p-6 text-sm text-slate-500">
          Пользователей пока нет.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead
              class="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              <tr>
                <th class="px-4 py-3">Логин</th>
                <th class="px-4 py-3">Email</th>
                <th class="px-4 py-3">Роли</th>
                <th class="px-4 py-3">Права</th>
                <th class="px-4 py-3">Группы</th>
                <th class="px-4 py-3">Старт</th>
                <th class="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="user in users" :key="user.email" class="align-top">
                <td class="px-4 py-4 font-semibold text-slate-950">{{ user.login }}</td>
                <td class="px-4 py-4 text-slate-600">{{ user.email }}</td>
                <td class="px-4 py-4">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-if="user.isSuperAdmin"
                      class="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800"
                    >
                      super admin
                    </span>
                    <span
                      v-if="user.isAdmin"
                      class="rounded-full bg-sky-100 px-2 py-1 text-xs font-bold text-sky-800"
                    >
                      admin
                    </span>
                    <span
                      v-if="!user.isAdmin && !user.isSuperAdmin"
                      class="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600"
                    >
                      user
                    </span>
                  </div>
                </td>
                <td class="px-4 py-4 text-slate-600">
                  {{ permissionLabels(user.appPermissions).join(', ') || 'Нет доступа' }}
                </td>
                <td class="px-4 py-4 text-slate-600">
                  {{ visibilityGroupLabels(user.visibilityGroups).join(', ') }}
                </td>
                <td class="px-4 py-4 text-slate-600">{{ labelForApp(user.defaultApp) }}</td>
                <td class="px-4 py-4">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      @click="startEdit(user)"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      :disabled="user.email === authStore.user?.email"
                      @click="deleteUser(user)"
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
    </div>

    <div
      v-if="editing"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6"
    >
      <form
        class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
        @submit.prevent="saveUser"
      >
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-xl font-bold text-slate-950">
              {{ editingMode === 'create' ? 'Новый пользователь' : 'Редактирование' }}
            </h3>
            <p class="mt-1 text-sm text-slate-500">
              Выдай человеку только те приложения, которые ему реально нужны.
            </p>
          </div>
          <button
            type="button"
            class="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            @click="closeEditor"
          >
            Закрыть
          </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >Логин</span
            >
            <input v-model="form.login" class="field" required />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >Email</span
            >
            <input v-model="form.email" type="email" class="field" required />
          </label>
          <label class="block sm:col-span-2">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {{ editingMode === 'create' ? 'Пароль' : 'Новый пароль' }}
            </span>
            <input
              v-model="form.password"
              type="password"
              class="field"
              :required="editingMode === 'create'"
              placeholder="Оставь пустым, если менять не нужно"
            />
          </label>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2">
          <label
            class="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <span class="text-sm font-semibold text-slate-950">Admin</span>
            <input v-model="form.isAdmin" type="checkbox" class="h-5 w-5" />
          </label>
          <label
            class="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <span class="text-sm font-semibold text-amber-950">Super admin</span>
            <input v-model="form.isSuperAdmin" type="checkbox" class="h-5 w-5" />
          </label>
        </div>

        <div class="mt-5">
          <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Права приложений
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <label
              v-for="option in availablePermissionOptions"
              :key="option.value"
              class="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <span class="text-sm font-semibold text-slate-800">{{ option.label }}</span>
              <input
                v-model="form.appPermissions"
                type="checkbox"
                class="h-5 w-5"
                :value="option.value"
              />
            </label>
          </div>
        </div>

        <div class="mt-5">
          <div class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Группы видимости
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div v-if="selectedVisibilityGroups.length" class="mb-3 flex flex-wrap gap-2">
              <button
                v-for="group in selectedVisibilityGroups"
                :key="group"
                type="button"
                class="inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                @click="removeVisibilityGroup(group)"
              >
                {{ group }}
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div v-else class="mb-3 text-xs text-slate-500">
              Если ничего не выбрать, сохранится группа general.
            </div>

            <div class="flex flex-col gap-2 sm:flex-row">
              <input
                v-model="newVisibilityGroupInput"
                class="field bg-white"
                placeholder="Например: family или work-team"
                @keydown.enter.prevent="addVisibilityGroup()"
              />
              <button
                type="button"
                class="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
                @click="addVisibilityGroup()"
              >
                Добавить
              </button>
            </div>

            <div v-if="unusedVisibilityGroupOptions.length" class="mt-3">
              <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Быстрый выбор
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="group in unusedVisibilityGroupOptions"
                  :key="group"
                  type="button"
                  class="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100"
                  @click="addVisibilityGroup(group)"
                >
                  + {{ group }}
                </button>
              </div>
            </div>
          </div>
          <span class="mt-1 block text-xs text-slate-500">
            Можно выбрать существующие группы или вписать новую латиницей и нажать Enter.
          </span>
        </div>

        <label class="mt-5 block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >Стартовая страница</span
          >
          <select v-model="form.defaultApp" class="field">
            <option
              v-for="option in defaultOptionsForForm"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </label>

        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="closeEditor"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="saving"
          >
            {{ saving ? 'Сохраняем...' : 'Сохранить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { DEFAULT_APP_OPTIONS, resolveDefaultAppValue } from '../lib/default-app.js'
import {
  collectVisibilityGroupOptions,
  DEFAULT_VISIBILITY_GROUP,
  normalizeVisibilityGroups,
  splitVisibilityGroupInput,
} from '../lib/visibility-groups.js'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationsStore } from '../stores/notifications.js'

const authStore = useAuthStore()
const notifications = useNotificationsStore()

const users = ref([])
const loading = ref(false)
const saving = ref(false)
const editing = ref(false)
const editingMode = ref('create')
const originalEmail = ref('')
const form = ref(createEmptyForm())
const selectedVisibilityGroups = ref([DEFAULT_VISIBILITY_GROUP])
const newVisibilityGroupInput = ref('')

const permissionOptions = DEFAULT_APP_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}))

const availablePermissionOptions = computed(() =>
  permissionOptions.filter((option) => {
    if (option.value === 'dashboard') {
      return form.value.isSuperAdmin
    }
    return true
  }),
)

const defaultOptionsForForm = computed(() => {
  const allowed = new Set(form.value.appPermissions)
  const options = DEFAULT_APP_OPTIONS.filter((option) => allowed.has(option.value))
  return options.length ? options : DEFAULT_APP_OPTIONS.filter((option) => option.value === 'chat')
})

const visibilityGroupOptions = computed(() =>
  collectVisibilityGroupOptions(users.value, selectedVisibilityGroups.value),
)

const unusedVisibilityGroupOptions = computed(() =>
  visibilityGroupOptions.value.filter((group) => !selectedVisibilityGroups.value.includes(group)),
)

watch(
  () => [form.value.isAdmin, form.value.isSuperAdmin],
  () => {
    const allowed = new Set(availablePermissionOptions.value.map((option) => option.value))
    form.value.appPermissions = form.value.appPermissions.filter((permission) =>
      allowed.has(permission),
    )
    if (form.value.isSuperAdmin && !form.value.appPermissions.includes('dashboard')) {
      form.value.appPermissions.unshift('dashboard')
    }
    if (!form.value.isSuperAdmin && form.value.defaultApp === 'dashboard') {
      form.value.defaultApp = 'chat'
    }
  },
)

watch(
  () => form.value.appPermissions.slice(),
  () => {
    if (!form.value.appPermissions.includes(form.value.defaultApp)) {
      form.value.defaultApp = form.value.appPermissions.includes('chat')
        ? 'chat'
        : form.value.appPermissions[0] || 'chat'
    }
  },
)

const loadUsers = async () => {
  loading.value = true
  try {
    users.value = await authStore.fetchAdminUsers()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось загрузить пользователей')
  } finally {
    loading.value = false
  }
}

const startCreate = () => {
  editingMode.value = 'create'
  originalEmail.value = ''
  form.value = createEmptyForm()
  selectedVisibilityGroups.value = [DEFAULT_VISIBILITY_GROUP]
  newVisibilityGroupInput.value = ''
  editing.value = true
}

const startEdit = (user) => {
  editingMode.value = 'edit'
  originalEmail.value = user.email
  form.value = {
    login: user.login,
    email: user.email,
    password: '',
    isAdmin: Boolean(user.isAdmin),
    isSuperAdmin: Boolean(user.isSuperAdmin),
    defaultApp: resolveDefaultAppValue(user.defaultApp),
    appPermissions: Array.isArray(user.appPermissions) ? [...user.appPermissions] : ['chat'],
  }
  selectedVisibilityGroups.value = normalizeVisibilityGroups(user.visibilityGroups)
  newVisibilityGroupInput.value = ''
  editing.value = true
}

const closeEditor = () => {
  editing.value = false
  saving.value = false
}

const saveUser = async () => {
  saving.value = true
  try {
    const payload = {
      login: form.value.login.trim(),
      email: form.value.email.trim(),
      is_admin: Boolean(form.value.isAdmin || form.value.isSuperAdmin),
      is_super_admin: Boolean(form.value.isSuperAdmin),
      default_app: resolveDefaultAppValue(form.value.defaultApp),
      app_permissions: [...form.value.appPermissions],
      visibility_groups: normalizeVisibilityGroups(selectedVisibilityGroups.value),
    }
    if (form.value.password.trim()) {
      payload.password = form.value.password.trim()
    }

    if (editingMode.value === 'create') {
      await authStore.createAdminUser(payload)
      notifications.success('Пользователь создан')
    } else {
      await authStore.updateAdminUser(originalEmail.value, payload)
      notifications.success('Пользователь обновлён')
    }
    closeEditor()
    await loadUsers()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось сохранить пользователя')
  } finally {
    saving.value = false
  }
}

const deleteUser = async (user) => {
  if (!window.confirm(`Удалить пользователя ${user.login}?`)) {
    return
  }
  try {
    await authStore.deleteAdminUser(user.email)
    users.value = users.value.filter((item) => item.email !== user.email)
    notifications.success('Пользователь удалён')
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось удалить пользователя')
  }
}

const permissionLabels = (permissions = []) =>
  permissions.map((permission) => labelForApp(permission)).filter(Boolean)

const visibilityGroupLabels = (groups = []) => normalizeVisibilityGroups(groups)

const labelForApp = (app) =>
  DEFAULT_APP_OPTIONS.find((option) => option.value === app)?.label || app

const addVisibilityGroup = (value = newVisibilityGroupInput.value) => {
  const nextGroups = [
    ...selectedVisibilityGroups.value,
    ...splitVisibilityGroupInput(value || newVisibilityGroupInput.value),
  ]
  selectedVisibilityGroups.value = normalizeVisibilityGroups(
    nextGroups,
    selectedVisibilityGroups.value,
  )
  newVisibilityGroupInput.value = ''
}

const removeVisibilityGroup = (group) => {
  selectedVisibilityGroups.value = selectedVisibilityGroups.value.filter((item) => item !== group)
}

function createEmptyForm() {
  return {
    login: '',
    email: '',
    password: '',
    isAdmin: false,
    isSuperAdmin: false,
    defaultApp: 'chat',
    appPermissions: ['chat'],
  }
}

onMounted(loadUsers)
</script>

<style scoped>
.field {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid rgb(226 232 240);
  background: rgb(248 250 252);
  padding: 0.75rem 0.875rem;
  font-size: 0.875rem;
  color: rgb(15 23 42);
  outline: none;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.field:focus {
  border-color: rgb(125 211 252);
  background: white;
}
</style>
