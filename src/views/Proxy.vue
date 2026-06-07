<template>
  <div class="min-h-screen bg-slate-100">
    <div class="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Proxy control</p>
          <h2 class="mt-1 text-3xl font-black tracking-tight text-slate-950">Прокси</h2>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            :disabled="loading"
            @click="loadProxy"
          >
            {{ loading ? 'Обновляем...' : 'Обновить' }}
          </button>
          <button
            type="button"
            class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
            :disabled="applying"
            @click="applyRuntime"
          >
            {{ applying ? 'Применяем...' : 'Применить Xray config' }}
          </button>
        </div>
      </div>

      <InlineNotice
        v-if="errorMessage"
        class="mb-4"
        tone="error"
        title="Прокси недоступен"
        :message="errorMessage"
      />

      <section class="mb-5 grid gap-3 lg:grid-cols-4">
        <div class="rounded-3xl bg-slate-950 p-5 text-white shadow-xl lg:col-span-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Runtime
              </p>
              <h3 class="mt-2 text-2xl font-black">
                {{ runtime.xrayService || 'xray' }}
              </h3>
              <p class="mt-1 text-sm text-slate-400">
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
          <div class="mt-5 grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl border border-white/10 bg-white/10 p-3">
              <div class="text-xs uppercase tracking-wide text-slate-400">Inbound</div>
              <div class="mt-1 text-lg font-black">{{ runtime.inboundSecurity || '—' }}</div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/10 p-3">
              <div class="text-xs uppercase tracking-wide text-slate-400">Local proxy</div>
              <div class="mt-1 text-lg font-black">
                {{ runtime.localProxyListen || '127.0.0.1' }}:{{ runtime.localProxyPort || '—' }}
              </div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/10 p-3">
              <div class="text-xs uppercase tracking-wide text-slate-400">Failover</div>
              <div class="mt-1 text-lg font-black">
                {{ runtime.failoverEnabled ? 'on' : 'off' }}
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Узлы</div>
          <div class="mt-2 text-3xl font-black text-slate-950">{{ nodes.length }}</div>
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="item in nodeSummary"
              :key="item.label"
              class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
            >
              {{ item.label }} {{ item.count }}
            </span>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Пользователи</div>
          <div class="mt-2 text-3xl font-black text-slate-950">{{ users.length }}</div>
          <p class="mt-2 text-sm text-slate-500">VLESS-ссылки выдаются на пользователя.</p>
        </div>
      </section>

      <section class="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <div class="space-y-5">
          <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 class="text-xl font-black text-slate-950">VLESS узлы</h3>
                <p class="text-sm text-slate-500">Внешние Reality/VLESS ссылки, через которые пойдет трафик.</p>
              </div>
            </div>
            <div class="space-y-3">
              <article
                v-for="node in nodes"
                :key="node.id"
                class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class="h-3 w-3 rounded-full"
                        :class="healthDotClass(node.healthStatus)"
                      ></span>
                      <h4 class="break-words text-lg font-black text-slate-950">
                        {{ node.name || node.host }}
                      </h4>
                      <span class="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-500">
                        {{ node.country || 'country —' }}
                      </span>
                    </div>
                    <p class="mt-1 break-all font-mono text-xs text-slate-500">
                      {{ node.maskedUrl || `${node.host}:${node.port}` }}
                    </p>
                    <p v-if="node.lastError" class="mt-2 text-sm font-semibold text-rose-600">
                      {{ node.lastError }}
                    </p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                      @click="toggleNode(node)"
                    >
                      {{ node.enabled ? 'Выключить' : 'Включить' }}
                    </button>
                    <button
                      type="button"
                      class="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                      @click="deleteNode(node)"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </article>
              <div v-if="!nodes.length" class="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Узлов пока нет.
              </div>
            </div>
          </div>

          <div class="grid gap-5 lg:grid-cols-2">
            <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 class="text-xl font-black text-slate-950">Пулы</h3>
              <div class="mt-4 space-y-2">
                <div
                  v-for="pool in pools"
                  :key="pool.id"
                  class="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div class="font-black text-slate-950">{{ pool.name }}</div>
                  <div class="mt-1 text-xs font-semibold text-slate-500">
                    {{ pool.mode || 'mode —' }} · active {{ nodeName(pool.activeNodeId) || 'auto' }}
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 class="text-xl font-black text-slate-950">Пользователи</h3>
              <div class="mt-4 space-y-2">
                <div
                  v-for="user in users"
                  :key="user.id"
                  class="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="font-black text-slate-950">{{ user.label }}</div>
                      <div class="mt-1 text-xs font-semibold text-slate-500">
                        {{ user.enabled ? 'enabled' : 'disabled' }} · {{ poolName(user.poolId) || 'pool —' }}
                      </div>
                    </div>
                    <button
                      type="button"
                      class="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                      @click="loadVlessLink(user)"
                    >
                      Ссылка
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="space-y-5">
          <form class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="createNode">
            <h3 class="text-xl font-black text-slate-950">Добавить VLESS</h3>
            <div class="mt-4 space-y-3">
              <input v-model.trim="nodeDraft.name" class="proxy-input" placeholder="Название" />
              <input v-model.trim="nodeDraft.country" class="proxy-input" placeholder="Страна, например DE" />
              <select v-model="nodeDraft.pool_id" class="proxy-input">
                <option value="">Без пула</option>
                <option v-for="pool in pools" :key="pool.id" :value="pool.id">{{ pool.name }}</option>
              </select>
              <textarea
                v-model.trim="nodeDraft.url"
                class="proxy-input min-h-28 font-mono text-xs"
                placeholder="vless://..."
              ></textarea>
              <div class="grid grid-cols-2 gap-2">
                <input v-model.number="nodeDraft.priority" type="number" class="proxy-input" placeholder="Priority" />
                <label class="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">
                  <input v-model="nodeDraft.enabled" type="checkbox" />
                  Включен
                </label>
              </div>
              <button class="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700">
                Добавить узел
              </button>
            </div>
          </form>

          <form class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="createPool">
            <h3 class="text-xl font-black text-slate-950">Добавить пул</h3>
            <div class="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <input v-model.trim="poolDraft.name" class="proxy-input" placeholder="Например Germany" />
              <button class="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">Создать</button>
            </div>
          </form>

          <form class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="createUser">
            <h3 class="text-xl font-black text-slate-950">Добавить пользователя</h3>
            <div class="mt-4 space-y-3">
              <input v-model.trim="userDraft.label" class="proxy-input" placeholder="label, например evgeny" />
              <select v-model="userDraft.pool_id" class="proxy-input">
                <option value="">Без пула</option>
                <option v-for="pool in pools" :key="pool.id" :value="pool.id">{{ pool.name }}</option>
              </select>
              <button class="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800">
                Создать пользователя
              </button>
            </div>
          </form>
        </aside>
      </section>
    </div>

    <div
      v-if="vlessModal.open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      @click.self="closeVlessModal"
    >
      <div class="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-xl font-black text-slate-950">VLESS ссылка</h3>
            <p class="mt-1 text-sm text-slate-500">{{ vlessModal.userLabel }}</p>
          </div>
          <button class="rounded-full bg-slate-100 px-3 py-2 text-sm font-black" @click="closeVlessModal">
            Закрыть
          </button>
        </div>
        <textarea readonly class="proxy-input mt-4 min-h-32 font-mono text-xs" :value="vlessModal.link"></textarea>
        <button
          class="mt-3 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"
          @click="copyVlessLink"
        >
          Скопировать
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import InlineNotice from '../components/InlineNotice.vue'
import { normalizeProxyState, proxyHealthTone } from '../lib/proxy.js'
import { isUnauthorizedError } from '../lib/auth-session.js'
import { useAuthStore } from '../stores/auth.js'
import { useNotificationsStore } from '../stores/notifications.js'

