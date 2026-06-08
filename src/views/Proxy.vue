<template>
  <div class="min-h-screen bg-slate-100">
    <div class="mx-auto flex max-w-7xl flex-col gap-4 px-3 py-4 sm:px-5 lg:px-7">
      <section class="grid gap-3 lg:grid-cols-[minmax(360px,1.15fr)_repeat(3,minmax(150px,0.42fr))]">
        <article class="rounded-[1.4rem] bg-slate-950 p-4 text-white shadow-xl">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Runtime</p>
              <h2 class="mt-1 truncate text-2xl font-black">{{ runtime.xrayService || 'xray' }}</h2>
              <p class="mt-1 truncate text-xs font-semibold text-slate-400" :title="runtime.configPath">
                {{ runtime.configPath || '/etc/xray/config.json' }}
              </p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-black"
              :class="runtime.xrayActive ? 'bg-emerald-400 text-slate-950' : 'bg-rose-400 text-white'"
            >
              {{ runtime.xrayActive ? 'ACTIVE' : 'DOWN' }}
            </span>
          </div>
          <dl class="mt-4 grid gap-2 sm:grid-cols-3">
            <div class="proxy-runtime-cell">
              <dt>Вход</dt>
              <dd>{{ runtime.inboundSecurity || '—' }}</dd>
            </div>
            <div class="proxy-runtime-cell">
              <dt>Резерв</dt>
              <dd>
                <span
                  class="rounded-full px-2 py-1 text-xs"
                  :class="runtime.failoverEnabled ? 'bg-emerald-400 text-slate-950' : 'bg-rose-400 text-white'"
                >
                  {{ runtime.failoverEnabled ? 'on' : 'off' }}
                </span>
              </dd>
            </div>
            <div class="proxy-runtime-cell min-w-0">
              <dt>Health</dt>
              <dd class="truncate" :title="runtime.healthcheckUrl">{{ shortHealthUrl }}</dd>
            </div>
          </dl>
        </article>

        <article v-for="card in summaryCards" :key="card.label" class="proxy-stat">
          <p>{{ card.label }}</p>
          <div>{{ card.value }}</div>
          <span>{{ card.hint }}</span>
        </article>
      </section>

      <div class="flex flex-col gap-3 rounded-[1.3rem] border border-slate-200 bg-white p-2 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <nav class="flex gap-1 overflow-x-auto">
          <RouterLink
            v-for="tab in tabs"
            :key="tab.key"
            :to="`/proxy/${tab.key}`"
            class="shrink-0 rounded-2xl px-4 py-2 text-sm font-black text-slate-600 transition"
            :class="activeTab === tab.key ? 'bg-slate-950 text-white shadow-sm' : 'hover:bg-slate-100'"
          >
            {{ tab.label }}
          </RouterLink>
        </nav>
        <div class="flex gap-2">
          <button class="proxy-secondary" :disabled="loading" type="button" @click="loadProxy">
            {{ loading ? '...' : 'Обновить' }}
          </button>
          <button class="proxy-primary" :disabled="applying" type="button" @click="applyRuntime">
            {{ applying ? '...' : 'Применить' }}
          </button>
        </div>
      </div>

      <InlineNotice
        v-if="errorMessage"
        tone="error"
        title="Прокси недоступен"
        :message="errorMessage"
      />

      <section v-if="activeTab === 'overview'" class="grid gap-4 xl:grid-cols-3">
        <article class="proxy-panel xl:col-span-2">
          <div class="flex items-center justify-between gap-3">
            <h3 class="proxy-title">Состояние нод</h3>
            <RouterLink class="proxy-secondary" to="/proxy/nodes">Открыть</RouterLink>
          </div>
          <div class="mt-4 grid gap-3 md:grid-cols-3">
            <div v-for="item in nodeSummary" :key="item.label" class="rounded-2xl bg-slate-50 p-4">
              <div class="text-2xl font-black text-slate-950">{{ item.count }}</div>
              <div class="mt-1 text-xs font-black uppercase tracking-[0.18em]" :class="item.class">
                {{ item.label }}
              </div>
            </div>
          </div>
        </article>

        <article class="proxy-panel">
          <div class="flex items-center justify-between gap-3">
            <h3 class="proxy-title">Маршруты</h3>
            <RouterLink class="proxy-secondary" to="/proxy/routes">Открыть</RouterLink>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="rule in enabledRoutes.slice(0, 10)"
              :key="rule.id"
              class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
            >
              {{ rule.value }}
            </span>
          </div>
        </article>
      </section>

      <section v-else-if="activeTab === 'nodes'" class="space-y-4">
        <details
          v-for="group in nodesByCountry"
          :key="group.country"
          class="proxy-panel"
          open
        >
          <summary class="cursor-pointer list-none">
            <div class="flex items-center justify-between gap-3">
              <h3 class="proxy-title">{{ group.country }}</h3>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                {{ group.nodes.length }}
              </span>
            </div>
          </summary>
          <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <article v-for="node in group.nodes" :key="node.id" class="proxy-card">
              <div class="proxy-card-actions">
                <button class="proxy-icon" type="button" title="Проверить" @click="checkNode(node)">↻</button>
                <button class="proxy-icon" type="button" :title="node.enabled ? 'Выключить' : 'Включить'" @click="toggleNode(node)">
                  {{ node.enabled ? '🟢' : '🔴' }}
                </button>
                <button class="proxy-icon" type="button" title="Редактировать" @click="openNodeModal(node)">✎</button>
                <button class="proxy-icon danger" type="button" title="Удалить" @click="deleteNode(node)">🗑</button>
              </div>
              <div class="pr-28">
                <div class="flex items-center gap-2">
                  <span class="h-3 w-3 rounded-full" :class="healthDotClass(node.healthStatus)"></span>
                  <h4 class="truncate text-lg font-black text-slate-950">{{ node.name || node.host }}</h4>
                </div>
                <p class="mt-2 break-all font-mono text-xs text-slate-500">
                  {{ node.maskedUrl || `${node.host}:${node.port}` }}
                </p>
                <div class="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-500">
                  <span class="proxy-chip">{{ poolName(node.poolId) || 'без пула' }}</span>
                  <span class="proxy-chip">{{ node.lastCheckedAt ? formatDate(node.lastCheckedAt) : 'не проверяли' }}</span>
                </div>
                <p v-if="node.lastError" class="mt-3 text-sm font-bold text-rose-600">{{ node.lastError }}</p>
              </div>
            </article>
            <button class="proxy-add-card" type="button" @click="openNodeModal()">
              <span>+</span>
            </button>
          </div>
        </details>
      </section>

      <section v-else-if="activeTab === 'pools'" class="proxy-panel">
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="pool in pools" :key="pool.id" class="proxy-card">
            <div class="proxy-card-actions">
              <button class="proxy-icon" type="button" title="Редактировать" @click="openPoolModal(pool)">✎</button>
              <button class="proxy-icon danger" type="button" title="Удалить" @click="deletePool(pool)">🗑</button>
            </div>
            <div class="pr-20">
              <h4 class="text-lg font-black text-slate-950">{{ pool.name }}</h4>
              <p class="mt-2 text-sm font-semibold text-slate-500">
                Нод: {{ nodes.filter((node) => node.poolId === pool.id).length }}
              </p>
            </div>
          </article>
          <button class="proxy-add-card" type="button" @click="openPoolModal()">
            <span>+</span>
          </button>
        </div>
      </section>

      <section v-else-if="activeTab === 'users'" class="proxy-panel">
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article v-for="user in users" :key="user.id" class="proxy-card">
            <div class="proxy-card-actions">
              <button class="proxy-icon" type="button" :title="user.enabled ? 'Выключить' : 'Включить'" @click="toggleUser(user)">
                {{ user.enabled ? '🟢' : '🔴' }}
              </button>
              <button class="proxy-icon" type="button" title="Редактировать" @click="openUserModal(user)">✎</button>
              <button class="proxy-icon danger" type="button" title="Удалить" @click="deleteUser(user)">🗑</button>
            </div>
            <div class="pr-24">
              <h4 class="text-lg font-black text-slate-950">{{ user.label }}</h4>
              <p class="mt-2 text-sm font-semibold text-slate-500">
                {{ userPoolSummary(user) || 'без пулов' }}
              </p>
            </div>
            <div class="mt-5 grid grid-cols-2 gap-2">
              <button class="proxy-primary" type="button" @click="loadVlessLink(user)">Ссылка</button>
              <button class="proxy-secondary" type="button" @click="loadUserConfig(user)">Config</button>
            </div>
          </article>
          <button class="proxy-add-card" type="button" @click="openUserModal()">
            <span>+</span>
          </button>
        </div>
      </section>

      <section v-else-if="activeTab === 'routes'" class="proxy-panel">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-xl font-black text-slate-950">Маршруты</h3>
          <button class="proxy-add-button" type="button" title="Добавить маршрут" @click="openRouteModal()">+</button>
        </div>

        <div class="proxy-routes-table mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table class="min-w-[720px] w-full border-collapse text-left text-sm">
            <thead class="bg-slate-50 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <th class="px-4 py-3">IP / домен</th>
                <th class="px-4 py-3">Название</th>
                <th class="px-4 py-3">Значение</th>
                <th class="px-4 py-3">Статус</th>
                <th class="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 bg-white">
              <tr v-for="rule in routes" :key="rule.id" class="transition hover:bg-slate-50">
                <td class="px-4 py-3 font-black text-slate-950">{{ routeKindLabel(rule.kind) }}</td>
                <td class="px-4 py-3 font-bold text-slate-800">
                  <div class="truncate" :title="rule.name">{{ rule.name }}</div>
                </td>
                <td class="px-4 py-3 font-mono text-xs font-bold text-slate-500">
                  <div class="truncate" :title="rule.value">{{ rule.value }}</div>
                </td>
                <td class="px-4 py-3">
                  <button
                    class="proxy-status-toggle"
                    :class="{ off: !rule.enabled }"
                    type="button"
                    :title="rule.enabled ? 'Выключить' : 'Включить'"
                    @click="toggleRoute(rule)"
                  >
                    {{ rule.enabled ? 'Вкл' : 'Выкл' }}
                  </button>
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-end gap-2">
                    <button class="proxy-icon" type="button" title="Редактировать" @click="openRouteModal(rule)">✎</button>
                    <button class="proxy-icon danger" type="button" title="Удалить" @click="deleteRoute(rule)">🗑</button>
                  </div>
                </td>
              </tr>
              <tr v-if="!routes.length">
                <td class="px-4 py-8 text-center font-bold text-slate-400" colspan="5">Маршрутов пока нет</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div v-if="modal.open" class="proxy-modal-backdrop" @click.self="closeModal">
      <form class="proxy-modal" @submit.prevent="submitModal">
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-xl font-black text-slate-950">{{ modalTitle }}</h3>
          <button class="proxy-secondary" type="button" @click="closeModal">Закрыть</button>
        </div>

        <div v-if="modal.type === 'node'" class="mt-4 space-y-3">
          <textarea
            v-if="modal.mode === 'create'"
            v-model.trim="nodeDraft.url"
            class="proxy-input min-h-32 font-mono text-xs"
            placeholder="vless://..."
            @blur="autofillNodeFromUrl"
          ></textarea>
          <input v-model.trim="nodeDraft.name" class="proxy-input" placeholder="Название" />
          <div class="grid grid-cols-2 gap-2">
            <input v-model.trim="nodeDraft.country" class="proxy-input" placeholder="Страна, например FI" />
            <input v-model.number="nodeDraft.priority" type="number" class="proxy-input" placeholder="Priority" />
          </div>
          <select v-model="nodeDraft.pool_id" class="proxy-input">
            <option value="">Без пула</option>
            <option v-for="pool in pools" :key="pool.id" :value="pool.id">{{ pool.name }}</option>
          </select>
          <label class="proxy-check">
            <input v-model="nodeDraft.enabled" type="checkbox" />
            Включена
          </label>
        </div>

        <div v-else-if="modal.type === 'pool'" class="mt-4 space-y-3">
          <input v-model.trim="poolDraft.name" class="proxy-input" placeholder="Название пула" />
        </div>

        <div v-else-if="modal.type === 'user'" class="mt-4 space-y-3">
          <input v-model.trim="userDraft.label" class="proxy-input" placeholder="label, например evgeny" />
          <div class="space-y-2">
            <label
              v-for="pool in pools"
              :key="pool.id"
              class="grid grid-cols-[auto_1fr_90px] items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <input :checked="isUserPoolSelected(pool.id)" type="checkbox" @change="toggleUserPool(pool.id)" />
              <span class="text-sm font-black text-slate-800">{{ pool.name }}</span>
              <input
                class="proxy-priority-input"
                type="number"
                :value="poolPriority(pool.id)"
                @input="setPoolPriority(pool.id, $event.target.value)"
              />
            </label>
          </div>
          <label class="proxy-check">
            <input v-model="userDraft.enabled" type="checkbox" />
            Включен
          </label>
        </div>

        <div v-else-if="modal.type === 'route'" class="mt-4 space-y-3">
          <input v-model.trim="routeDraft.name" class="proxy-input" placeholder="Название" />
          <select v-model="routeDraft.kind" class="proxy-input">
            <option value="domain">Домен</option>
            <option value="ip">IP / geoip</option>
          </select>
          <input v-model.trim="routeDraft.value" class="proxy-input font-mono" placeholder=".ru или geoip:ru" />
          <label class="proxy-check">
            <input v-model="routeDraft.enabled" type="checkbox" />
            Включен
          </label>
        </div>

        <button class="proxy-primary mt-5 w-full" type="submit">
          {{ modal.mode === 'edit' ? 'Сохранить' : 'Добавить' }}
        </button>
      </form>
    </div>

    <div v-if="vlessModal.open" class="proxy-modal-backdrop" @click.self="closeVlessModal">
      <div class="proxy-modal max-w-3xl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-xl font-black text-slate-950">{{ vlessModal.title }}</h3>
            <p class="mt-1 text-sm text-slate-500">{{ vlessModal.userLabel }}</p>
          </div>
          <button class="proxy-secondary" type="button" @click="closeVlessModal">Закрыть</button>
        </div>
        <textarea readonly class="proxy-input mt-4 min-h-44 font-mono text-xs" :value="vlessModal.content"></textarea>
        <div class="mt-3 flex gap-2">
          <button class="proxy-primary" type="button" @click="copyVlessModalContent">Скопировать</button>
          <button v-if="vlessModal.filename" class="proxy-secondary" type="button" @click="downloadUserConfig">Скачать</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import InlineNotice from '../components/InlineNotice.vue'
