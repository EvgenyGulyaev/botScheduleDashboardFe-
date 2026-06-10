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

      <section v-if="activeTab === 'overview'" class="grid gap-4 xl:grid-cols-[0.9fr_1.35fr]">
        <article class="proxy-panel">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="proxy-title">Трафик за месяц</h3>
              <p class="mt-1 text-xs font-bold text-slate-500">{{ trafficOverview.period }}</p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-black"
              :class="runtime.trafficStatsEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
            >
              {{ runtime.trafficStatsEnabled ? 'учет включен' : 'учет выкл' }}
            </span>
          </div>
          <div class="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div class="rounded-2xl bg-slate-950 p-4 text-white">
              <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Всего</p>
              <div class="mt-2 text-3xl font-black">{{ formatBytes(trafficOverview.totalBytes) }}</div>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Upload</p>
              <div class="mt-2 text-2xl font-black text-slate-950">{{ formatBytes(trafficOverview.uplinkBytes) }}</div>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Download</p>
              <div class="mt-2 text-2xl font-black text-slate-950">{{ formatBytes(trafficOverview.downlinkBytes) }}</div>
            </div>
          </div>
        </article>

        <article class="proxy-panel">
          <div class="flex items-center justify-between gap-3">
            <h3 class="proxy-title">Потребление пользователей</h3>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
              {{ trafficOverview.activeUsers }}/{{ users.length }}
            </span>
          </div>
          <div class="mt-4 space-y-3">
            <div v-if="!users.length" class="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
              Пользователей пока нет.
            </div>
            <div
              v-for="user in trafficUsers"
              :key="user.id"
              class="rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-black text-slate-950">{{ user.label }}</p>
                  <p class="mt-0.5 text-xs font-bold text-slate-500">
                    ↑ {{ formatBytes(user.traffic.uplinkBytes) }} · ↓ {{ formatBytes(user.traffic.downlinkBytes) }}
                  </p>
                </div>
                <div class="shrink-0 text-right">
                  <p class="text-sm font-black text-slate-950">{{ formatBytes(user.traffic.totalBytes) }}</p>
                  <p class="text-xs font-bold text-slate-500">{{ userTrafficPercentLabel(user) }}</p>
                </div>
              </div>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div
                  class="h-full rounded-full transition-all"
                  :class="userTrafficBarClass(user)"
                  :style="{ width: `${userTrafficProgress(user)}%` }"
                />
              </div>
            </div>
          </div>
        </article>
      </section>

      <section v-else-if="activeTab === 'nodes'" class="space-y-4">
        <details
          v-for="group in nodesByCountry"
          :key="group.country"
          class="proxy-panel"
          :class="{ 'proxy-panel-broken': group.broken }"
          :open="!isNodeGroupCollapsed(group)"
          @toggle="setNodeGroupCollapsed(group, $event.target.open)"
        >
          <summary class="cursor-pointer list-none">
            <div class="flex items-center justify-between gap-3">
              <h3 class="proxy-title" :class="{ 'text-rose-700': group.broken }">{{ group.country }}</h3>
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
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-xl font-black text-slate-950">Пулы</h3>
          <button class="proxy-add-button" type="button" title="Добавить пул" @click="openPoolModal()">+</button>
        </div>

        <div class="proxy-pools-table mt-4 overflow-x-auto rounded-2xl border border-slate-200">
          <table class="min-w-[640px] w-full border-collapse text-left text-sm">
            <thead class="bg-slate-50 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
              <tr>
                <th class="px-4 py-3">Пул</th>
                <th class="px-4 py-3">Ноды</th>
                <th class="px-4 py-3">Страны</th>
                <th class="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 bg-white">
              <template v-for="pool in pagedPools" :key="pool.id">
                <tr class="transition hover:bg-slate-50">
                  <td class="px-4 py-3 font-black text-slate-950">
                    <div class="flex min-w-0 items-center gap-2">
                      <button
                        class="proxy-icon shrink-0"
                        type="button"
                        :title="isPoolExpanded(pool.id) ? 'Свернуть ноды' : 'Показать ноды'"
                        @click="togglePoolExpanded(pool.id)"
                      >
                        {{ isPoolExpanded(pool.id) ? '−' : '+' }}
                      </button>
                      <div class="truncate" :title="pool.name">{{ pool.name }}</div>
                    </div>
                  </td>
                  <td class="px-4 py-3 font-bold text-slate-700">{{ pool.nodeCount }}</td>
                  <td class="px-4 py-3 text-xs font-bold text-slate-500">
                    <div class="truncate" :title="pool.countries">{{ pool.countries }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex justify-end gap-2">
                      <button class="proxy-icon" type="button" title="Редактировать" @click="openPoolModal(pool)">✎</button>
                      <button class="proxy-icon danger" type="button" title="Удалить" @click="deletePool(pool)">🗑</button>
                    </div>
                  </td>
                </tr>
                <tr v-if="isPoolExpanded(pool.id)" class="bg-slate-50/80">
                  <td class="px-4 py-4" colspan="4">
                    <div v-if="pool.nodes.length" class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div
                        v-for="(node, index) in pool.nodes"
                        :key="node.id"
                        class="grid gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 md:grid-cols-[2rem_minmax(0,1fr)_auto] md:items-center"
                      >
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                          {{ index + 1 }}
                        </div>
                        <div class="min-w-0">
                          <div class="flex min-w-0 flex-wrap items-center gap-2">
                            <span class="h-2.5 w-2.5 rounded-full" :class="healthDotClass(node.healthStatus)"></span>
                            <span class="truncate font-black text-slate-950" :title="node.name || node.host">
                              {{ node.name || node.host }}
                            </span>
                            <span class="proxy-chip">{{ normalizeCountryLabel(node.country) }}</span>
                            <span class="proxy-chip">{{ node.protocol || 'vless' }}</span>
                          </div>
                          <p class="mt-1 break-all font-mono text-xs font-semibold text-slate-500">
                            {{ node.maskedUrl || `${node.host}:${node.port}` }}
                          </p>
                        </div>
                        <div class="flex justify-end gap-2">
                          <button
                            class="proxy-icon"
                            type="button"
                            title="Поднять выше"
                            :disabled="reorderingPoolId === pool.id || index === 0"
                            @click="movePoolNode(pool.id, node.id, -1)"
                          >
                            ↑
                          </button>
                          <button
                            class="proxy-icon"
                            type="button"
                            title="Опустить ниже"
                            :disabled="reorderingPoolId === pool.id || index === pool.nodes.length - 1"
                            @click="movePoolNode(pool.id, node.id, 1)"
                          >
                            ↓
                          </button>
                          <button class="proxy-icon" type="button" title="Редактировать ноду" @click="openNodeModal(node)">✎</button>
                        </div>
                      </div>
                    </div>
                    <div v-else class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm font-bold text-slate-400">
                      В пуле пока нет нод
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="!poolRows.length">
                <td class="px-4 py-8 text-center font-bold text-slate-400" colspan="4">Пулов пока нет</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="poolRows.length" class="proxy-pagination">
          <span>{{ poolPageRange }}</span>
          <div v-if="poolTotalPages > 1" class="flex items-center gap-2">
            <button class="proxy-page-button" type="button" :disabled="poolPage === 1" @click="changePoolPage(-1)">Назад</button>
            <strong>{{ poolPage }} / {{ poolTotalPages }}</strong>
            <button class="proxy-page-button" type="button" :disabled="poolPage === poolTotalPages" @click="changePoolPage(1)">Вперед</button>
          </div>
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
            <div class="mt-4 rounded-2xl bg-slate-50 p-3">
              <div class="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                <span>{{ user.traffic.period || 'текущий месяц' }}</span>
                <span>{{ userTrafficPercentLabel(user) }}</span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  class="h-full rounded-full"
                  :class="userTrafficBarClass(user)"
                  :style="{ width: `${userTrafficProgress(user)}%` }"
                ></div>
              </div>
              <p class="mt-2 text-sm font-black text-slate-900">
                {{ formatBytes(user.traffic.totalBytes) }}
                <span class="text-slate-500">/ {{ user.traffic.quotaBytes ? formatBytes(user.traffic.quotaBytes) : 'без лимита' }}</span>
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
          <h3 class="text-xl font-black text-slate-950">Папки маршрутов</h3>
          <button class="proxy-add-button" type="button" title="Добавить папку" @click="openRouteGroupModal()">+</button>
        </div>

        <div class="mt-4 space-y-4">
          <details
            v-for="group in routeGroupRows"
            :key="group.id"
            class="proxy-route-group"
            :open="!isRouteGroupCollapsed(group)"
            @toggle="setRouteGroupCollapsed(group, $event.target.open)"
          >
            <summary class="cursor-pointer list-none">
              <div class="flex items-center justify-between gap-3 px-1">
                <div class="flex min-w-0 items-center gap-3">
                  <span class="proxy-collapse-mark">{{ isRouteGroupCollapsed(group) ? '+' : '−' }}</span>
                  <div class="min-w-0">
                    <h4 class="truncate text-lg font-black text-slate-950">{{ group.name }}</h4>
                    <p class="text-xs font-bold text-slate-500">{{ group.routes.length }} маршрутов</p>
                  </div>
                </div>
                <div class="flex shrink-0 gap-2">
                  <button class="proxy-icon" type="button" title="Добавить маршрут" @click.stop="openRouteModal(null, group.id)">+</button>
                  <button
                    class="proxy-icon"
                    type="button"
                    title="Редактировать папку"
                    :disabled="group.id === DEFAULT_ROUTE_GROUP_ID"
                    @click.stop="openRouteGroupModal(group)"
                  >✎</button>
                  <button
                    class="proxy-icon danger"
                    type="button"
                    title="Удалить папку"
                    :disabled="group.id === DEFAULT_ROUTE_GROUP_ID"
                    @click.stop="deleteRouteGroup(group)"
                  >🗑</button>
                </div>
              </div>
            </summary>
            <div class="proxy-routes-table mt-3 overflow-x-auto rounded-2xl border border-slate-200">
              <table class="min-w-[720px] w-full border-collapse text-left text-sm">
                <thead class="bg-slate-50 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                  <tr>
                    <th class="px-4 py-3">Тип</th>
                    <th class="px-4 py-3">Название</th>
                    <th class="px-4 py-3">Значение</th>
                    <th class="px-4 py-3">Статус</th>
                    <th class="px-4 py-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 bg-white">
                  <tr v-for="rule in group.routes" :key="rule.id" class="transition hover:bg-slate-50">
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
                  <tr v-if="!group.routes.length">
                    <td class="px-4 py-8 text-center font-bold text-slate-400" colspan="5">В папке пока нет маршрутов</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </section>
    </div>

    <div v-if="modal.open" class="proxy-modal-backdrop" @click.self="closeModal">
      <form class="proxy-modal" @submit.prevent="submitModal">
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-xl font-black text-slate-950">{{ modalTitle }}</h3>
          <button class="proxy-secondary" type="button" :disabled="modalSaving" @click="closeModal">
            Закрыть
          </button>
        </div>

        <div v-if="modal.type === 'node'" class="mt-4 space-y-3">
          <textarea
            v-if="modal.mode === 'create'"
            v-model.trim="nodeDraft.url"
            class="proxy-input min-h-32 font-mono text-xs"
            placeholder="vless://... или hysteria2://..."
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
          <label class="block">
            <span class="mb-1 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">Квота в месяц, GB</span>
            <input v-model="userDraft.traffic_limit_gb" class="proxy-input" inputmode="decimal" placeholder="пусто = без лимита" />
          </label>
          <div class="space-y-2" aria-label="Пулы пользователя">
            <div
              v-for="pool in userPoolRows"
              :key="pool.id"
              class="proxy-user-pool-row"
              :class="{ selected: pool.selected, dragging: draggingUserPoolId === pool.id }"
              :draggable="pool.selected"
              @dragstart="startUserPoolDrag(pool.id, $event)"
              @dragover.prevent
              @drop.prevent="dropUserPool(pool.id, $event)"
              @dragend="finishUserPoolDrag"
            >
              <input :checked="pool.selected" type="checkbox" @change="toggleUserPool(pool.id)" />
              <span class="min-w-0 truncate text-sm font-black text-slate-800">{{ pool.name }}</span>
              <div v-if="pool.selected" class="flex items-center gap-1">
                <button class="proxy-order-button" type="button" title="Выше" @click="moveUserPool(pool.id, -1)">↑</button>
                <button class="proxy-order-button" type="button" title="Ниже" @click="moveUserPool(pool.id, 1)">↓</button>
                <span class="proxy-drag-handle" title="Перетащить">↕</span>
              </div>
            </div>
          </div>
          <div class="space-y-2" aria-label="Папки маршрутов пользователя">
            <p class="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Маршруты</p>
            <label
              v-for="group in routeGroupOptions"
              :key="group.id"
              class="proxy-check"
              :class="{ selected: isUserRouteGroupSelected(group.id) }"
            >
              <input
                :checked="isUserRouteGroupSelected(group.id)"
                type="checkbox"
                :disabled="group.id === DEFAULT_ROUTE_GROUP_ID"
                @change="toggleUserRouteGroup(group.id)"
              />
              {{ group.name }}
            </label>
          </div>
          <label class="proxy-check">
            <input v-model="userDraft.enabled" type="checkbox" />
            Включен
          </label>
        </div>

        <div v-else-if="modal.type === 'route'" class="mt-4 space-y-3">
          <select v-model="routeDraft.group_id" class="proxy-input">
            <option v-for="group in routeGroupOptions" :key="group.id" :value="group.id">{{ group.name }}</option>
          </select>
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

        <div v-else-if="modal.type === 'routeGroup'" class="mt-4 space-y-3">
          <input v-model.trim="routeGroupDraft.name" class="proxy-input" placeholder="Название папки, например evgeny" />
        </div>

        <button class="proxy-primary mt-5 w-full" type="submit" :disabled="modalSaving">
          {{
            modalSaving
              ? 'Сохраняем...'
              : modal.mode === 'edit'
                ? 'Сохранить'
                : 'Добавить'
          }}
        </button>
      </form>
    </div>

    <div v-if="vlessModal.open" class="proxy-modal-backdrop" @click.self="closeVlessModal">
      <div class="proxy-modal max-w-3xl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-xl font-black text-slate-950">Клиентский config</h3>
            <p class="mt-1 text-sm text-slate-500">{{ vlessModal.userLabel }}</p>
          </div>
          <button class="proxy-secondary" type="button" @click="closeVlessModal">Закрыть</button>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            :class="vlessModal.mode === 'config' ? 'proxy-primary' : 'proxy-secondary'"
            type="button"
            :disabled="vlessModal.loading"
            @click="switchVlessModalMode('config')"
          >
            Клиентский конфиг
          </button>
          <button
            :class="vlessModal.mode === 'link' ? 'proxy-primary' : 'proxy-secondary'"
            type="button"
            :disabled="vlessModal.loading"
            @click="switchVlessModalMode('link')"
          >
            VLESS ссылка
          </button>
        </div>

        <div v-if="vlessModal.mode === 'config'" class="mt-4 grid gap-2 sm:max-w-xs">
          <label class="text-xs font-bold uppercase tracking-wide text-slate-500" for="proxy-config-format">
            Формат
          </label>
          <select
            id="proxy-config-format"
            v-model="vlessModal.format"
            class="proxy-input"
            :disabled="vlessModal.loading"
            @change="reloadUserConfigFormat"
          >
            <option v-for="format in CONFIG_FORMATS" :key="format.value" :value="format.value">
              {{ format.label }}
            </option>
          </select>
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
  inferProxyNodeCountry,
  inferProxyNodeName,
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
const modalSaving = ref(false)
const errorMessage = ref('')
const runtime = ref(normalizeProxyState().runtime)
const nodes = ref([])
const pools = ref([])
const users = ref([])
const routeGroups = ref([])
const routes = ref([])
const poolPage = ref(1)
const expandedPoolIds = ref(new Set())
const reorderingPoolId = ref('')
const draggingUserPoolId = ref('')
const POOL_PAGE_SIZE = 8
const BROKEN_NODES_GROUP = 'Нерабочие'
const DEFAULT_ROUTE_GROUP_ID = 'default'
const CONFIG_FORMATS = [
  { value: 'happ', label: 'Happ маршруты' },
  { value: 'ficlashx', label: 'FIClashX' },
  { value: 'koala-clash', label: 'Koala Clash' },
  { value: 'prizrak-box', label: 'Prizrak-Box' },
]

const modal = reactive({ open: false, type: '', mode: 'create', id: '' })
const vlessModal = reactive({
  open: false,
  mode: '',
  userId: '',
  userLabel: '',
  format: 'happ',
  content: '',
  filename: '',
  contentType: 'text/plain',
  loading: false,
})
const collapsedNodeGroups = reactive({ [BROKEN_NODES_GROUP]: true })
const collapsedRouteGroups = reactive({})

const nodeDraft = reactive(defaultNodeDraft())
const poolDraft = reactive(defaultPoolDraft())
const userDraft = reactive(defaultUserDraft())
const routeDraft = reactive(defaultRouteDraft())
const routeGroupDraft = reactive(defaultRouteGroupDraft())

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
const routeGroupOptions = computed(() =>
  routeGroups.value.length
    ? routeGroups.value
    : [{ id: DEFAULT_ROUTE_GROUP_ID, name: 'default' }],
)
const routeGroupRows = computed(() => {
  return routeGroupOptions.value.map((group) => ({
    ...group,
    routes: routes.value
      .filter((rule) => (rule.groupId || DEFAULT_ROUTE_GROUP_ID) === group.id)
      .sort((left, right) => left.name.localeCompare(right.name, 'ru')),
  }))
})

const trafficUsers = computed(() =>
  users.value
    .slice()
    .sort((left, right) => Number(right.traffic?.totalBytes || 0) - Number(left.traffic?.totalBytes || 0)),
)

const trafficOverview = computed(() => {
  const period = trafficUsers.value.find((user) => user.traffic?.period)?.traffic?.period || 'текущий месяц'
  return trafficUsers.value.reduce(
    (acc, user) => {
      const traffic = user.traffic || {}
      const totalBytes = Number(traffic.totalBytes || 0)
      acc.uplinkBytes += Number(traffic.uplinkBytes || 0)
      acc.downlinkBytes += Number(traffic.downlinkBytes || 0)
      acc.totalBytes += totalBytes
      if (totalBytes > 0) acc.activeUsers += 1
      return acc
    },
    { period, uplinkBytes: 0, downlinkBytes: 0, totalBytes: 0, activeUsers: 0 },
  )
})

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
    const country = isBrokenNode(node) ? BROKEN_NODES_GROUP : normalizeCountryLabel(node.country)
    if (!groups.has(country)) groups.set(country, [])
    groups.get(country).push(node)
  }
  const result = [...groups.entries()].map(([country, groupNodes]) => ({
    country,
    nodes: groupNodes,
    broken: country === BROKEN_NODES_GROUP,
  }))
  result.sort((left, right) => {
    if (left.broken) return 1
    if (right.broken) return -1
    return left.country.localeCompare(right.country, 'ru')
  })
  return result
})

