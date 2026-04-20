import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCallMediaConstraints,
  getCallVideoGridClass,
  mergeCallMediaEntry,
  setStreamTracksEnabled,
  streamHasActiveVideo,
  streamHasVideo,
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
    mergeCallMediaEntry({ cameraEnabled: false }, participant, stream),
    {
      email: 'nika@example.com',
      login: 'nika',
      muted: true,
      stream,
      cameraEnabled: true,
      hasVideo: true,
    },
  )
})

test('picks tighter grid classes as participant count grows', () => {
  assert.equal(getCallVideoGridClass(1), 'grid-cols-1')
  assert.equal(getCallVideoGridClass(2), 'grid-cols-1 sm:grid-cols-2')
  assert.equal(getCallVideoGridClass(4), 'grid-cols-1 sm:grid-cols-2')
})