import {
  inferVlessCountry,
  inferVlessName,
  normalizeProxyState,
  proxyHealthTone,
} from '../lib/proxy.js'
import { isUnauthorizedError } from '../lib/auth-session.js'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationsStore } from '../stores/notifications.js'

const authStore = useAuthStore()
const notifications = useNotificationsStore()
const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'overview', label: 'Обзор' },
  { key: 'nodes', label: 'Ноды' },
  { key: 'pools', label: 'Пулы' },
  { key: 'users', label: 'Пользователи' },
  { key: 'routes', label: 'Маршруты' },
]

const loading = ref(false)
const applying = ref(false)
const errorMessage = ref('')
const runtime = ref(normalizeProxyState().runtime)
const nodes = ref([])
const pools = ref([])
const users = ref([])
const routes = ref([])

const modal = reactive({ open: false, type: '', mode: 'create', id: '' })
const vlessModal = reactive({ open: false, title: '', userLabel: '', content: '', filename: '' })

const nodeDraft = reactive(defaultNodeDraft())
const poolDraft = reactive(defaultPoolDraft())
const userDraft = reactive(defaultUserDraft())
const routeDraft = reactive(defaultRouteDraft())

const activeTab = computed(() => {
  const section = String(route.params.section || 'overview')
  return tabs.some((tab) => tab.key === section) ? section : 'overview'
})