const authStore = useAuthStore()
const notifications = useNotificationsStore()

const loading = ref(false)
const applying = ref(false)
const errorMessage = ref('')
const runtime = ref(normalizeProxyState().runtime)
const nodes = ref([])
const pools = ref([])
const users = ref([])
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

const nodeSummary = computed(() => {
  const counters = nodes.value.reduce(
    (acc, node) => {
      acc[node.healthStatus] = (acc[node.healthStatus] || 0) + 1
      return acc
    },
    { up: 0, degraded: 0, down: 0 },
  )
  return [
    { label: 'up', count: counters.up || 0 },
    { label: 'warn', count: counters.degraded || 0 },
    { label: 'down', count: counters.down || 0 },
  ]
})

const loadProxy = async () => {
  loading.value = true
  try {
    const [runtimeRes, nodesRes, poolsRes, usersRes] = await Promise.all([
      authStore.api.get('/proxy/runtime/status'),
      authStore.api.get('/proxy/nodes'),
      authStore.api.get('/proxy/pools'),
      authStore.api.get('/proxy/users'),
    ])
    const state = normalizeProxyState({
      runtime: runtimeRes.data,
      nodes: nodesRes.data,
      pools: poolsRes.data,
      users: usersRes.data,
    })
    runtime.value = state.runtime
    nodes.value = state.nodes
    pools.value = state.pools
    users.value = state.users
    errorMessage.value = ''
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return
    }
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

const createNode = async () => {
  if (!nodeDraft.url) {
    notifications.error('Вставь VLESS ссылку')
    return
  }
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
    notifications.success('Узел добавлен')
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось добавить узел')
  }
}

const toggleNode = async (node) => {
  try {
    await authStore.api.patch(`/proxy/nodes/${node.id}`, { enabled: !node.enabled })
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось переключить узел')
  }
}

const deleteNode = async (node) => {
  if (!window.confirm(`Удалить узел ${node.name || node.host}?`)) {
    return
  }
  try {
    await authStore.api.delete(`/proxy/nodes/${node.id}`)
    notifications.success('Узел удален')
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось удалить узел')
  }
}

const createPool = async () => {
  if (!poolDraft.name) {
    notifications.error('Укажи название пула')
    return
  }
  try {
    await authStore.api.post('/proxy/pools', { name: poolDraft.name, mode: 'failover' })
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
      selection_mode: userDraft.pool_id ? 'pool' : 'auto',
    })
    Object.assign(userDraft, { label: '', pool_id: '' })
    notifications.success('Пользователь создан')
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось создать пользователя')
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
</style>