const orderedPoolNodes = (poolId) =>
  nodes.value
    .filter((node) => node.poolId === poolId)
    .slice()
    .sort((left, right) => {
      const byPriority = Number(left.priority || 0) - Number(right.priority || 0)
      if (byPriority) return byPriority
      return (left.name || left.host || '').localeCompare(right.name || right.host || '', 'ru')
    })

const poolRows = computed(() =>
  pools.value
    .map((pool) => {
      const poolNodes = orderedPoolNodes(pool.id)
      const countries = [...new Set(poolNodes.map((node) => normalizeCountryLabel(node.country)).filter(Boolean))]
      return {
        ...pool,
        nodes: poolNodes,
        nodeCount: poolNodes.length,
        countries: countries.join(', ') || 'не задано',
      }
    })
    .sort((left, right) => left.name.localeCompare(right.name, 'ru')),
)
const poolTotalPages = computed(() => Math.max(1, Math.ceil(poolRows.value.length / POOL_PAGE_SIZE)))
const pagedPools = computed(() => {
  const start = (poolPage.value - 1) * POOL_PAGE_SIZE
  return poolRows.value.slice(start, start + POOL_PAGE_SIZE)
})
const poolPageRange = computed(() => {
  if (!poolRows.value.length) return '0 из 0'
  const start = (poolPage.value - 1) * POOL_PAGE_SIZE + 1
  const end = Math.min(poolPage.value * POOL_PAGE_SIZE, poolRows.value.length)
  return `${start}-${end} из ${poolRows.value.length}`
})