watch(
  () => route.params.section,
  (section) => {
    if (section && !tabs.some((tab) => tab.key === section)) {
      router.replace('/proxy/overview')
    }
  },
  { immediate: true },
)

const shortHealthUrl = computed(() => {
  const value = runtime.value.healthcheckUrl || ''
  try {
    return new URL(value).hostname || value
  } catch {
    return value || 'tcp'
  }
})

const enabledRoutes = computed(() => routes.value.filter((rule) => rule.enabled))
const summaryCards = computed(() => [
  { label: 'Ноды', value: nodes.value.length, hint: `${nodeSummary.value[0].count} up` },
  { label: 'Пулы', value: pools.value.length, hint: 'группы' },
  { label: 'Пользователи', value: users.value.length, hint: 'доступы' },
])

const nodeSummary = computed(() => {
  const counters = nodes.value.reduce(
    (acc, node) => {
      acc[node.healthStatus] = (acc[node.healthStatus] || 0) + 1
      return acc
    },
    { up: 0, degraded: 0, down: 0 },
  )
  return [
    { label: 'up', count: counters.up || 0, class: 'text-emerald-600' },
    { label: 'warn', count: counters.degraded || 0, class: 'text-amber-600' },
    { label: 'down', count: counters.down || 0, class: 'text-rose-600' },
  ]
})

