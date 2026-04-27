# Chat Phase 3 Power Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add private favorites, forwarding, and multi-select message actions to chat.

**Architecture:** Backend owns favorites and forwarding authorization. Frontend keeps selection state local and calls backend actions in batches, reusing existing message update and conversation refresh flows.

**Tech Stack:** Go, BoltDB, Silverlining routes, Vue 3, Pinia, Vite, Node test runner

---

### Task 1: Backend favorites and forwarding

**Files:**
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/store/buckets.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/model/chatMessage.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/server.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/chat_helpers.go`
- Create: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/putChatFavorite.go`
- Create: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/deleteChatFavorite.go`
- Create: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/getChatFavorites.go`
- Create: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/postChatForward.go`
- Modify tests: `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat_test.go`
- Modify tests: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/chat_routes_test.go`

- [ ] Write failing tests for private favorites and forwarding membership checks.
- [ ] Add per-user favorite storage and DTO flags.
- [ ] Add forwarded metadata to message model/DTO.
- [ ] Add favorite routes.
- [ ] Add forward route that creates copied messages in target conversation.
- [ ] Publish normal persisted events for forwarded messages.
- [ ] Run `GOENV_VERSION=1.25.4 go test ./internal/store ./internal/http/routes -run 'Favorite|Forward' -count=1`.
- [ ] Commit backend phase 3.

### Task 2: Frontend favorites, forwarding, and multi-select

**Files:**
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat-ui.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/stores/chat.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/views/Chat.vue`
- Modify tests: `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat.test.js`
- Modify tests: `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat-ui.test.js`

- [ ] Write failing tests for favorite normalization, selection helpers, and store requests.
- [ ] Normalize favorite and forwarded metadata.
- [ ] Add store actions for favorite/unfavorite, load favorites, forward messages, and batch delete own messages.
- [ ] Add local selected-message state and toolbar.
- [ ] Add target conversation picker for forwarding.
- [ ] Run `node --test tests/chat.test.js tests/chat-ui.test.js`.
- [ ] Run `npm run build`.
- [ ] Commit frontend phase 3.

### Task 3: Phase 3 verification and push

- [ ] Run backend full regression: `GOENV_VERSION=1.25.4 go test ./...`.
- [ ] Run frontend full regression: `node --test tests/*.test.js`.
- [ ] Run frontend build: `npm run build`.
- [ ] Review and push backend and frontend `main`.