watch(poolTotalPages, (total) => {
  if (poolPage.value > total) poolPage.value = total
})

const isPoolExpanded = (poolId) => expandedPoolIds.value.has(poolId)

const togglePoolExpanded = (poolId) => {
  const next = new Set(expandedPoolIds.value)
  if (next.has(poolId)) {
    next.delete(poolId)
  } else {
    next.add(poolId)
  }
  expandedPoolIds.value = next
}

const userPoolRows = computed(() => {
  const selectedIds = orderedUserPoolPriorities().map((item) => item.poolId)
  const selectedSet = new Set(selectedIds)
  const selected = selectedIds
    .map((id) => pools.value.find((pool) => pool.id === id))
    .filter(Boolean)
    .map((pool) => ({ ...pool, selected: true }))
  const unselected = pools.value
    .filter((pool) => !selectedSet.has(pool.id))
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name, 'ru'))
    .map((pool) => ({ ...pool, selected: false }))
  return [...selected, ...unselected]
})

const modalTitle = computed(() => {
  const action = modal.mode === 'edit' ? 'Редактировать' : 'Добавить'
  const entity = { node: 'ноду', pool: 'пул', user: 'пользователя', route: 'маршрут', routeGroup: 'папку маршрутов' }[modal.type]
  return `${action} ${entity || ''}`
})