const nodesByCountry = computed(() => {
  const groups = new Map()
  for (const node of nodes.value) {
    const country = normalizeCountryLabel(node.country)
    if (!groups.has(country)) groups.set(country, [])
    groups.get(country).push(node)
  }
  const result = [...groups.entries()].map(([country, groupNodes]) => ({
    country,
    nodes: groupNodes,
  }))
  result.sort((left, right) => left.country.localeCompare(right.country, 'ru'))
  return result
})

const modalTitle = computed(() => {
  const action = modal.mode === 'edit' ? 'Редактировать' : 'Добавить'
  const entity = { node: 'ноду', pool: 'пул', user: 'пользователя', route: 'маршрут' }[modal.type]
  return `${action} ${entity || ''}`
})

const loadProxy = async () => {
  loading.value = true
  try {
    const [runtimeRes, nodesRes, poolsRes, usersRes, routesRes] = await Promise.all([
      authStore.api.get('/proxy/runtime/status'),
      authStore.api.get('/proxy/nodes'),
      authStore.api.get('/proxy/pools'),
      authStore.api.get('/proxy/users'),
      authStore.api.get('/proxy/routes'),
    ])
    const state = normalizeProxyState({
      runtime: runtimeRes.data,
      nodes: nodesRes.data,
      pools: poolsRes.data,
      users: usersRes.data,
      routes: routesRes.data,
    })
    runtime.value = state.runtime
    nodes.value = state.nodes
    pools.value = state.pools
    users.value = state.users
    routes.value = state.routes
    errorMessage.value = ''
  } catch (error) {
    if (isUnauthorizedError(error)) return
    errorMessage.value = error.response?.data?.message || 'Не получилось получить данные proxy.'
  } finally {
    loading.value = false
  }
}

