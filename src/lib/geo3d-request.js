const sanitizeFilenamePart = (value) => {
  const normalized = String(value ?? '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  return normalized || 'coords'
}

const getDownloadExtension = (form) => {
  if (form.print_ready && form.split_board && !form.merge_tiles) {
    return 'zip'
  }

  return form.format
}

export const buildGeoPayload = (form) => {
  const payload = {
    width: form.width,
    height: form.height,
    format: form.format,
    include_roads: form.include_roads,
    include_terrain: form.include_terrain,
  }

  if (form.mode === 'city') {
    payload.city = form.city
  } else {
    payload.lat = form.lat
    payload.lon = form.lon
  }

  if (form.print_ready) {
    payload.print_ready = true
    payload.scale = form.scale
    payload.height_multiplier = form.height_multiplier
    payload.base_thickness = form.base_thickness

    if (form.split_board) {
      payload.split_board = true
      payload.board_size_mm = form.board_size_mm
      payload.merge_tiles = form.merge_tiles
      payload.merge_gap_mm = form.merge_gap_mm
    }
  }

  const email = form.email?.trim()
  if (email) {
    payload.email = email
  }

  return payload
}

export const buildGeoRequestConfig = (token) => ({
  responseType: 'blob',
  timeout: 120000,
  headers: token ? { Authorization: `Bearer ${token}` } : {},
})

export const resolveGeoDownloadFilename = ({ headers, form }) => {
  const disposition = headers['content-disposition']

  if (disposition?.includes('attachment')) {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
    const matches = filenameRegex.exec(disposition)
    if (matches?.[1]) {
      return matches[1].replace(/['"]/g, '')
    }
  }

  const baseName =
    form.mode === 'city' ? sanitizeFilenamePart(form.city) : sanitizeFilenamePart('coords')

  return `model_${baseName}.${getDownloadExtension(form)}`
}