const loadProxy = async () => {
  loading.value = true
  try {
    const [runtimeRes, nodesRes, poolsRes, usersRes, routeGroupsRes, routesRes] = await Promise.all([
      authStore.api.get('/proxy/runtime/status'),
      authStore.api.get('/proxy/nodes'),
      authStore.api.get('/proxy/pools'),
      authStore.api.get('/proxy/users'),
      authStore.api.get('/proxy/route-groups'),
      authStore.api.get('/proxy/routes'),
    ])
    const state = normalizeProxyState({
      runtime: runtimeRes.data,
      nodes: nodesRes.data,
      pools: poolsRes.data,
      users: usersRes.data,
      routeGroups: routeGroupsRes.data,
      routes: routesRes.data,
    })
    runtime.value = state.runtime
    nodes.value = state.nodes
    pools.value = state.pools
    users.value = state.users
    routeGroups.value = state.routeGroups
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

const applyRuntimeAfterMutation = async () => {
  try {
    await authStore.api.post('/proxy/runtime/apply')
    return true
  } catch (error) {
    notifications.errorFrom(error, 'Настройки сохранены, но Xray config не применился')
    return false
  }
}

const appliedMutationMessage = (message, applied) => `${message}${applied ? ' и применен' : ''}`

function defaultNodeDraft() {
  return { name: '', country: '', pool_id: '', url: '', enabled: true, priority: 100 }
}

function defaultPoolDraft() {
  return { name: '' }
}

function defaultUserDraft() {
  return {
    label: '',
    enabled: true,
    pool_priorities: [],
    route_groups: [DEFAULT_ROUTE_GROUP_ID],
    traffic_limit_gb: '',
  }
}

function defaultRouteDraft() {
  return { group_id: DEFAULT_ROUTE_GROUP_ID, name: '', kind: 'domain', value: '', enabled: true }
}

function defaultRouteGroupDraft() {
  return { name: '' }
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
      ? orderedUserPoolPriorities(user.poolPriorities)
      : (user.poolId ? [{ poolId: user.poolId, priority: 100 }] : []),
    route_groups: normalizeUserRouteGroups(user.routeGroups),
    traffic_limit_gb: bytesToGbInput(user.trafficLimitBytes),
  } : defaultUserDraft())
}