const applyRuntime = async () => {
  applying.value = true
  try {
    await authStore.api.post('/proxy/runtime/apply')
    notifications.success('Xray config применен')
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось применить Xray config')
  } finally {
    applying.value = false
  }
}

function defaultNodeDraft() {
  return { name: '', country: '', pool_id: '', url: '', enabled: true, priority: 100 }
}

function defaultPoolDraft() {
  return { name: '' }
}

function defaultUserDraft() {
  return { label: '', enabled: true, pool_priorities: [] }
}

function defaultRouteDraft() {
  return { name: '', kind: 'domain', value: '', enabled: true }
}

const resetDraft = (target, value) => {
  Object.keys(target).forEach((key) => delete target[key])
  Object.assign(target, value)
}

const openNodeModal = (node = null) => {
  modal.open = true
  modal.type = 'node'
  modal.mode = node ? 'edit' : 'create'
  modal.id = node?.id || ''
  resetDraft(nodeDraft, node ? {
    name: node.name,
    country: node.country,
    pool_id: node.poolId,
    url: '',
    enabled: node.enabled,
    priority: node.priority,
  } : defaultNodeDraft())
}

const openPoolModal = (pool = null) => {
  modal.open = true
  modal.type = 'pool'
  modal.mode = pool ? 'edit' : 'create'
  modal.id = pool?.id || ''
  resetDraft(poolDraft, pool ? { name: pool.name } : defaultPoolDraft())
}

const openUserModal = (user = null) => {
  modal.open = true
  modal.type = 'user'
  modal.mode = user ? 'edit' : 'create'
  modal.id = user?.id || ''
  resetDraft(userDraft, user ? {
    label: user.label,
    enabled: user.enabled,
    pool_priorities: user.poolPriorities.length
      ? user.poolPriorities.map((item) => ({ ...item }))
      : (user.poolId ? [{ poolId: user.poolId, priority: 100 }] : []),
  } : defaultUserDraft())
}

const openRouteModal = (rule = null) => {
  modal.open = true
  modal.type = 'route'
  modal.mode = rule ? 'edit' : 'create'
  modal.id = rule?.id || ''
  resetDraft(routeDraft, rule ? {
    name: rule.name,
    kind: rule.kind,
    value: rule.value,
    enabled: rule.enabled,
  } : defaultRouteDraft())
}

const closeModal = () => {
  modal.open = false
  modal.type = ''
  modal.id = ''
}

const submitModal = async () => {
  if (modal.type === 'node') return saveNode()
  if (modal.type === 'pool') return savePool()
  if (modal.type === 'user') return saveUser()
  if (modal.type === 'route') return saveRoute()
}

