<template>
  <div class="min-h-screen bg-slate-100">
    <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <header class="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Proxy gateway</p>
            <h2 class="mt-1 text-3xl font-black tracking-tight text-slate-950">Прокси</h2>
            <p class="mt-1 text-sm font-semibold text-slate-500">
              Ноды, пользователи, пулы и direct-маршруты для xray.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
              {{ runtime.localProxyListen || '127.0.0.1' }}:{{ runtime.localProxyPort || '—' }}
            </span>
            <button class="proxy-secondary" :disabled="loading" type="button" @click="loadProxy">
              {{ loading ? 'Обновляем...' : 'Обновить' }}
            </button>
            <button class="proxy-primary" :disabled="applying" type="button" @click="applyRuntime">
              {{ applying ? 'Применяем...' : 'Применить' }}
            </button>
          </div>
        </div>
      </header>

      <InlineNotice
        v-if="errorMessage"
        tone="error"
        title="Прокси недоступен"
        :message="errorMessage"
      />

      <section class="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(160px,0.45fr))]">
        <article class="rounded-[1.5rem] bg-slate-950 p-4 text-white shadow-xl">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Runtime</p>
              <h3 class="mt-2 text-2xl font-black">{{ runtime.xrayService || 'xray' }}</h3>
              <p class="mt-1 break-all text-xs font-semibold text-slate-400">
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
            <div class="rounded-2xl border border-white/10 bg-white/10 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-400">Inbound</dt>
              <dd class="mt-1 font-black">{{ runtime.inboundSecurity || '—' }}</dd>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/10 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-400">Failover</dt>
              <dd class="mt-1 font-black">{{ runtime.failoverEnabled ? 'on' : 'off' }}</dd>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/10 p-3">
              <dt class="text-xs uppercase tracking-wide text-slate-400">Health</dt>
              <dd class="mt-1 font-black">{{ runtime.healthcheckUrl || 'tcp' }}</dd>
            </div>
          </dl>
        </article>

        <article v-for="card in summaryCards" :key="card.label" class="proxy-stat">
          <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{{ card.label }}</p>
          <div class="mt-2 text-3xl font-black text-slate-950">{{ card.value }}</div>
          <p class="mt-1 text-xs font-bold text-slate-500">{{ card.hint }}</p>
        </article>
      </section>

      <nav class="flex gap-2 overflow-x-auto rounded-[1.35rem] border border-slate-200 bg-white p-2 shadow-sm">
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

      <section v-if="activeTab === 'overview'" class="grid gap-4 xl:grid-cols-3">
        <article class="proxy-panel xl:col-span-2">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="proxy-title">Состояние нод</h3>
              <p class="proxy-subtitle">Быстрый снимок здоровья и fallback-готовности.</p>
            </div>
            <RouterLink class="proxy-secondary" to="/proxy/nodes">К нодам</RouterLink>
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
          <h3 class="proxy-title">Direct-маршруты</h3>
          <p class="proxy-subtitle">Сайты, которые не отправляем через внешние VLESS.</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="rule in enabledRoutes.slice(0, 8)"
              :key="rule.id"
              class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"
            >
              {{ rule.value }}
            </span>
            <span v-if="!enabledRoutes.length" class="text-sm font-semibold text-slate-500">
              Нет активных правил.
            </span>
          </div>
        </article>
      </section>

      <section v-else-if="activeTab === 'nodes'" class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div class="proxy-panel">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="proxy-title">VLESS ноды</h3>
              <p class="proxy-subtitle">Внешние Reality/VLESS ссылки, через которые идет трафик.</p>
            </div>
          </div>
          <div class="mt-4 grid gap-3 lg:grid-cols-2">
            <article v-for="node in nodes" :key="node.id" class="proxy-card">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="h-3 w-3 rounded-full" :class="healthDotClass(node.healthStatus)"></span>
                    <h4 class="truncate text-lg font-black text-slate-950">{{ node.name || node.host }}</h4>
                  </div>
                  <p class="mt-1 break-all font-mono text-xs text-slate-500">
                    {{ node.maskedUrl || `${node.host}:${node.port}` }}
                  </p>
                </div>
                <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">
                  {{ node.country || '—' }}
                </span>
              </div>
              <div class="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-500">
                <span class="proxy-chip">priority {{ node.priority }}</span>
                <span class="proxy-chip">{{ poolName(node.poolId) || 'без пула' }}</span>
                <span class="proxy-chip">{{ node.lastCheckedAt ? formatDate(node.lastCheckedAt) : 'не проверяли' }}</span>
              </div>
              <p v-if="node.lastError" class="mt-3 text-sm font-bold text-rose-600">{{ node.lastError }}</p>
              <div class="mt-4 flex flex-wrap gap-2">
                <button class="proxy-secondary" type="button" @click="checkNode(node)">
                  Проверить
                </button>
                <button class="proxy-secondary" type="button" @click="toggleNode(node)">
                  {{ node.enabled ? 'Выключить' : 'Включить' }}
                </button>
                <button class="proxy-danger" type="button" @click="deleteNode(node)">Удалить</button>
              </div>
            </article>
            <div v-if="!nodes.length" class="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              Узлов пока нет.
            </div>
          </div>
        </div>

        <form class="proxy-panel" @submit.prevent="createNode">
          <h3 class="proxy-title">Импорт VLESS</h3>
          <p class="proxy-subtitle">Вставь ссылку, название и страна подтянутся из ссылки, если получится.</p>
          <div class="mt-4 space-y-3">
            <textarea
              v-model.trim="nodeDraft.url"
              class="proxy-input min-h-32 font-mono text-xs"
              placeholder="vless://..."
              @blur="autofillNodeFromUrl"
            ></textarea>
            <input v-model.trim="nodeDraft.name" class="proxy-input" placeholder="Название" />
            <div class="grid grid-cols-2 gap-2">
              <input v-model.trim="nodeDraft.country" class="proxy-input" placeholder="Страна" />
              <input v-model.number="nodeDraft.priority" type="number" class="proxy-input" placeholder="Priority" />
            </div>
            <select v-model="nodeDraft.pool_id" class="proxy-input">
              <option value="">Без пула</option>
              <option v-for="pool in pools" :key="pool.id" :value="pool.id">{{ pool.name }}</option>
            </select>
            <label class="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
              <input v-model="nodeDraft.enabled" type="checkbox" />
              Включить сразу
            </label>
            <button class="proxy-primary w-full" type="submit">Добавить ноду</button>
          </div>
        </form>
      </section>

      <section v-else-if="activeTab === 'pools'" class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div class="proxy-panel">
          <h3 class="proxy-title">Пулы</h3>
          <p class="proxy-subtitle">Группировка нод для ручного выбора или auto-failover.</p>
          <div class="mt-4 grid gap-3 lg:grid-cols-2">
            <article v-for="pool in pools" :key="pool.id" class="proxy-card">
              <h4 class="text-lg font-black text-slate-950">{{ pool.name }}</h4>
              <p class="mt-1 text-sm font-semibold text-slate-500">
                {{ pool.mode || 'auto_failover' }} · active {{ nodeName(pool.activeNodeId) || 'auto' }}
              </p>
              <div class="mt-3 text-xs font-black text-slate-500">
                Нод в пуле: {{ nodes.filter((node) => node.poolId === pool.id).length }}
              </div>
            </article>
          </div>
        </div>
        <form class="proxy-panel" @submit.prevent="createPool">
          <h3 class="proxy-title">Новый пул</h3>
          <div class="mt-4 space-y-3">
            <input v-model.trim="poolDraft.name" class="proxy-input" placeholder="Например Germany" />
            <button class="proxy-primary w-full" type="submit">Создать пул</button>
          </div>
        </form>
      </section>

      <section v-else-if="activeTab === 'users'" class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div class="proxy-panel">
          <h3 class="proxy-title">Пользователи</h3>
          <p class="proxy-subtitle">Каждому пользователю выдаем отдельную VLESS-ссылку.</p>
          <div class="mt-4 grid gap-3 lg:grid-cols-2">
            <article v-for="user in users" :key="user.id" class="proxy-card">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h4 class="text-lg font-black text-slate-950">{{ user.label }}</h4>
                  <p class="mt-1 text-sm font-semibold text-slate-500">
                    {{ poolName(user.poolId) || 'без пула' }} · {{ user.selectionMode }}
                  </p>
                </div>
                <span
                  class="rounded-full px-2 py-1 text-xs font-black"
                  :class="user.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                >
                  {{ user.enabled ? 'on' : 'off' }}
                </span>
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                <button class="proxy-primary" type="button" @click="loadVlessLink(user)">Ссылка</button>
                <button class="proxy-secondary" type="button" @click="toggleUser(user)">
                  {{ user.enabled ? 'Выключить' : 'Включить' }}
                </button>
              </div>
            </article>
          </div>
        </div>
        <form class="proxy-panel" @submit.prevent="createUser">
          <h3 class="proxy-title">Новый пользователь</h3>
          <div class="mt-4 space-y-3">
            <input v-model.trim="userDraft.label" class="proxy-input" placeholder="label, например evgeny" />
            <select v-model="userDraft.pool_id" class="proxy-input">
              <option value="">Без пула</option>
              <option v-for="pool in pools" :key="pool.id" :value="pool.id">{{ pool.name }}</option>
            </select>
            <button class="proxy-primary w-full" type="submit">Создать пользователя</button>
          </div>
        </form>
      </section>

      <section v-else-if="activeTab === 'routes'" class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div class="proxy-panel">
          <h3 class="proxy-title">Direct-маршруты</h3>
          <p class="proxy-subtitle">Эти домены/IP будут идти напрямую, минуя внешние VLESS-ноды.</p>
          <div class="mt-4 grid gap-3 lg:grid-cols-2">
            <article v-for="rule in routes" :key="rule.id" class="proxy-card">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h4 class="text-lg font-black text-slate-950">{{ rule.name }}</h4>
                  <p class="mt-1 font-mono text-sm font-semibold text-slate-500">{{ rule.value }}</p>
                </div>
                <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">
                  {{ rule.kind }}
                </span>
              </div>
              <div class="mt-3 flex flex-wrap gap-2 text-xs font-black text-slate-500">
                <span class="proxy-chip">priority {{ rule.priority }}</span>
                <span class="proxy-chip">{{ rule.outboundTag }}</span>
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                <button class="proxy-secondary" type="button" @click="toggleRoute(rule)">
                  {{ rule.enabled ? 'Выключить' : 'Включить' }}
                </button>
                <button class="proxy-danger" type="button" @click="deleteRoute(rule)">Удалить</button>
              </div>
            </article>
          </div>
        </div>
        <form class="proxy-panel" @submit.prevent="createRoute">
          <h3 class="proxy-title">Добавить маршрут</h3>
          <p class="proxy-subtitle">Для доменов можно писать `.ru`, `domain:yandex.ru`, `geosite:ru`.</p>
          <div class="mt-4 space-y-3">
            <input v-model.trim="routeDraft.name" class="proxy-input" placeholder="Название" />
            <select v-model="routeDraft.kind" class="proxy-input">
              <option value="domain">Домен</option>
              <option value="ip">IP / geoip</option>
            </select>
            <input v-model.trim="routeDraft.value" class="proxy-input font-mono" placeholder=".ru или geoip:ru" />
            <input v-model.number="routeDraft.priority" type="number" class="proxy-input" placeholder="Priority" />
            <button class="proxy-primary w-full" type="submit">Добавить direct-маршрут</button>
          </div>
        </form>
      </section>
    </div>

    <div
      v-if="vlessModal.open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      @click.self="closeVlessModal"
    >
      <div class="w-full max-w-2xl rounded-[1.5rem] bg-white p-5 shadow-2xl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-xl font-black text-slate-950">VLESS ссылка</h3>
            <p class="mt-1 text-sm text-slate-500">{{ vlessModal.userLabel }}</p>
          </div>
          <button class="proxy-secondary" type="button" @click="closeVlessModal">Закрыть</button>
        </div>
        <textarea readonly class="proxy-input mt-4 min-h-32 font-mono text-xs" :value="vlessModal.link"></textarea>
        <button class="proxy-primary mt-3" type="button" @click="copyVlessLink">Скопировать</button>
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
const vlessModal = reactive({ open: false, userLabel: '', link: '' })

