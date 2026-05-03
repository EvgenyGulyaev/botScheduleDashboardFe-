const toTracks = (stream, kind) => {
  if (!stream) {
    return []
  }

  if (kind === 'audio') {
    return Array.isArray(stream.getAudioTracks?.()) ? stream.getAudioTracks() : []
  }

  return Array.isArray(stream.getVideoTracks?.()) ? stream.getVideoTracks() : []
}

export const buildCallMediaConstraints = ({ video = true } = {}) => ({
  audio: true,
  video: video
    ? {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      }
    : false,
})

export const streamHasVideo = (stream) => toTracks(stream, 'video').length > 0

export const streamVideoTrack = (stream) => toTracks(stream, 'video')[0] || null

export const streamHasActiveVideo = (stream) =>
  toTracks(stream, 'video').some(
    (track) => track?.enabled !== false && track?.readyState !== 'ended',
  )

export const setStreamTracksEnabled = (stream, kind, enabled) => {
  const tracks = toTracks(stream, kind)
  for (const track of tracks) {
    track.enabled = Boolean(enabled)
  }
  return tracks.length
}

export const replacePeerConnectionsVideoTrack = async (connections, track) => {
  const values =
    connections && typeof connections.values === 'function'
      ? connections.values()
      : connections || []
  let replaced = 0
  for (const connection of values) {
    const sender = connection
      ?.getSenders?.()
      ?.find((item) => item?.track?.kind === 'video' && typeof item.replaceTrack === 'function')
    if (!sender) {
      continue
    }
    await sender.replaceTrack(track || null)
    replaced += 1
  }
  return replaced
}

export const mergeCallMediaEntry = (current = {}, participant = {}, stream = null) => ({
  email: participant?.email || current?.email || '',
  login: participant?.login || current?.login || participant?.email || current?.email || '',
  muted: Boolean(participant?.muted),
  stream: stream || current?.stream || null,
  cameraEnabled: stream ? streamHasActiveVideo(stream) : Boolean(current?.cameraEnabled),
  hasVideo: stream ? streamHasVideo(stream) : Boolean(current?.hasVideo),
  screenSharing: Boolean(current?.screenSharing),
})

export const getCallVideoGridClass = (count = 0) => {
  if (Number(count) <= 1) {
    return 'grid-cols-1'
  }

  return 'grid-cols-1 sm:grid-cols-2'
}

export const getCallFocusTile = (tiles = [], preferredEmail = '') => {
  const normalizedTiles = Array.isArray(tiles) ? tiles.filter(Boolean) : []
  if (!normalizedTiles.length) {
    return null
  }

  if (preferredEmail) {
    const explicit = normalizedTiles.find((tile) => tile.email === preferredEmail)
    if (explicit) {
      return explicit
    }
  }

  return (
    normalizedTiles.find((tile) => tile.screenSharing && (tile.hasVideo || tile.stream)) ||
    normalizedTiles.find((tile) => tile.cameraEnabled || tile.hasVideo) ||
    normalizedTiles[0] ||
    null
  )
}

export const getCallFocusSidebarTiles = (tiles = [], featuredEmail = '') =>
  (Array.isArray(tiles) ? tiles : []).filter(
    (tile) => tile?.email && (!featuredEmail || tile.email !== featuredEmail),
  )