const autofillNodeFromUrl = () => {
  if (!nodeDraft.url) return
  if (!nodeDraft.name) nodeDraft.name = inferVlessName(nodeDraft.url)
  if (!nodeDraft.country) nodeDraft.country = inferVlessCountry(nodeDraft.url)
}

const saveNode = async () => {
  if (modal.mode === 'create' && !nodeDraft.url) {
    notifications.error('Вставь VLESS ссылку')
    return
  }
  autofillNodeFromUrl()
  try {
    const payload = {
      name: nodeDraft.name || undefined,
      country: nodeDraft.country || undefined,
      pool_id: nodeDraft.pool_id || undefined,
      enabled: nodeDraft.enabled,
      priority: Number(nodeDraft.priority) || 100,
    }
    if (modal.mode === 'create') {
      await authStore.api.post('/proxy/nodes', { ...payload, url: nodeDraft.url })
    } else {
      await authStore.api.patch(`/proxy/nodes/${modal.id}`, payload)
    }
    notifications.success(modal.mode === 'edit' ? 'Нода сохранена' : 'Нода добавлена')
    closeModal()
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось сохранить ноду')
  }
}

const savePool = async () => {
  if (!poolDraft.name) {
    notifications.error('Укажи название пула')
    return
  }
  try {
    if (modal.mode === 'create') {
      await authStore.api.post('/proxy/pools', { name: poolDraft.name, mode: 'auto_failover' })
    } else {
      await authStore.api.patch(`/proxy/pools/${modal.id}`, { name: poolDraft.name, mode: 'auto_failover' })
    }
    notifications.success('Пул сохранен')
    closeModal()
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось сохранить пул')
  }
}

const saveUser = async () => {
  if (!userDraft.label) {
    notifications.error('Укажи label пользователя')
    return
  }
  const priorities = normalizedUserPoolPayload()
  try {
    const payload = {
      label: userDraft.label,
      enabled: userDraft.enabled,
      pool_id: priorities[0]?.pool_id,
      pool_priorities: priorities,
      selection_mode: priorities.length ? 'pool_chain' : 'auto_failover',
    }
    if (modal.mode === 'create') {
      await authStore.api.post('/proxy/users', payload)
    } else {
      await authStore.api.patch(`/proxy/users/${modal.id}`, payload)
    }
    notifications.success('Пользователь сохранен')
    closeModal()
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось сохранить пользователя')
  }
}

const saveRoute = async () => {
  if (!routeDraft.name || !routeDraft.value) {
    notifications.error('Укажи название и значение маршрута')
    return
  }
  try {
    const payload = {
      name: routeDraft.name,
      kind: routeDraft.kind,
      value: routeDraft.value,
      outbound_tag: 'direct',
      enabled: routeDraft.enabled,
      priority: 100,
    }
    if (modal.mode === 'create') {
      await authStore.api.post('/proxy/routes', payload)
    } else {
      await authStore.api.patch(`/proxy/routes/${modal.id}`, payload)
    }
    notifications.success('Маршрут сохранен')
    closeModal()
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось сохранить маршрут')
  }
}

const checkNode = async (node) => {
  try {
    const { data } = await authStore.api.post(`/proxy/nodes/${node.id}/check`)
    notifications[data.ok ? 'success' : 'error'](data.ok ? 'Нода отвечает' : data.error || 'Нода недоступна')
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось проверить ноду')
  }
}

const toggleNode = async (node) => patchAndReload(`/proxy/nodes/${node.id}`, { enabled: !node.enabled }, 'Не удалось переключить ноду')
const toggleUser = async (user) => patchAndReload(`/proxy/users/${user.id}`, { enabled: !user.enabled }, 'Не удалось переключить пользователя')
const toggleRoute = async (rule) => patchAndReload(`/proxy/routes/${rule.id}`, { enabled: !rule.enabled }, 'Не удалось переключить маршрут')

const patchAndReload = async (url, payload, fallback) => {
  try {
    await authStore.api.patch(url, payload)
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, fallback)
  }
}

const deleteNode = async (node) => deleteAndReload(`/proxy/nodes/${node.id}`, `Удалить ноду ${node.name || node.host}?`, 'Нода удалена', 'Не удалось удалить ноду')
const deletePool = async (pool) => deleteAndReload(`/proxy/pools/${pool.id}`, `Удалить пул ${pool.name}?`, 'Пул удален', 'Не удалось удалить пул')
const deleteUser = async (user) => deleteAndReload(`/proxy/users/${user.id}`, `Удалить пользователя ${user.label}?`, 'Пользователь удален', 'Не удалось удалить пользователя')
const deleteRoute = async (rule) => deleteAndReload(`/proxy/routes/${rule.id}`, `Удалить маршрут ${rule.name}?`, 'Маршрут удален', 'Не удалось удалить маршрут')

