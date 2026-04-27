# Chat Phase 1 Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add presence, typing, delivered/read state, server-backed drafts, unread separator, and failed-send retry to the existing realtime admin chat without regressing current text/audio/image, call, push, and Alice flows.

**Architecture:** Extend the current Bolt-backed chat model and WebSocket event protocol in place rather than introducing a second messaging subsystem. Backend owns durable presence metadata, read points, draft storage, delivery/read acknowledgements, and send deduplication; frontend layers optimistic state and compact UI on top of the existing `chat.js` store and `Chat.vue` timeline.

**Tech Stack:** Go, BoltDB, Silverlining routes, existing chat event bus/WebSocket transport, Vue 3, Pinia, Vite, Node test runner

---

## File Map

### Backend files to modify

- `/Users/evgeny/Work/botScheduleDashboard/internal/chat/events.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/chat/hub.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/chat/server.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/model/chatMessage.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/model/chatConversation.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/model/chatMember.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/http/server.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/chat_helpers.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/getChatConversations.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/getChatMessages.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/postChatMessage.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/postChatAudio.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/postChatImage.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/chat_routes_test.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat_test.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_payloads.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_publish.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_subjects.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_handlers.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/event/consumer/chat_test.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/chat/hub_test.go`

### Backend files to create

- `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/getChatDraft.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/putChatDraft.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/deleteChatDraft.go`

### Frontend files to modify

- `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat.js`
- `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat-ui.js`
- `/Users/evgeny/Work/botScheduleDashboardFe-/src/stores/chat.js`
- `/Users/evgeny/Work/botScheduleDashboardFe-/src/views/Chat.vue`
- `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat.test.js`
- `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat-ui.test.js`
- `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat-markdown.test.js`

### Frontend files to create

- `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat-presence.test.js`
- `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat-drafts.test.js`
- `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat-unread.test.js`

---

### Task 1: Add durable presence metadata and typing events

**Files:**
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/model/chatConversation.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/chat/events.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/chat/hub.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/chat/server.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/getChatConversations.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/getChatMessages.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_payloads.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_publish.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_subjects.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_handlers.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/event/consumer/chat_test.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/chat/hub_test.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/server.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/chat_routes_test.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat_test.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/stores/chat.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/views/Chat.vue`
- Create: `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat-presence.test.js`

- [ ] **Step 1: Write failing backend tests for presence summaries and typing fanout**

Add tests that cover:
- direct conversation payload contains `presence.online`, `presence.last_active_at`, `presence.last_seen_at`
- group conversation payload contains `presence.online_count`, `presence.last_active_at`
- websocket connect marks user online and updates `last_active_at`
- websocket disconnect clears online state and advances `last_seen_at`
- `presence_updated` is fanned out to member conversations only
- outgoing websocket `typing_started` and `typing_stopped` commands mutate server typing state correctly
- typing events are scoped to the conversation and exclude the sender
- typing state expires when no stop event arrives

- [ ] **Step 2: Run presence/typing backend tests to verify failure**

Run: `GOENV_VERSION=1.25.4 go test ./internal/store ./internal/http/routes ./internal/event/... ./internal/chat -run 'Presence|Typing' -count=1`
Expected: FAIL because presence fields, routes, and event payloads do not exist yet.

- [ ] **Step 3: Implement backend presence model and typing endpoints**

Implement:
- durable user presence fields `last_active_at` and `last_seen_at`
- aggregate presence summary generation in conversation DTOs
- websocket lifecycle hooks in `internal/chat/server.go` and `internal/chat/hub.go` for connect/disconnect presence transitions
- in-memory typing registry with TTL cleanup
- new gateway command names and payload types in `internal/chat/events.go` for outgoing `typing_started` and `typing_stopped`
- broker subjects and listeners for presence/typing in `internal/event/chat_subjects.go`, `internal/event/chat_publish.go`, and `internal/chat/server.go`
- `typing_started` and `typing_stopped` event publication
- `presence_updated` event publication to relevant conversation members

- [ ] **Step 4: Re-run presence/typing backend tests**

Run: `GOENV_VERSION=1.25.4 go test ./internal/store ./internal/http/routes ./internal/event/... ./internal/chat -run 'Presence|Typing' -count=1`
Expected: PASS.

- [ ] **Step 5: Write failing frontend tests for presence label mapping and typing aggregation**

Add tests for:
- direct presence text
- group online-count summary normalization
- typing indicator label generation for one and multiple users

- [ ] **Step 6: Run frontend presence/typing tests to verify failure**

Run: `node --test tests/chat-presence.test.js tests/chat-ui.test.js`
Expected: FAIL because normalization and UI helpers are missing.

- [ ] **Step 7: Implement frontend presence and typing UI**

Implement:
- normalization of new presence payloads
- store fields for active typers per conversation
- outgoing websocket envelopes for typing start/stop based on composer activity
- WebSocket handling for `typing_started`, `typing_stopped`, and `presence_updated`
- compact rendering in chat list and chat header/timeline

- [ ] **Step 8: Re-run frontend presence/typing tests**

Run: `node --test tests/chat-presence.test.js tests/chat-ui.test.js`
Expected: PASS.

- [ ] **Step 9: Commit presence and typing**

```bash
git -C /Users/evgeny/Work/botScheduleDashboard add internal/chat/events.go internal/chat/hub.go internal/chat/server.go internal/chat/hub_test.go internal/model/chatConversation.go internal/store/chat.go internal/http/routes/getChatConversations.go internal/http/routes/getChatMessages.go internal/event/chat_payloads.go internal/event/chat_publish.go internal/event/chat_subjects.go internal/event/chat_handlers.go internal/event/consumer/chat_test.go internal/http/server.go internal/http/routes/chat_routes_test.go internal/store/chat_test.go
git -C /Users/evgeny/Work/botScheduleDashboard commit -m "feat: add chat presence and typing"

