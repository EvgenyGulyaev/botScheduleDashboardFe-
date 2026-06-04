import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useDrawingStampsStore } from '../src/stores/drawing-stamps.js'
import { useAuthStore } from '../src/stores/auth.js'

const buildApiMock = () => {
  const calls = []
  const handlers = { get: null, post: null, put: null, delete: null }
  const make = (method) => (url, payload, config) => {
    calls.push({ method, url, payload, config })
    return handlers[method]({ url, payload, config })
  }
  return {
    calls,
    api: {
      get: (url, config) => make('get')(url, undefined, config),
      post: (url, payload, config) => make('post')(url, payload, config),
      put: (url, payload, config) => make('put')(url, payload, config),
      delete: (url, config) => make('delete')(url, undefined, config),
    },
    on(method, fn) {
      handlers[method] = fn
    },
  }
}

const setupStore = () => {
  setActivePinia(createPinia())
  const auth = useAuthStore()
  const mock = buildApiMock()
  auth.api = mock.api
  return { store: useDrawingStampsStore(), mock }
}

test('fetchStamps populates shared stamps', async () => {
  const { store, mock } = setupStore()
  mock.on('get', ({ url }) => {
    assert.equal(url, '/drawing/stamps')
    return { data: { items: [{ id: 's1', name: 'Evgeny', textValue: 'E', priority: 'text' }] } }
  })

  const items = await store.fetchStamps()
  assert.equal(items.length, 1)
  assert.equal(store.items[0].name, 'Evgeny')
})

test('createStamp posts multipart payload', async () => {
  const { store, mock } = setupStore()
  mock.on('post', ({ url, payload }) => {
    assert.equal(url, '/drawing/stamps')
    assert.ok(payload instanceof FormData)
    return { data: { id: 's1', name: 'Seal', hasImage: true, priority: 'image' } }
  })

  const created = await store.createStamp({
    name: 'Seal',
    textValue: 'S',
    priority: 'image',
    file: new Blob(['x'], { type: 'image/png' }),
  })
  assert.equal(created.id, 's1')
  assert.equal(store.items[0].id, 's1')
})

test('createStamp uses stamp name as text when image is omitted', async () => {
  const { store, mock } = setupStore()
  mock.on('post', ({ payload }) => {
    const metadata = JSON.parse(payload.get('metadata'))
    assert.deepEqual(metadata, {
      name: 'Евгений',
      textValue: 'Евгений',
      priority: 'text',
      removeImage: false,
    })
    return { data: { id: 's2', name: 'Евгений', textValue: 'Евгений', priority: 'text' } }
  })

  await store.createStamp({
    name: 'Евгений',
    textValue: '',
    priority: 'image',
    hasImage: false,
  })
})

test('createStamp removes local duplicate names', async () => {
  const { store, mock } = setupStore()
  store.items = [
    { id: 'old', name: ' Антон ', textValue: 'old', priority: 'text' },
    { id: 'other', name: 'Женя', textValue: 'Женя', priority: 'text' },
  ]
  mock.on('post', () => ({ data: { id: 'new', name: 'антон', textValue: 'new', priority: 'text' } }))

  await store.createStamp({
    name: 'антон',
    textValue: 'new',
    priority: 'text',
  })

  assert.deepEqual(store.items.map((item) => item.id), ['new', 'other'])
})

test('updateStamp removes local duplicate names', async () => {
  const { store, mock } = setupStore()
  store.items = [
    { id: 'first', name: 'Первый', textValue: 'first', priority: 'text' },
    { id: 'duplicate', name: ' seal ', textValue: 'dup', priority: 'text' },
    { id: 'target', name: 'Печать', textValue: 'old', priority: 'text' },
    { id: 'other', name: 'Женя', textValue: 'Женя', priority: 'text' },
  ]
  mock.on('put', ({ url }) => {
    assert.equal(url, '/drawing/stamps/target')
    return { data: { id: 'target', name: 'Seal', textValue: 'new', priority: 'text' } }
  })

  await store.updateStamp('target', {
    name: 'Seal',
    textValue: 'new',
    priority: 'text',
  })

  assert.deepEqual(store.items.map((item) => item.id), ['first', 'target', 'other'])
})

test('fetchStampContent returns blob response', async () => {
  const { store, mock } = setupStore()
  const blob = new Blob(['png'], { type: 'image/png' })
  mock.on('get', ({ url, config }) => {
    assert.equal(url, '/drawing/stamps/s1/content')
    assert.equal(config.responseType, 'blob')
    return { data: blob }
  })

  assert.equal(await store.fetchStampContent('s1'), blob)
})