const deleteAndReload = async (url, question, success, fallback) => {
  if (!window.confirm(question)) return
  try {
    await authStore.api.delete(url)
    notifications.success(success)
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, fallback)
  }
}

const loadVlessLink = async (user) => {
  try {
    const { data } = await authStore.api.get(`/proxy/users/${user.id}/vless-link`)
    vlessModal.open = true
    vlessModal.title = 'VLESS ссылка'
    vlessModal.userLabel = user.label
    vlessModal.content = data.link || ''
    vlessModal.filename = ''
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось получить VLESS ссылку')
  }
}

const loadUserConfig = async (user) => {
  try {
    const { data } = await authStore.api.get(`/proxy/users/${user.id}/config`)
    vlessModal.open = true
    vlessModal.title = 'Клиентский config'
    vlessModal.userLabel = user.label
    vlessModal.content = JSON.stringify(data.config || {}, null, 2)
    vlessModal.filename = data.filename || `${user.label}-proxy-config.json`
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось получить config')
  }
}

const copyVlessModalContent = async () => {
  await navigator.clipboard?.writeText(vlessModal.content)
  notifications.success('Скопировано')
}

const downloadUserConfig = () => {
  const blob = new Blob([vlessModal.content], { type: 'application/json' })
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = vlessModal.filename
  link.click()
  URL.revokeObjectURL(href)
}

const closeVlessModal = () => {
  vlessModal.open = false
}

const isUserPoolSelected = (poolId) => userDraft.pool_priorities.some((item) => item.poolId === poolId)
const poolPriority = (poolId) => userDraft.pool_priorities.find((item) => item.poolId === poolId)?.priority || 100

const toggleUserPool = (poolId) => {
  const index = userDraft.pool_priorities.findIndex((item) => item.poolId === poolId)
  if (index >= 0) {
    userDraft.pool_priorities.splice(index, 1)
  } else {
    userDraft.pool_priorities.push({ poolId, priority: nextUserPoolPriority() })
  }
}

const setPoolPriority = (poolId, value) => {
  const item = userDraft.pool_priorities.find((entry) => entry.poolId === poolId)
  if (item) item.priority = Number(value) || 100
}

const nextUserPoolPriority = () => {
  const max = Math.max(0, ...userDraft.pool_priorities.map((item) => Number(item.priority) || 0))
  return max + 100
}

const normalizedUserPoolPayload = () =>
  [...userDraft.pool_priorities]
    .filter((item) => item.poolId)
    .sort((left, right) => (Number(left.priority) || 100) - (Number(right.priority) || 100))
    .map((item, index) => ({
      pool_id: item.poolId,
      priority: Number(item.priority) || (index + 1) * 100,
    }))

const poolName = (id) => pools.value.find((pool) => pool.id === id)?.name || ''
const userPoolSummary = (user) =>
  (user.poolPriorities || [])
    .slice()
    .sort((left, right) => left.priority - right.priority)
    .map((item) => poolName(item.poolId))
    .filter(Boolean)
    .join(' → ')

const formatDate = (value) => new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

const healthDotClass = (status) => {
  const tone = proxyHealthTone(status)
  if (tone === 'ok') return 'bg-emerald-500'
  if (tone === 'warning') return 'bg-amber-400'
  if (tone === 'error') return 'bg-rose-500'
  return 'bg-slate-300'
}

const normalizeCountryLabel = (country) => {
  const value = String(country || '').trim().toUpperCase()
  const labels = { DE: 'Германия', FI: 'Финляндия', NL: 'Нидерланды', US: 'США' }
  return labels[value] || value || 'Без страны'
}

const routeKindLabel = (kind) => (kind === 'ip' ? 'IP' : 'Домен')

onMounted(loadProxy)
</script>

<style scoped>
.proxy-panel {
  border: 1px solid rgb(226 232 240);
  border-radius: 1.5rem;
  background: white;
  padding: 1rem;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.06);
}

.proxy-card {
  position: relative;
  min-height: 9.5rem;
  border: 1px solid rgb(226 232 240);
  border-radius: 1.25rem;
  background: rgb(248 250 252);
  padding: 1rem;
}

