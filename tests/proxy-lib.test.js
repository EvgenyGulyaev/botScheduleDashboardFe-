import test from 'node:test'
import assert from 'node:assert/strict'
import { inferVlessCountry } from '../src/lib/proxy.js'

test('infers Finland for known Finnish Hiddify node without matching de inside words', () => {
  const link =
    'vless://9aa7ba20-9b43-4a22-b27b-bd80b9828111@31.56.196.40:443?flow=xtls-rprx-vision&type=tcp&headerType=none&security=reality&fp=safari&sni=31.56.196.40&pbk=-zFEwuaFlhIj3vGGXjSEF8Xx7S1Jj2eqyrqPpB_b1Eg&sid=53fdb69aefab818e#Hiddify-Reality'

  assert.equal(inferVlessCountry(link), 'FI')
})

test('infers Germany from explicit flag or country token', () => {
  assert.equal(inferVlessCountry('vless://id@example.com:443#🇩🇪 Основной'), 'DE')
  assert.equal(inferVlessCountry('vless://id@example.com:443#Germany'), 'DE')
})
