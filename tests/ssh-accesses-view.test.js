import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const router = readFileSync(resolve(__dirname, '../src/router/index.js'), 'utf8')
const dashboard = readFileSync(resolve(__dirname, '../src/views/Dashboard.vue'), 'utf8')
const sshAccesses = readFileSync(resolve(__dirname, '../src/views/SSHAccesses.vue'), 'utf8')

test('ssh accesses route is super admin dashboard route', () => {
  assert.match(router, /path: '\/dashboard\/ssh-accesses'/)
  assert.match(router, /name: 'SSHAccesses'/)
  assert.match(router, /requiresSuperAdmin: true/)
})

test('dashboard exposes ssh accesses entry point', () => {
  assert.match(dashboard, /to="\/dashboard\/ssh-accesses"/)
  assert.match(dashboard, /SSH доступы/)
})

test('ssh accesses view uses public key and folder permission API contract', () => {
  assert.match(sshAccesses, /\/server\/ssh-accesses/)
  assert.match(sshAccesses, /public_key/)
  assert.match(sshAccesses, /var_go_access/)
  assert.match(sshAccesses, /var_www_access/)
  assert.match(sshAccesses, /id_rsa\.pub/)
})
