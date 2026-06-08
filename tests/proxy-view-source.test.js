import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const proxyVue = readFileSync(resolve(__dirname, '../src/views/Proxy.vue'), 'utf8')
const router = readFileSync(resolve(__dirname, '../src/router/index.js'), 'utf8')

test('proxy route is protected by proxy app permission', () => {
  const route = router.match(/path: '\/proxy\/:section\?'[\s\S]*?meta: \{[^}]+}/)?.[0] || ''

  assert.match(route, /name: 'Proxy'/)
  assert.match(route, /appKey: 'proxy'/)
  assert.match(route, /superAdminBypass: true/)
  assert.doesNotMatch(route, /requiresSuperAdmin/)
})

test('proxy view manages runtime, nodes, users and routes', () => {
  assert.match(proxyVue, /\/proxy\/runtime\/status/)
  assert.match(proxyVue, /\/proxy\/runtime\/apply/)
  assert.match(proxyVue, /\/proxy\/nodes/)
  assert.match(proxyVue, /\/proxy\/nodes\/\$\{node\.id\}\/check/)
  assert.match(proxyVue, /\/proxy\/users/)
  assert.match(proxyVue, /\/proxy\/users\/\$\{user\.id\}\/config/)
  assert.match(proxyVue, /\/proxy\/route-groups/)
  assert.match(proxyVue, /\/proxy\/routes/)
  assert.match(proxyVue, /vless-link/)
  assert.match(proxyVue, /BROKEN_NODES_GROUP = 'Нерабочие'/)
  assert.match(proxyVue, /isBrokenNode\(node\) \? BROKEN_NODES_GROUP/)
  assert.match(proxyVue, /collapsedNodeGroups/)
  assert.match(proxyVue, /collapsedRouteGroups/)
  assert.match(proxyVue, /isRouteGroupCollapsed/)
  assert.match(proxyVue, /pool_priorities/)
  assert.match(proxyVue, /route_groups/)
  assert.match(proxyVue, /routeGroupRows/)
  assert.match(proxyVue, /routeGroupDraft/)
  assert.match(proxyVue, /proxy-pools-table/)
  assert.match(proxyVue, /pagedPools/)
  assert.match(proxyVue, /proxy-user-pool-row/)
  assert.match(proxyVue, /dropUserPool/)
  assert.doesNotMatch(proxyVue, /proxy-priority-input/)
  assert.match(proxyVue, /proxy-routes-table/)
  assert.match(proxyVue, /routeKindLabel/)
  assert.match(proxyVue, /openRouteModal/)
  assert.match(proxyVue, /openNodeModal/)
})