const openRouteModal = (rule = null, groupId = DEFAULT_ROUTE_GROUP_ID) => {
  modal.open = true
  modal.type = 'route'
  modal.mode = rule ? 'edit' : 'create'
  modal.id = rule?.id || ''
  resetDraft(routeDraft, rule ? {
    group_id: rule.groupId || DEFAULT_ROUTE_GROUP_ID,
    name: rule.name,
    kind: rule.kind,
    value: rule.value,
    enabled: rule.enabled,
  } : { ...defaultRouteDraft(), group_id: groupId })
}

const openRouteGroupModal = (group = null) => {
  modal.open = true
  modal.type = 'routeGroup'
  modal.mode = group ? 'edit' : 'create'
  modal.id = group?.id || ''
  resetDraft(routeGroupDraft, group ? { name: group.name } : defaultRouteGroupDraft())
}

const closeModal = () => {
  if (modalSaving.value) return
  modal.open = false
  modal.type = ''
  modal.id = ''
}

const submitModal = async () => {
  if (modalSaving.value) return
  modalSaving.value = true
  try {
    if (modal.type === 'node') return await saveNode()
    if (modal.type === 'pool') return await savePool()
    if (modal.type === 'user') return await saveUser()
    if (modal.type === 'route') return await saveRoute()
    if (modal.type === 'routeGroup') return await saveRouteGroup()
  } finally {
    modalSaving.value = false
  }
}

const autofillNodeFromUrl = () => {
  if (!nodeDraft.url) return
  if (!nodeDraft.name) nodeDraft.name = inferProxyNodeName(nodeDraft.url)
  if (!nodeDraft.country) nodeDraft.country = inferProxyNodeCountry(nodeDraft.url)
}