.proxy-card-actions {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.35rem;
}

.proxy-icon {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 999px;
  border: 1px solid rgb(226 232 240);
  background: white;
  font-size: 0.85rem;
  font-weight: 900;
  color: rgb(51 65 85);
}

.proxy-icon:hover {
  background: rgb(241 245 249);
}

.proxy-icon.danger {
  color: rgb(225 29 72);
}

.proxy-add-card {
  display: grid;
  min-height: 9.5rem;
  place-items: center;
  border-radius: 1.25rem;
  border: 1px dashed rgb(148 163 184);
  background: rgb(248 250 252);
  color: rgb(71 85 105);
}

.proxy-add-card span {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 999px;
  background: rgb(15 23 42);
  color: white;
  font-size: 1.75rem;
  font-weight: 900;
}

.proxy-add-button {
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border-radius: 999px;
  background: rgb(15 23 42);
  color: white;
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
}

.proxy-add-button:hover {
  background: rgb(30 41 59);
}

.proxy-routes-table table {
  table-layout: fixed;
}

.proxy-routes-table th:nth-child(1),
.proxy-routes-table td:nth-child(1) {
  width: 6.5rem;
}

.proxy-routes-table th:nth-child(2),
.proxy-routes-table td:nth-child(2) {
  width: 12rem;
}

.proxy-routes-table th:nth-child(4),
.proxy-routes-table td:nth-child(4) {
  width: 6.5rem;
}

.proxy-routes-table th:nth-child(5),
.proxy-routes-table td:nth-child(5) {
  width: 7.5rem;
}

.proxy-status-toggle {
  min-width: 3.3rem;
  border-radius: 999px;
  background: rgb(16 185 129);
  padding: 0.25rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 900;
  color: white;
}

.proxy-status-toggle.off {
  background: rgb(244 63 94);
}

.proxy-runtime-cell {
  min-width: 0;
  border-radius: 1rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  background: rgb(255 255 255 / 0.1);
  padding: 0.75rem;
}

.proxy-runtime-cell dt {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgb(148 163 184);
}

.proxy-runtime-cell dd {
  margin-top: 0.25rem;
  min-width: 0;
  font-weight: 900;
}

.proxy-stat {
  border: 1px solid rgb(226 232 240);
  border-radius: 1.4rem;
  background: white;
  padding: 1rem;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.06);
}

.proxy-stat p {
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgb(100 116 139);
}

.proxy-stat div {
  margin-top: 0.4rem;
  font-size: 2rem;
  font-weight: 900;
  color: rgb(15 23 42);
}

.proxy-stat span,
.proxy-title,
.proxy-chip {
  font-weight: 900;
}

.proxy-title {
  font-size: 1.125rem;
  color: rgb(15 23 42);
}

.proxy-chip {
  border-radius: 999px;
  background: white;
  padding: 0.35rem 0.6rem;
}

.proxy-primary,
.proxy-secondary {
  border-radius: 1rem;
  padding: 0.65rem 0.9rem;
  font-size: 0.875rem;
  font-weight: 900;
  transition: background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}

.proxy-primary {
  background: rgb(15 23 42);
  color: white;
}

.proxy-primary:hover {
  background: rgb(30 41 59);
}

.proxy-secondary {
  border: 1px solid rgb(226 232 240);
  background: white;
  color: rgb(51 65 85);
}

.proxy-secondary:hover {
  background: rgb(248 250 252);
}

.proxy-input,
.proxy-priority-input {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid rgb(226 232 240);
  background: white;
  color: rgb(15 23 42);
  outline: none;
}

.proxy-input {
  padding: 0.75rem 0.9rem;
}

.proxy-priority-input {
  padding: 0.45rem 0.6rem;
  font-weight: 800;
}

.proxy-input:focus,
.proxy-priority-input:focus {
  border-color: rgb(37 99 235);
  box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
}

.proxy-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 1rem;
  border: 1px solid rgb(226 232 240);
  padding: 0.65rem 0.85rem;
  font-size: 0.875rem;
  font-weight: 800;
  color: rgb(51 65 85);
}

.proxy-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(15 23 42 / 0.52);
  padding: 1rem;
}

.proxy-modal {
  width: min(100%, 34rem);
  max-height: min(90vh, 48rem);
  overflow: auto;
  border-radius: 1.5rem;
  background: white;
  padding: 1.25rem;
  box-shadow: 0 24px 80px rgb(15 23 42 / 0.28);
}
</style>
