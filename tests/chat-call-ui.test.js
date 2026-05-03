import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCallMediaConstraints,
  getCallFocusSidebarTiles,
  getCallFocusTile,
  getCallVideoGridClass,
  mergeCallMediaEntry,
  replacePeerConnectionsVideoTrack,
  setStreamTracksEnabled,
  streamHasActiveVideo,
  streamHasVideo,
  streamVideoTrack,
} from '../src/lib/chat-call-ui.js'

test('builds call media constraints with optional video', () => {
  assert.deepEqual(buildCallMediaConstraints(), {
    audio: true,
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  })

  assert.deepEqual(buildCallMediaConstraints({ video: false }), {
    audio: true,
    video: false,
  })
})

test('detects video tracks and active camera state', () => {
  const noVideoStream = {
    getVideoTracks() {
      return []
    },
  }
  const disabledVideoStream = {
    getVideoTracks() {
      return [{ enabled: false, readyState: 'live' }]
    },
  }
  const activeVideoStream = {
    getVideoTracks() {
      return [{ enabled: true, readyState: 'live' }]
    },
  }

  assert.equal(streamHasVideo(noVideoStream), false)
  assert.equal(streamHasVideo(activeVideoStream), true)
  assert.equal(streamHasActiveVideo(noVideoStream), false)
  assert.equal(streamHasActiveVideo(disabledVideoStream), false)
  assert.equal(streamHasActiveVideo(activeVideoStream), true)
})

test('toggles stream tracks for requested media kind', () => {
  const audioTrack = { enabled: true }
  const videoTrack = { enabled: true }
  const stream = {
    getAudioTracks() {
      return [audioTrack]
    },
    getVideoTracks() {
      return [videoTrack]
    },
  }

  assert.equal(setStreamTracksEnabled(stream, 'video', false), 1)
  assert.equal(videoTrack.enabled, false)
  assert.equal(audioTrack.enabled, true)

  assert.equal(setStreamTracksEnabled(stream, 'audio', false), 1)
  assert.equal(audioTrack.enabled, false)
})

test('gets the first video track from a stream', () => {
  const videoTrack = { kind: 'video' }
  assert.equal(
    streamVideoTrack({
      getVideoTracks() {
        return [videoTrack]
      },
    }),
    videoTrack,
  )
  assert.equal(streamVideoTrack(null), null)
})

test('replaces video sender tracks across peer connections', async () => {
  const nextTrack = { kind: 'video', id: 'screen-track' }
  const replaced = []
  const audioSender = {
    track: { kind: 'audio' },
    async replaceTrack(track) {
      replaced.push(['audio', track])
    },
  }
  const videoSender = {
    track: { kind: 'video' },
    async replaceTrack(track) {
      replaced.push(['video', track])
    },
  }
  const connections = new Map([
    [
      'peer-a@example.com',
      {
        getSenders() {
          return [audioSender, videoSender]
        },
      },
    ],
    [
      'peer-b@example.com',
      {
        getSenders() {
          return [audioSender]
        },
      },
    ],
  ])

  assert.equal(await replacePeerConnectionsVideoTrack(connections, nextTrack), 1)
  assert.deepEqual(replaced, [['video', nextTrack]])
})

test('merges remote media entry with participant and stream state', () => {
  const participant = {
    email: 'nika@example.com',
    login: 'nika',
    muted: true,
  }
  const stream = {
    getVideoTracks() {
      return [{ enabled: true, readyState: 'live' }]
    },
  }

  assert.deepEqual(
    mergeCallMediaEntry({ cameraEnabled: false, screenSharing: true }, participant, stream),
    {
      email: 'nika@example.com',
      login: 'nika',
      muted: true,
      stream,
      cameraEnabled: true,
      hasVideo: true,
      screenSharing: true,
    },
  )
})

test('picks tighter grid classes as participant count grows', () => {
  assert.equal(getCallVideoGridClass(1), 'grid-cols-1')
  assert.equal(getCallVideoGridClass(2), 'grid-cols-1 sm:grid-cols-2')
  assert.equal(getCallVideoGridClass(4), 'grid-cols-1 sm:grid-cols-2')
})

test('picks focused call tile by explicit email or sensible fallback', () => {
  const tiles = [
    { email: 'audio@example.com', cameraEnabled: false, hasVideo: false },
    { email: 'video@example.com', cameraEnabled: true, hasVideo: true },
    { email: 'other@example.com', cameraEnabled: false, hasVideo: true, screenSharing: true },
  ]

  assert.equal(getCallFocusTile(tiles, 'other@example.com')?.email, 'other@example.com')
  assert.equal(getCallFocusTile(tiles, '')?.email, 'other@example.com')
  assert.equal(getCallFocusTile(tiles, 'missing@example.com')?.email, 'other@example.com')
  assert.equal(
    getCallFocusTile([{ email: 'audio@example.com', hasVideo: false }], '')?.email,
    'audio@example.com',
  )
  assert.equal(getCallFocusTile([], 'video@example.com'), null)
})

test('builds sidebar tiles without the currently focused participant', () => {
  const tiles = [
    { email: 'self@example.com' },
    { email: 'peer-a@example.com' },
    { email: 'peer-b@example.com' },
  ]

  assert.deepEqual(
    getCallFocusSidebarTiles(tiles, 'peer-a@example.com').map((tile) => tile.email),
    ['self@example.com', 'peer-b@example.com'],
  )
  assert.deepEqual(
    getCallFocusSidebarTiles(tiles, '').map((tile) => tile.email),
    ['self@example.com', 'peer-a@example.com', 'peer-b@example.com'],
  )
})