const saveNode = async () => {
  if (modal.mode === 'create' && !nodeDraft.url) {
    notifications.error('Вставь VLESS или Hysteria2 ссылку')
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
    const applied = await applyRuntimeAfterMutation()
    notifications.success(modal.mode === 'edit' ? appliedMutationMessage('Нода сохранена', applied) : appliedMutationMessage('Нода добавлена', applied))
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
    const applied = await applyRuntimeAfterMutation()
    notifications.success(appliedMutationMessage('Пул сохранен', applied))
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
      route_groups: normalizeUserRouteGroups(userDraft.route_groups),
      selection_mode: priorities.length ? 'pool_chain' : 'auto_failover',
      traffic_limit_bytes: gbInputToBytes(userDraft.traffic_limit_gb),
    }
    if (modal.mode === 'create') {
      await authStore.api.post('/proxy/users', payload)
    } else {
      await authStore.api.patch(`/proxy/users/${modal.id}`, payload)
    }
    const applied = await applyRuntimeAfterMutation()
    notifications.success(appliedMutationMessage('Пользователь сохранен', applied))
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
      group_id: routeDraft.group_id || DEFAULT_ROUTE_GROUP_ID,
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
    const applied = await applyRuntimeAfterMutation()
    notifications.success(appliedMutationMessage('Маршрут сохранен', applied))
    closeModal()
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось сохранить маршрут')
  }
}

const saveRouteGroup = async () => {
  if (!routeGroupDraft.name) {
    notifications.error('Укажи название папки')
    return
  }
  try {
    if (modal.mode === 'create') {
      await authStore.api.post('/proxy/route-groups', { name: routeGroupDraft.name })
    } else {
      await authStore.api.patch(`/proxy/route-groups/${modal.id}`, { name: routeGroupDraft.name })
    }
    const applied = await applyRuntimeAfterMutation()
    notifications.success(appliedMutationMessage('Папка маршрутов сохранена', applied))
    closeModal()
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось сохранить папку маршрутов')
  }
}

const checkNode = async (node) => {
  try {
    const { data } = await authStore.api.post(`/proxy/nodes/${node.id}/check`)
    notifications[data.ok ? 'success' : 'error'](data.ok ? 'Нода отвечает' : data.error || 'Нода недоступна')
    await applyRuntimeAfterMutation()
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось проверить ноду')
  }
}

const movePoolNode = async (poolId, nodeId, direction) => {
  if (reorderingPoolId.value) return
  const ordered = orderedPoolNodes(poolId)
  const index = ordered.findIndex((node) => node.id === nodeId)
  const nextIndex = index + direction
  if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return

  const reordered = ordered.slice()
  ;[reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]]
  const updates = reordered
    .map((node, nodeIndex) => ({ node, priority: (nodeIndex + 1) * 10 }))
    .filter((item) => Number(item.node.priority || 0) !== item.priority)

  if (!updates.length) return

  reorderingPoolId.value = poolId
  try {
    await Promise.all(updates.map(({ node, priority }) => authStore.api.patch(`/proxy/nodes/${node.id}`, { priority })))
    const applied = await applyRuntimeAfterMutation()
    notifications.success(appliedMutationMessage('Порядок нод сохранен', applied))
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось поменять порядок нод')
  } finally {
    reorderingPoolId.value = ''
  }
}

const toggleNode = async (node) => patchAndReload(`/proxy/nodes/${node.id}`, { enabled: !node.enabled }, 'Не удалось переключить ноду')
const toggleUser = async (user) => patchAndReload(`/proxy/users/${user.id}`, { enabled: !user.enabled }, 'Не удалось переключить пользователя')
const toggleRoute = async (rule) => patchAndReload(`/proxy/routes/${rule.id}`, { enabled: !rule.enabled }, 'Не удалось переключить маршрут')

const patchAndReload = async (url, payload, fallback) => {
  try {
    await authStore.api.patch(url, payload)
    await applyRuntimeAfterMutation()
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, fallback)
  }
}

const deleteNode = async (node) => deleteAndReload(`/proxy/nodes/${node.id}`, `Удалить ноду ${node.name || node.host}?`, 'Нода удалена', 'Не удалось удалить ноду')
const deletePool = async (pool) => deleteAndReload(`/proxy/pools/${pool.id}`, `Удалить пул ${pool.name}?`, 'Пул удален', 'Не удалось удалить пул')
const deleteUser = async (user) => deleteAndReload(`/proxy/users/${user.id}`, `Удалить пользователя ${user.label}?`, 'Пользователь удален', 'Не удалось удалить пользователя')
const deleteRoute = async (rule) => deleteAndReload(`/proxy/routes/${rule.id}`, `Удалить маршрут ${rule.name}?`, 'Маршрут удален', 'Не удалось удалить маршрут')
const deleteRouteGroup = async (group) => deleteAndReload(`/proxy/route-groups/${group.id}`, `Удалить папку ${group.name} и все маршруты внутри?`, 'Папка маршрутов удалена', 'Не удалось удалить папку маршрутов')

const deleteAndReload = async (url, question, success, fallback) => {
  if (!window.confirm(question)) return
  try {
    await authStore.api.delete(url)
    await applyRuntimeAfterMutation()
    notifications.success(success)
    await loadProxy()
  } catch (error) {
    notifications.errorFrom(error, fallback)
  }
}

const loadVlessLink = async (user) => {
  vlessModal.loading = true
  try {
    const { data } = await authStore.api.get(`/proxy/users/${user.id}/vless-link`)
    vlessModal.open = true
    vlessModal.mode = 'link'
    vlessModal.userId = user.id
    vlessModal.userLabel = user.label
    vlessModal.content = data.link || ''
    vlessModal.filename = `${user.label}-vless-link.txt`
    vlessModal.contentType = 'text/plain'
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось получить VLESS ссылку')
  } finally {
    vlessModal.loading = false
  }
}