git -C /Users/evgeny/Work/botScheduleDashboardFe- add src/lib/chat.js src/stores/chat.js src/views/Chat.vue tests/chat-presence.test.js tests/chat-ui.test.js
git -C /Users/evgeny/Work/botScheduleDashboardFe- commit -m "feat: show chat presence and typing"
```

### Task 2: Add `client_message_id` send deduplication and delivered/read lifecycle

**Files:**
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/chat/events.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/chat/hub.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/chat/server.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/model/chatMessage.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/postChatAudio.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/postChatImage.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/getChatMessages.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/server.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_payloads.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_publish.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_subjects.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_handlers.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/chat_routes_test.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat_test.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/chat/hub_test.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat-ui.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/stores/chat.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/views/Chat.vue`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat.test.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat-ui.test.js`

- [ ] **Step 1: Write failing backend tests for client-message dedupe and delivered/read transitions**

Cover:
- repeated send with same `(conversation_id, sender_email, client_message_id)` does not create duplicate persisted message
- message payloads include `client_message_id`
- message payloads include `id`, `created_at`, and normalized sender identity for reconciliation
- outgoing websocket `message_received` acknowledgements advance server delivery state
- delivered status advances after recipient delivery acknowledgement
- direct and group read state follow the phase-1 aggregate rules
- `GET /api/chat/messages/:conversationID` includes `delivery_status`, `delivered_to_count`, and `read_by_count`
- duplicate delivered/read events are idempotent and monotonic

- [ ] **Step 2: Run backend delivery tests to verify failure**

Run: `GOENV_VERSION=1.25.4 go test ./internal/store ./internal/http/routes ./internal/event/... ./internal/chat -run 'Delivered|Read|ClientMessage|Dedupe' -count=1`
Expected: FAIL.

- [ ] **Step 3: Implement backend send-contract and delivery/read tracking**

Implement:
- `client_message_id` on websocket send commands and persisted message/event payloads
- backend dedupe by `(conversation_id, sender_email, client_message_id)`
- `message_received` / delivered-ack handling over websocket command/event flow
- new gateway event/command constants and payload wiring in `internal/chat/events.go`
- broker subjects/listeners for `message_delivered` in `internal/event/chat_subjects.go`, `internal/event/chat_publish.go`, and `internal/chat/server.go`
- durable per-message delivered metadata
- explicit read state aggregation aligned to spec
- message-list response shape change from bare array to object:
  - `messages`
  - `last_read_message_id`
- delivery/read metadata on each message DTO:
  - `delivery_status`
  - `delivered_to_count`
  - `read_by_count`
- idempotent handling of duplicate delivered/read updates

- [ ] **Step 4: Re-run backend delivery tests**

Run: `GOENV_VERSION=1.25.4 go test ./internal/store ./internal/http/routes ./internal/event/... ./internal/chat -run 'Delivered|Read|ClientMessage|Dedupe' -count=1`
Expected: PASS.

- [ ] **Step 5: Write failing frontend tests for optimistic reconciliation and status mapping**

Cover:
- local optimistic text bubble reconciles to persisted message using `client_message_id`
- late success after retry does not duplicate the bubble
- reconciliation requires `id`, `client_message_id`, `created_at`, and normalized sender identity`
- outgoing websocket `message_received` ack is sent when recipient store receives a new incoming message event
- message loader accepts new `/chat/conversations/:id/messages` response shape:
  - `messages`
  - `last_read_message_id`
- status icon mapping:
  - `sent`
  - `delivered`
  - `read`
- group aggregate read status uses the phase-1 rule

