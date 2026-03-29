# Toast Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace blocking browser alerts with a lightweight global toast system that gives consistent success, info, and error feedback across the app.

**Architecture:** Add a small notifications store for transient UI messages, render them once near the app shell, and update existing views to call the store instead of `alert()`. Keep the API small so pages only express intent (`success`, `error`, `info`) while the container handles presentation and auto-dismiss.

**Tech Stack:** Vue 3, Pinia, Tailwind CSS, Node test runner

---

### Task 1: Notification Logic

**Files:**
- Create: `src/stores/notifications.js`
- Create: `tests/notifications-store.test.js`

- [ ] Write failing tests for adding notifications, auto-dismiss metadata, and dismissing by id.
- [ ] Run `node --test tests/notifications-store.test.js` and confirm failure.
- [ ] Implement the minimal notifications store API.
- [ ] Re-run `node --test tests/notifications-store.test.js` and confirm pass.

### Task 2: Toast Container UI

**Files:**
- Create: `src/components/AppNotifications.vue`
- Modify: `src/App.vue`

- [ ] Render global notifications near the app shell.
- [ ] Add accessible styles and close button.
- [ ] Keep layout non-blocking and mobile-safe.

### Task 3: Replace Alerts In Screens

**Files:**
- Modify: `src/views/Login.vue`
- Modify: `src/views/Dashboard.vue`
- Modify: `src/views/Messages.vue`
- Modify: `src/views/Geo3D.vue`

- [ ] Replace `alert()` success/error flows with notifications store calls.
- [ ] Preserve existing auth redirect behavior for `401`.
- [ ] Keep useful console logging only for debugging paths.

### Task 4: Verification

**Files:**
- Test: `tests/*.test.js`
- Test: `src/**/*.vue`

- [ ] Run `node --test tests/*.test.js`.
- [ ] Run `npm run build`.
- [ ] Fix any regressions before completion.
