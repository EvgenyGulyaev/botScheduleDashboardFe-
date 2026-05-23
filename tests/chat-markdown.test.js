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

test('renders phone numbers as tel links with a call icon', () => {
  const html = renderChatMarkdown(
    'Сформировалась заявка по услугам\nИмя: авыпавп\nТелефон: +79896283132',
  )

  assert.match(html, /Телефон: <a href="tel:\+79896283132"/)
  assert.match(html, /aria-label="Call \+79896283132"/)
  assert.match(html, />&#128222; \+79896283132<\/a>/)
})

test('normalizes formatted russian phone numbers for tel href', () => {
  const html = renderChatMarkdown('Телефон: +7 (989) 628-31-32')

  assert.match(html, /href="tel:\+79896283132"/)
  assert.match(html, />&#128222; \+7 \(989\) 628-31-32<\/a>/)
})