const loadUserConfig = async (user, format = vlessModal.format || 'happ') => {
  vlessModal.loading = true
  try {
    const { data } = await authStore.api.get(
      `/proxy/users/${user.id}/config?format=${encodeURIComponent(format)}`,
    )
    vlessModal.open = true
    vlessModal.mode = 'config'
    vlessModal.userId = user.id
    vlessModal.userLabel = user.label
    vlessModal.format = data.format || format
    vlessModal.content = data.content || JSON.stringify(data.config || {}, null, 2)
    vlessModal.filename = data.filename || `${user.label}-proxy-config.json`
    vlessModal.contentType = data.content_type || 'text/plain'
  } catch (error) {
    notifications.errorFrom(error, 'Не удалось получить config')
  } finally {
    vlessModal.loading = false
  }
}

const reloadUserConfigFormat = async () => {
  if (!vlessModal.userId) return
  await loadUserConfig({ id: vlessModal.userId, label: vlessModal.userLabel }, vlessModal.format)
}

const switchVlessModalMode = async (mode) => {
  if (!vlessModal.userId || vlessModal.mode === mode) return
  const user = { id: vlessModal.userId, label: vlessModal.userLabel }
  if (mode === 'link') {
    await loadVlessLink(user)
    return
  }
  await loadUserConfig(user, vlessModal.format)
}

const copyVlessModalContent = async () => {
  await navigator.clipboard?.writeText(vlessModal.content)
  notifications.success('Скопировано')
}

const downloadUserConfig = () => {
  const blob = new Blob([vlessModal.content], { type: vlessModal.contentType || 'text/plain' })
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = vlessModal.filename
  link.click()
  URL.revokeObjectURL(href)
}

const closeVlessModal = () => {
  vlessModal.open = false
  vlessModal.loading = false
}

const isUserPoolSelected = (poolId) => userDraft.pool_priorities.some((item) => item.poolId === poolId)

const orderedUserPoolPriorities = (items = userDraft.pool_priorities) =>
  [...items]
    .filter((item) => item.poolId)
    .sort((left, right) => (Number(left.priority) || 100) - (Number(right.priority) || 100))
    .map((item, index) => ({ poolId: item.poolId, priority: (index + 1) * 100 }))

const syncUserPoolPriorities = (items = userDraft.pool_priorities) => {
  userDraft.pool_priorities.splice(0, userDraft.pool_priorities.length, ...items.map((item, index) => ({
    poolId: item.poolId,
    priority: (index + 1) * 100,
  })))
}

const toggleUserPool = (poolId) => {
  const index = userDraft.pool_priorities.findIndex((item) => item.poolId === poolId)
  if (index >= 0) {
    userDraft.pool_priorities.splice(index, 1)
  } else {
    userDraft.pool_priorities.push({ poolId, priority: (userDraft.pool_priorities.length + 1) * 100 })
  }
  syncUserPoolPriorities(orderedUserPoolPriorities())
}

const moveUserPool = (poolId, direction) => {
  const ordered = orderedUserPoolPriorities()
  const from = ordered.findIndex((item) => item.poolId === poolId)
  const to = from + direction
  if (from < 0 || to < 0 || to >= ordered.length) return
  const [item] = ordered.splice(from, 1)
  ordered.splice(to, 0, item)
  syncUserPoolPriorities(ordered)
}

const startUserPoolDrag = (poolId, event) => {
  if (!isUserPoolSelected(poolId)) return
  draggingUserPoolId.value = poolId
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', poolId)
}

const dropUserPool = (targetPoolId, event) => {
  const sourcePoolId = draggingUserPoolId.value || event.dataTransfer.getData('text/plain')
  if (!sourcePoolId || sourcePoolId === targetPoolId || !isUserPoolSelected(targetPoolId)) return
  const ordered = orderedUserPoolPriorities()
  const from = ordered.findIndex((item) => item.poolId === sourcePoolId)
  const to = ordered.findIndex((item) => item.poolId === targetPoolId)
  if (from < 0 || to < 0) return
  const [item] = ordered.splice(from, 1)
  ordered.splice(to, 0, item)
  syncUserPoolPriorities(ordered)
}

const finishUserPoolDrag = () => {
  draggingUserPoolId.value = ''
}

const normalizedUserPoolPayload = () =>
  orderedUserPoolPriorities()
    .map((item, index) => ({
      pool_id: item.poolId,
      priority: (index + 1) * 100,
    }))

const normalizeUserRouteGroups = (values = []) => {
  const result = [DEFAULT_ROUTE_GROUP_ID, ...values]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
  return [...new Set(result)]
}

const isUserRouteGroupSelected = (groupId) => normalizeUserRouteGroups(userDraft.route_groups).includes(groupId)

const toggleUserRouteGroup = (groupId) => {
  if (groupId === DEFAULT_ROUTE_GROUP_ID) return
  const groups = normalizeUserRouteGroups(userDraft.route_groups)
  const index = groups.indexOf(groupId)
  if (index >= 0) {
    groups.splice(index, 1)
  } else {
    groups.push(groupId)
  }
  userDraft.route_groups.splice(0, userDraft.route_groups.length, ...normalizeUserRouteGroups(groups))
}

const changePoolPage = (direction) => {
  const next = poolPage.value + direction
  poolPage.value = Math.min(Math.max(next, 1), poolTotalPages.value)
}

const poolName = (id) => pools.value.find((pool) => pool.id === id)?.name || ''
const userPoolSummary = (user) =>
  (user.poolPriorities || [])
    .slice()
    .sort((left, right) => left.priority - right.priority)
    .map((item) => poolName(item.poolId))
    .filter(Boolean)
    .join(' → ')