- [ ] **Step 6: Run frontend delivery tests to verify failure**

Run: `node --test tests/chat.test.js tests/chat-ui.test.js`
Expected: FAIL.

- [ ] **Step 7: Implement optimistic reconciliation and delivered/read UI**

Implement:
- client-generated `client_message_id` for text sends
- optimistic local bubble state
- outgoing websocket send-command payloads include `client_message_id`
- `client_message_id` reconciliation on REST/WebSocket success
- reconciliation verifies `id`, `created_at`, and sender identity from persisted payloads
- outgoing websocket delivery ack for new incoming messages
- update `loadMessages()` parsing to consume `{ messages, last_read_message_id }` instead of a bare array
- delivery/read updates in store
- compact checkmark status rendering in `Chat.vue`

- [ ] **Step 8: Re-run frontend delivery tests**

Run: `node --test tests/chat.test.js tests/chat-ui.test.js`
Expected: PASS.

- [ ] **Step 9: Commit send dedupe and delivered/read**

```bash
git -C /Users/evgeny/Work/botScheduleDashboard add internal/chat/events.go internal/chat/hub.go internal/chat/server.go internal/chat/hub_test.go internal/model/chatMessage.go internal/store/chat.go internal/http/routes/postChatAudio.go internal/http/routes/postChatImage.go internal/http/routes/getChatMessages.go internal/http/server.go internal/event/chat_payloads.go internal/event/chat_publish.go internal/event/chat_subjects.go internal/event/chat_handlers.go internal/http/routes/chat_routes_test.go internal/store/chat_test.go
git -C /Users/evgeny/Work/botScheduleDashboard commit -m "feat: add chat delivery lifecycle"

git -C /Users/evgeny/Work/botScheduleDashboardFe- add src/lib/chat.js src/lib/chat-ui.js src/stores/chat.js src/views/Chat.vue tests/chat.test.js tests/chat-ui.test.js
git -C /Users/evgeny/Work/botScheduleDashboardFe- commit -m "feat: reconcile optimistic chat messages"
```

### Task 3: Add server-backed drafts and conversation draft previews

**Files:**
- Create: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/getChatDraft.go`
- Create: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/putChatDraft.go`
- Create: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/deleteChatDraft.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/server.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/getChatConversations.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/chat_routes_test.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat_test.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/stores/chat.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/views/Chat.vue`
- Create: `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat-drafts.test.js`

- [ ] **Step 1: Write failing backend draft CRUD tests**

Cover:
- save draft
- fetch draft
- clear draft on empty text
- conversation list includes `draft.text` and `draft.updated_at` for current user only

- [ ] **Step 2: Run backend draft tests to verify failure**

Run: `GOENV_VERSION=1.25.4 go test ./internal/store ./internal/http/routes -run 'Draft' -count=1`
Expected: FAIL.

- [ ] **Step 3: Implement backend draft storage and routes**

Implement:
- Bolt-backed per-user draft records
- draft fetch/update/delete routes
- draft preview injection into conversation payloads

- [ ] **Step 4: Re-run backend draft tests**

Run: `GOENV_VERSION=1.25.4 go test ./internal/store ./internal/http/routes -run 'Draft' -count=1`
Expected: PASS.

- [ ] **Step 5: Write failing frontend draft tests**

Cover:
- composer loads saved draft when conversation opens
- autosave uses debounce and does not spam requests
- send clears draft
- chat list preview prefers `Черновик:` over last message preview

- [ ] **Step 6: Run frontend draft tests to verify failure**

Run: `node --test tests/chat-drafts.test.js tests/chat.test.js`
Expected: FAIL.

- [ ] **Step 7: Implement frontend draft behavior**

Implement:
- per-conversation draft load on selection
- debounced draft save while typing
- local fallback if save fails
- `Черновик:` preview rendering in chat list

- [ ] **Step 8: Re-run frontend draft tests**

Run: `node --test tests/chat-drafts.test.js tests/chat.test.js`
Expected: PASS.

- [ ] **Step 9: Commit drafts**

```bash
git -C /Users/evgeny/Work/botScheduleDashboard add internal/http/routes/getChatDraft.go internal/http/routes/putChatDraft.go internal/http/routes/deleteChatDraft.go internal/store/chat.go internal/http/server.go internal/http/routes/getChatConversations.go internal/http/routes/chat_routes_test.go internal/store/chat_test.go
git -C /Users/evgeny/Work/botScheduleDashboard commit -m "feat: add chat drafts"

