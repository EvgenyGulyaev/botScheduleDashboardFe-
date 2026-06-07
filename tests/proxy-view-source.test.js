import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const proxyVue = readFileSync(resolve(__dirname, '../src/views/Proxy.vue'), 'utf8')
const router = readFileSync(resolve(__dirname, '../src/router/index.js'), 'utf8')

test('proxy route is a super admin app', () => {
  assert.match(router, /path: '\/proxy'/)
  assert.match(router, /name: 'Proxy'/)
  assert.match(router, /requiresSuperAdmin: true/)
})

test('proxy view manages runtime, nodes and users', () => {
  assert.match(proxyVue, /\/proxy\/runtime\/status/)
  assert.match(proxyVue, /\/proxy\/runtime\/apply/)
  assert.match(proxyVue, /\/proxy\/nodes/)
  assert.match(proxyVue, /\/proxy\/users/)
  assert.match(proxyVue, /vless-link/)
})