const GB = 1024 ** 3

const formatBytes = (bytes = 0) => {
  const value = Number(bytes) || 0
  if (value >= GB) return `${(value / GB).toFixed(value >= 10 * GB ? 1 : 2)} GB`
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MB`
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${value} B`
}

const bytesToGbInput = (bytes) => {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value <= 0) return ''
  return Number((value / GB).toFixed(2)).toString()
}

const gbInputToBytes = (value) => {
  const normalized = String(value ?? '').trim().replace(',', '.')
  if (!normalized) return null
  const numeric = Number(normalized)
  if (!Number.isFinite(numeric) || numeric <= 0) return null
  return Math.round(numeric * GB)
}

const userTrafficProgress = (user) => {
  const quota = Number(user?.traffic?.quotaBytes || user?.trafficLimitBytes || 0)
  if (!quota) return 0
  return Math.min(100, Math.round((Number(user?.traffic?.totalBytes || 0) / quota) * 100))
}

const userTrafficPercentLabel = (user) => {
  const quota = Number(user?.traffic?.quotaBytes || user?.trafficLimitBytes || 0)
  if (!quota) return 'без лимита'
  return `${userTrafficProgress(user)}%`
}

const userTrafficBarClass = (user) => {
  const progress = userTrafficProgress(user)
  if (progress >= 100) return 'bg-rose-500'
  if (progress >= 80) return 'bg-amber-400'
  return 'bg-emerald-500'
}

const formatDate = (value) => new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

const healthDotClass = (status) => {
  const tone = proxyHealthTone(status)
  if (tone === 'ok') return 'bg-emerald-500'
  if (tone === 'warning') return 'bg-amber-400'
  if (tone === 'error') return 'bg-rose-500'
  return 'bg-slate-300'
}

const isBrokenNode = (node) => String(node?.healthStatus || '').toLowerCase() === 'down'

const isNodeGroupCollapsed = (group) => Boolean(collapsedNodeGroups[group.country])

const setNodeGroupCollapsed = (group, open) => {
  collapsedNodeGroups[group.country] = !open
}

const isRouteGroupCollapsed = (group) => Boolean(collapsedRouteGroups[group.id])

const setRouteGroupCollapsed = (group, open) => {
  collapsedRouteGroups[group.id] = !open
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

.proxy-panel-broken {
  border-color: rgb(254 205 211);
  background: rgb(255 241 242);
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

.proxy-icon:disabled {
  cursor: default;
  opacity: 0.35;
}

.proxy-icon:disabled:hover {
  background: white;
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

.proxy-routes-table table,
.proxy-pools-table table {
  table-layout: fixed;
}

.proxy-route-group {
  border-radius: 1.25rem;
  border: 1px solid rgb(226 232 240);
  background: rgb(248 250 252);
  padding: 0.75rem;
}

.proxy-collapse-mark {
  display: grid;
  width: 2rem;
  height: 2rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
  background: rgb(15 23 42);
  color: white;
  font-weight: 900;
  line-height: 1;
}

.proxy-pools-table th:nth-child(1),
.proxy-pools-table td:nth-child(1) {
  width: 16rem;
}

.proxy-pools-table th:nth-child(2),
.proxy-pools-table td:nth-child(2) {
  width: 6rem;
}

.proxy-pools-table th:nth-child(4),
.proxy-pools-table td:nth-child(4) {
  width: 7.5rem;
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

.proxy-pagination {
  margin-top: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.8rem;
  font-weight: 900;
  color: rgb(100 116 139);
}

.proxy-page-button {
  border-radius: 999px;
  border: 1px solid rgb(226 232 240);
  background: white;
  padding: 0.35rem 0.75rem;
  color: rgb(51 65 85);
  font-weight: 900;
}

.proxy-page-button:disabled {
  cursor: default;
  opacity: 0.45;
}

.proxy-page-button:not(:disabled):hover {
  background: rgb(241 245 249);
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

.proxy-primary:disabled,
.proxy-secondary:disabled {
  cursor: default;
  opacity: 0.55;
}

.proxy-primary:disabled:hover {
  background: rgb(15 23 42);
}

.proxy-secondary:disabled:hover {
  background: white;
}

.proxy-input {
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

.proxy-input:focus {
  border-color: rgb(37 99 235);
  box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
}

.proxy-user-pool-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
  border-radius: 1rem;
  border: 1px solid rgb(226 232 240);
  background: rgb(248 250 252);
  padding: 0.65rem 0.75rem;
}

.proxy-user-pool-row.selected {
  border-color: rgb(191 219 254);
  background: rgb(239 246 255);
}

.proxy-user-pool-row.dragging {
  opacity: 0.55;
}

.proxy-order-button,
.proxy-drag-handle {
  display: grid;
  width: 1.85rem;
  height: 1.85rem;
  place-items: center;
  border-radius: 999px;
  border: 1px solid rgb(226 232 240);
  background: white;
  color: rgb(51 65 85);
  font-size: 0.78rem;
  font-weight: 900;
}

.proxy-order-button:hover {
  background: rgb(241 245 249);
}

.proxy-drag-handle {
  cursor: grab;
  color: rgb(100 116 139);
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

.proxy-check.selected {
  border-color: rgb(191 219 254);
  background: rgb(239 246 255);
}

.proxy-check input:disabled {
  cursor: default;
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