git -C /Users/evgeny/Work/botScheduleDashboardFe- add src/lib/chat.js src/stores/chat.js src/views/Chat.vue tests/chat-drafts.test.js tests/chat.test.js
git -C /Users/evgeny/Work/botScheduleDashboardFe- commit -m "feat: persist chat drafts"
```

### Task 4: Add unread separator, jump-to-first-unread, and failed text retry

**Files:**
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/getChatMessages.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/getChatConversations.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/chat_routes_test.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat_test.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat-ui.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/stores/chat.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/views/Chat.vue`
- Create: `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat-unread.test.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat.test.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat-ui.test.js`

- [ ] **Step 1: Write failing backend tests for unread metadata and read-point advancement**

Cover:
- conversations return `last_read_message_id` and `unread_count`
- message list returns enough read metadata for first-unread separator placement
- read point does not advance merely because unread history loaded
- read point advances after explicit mark-read condition

- [ ] **Step 2: Run backend unread tests to verify failure**

Run: `GOENV_VERSION=1.25.4 go test ./internal/store ./internal/http/routes -run 'Unread|ReadPoint' -count=1`
Expected: FAIL.

- [ ] **Step 3: Implement backend unread/read-point contract**

Implement:
- durable `last_read_message_id`
- unread count derivation
- message list payload metadata for unread anchor
- explicit read-point update semantics matching the spec

- [ ] **Step 4: Re-run backend unread tests**

Run: `GOENV_VERSION=1.25.4 go test ./internal/store ./internal/http/routes -run 'Unread|ReadPoint' -count=1`
Expected: PASS.

- [ ] **Step 5: Write failing frontend tests for unread separator and failed text retry**

Cover:
- separator appears before first unread message
- initial open jumps to first unread when appropriate
- failed optimistic text message remains visible
- retry reuses same `client_message_id` and reconciles on later success
- audio/image failed send shows clear error but not guaranteed one-click retry

- [ ] **Step 6: Run frontend unread/retry tests to verify failure**

Run: `node --test tests/chat-unread.test.js tests/chat.test.js tests/chat-ui.test.js`
Expected: FAIL.

- [ ] **Step 7: Implement unread separator and text retry UX**

Implement:
- separator placement and first-unread scroll logic
- focused viewport read advancement
- failed text bubble with retry button
- explicit clear error state for audio/image failure without promising parity retry

- [ ] **Step 8: Re-run frontend unread/retry tests**

Run: `node --test tests/chat-unread.test.js tests/chat.test.js tests/chat-ui.test.js`
Expected: PASS.

- [ ] **Step 9: Commit unread and retry UX**

```bash
git -C /Users/evgeny/Work/botScheduleDashboard add internal/store/chat.go internal/http/routes/getChatMessages.go internal/http/routes/getChatConversations.go internal/http/routes/chat_routes_test.go internal/store/chat_test.go
git -C /Users/evgeny/Work/botScheduleDashboard commit -m "feat: add chat unread tracking"

git -C /Users/evgeny/Work/botScheduleDashboardFe- add src/lib/chat.js src/lib/chat-ui.js src/stores/chat.js src/views/Chat.vue tests/chat-unread.test.js tests/chat.test.js tests/chat-ui.test.js
git -C /Users/evgeny/Work/botScheduleDashboardFe- commit -m "feat: add unread markers and text retry"
```

### Task 5: Full verification and regression pass

**Files:**
- Modify only as needed based on test failures from previous tasks

- [ ] **Step 1: Run backend full chat regression suite**

Run: `GOENV_VERSION=1.25.4 go test ./internal/store ./internal/http/routes ./internal/event/... ./internal/chat -count=1`
Expected: PASS.

- [ ] **Step 2: Run frontend chat-focused suite**

Run: `node --test tests/chat.test.js tests/chat-ui.test.js tests/chat-markdown.test.js tests/chat-presence.test.js tests/chat-drafts.test.js tests/chat-unread.test.js`
Expected: PASS.

- [ ] **Step 3: Run frontend production build**

Run: `npm run build`
Expected: `vite build` completes successfully.

- [ ] **Step 4: Manual QA**

Verify:
- desktop direct chat
- desktop group chat
- mobile direct chat
- mobile group chat
- two-browser-tab presence changes
- typing starts/stops
- draft survives navigation
- unread separator placement
- text failure and retry
- audio/image failure copy
- existing Alice, audio, image, call, reply, reaction, pin, edit/delete flows still work

- [ ] **Step 5: Final commits if any verification fixes were required**

```bash
git -C /Users/evgeny/Work/botScheduleDashboard status
git -C /Users/evgeny/Work/botScheduleDashboardFe- status
```

---

## Notes For Execution

- Execute this plan in task order. Do not start drafts or unread UI until presence/typing and delivery contracts are stable.
- Keep backend and frontend commits separate where possible for easier rollback.
- Prefer tiny, passing steps over broad “do everything and hope” edits.
- Do not expand phase scope into group moderation, forwarding, favorites, or media galleries during implementation.