const nodeDraft = reactive({
  name: '',
  country: '',
  pool_id: '',
  url: '',
  enabled: true,
  priority: 100,
})
const poolDraft = reactive({ name: '' })
const userDraft = reactive({ label: '', pool_id: '' })
const routeDraft = reactive({
  name: '',
  kind: 'domain',
  value: '',
  priority: 100,
})

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

const enabledRoutes = computed(() => routes.value.filter((rule) => rule.enabled))

const summaryCards = computed(() => [
  { label: 'Ноды', value: nodes.value.length, hint: `${nodeSummary.value[0].count} up` },
  { label: 'Пулы', value: pools.value.length, hint: 'группы fallback' },
  { label: 'Пользователи', value: users.value.length, hint: 'личные ссылки' },
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

const autofillNodeFromUrl = () => {
  if (!nodeDraft.url) return
  if (!nodeDraft.name) nodeDraft.name = inferVlessName(nodeDraft.url)
  if (!nodeDraft.country) nodeDraft.country = inferVlessCountry(nodeDraft.url)
}

const createNode = async () => {
  if (!nodeDraft.url) {
    notifications.error('Вставь VLESS ссылку')
    return
  }
  autofillNodeFromUrl()
  try {
    await authStore.api.post('/proxy/nodes', {
      name: nodeDraft.name || undefined,
      country: nodeDraft.country || undefined,
      pool_id: nodeDraft.pool_id || undefined,
      url: nodeDraft.url,
      enabled: nodeDraft.enabled,
      priority: Number(nodeDraft.priority) || 100,
    })
    Object.assign(nodeDraft, { name: '', country: '', pool_id: '', url: '', enabled: true, priority: 100 })
    notifications.success('Нода добавлена')
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось добавить ноду')
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

const toggleNode = async (node) => {
  try {
    await authStore.api.patch(`/proxy/nodes/${node.id}`, { enabled: !node.enabled })
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось переключить ноду')
  }
}

const deleteNode = async (node) => {
  if (!window.confirm(`Удалить ноду ${node.name || node.host}?`)) return
  try {
    await authStore.api.delete(`/proxy/nodes/${node.id}`)
    notifications.success('Нода удалена')
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось удалить ноду')
  }
}

const createPool = async () => {
  if (!poolDraft.name) {
    notifications.error('Укажи название пула')
    return
  }
  try {
    await authStore.api.post('/proxy/pools', { name: poolDraft.name, mode: 'auto_failover' })
    poolDraft.name = ''
    notifications.success('Пул создан')
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось создать пул')
  }
}

const createUser = async () => {
  if (!userDraft.label) {
    notifications.error('Укажи label пользователя')
    return
  }
  try {
    await authStore.api.post('/proxy/users', {
      label: userDraft.label,
      pool_id: userDraft.pool_id || undefined,
      selection_mode: userDraft.pool_id ? 'pool' : 'auto_failover',
    })
    Object.assign(userDraft, { label: '', pool_id: '' })
    notifications.success('Пользователь создан')
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось создать пользователя')
  }
}

const toggleUser = async (user) => {
  try {
    await authStore.api.patch(`/proxy/users/${user.id}`, { enabled: !user.enabled })
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось переключить пользователя')
  }
}

const createRoute = async () => {
  if (!routeDraft.name || !routeDraft.value) {
    notifications.error('Укажи название и значение маршрута')
    return
  }
  try {
    await authStore.api.post('/proxy/routes', {
      name: routeDraft.name,
      kind: routeDraft.kind,
      value: routeDraft.value,
      outbound_tag: 'direct',
      enabled: true,
      priority: Number(routeDraft.priority) || 100,
    })
    Object.assign(routeDraft, { name: '', kind: 'domain', value: '', priority: 100 })
    notifications.success('Маршрут добавлен')
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось добавить маршрут')
  }
}

const toggleRoute = async (rule) => {
  try {
    await authStore.api.patch(`/proxy/routes/${rule.id}`, { enabled: !rule.enabled })
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось переключить маршрут')
  }
}

const deleteRoute = async (rule) => {
  if (!window.confirm(`Удалить маршрут ${rule.name}?`)) return
  try {
    await authStore.api.delete(`/proxy/routes/${rule.id}`)
    notifications.success('Маршрут удален')
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось удалить маршрут')
  }
}

const loadVlessLink = async (user) => {
  try {
    const { data } = await authStore.api.get(`/proxy/users/${user.id}/vless-link`)
    vlessModal.open = true
    vlessModal.userLabel = user.label
    vlessModal.link = data.link || ''
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось получить VLESS ссылку')
  }
}

const copyVlessLink = async () => {
  await navigator.clipboard?.writeText(vlessModal.link)
  notifications.success('Ссылка скопирована')
}

const closeVlessModal = () => {
  vlessModal.open = false
}

const poolName = (id) => pools.value.find((pool) => pool.id === id)?.name || ''
const nodeName = (id) => nodes.value.find((node) => node.id === id)?.name || ''
const formatDate = (value) => new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

const healthDotClass = (status) => {
  const tone = proxyHealthTone(status)
  if (tone === 'ok') return 'bg-emerald-500'
  if (tone === 'warning') return 'bg-amber-400'
  if (tone === 'error') return 'bg-rose-500'
  return 'bg-slate-300'
}

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
  border: 1px solid rgb(226 232 240);
  border-radius: 1.25rem;
  background: rgb(248 250 252);
  padding: 1rem;
}

.proxy-stat {
  border: 1px solid rgb(226 232 240);
  border-radius: 1.5rem;
  background: white;
  padding: 1rem;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.06);
}

.proxy-title {
  font-size: 1.125rem;
  font-weight: 900;
  color: rgb(15 23 42);
}

.proxy-subtitle {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: rgb(100 116 139);
}

.proxy-input {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid rgb(226 232 240);
  background: white;
  padding: 0.75rem 0.9rem;
  color: rgb(15 23 42);
  outline: none;
}

.proxy-input:focus {
  border-color: rgb(37 99 235);
  box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
}

.proxy-primary,
.proxy-secondary,
.proxy-danger {
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

.proxy-danger {
  border: 1px solid rgb(254 205 211);
  background: white;
  color: rgb(225 29 72);
}

.proxy-danger:hover {
  background: rgb(255 241 242);
}

.proxy-primary:disabled,
.proxy-secondary:disabled,
.proxy-danger:disabled {
  opacity: 0.55;
}

.proxy-chip {
  border-radius: 999px;
  background: white;
  padding: 0.35rem 0.6rem;
}
</style>
