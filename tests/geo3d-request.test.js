import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildGeoPayload,
  buildGeoRequestConfig,
  resolveGeoDownloadFilename,
} from '../src/lib/geo3d-request.js'

test('builds geo payload for city mode and trims email', () => {
  const payload = buildGeoPayload({
    mode: 'city',
    city: 'Moscow Kremlin',
    lat: null,
    lon: null,
    width: 500,
    height: 600,
    include_roads: true,
    include_terrain: false,
    print_ready: true,
    format: 'stl',
    scale: 1.2,
    height_multiplier: 1.8,
    base_thickness: 3,
    split_board: true,
    board_size_mm: 160,
    merge_tiles: false,
    merge_gap_mm: 10,
    email: '  admin@example.com ',
  })

  assert.deepEqual(payload, {
    city: 'Moscow Kremlin',
    width: 500,
    height: 600,
    format: 'stl',
    include_roads: true,
    include_terrain: false,
    print_ready: true,
    scale: 1.2,
    height_multiplier: 1.8,
    base_thickness: 3,
    split_board: true,
    board_size_mm: 160,
    merge_tiles: false,
    merge_gap_mm: 10,
    email: 'admin@example.com',
  })
})

test('builds geo payload for coords mode without optional fields', () => {
  const payload = buildGeoPayload({
    mode: 'coords',
    city: '',
    lat: 55.75,
    lon: 37.61,
    width: 500,
    height: 500,
    include_roads: true,
    include_terrain: false,
    print_ready: false,
    format: 'glb',
    scale: 1,
    height_multiplier: 1,
    base_thickness: 3,
    split_board: false,
    board_size_mm: 160,
    merge_tiles: false,
    merge_gap_mm: 10,
    email: '   ',
  })

  assert.deepEqual(payload, {
    lat: 55.75,
    lon: 37.61,
    width: 500,
    height: 500,
    format: 'glb',
    include_roads: true,
    include_terrain: false,
  })
})

test('adds bearer auth header to geo request config when token exists', () => {
  const withToken = buildGeoRequestConfig('secret-token')
  const withoutToken = buildGeoRequestConfig(null)

  assert.equal(withToken.responseType, 'blob')
  assert.equal(withToken.timeout, 120000)
  assert.equal(withToken.headers.Authorization, 'Bearer secret-token')
  assert.deepEqual(withoutToken.headers, {})
})

test('resolves safe fallback geo filename and zip extension for split boards', () => {
  const filename = resolveGeoDownloadFilename({
    headers: {},
    form: {
      mode: 'city',
      city: 'Moscow / Kremlin',
      format: 'stl',
      print_ready: true,
      split_board: true,
      merge_tiles: false,
    },
  })

  assert.equal(filename, 'model_Moscow_Kremlin.zip')
})

test('prefers content-disposition filename when provided', () => {
  const filename = resolveGeoDownloadFilename({
    headers: {
      'content-disposition': 'attachment; filename=\"ready-model.stl\"',
    },
    form: {
      mode: 'coords',
      city: '',
      format: 'stl',
      print_ready: false,
      split_board: false,
      merge_tiles: false,
    },
  })

  assert.equal(filename, 'ready-model.stl')
})
