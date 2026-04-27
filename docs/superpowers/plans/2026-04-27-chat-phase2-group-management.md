# Chat Phase 2 Group Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe group roles, permissions, and settings management to chat.

**Architecture:** Extend the existing `ChatMember` model with a role and derive permission flags in route DTOs. Backend remains the source of truth for authorization; frontend only hides unavailable actions and uses existing notification handling for denied requests.

**Tech Stack:** Go, BoltDB, Silverlining routes, Vue 3, Pinia, Vite, Node test runner

---

### Task 1: Backend roles and authorization

**Files:**
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/model/chatMember.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/server.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/chat_helpers.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/postChatGroup.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/patchChatGroup.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/postChatGroupMembers.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/deleteChatGroupMembers.go`
- Modify: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/deleteChatGroup.go`
- Create: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/patchChatGroupMember.go`
- Modify tests: `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes/chat_routes_test.go`
- Modify tests: `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat_test.go`

- [ ] Write failing backend tests for group roles, permissions, and denied mutations.
- [ ] Add `role` to `ChatMember`; default creator to `owner`, everyone else to `member`.
- [ ] Derive permissions in DTOs.
- [ ] Gate rename, add, remove, role update, and delete routes.
- [ ] Add route for changing member role.
- [ ] Run `GOENV_VERSION=1.25.4 go test ./internal/store ./internal/http/routes -run 'Group|Role|Permission' -count=1`.
- [ ] Commit backend phase 2.

### Task 2: Frontend group settings UI

**Files:**
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat-ui.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/stores/chat.js`
- Modify: `/Users/evgeny/Work/botScheduleDashboardFe-/src/views/Chat.vue`
- Modify tests: `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat.test.js`
- Modify tests: `/Users/evgeny/Work/botScheduleDashboardFe-/tests/chat-ui.test.js`

- [ ] Write failing frontend tests for role normalization, permission helpers, and store requests.
- [ ] Normalize member roles and conversation permissions.
- [ ] Add store actions for rename, add/remove members, leave group, delete group, and role updates.
- [ ] Replace inline delete with a group settings modal.
- [ ] Render actions based on backend permission flags.
- [ ] Run `node --test tests/chat.test.js tests/chat-ui.test.js`.
- [ ] Run `npm run build`.
- [ ] Commit frontend phase 2.

### Task 3: Phase 2 verification and push

- [ ] Run backend full regression: `GOENV_VERSION=1.25.4 go test ./...`.
- [ ] Run frontend full regression: `node --test tests/*.test.js`.
- [ ] Run frontend build: `npm run build`.
- [ ] Push backend and frontend `main`.
