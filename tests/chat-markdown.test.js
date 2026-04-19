import test from 'node:test'
import assert from 'node:assert/strict'
import { renderChatMarkdown } from '../src/lib/chat-markdown.js'

test('renders bold, italic and links in chat markdown', () => {
  const html = renderChatMarkdown(
    'Это **жирный** текст, это *курсив*, а это [ссылка](https://example.com)',
  )

  assert.match(html, /<strong>жирный<\/strong>/)
  assert.match(html, /<em>курсив<\/em>/)
  assert.match(html, /<a href="https:\/\/example\.com"/)
})

test('escapes html instead of rendering it', () => {
  const html = renderChatMarkdown('<script>alert(1)</script> **ok**')

  assert.doesNotMatch(html, /<script>/)
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.match(html, /<strong>ok<\/strong>/)
})

test('keeps unsafe markdown links as plain text', () => {
  const html = renderChatMarkdown('[bad](javascript:alert(1))')

  assert.doesNotMatch(html, /<a /)
  assert.match(html, /\[bad\]\(javascript:alert\(1\)\)/)
})

test('preserves line breaks in markdown output', () => {
  const html = renderChatMarkdown('first line\nsecond line')

  assert.match(html, /first line<br>second line/)
})
