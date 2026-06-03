import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useDrawingStore } from '../src/stores/drawing.js'
import { useAuthStore } from '../src/stores/auth.js'

const buildApiMock = () => {
  const calls = []
  const handlers = {
    get: null,
    post: null,
    put: null,
    delete: null,
  }
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

const setupDrawingStore = () => {
  setActivePinia(createPinia())
  const auth = useAuthStore()
  const mock = buildApiMock()
  auth.api = mock.api
  const store = useDrawingStore()
  return { store, mock, auth }
}

test('fetchImages populates items', async () => {
  const { store, mock } = setupDrawingStore()
  mock.on('get', ({ url }) => {
    assert.equal(url, '/drawing/images')
    return { data: { items: [{ id: '1', title: 'Test', mime_type: 'image/png', size: 10, width: 100, height: 50, created_by: 'u', updated_by: 'u' }] } }
  })

  const items = await store.fetchImages()
  assert.equal(items.length, 1)
  assert.equal(store.items[0].id, '1')
  assert.equal(store.items[0].title, 'Test')
  assert.equal(store.items[0].mimeType, 'image/png')
  assert.equal(store.items[0].createdBy, 'u')
})

test('fetchImage sets selected', async () => {
  const { store, mock } = setupDrawingStore()
  mock.on('get', ({ url }) => {
    assert.equal(url, '/drawing/images/abc')
    return { data: { id: 'abc', title: 'x', width: 1, height: 1 } }
  })

  const item = await store.fetchImage('abc')
  assert.equal(store.selected.id, 'abc')
  assert.equal(item.id, 'abc')
})

test('fetchImageContent returns blob', async () => {
  const { store, mock } = setupDrawingStore()
  const blob = new Blob(['x'])
  mock.on('get', ({ url, config }) => {
    assert.equal(url, '/drawing/images/abc/content')
    assert.equal(config.responseType, 'blob')
    return { data: blob }
  })
  const result = await store.fetchImageContent('abc')
  assert.equal(result, blob)
})

test('createImage posts multipart and prepends item', async () => {
  const { store, mock } = setupDrawingStore()
  mock.on('post', ({ url, payload }) => {
    assert.equal(url, '/drawing/images')
    assert.ok(payload instanceof FormData)
    return { data: { id: 'new', title: '  New  ', mime_type: 'image/png', size: 1, width: 1, height: 1 } }
  })

  const created = await store.createImage({
    title: '  New  ',
    width: 1,
    height: 1,
    blob: new Blob(['x']),
  })
  assert.equal(created.id, 'new')
  assert.equal(store.items[0].id, 'new')
  assert.equal(store.selected.id, 'new')
})

test('updateImage replaces item by id', async () => {
  const { store, mock } = setupDrawingStore()
  store.items = [{ id: 'a', title: 'A', width: 1, height: 1 }]

  mock.on('put', ({ url }) => {
    assert.equal(url, '/drawing/images/a')
    return { data: { id: 'a', title: 'AA', width: 2, height: 2 } }
  })

  const updated = await store.updateImage('a', { title: 'AA', width: 2, height: 2, blob: new Blob(['x']) })
  assert.equal(updated.title, 'AA')
  assert.equal(store.items[0].title, 'AA')
})

test('deleteImage removes item and clears selected', async () => {
  const { store, mock } = setupDrawingStore()
  store.items = [{ id: 'a', title: 'A' }]
  store.selected = { id: 'a', title: 'A' }

  mock.on('delete', ({ url }) => {
    assert.equal(url, '/drawing/images/a')
    return { data: null }
  })

  await store.deleteImage('a')
  assert.equal(store.items.length, 0)
  assert.equal(store.selected, null)
})

test('error message is exposed in russian', async () => {
  const { store, mock } = setupDrawingStore()
  mock.on('get', () => {
    const err = new Error('boom')
    err.response = { data: { message: 'invalid token' } }
    throw err
  })

  await assert.rejects(() => store.fetchImages())
  assert.equal(store.error, 'invalid token')
})

test('fallback error message is russian', async () => {
  const { store, mock } = setupDrawingStore()
  mock.on('get', () => {
    const err = new Error('boom')
    throw err
  })

  await assert.rejects(() => store.fetchImages())
  assert.equal(store.error, 'Не удалось загрузить список рисунков')
})
