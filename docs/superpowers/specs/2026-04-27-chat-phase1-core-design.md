# Chat Phase 1 Core Design

**Status:** approved in chat conversation  
**Scope:** core messenger reliability and presence (`typing`, `presence`, `delivered/read`, `drafts`, `unread`, `retry/error states`)  
**Out of scope:** group roles/moderation, forwarding, favorites, multi-select, media catalogs

## Goal

Upgrade the existing admin chat from “messages with realtime sync” into a more complete messenger core without disrupting current text/audio/image, call, push, and Alice flows.

This phase should make the chat feel alive, resilient, and safe to use across desktop and mobile by adding:

- typing indicators
- online / last seen presence
- message delivery lifecycle (`sent`, `delivered`, `read`)
- server-backed drafts per conversation
- unread separator and jump-to-first-unread behavior
- explicit failed-send state with retry

## Existing Context

Frontend already centralizes chat state and socket handling in:

- `/Users/evgeny/Work/botScheduleDashboardFe-/src/stores/chat.js`
- `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat.js`
- `/Users/evgeny/Work/botScheduleDashboardFe-/src/views/Chat.vue`

Backend already has:

- Bolt-backed chat repository in `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat.go`
- message send/event orchestration in `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_handlers.go`
- REST routes in `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes`
- websocket/event transport in `/Users/evgeny/Work/botScheduleDashboard/internal/event`

The existing system already supports:

- direct and group conversations
- text, audio, and image messages
- read receipts for current message UX
- replies, reactions, edit/delete, pin, global search
- call state and Alice side effects

This phase must extend the current REST + WebSocket architecture rather than replacing it.

## User Decisions Locked In

- Build all requested “core messenger” work before group moderation and power-user tools.
- Start with one phase focused only on reliability/presence rather than mixing in roles and forwarding.
- Moscow time is already used elsewhere in the product and remains the operational timezone when needed.
- Desktop and mobile must keep the same logical behavior, with only compact UI differences.
- If a message fails to send, the message should remain visible with a failed state and retry action.
- Drafts should survive leaving and reopening a chat.
- Presence and typing should feel lightweight and must not flood the UI.

## Recommended Architecture

Use lightweight companion state around the current message model instead of introducing a second chat domain or full session subsystem.

### Why this approach

- It fits the existing store/event shape.
- It avoids rebuilding chat storage and message rendering.
- It allows safe incremental rollout in four small backend/frontend waves.
- It preserves current message/audio/image/Alice logic while enriching it with additional status signals.

## Phase Breakdown

This design intentionally covers only the first product phase:

1. presence + typing
2. delivered/read lifecycle
3. server-backed drafts
4. unread marker + retry/error states

The next two user-requested buckets remain separate future phases:

- **Phase 2:** group moderation and group-specific settings
- **Phase 3:** workflow/power-user UX

This does **not** defer group-chat support for phase 1 features. Presence, typing, delivery/read, drafts, unread markers, and retry behavior all apply to both direct and group conversations in this phase. Only moderation/permissions/group management are deferred.

## Backend Design

### 1. Presence State

Presence is per user, not per conversation.

Store and expose:

- `online` boolean
- `last_active_at`
- `last_seen_at`

Recommended persistence model:

- keep active socket/session counters in memory
- update durable `last_active_at`:
  - on websocket connect for users transitioning from offline to online
  - on successful explicit chat actions initiated by the user:
    - send message
    - mark read
    - typing start
    - typing stop
- update durable `last_seen_at` only when the user transitions from online to offline, using the latest known `last_active_at`

`online` should be derived from active websocket connections, not written manually by clients.

Conversation presence summary rules:

- direct conversation summary represents the peer user:
  - `presence.online`
  - `presence.last_active_at`
  - `presence.last_seen_at`
- group conversation summary represents the group aggregate:
  - `presence.online_count`
  - `presence.last_active_at`

`last_active_at` for groups is the most recent `last_active_at` among members other than the current user.

### 2. Typing State

Typing is ephemeral and should not be persisted in Bolt as a durable message artifact.

Track in memory:

- `conversation_id`
- `user_email`
- `user_login`
- `started_at`
- expiry/TTL, recommended `5-8s`

Rules:

- client emits `typing_started` when text entry begins
- client emits `typing_stopped` on idle/send/blur
- server auto-expires stale typing state if stop never arrives
- typing events go only to other members of the same conversation

### 3. Delivery Lifecycle

Current read behavior should become a clearer three-step lifecycle:

- `sent`
- `delivered`
- `read`

Definitions:

- `sent`: message has been accepted and persisted by backend
- `delivered`: at least one active websocket session of a non-sender recipient acknowledged receipt of the event
- `read`: at least one non-sender recipient explicitly advanced read state to include the message

Recommended storage:

- keep `read` as durable per-user conversation/message progress
- keep `delivered` as per-message metadata based on recipient acknowledgements

For direct chats, status reflects the single peer.

For group chats, phase 1 uses this exact aggregate rule:

- `sent`: zero non-sender recipients have acknowledged delivery
- `delivered`: one or more non-sender recipients acknowledged delivery, but zero have read
- `read`: one or more non-sender recipients have read

This is intentionally not a per-participant read UI. It is the minimum aggregate rule for stable checkmarks and QA in group chats.

### 4. Drafts

Drafts should be persisted on backend per user per conversation.

Suggested fields:

- `conversation_id`
- `user_email`
- `text`
- `updated_at`

Rules:

- drafts are private to a user
- drafts do not emit realtime events to other participants
- empty text deletes or clears the draft
- autosave should be debounced client-side

### 5. Read Position and Unread Marker

Unread separator should be derived from durable read progress rather than stored as a fake system message.

Recommended model:

- per conversation per user:
  - `last_read_message_id`
  - optionally `last_read_at`

This supports:

- unread badge counts
- jump to first unread
- rendering a separator in the timeline

Read contract for phase 1:

- client advances `last_read_message_id` only for messages from other users
- on conversation open with unread history, client does **not** immediately mark anything as read just because the list rendered
- on conversation open with no unread history and the user lands at the bottom, client may mark the newest visible incoming message as read after render
- while the chat is focused, new incoming messages are marked read automatically only when the user is already at or near the bottom of the timeline
- if the user is reading older history away from the bottom, new incoming messages remain unread until the user returns and the client sends a newer read point
- unread separator is rendered before the first message whose position is strictly after `last_read_message_id`

### 6. Failed Send / Retry

Failed messages should exist first as optimistic client-side entries and resolve into one of:

- persisted message from server
- failed local message with retry affordance

Backend behavior:

- backend still behaves as source of truth
- retry must reuse the same `client_message_id` for the optimistic message being retried
- backend must deduplicate successful message creation by `(conversation_id, sender_email, client_message_id)`
- no special storage is required for failed unsent messages beyond the client-side optimistic entry, but successful persisted messages must retain enough metadata to reconcile late server responses

## API Design

### New REST Endpoints

- `GET /api/chat/drafts/:conversationID`
  - fetch current user draft for a conversation
- `PUT /api/chat/drafts/:conversationID`
  - save/update current user draft
- `DELETE /api/chat/drafts/:conversationID`
  - clear current user draft
- `POST /api/chat/messages/:id/retry-alice`
  - already exists or equivalent behavior is present for Alice retry; this phase must not break it

### Existing Send Contract Changes

All message send endpoints used by the chat composer should accept:

- `client_message_id`

The same field must be echoed back in:

- HTTP success responses for message creation
- websocket persisted-message payloads

This field is required for:

- optimistic bubble reconciliation
- safe retry without duplicate messages when the original success arrives late

If a conversation-level unread helper endpoint proves useful, it may be added, but it is not required if unread can be derived from existing message payload plus read-point metadata.

### Existing Endpoint Changes

- `GET /api/chat/conversations`
  - include peer/group presence summary
  - required direct-chat fields:
    - `presence.online`
    - `presence.last_active_at`
    - `presence.last_seen_at`
  - required group-chat fields:
    - `presence.online_count`
    - `presence.last_active_at`
  - include current user draft preview if present
  - required draft fields:
    - `draft.text`
    - `draft.updated_at`
  - include unread metadata
  - required unread fields:
    - `last_read_message_id`
    - `unread_count`
- `GET /api/chat/messages/:conversationID`
  - include delivery/read status metadata for each message
  - required per-message fields:
    - `delivery_status`
    - `delivered_to_count`
    - `read_by_count`
  - include conversation read metadata sufficient for unread separator placement
  - required conversation-level or payload-level fields:
    - `last_read_message_id`
- existing send endpoints
  - should return enough message state for optimistic-message reconciliation
  - required reconciliation fields:
    - durable server `id`
    - `client_message_id`
    - `created_at`
    - normalized sender identity

## WebSocket/Event Design

Add events for:

- `typing_started`
- `typing_stopped`
- `presence_updated`
- `message_delivered`
- `message_read`

Recommended addition:

- client ack event for message delivery, for example `message_received`

Rules:

- `typing_*` fan out only within the conversation
- `presence_updated` is broadcast to conversations where the user appears as a member
- `message_delivered` updates only when a recipient session confirms receipt
- `message_read` remains explicit, not inferred from delivery
- duplicate `message_delivered` and `message_read` events must be idempotent and monotonic
- persisted-message events must include `client_message_id` whenever the originating client supplied one

## Frontend Design

### 1. Conversation List

Each conversation row may show:

- peer `онлайн` or `был(а) недавно`
- current user draft preview with priority over last message text
- current unread badge behavior

Draft preview format:

- `Черновик: <text>`

This should be visually secondary but clearly distinct from a real incoming message.

### 2. Chat Header and Presence

For direct chats:

- show `онлайн` when peer has active websocket presence
- otherwise show `был(а) недавно` or a formatted last-seen time

For group chats:

- no dense participant grid in phase 1
- presence remains minimal and compact

### 3. Typing Indicator

Display a compact line, not a banner.

Examples:

- `nika печатает...`
- `nika, alice печатают...`

Mobile and desktop should share the same wording and behavior.

### 4. Message Status

Preserve current checkmark metaphor instead of adding text labels:

- `sent` → one check
- `delivered` → two neutral checks
- `read` → two accent checks
- `failed` → visible failed state with retry affordance

This keeps the timeline readable and avoids cluttering each bubble.

### 5. Unread Marker

Render a thin separator:

- `Непрочитанные сообщения`

Behavior:

- appears before the first unread message after `last_read_message_id`
- initial open jumps to first unread when a valid unread anchor exists and the user did not explicitly navigate to another target
- initial open with unread messages does **not** immediately advance read state just because the list rendered
- once the first unread message enters the visible viewport while the chat is focused, client may advance the read point
- once the client successfully advances the read point past the separator, it disappears on subsequent loads

### 6. Draft UX

Rules:

- draft restores automatically when reopening chat
- autosaves with debounce while user types
- sending a message clears the draft
- switching between chats preserves each chat’s independent draft

### 7. Retry/Error UX

When text send fails:

- keep the local pending bubble in timeline
- mark it as failed
- show a compact retry action

Phase-1 retry guarantee:

- full optimistic failed-state + one-click retry is required for `text`
- `audio` and `image` may surface a clear failure state, but recovery may use the existing manual re-upload flow in this phase
- future parity for media retry should remain possible, but it is not part of phase-1 acceptance

## Error Handling

### Presence / Typing

- stale typing states auto-expire on server
- lost socket should clear local typing/presence assumptions
- reconnect should resubscribe and refresh presence snapshot

### Delivery / Read

- if delivery ack never arrives, message remains `sent`
- if read mark fails, keep current UI state and retry on next safe interaction
- duplicate delivery/read events must be idempotent
- when a chat opens with unread history, read state advances only after unread content becomes visible in the focused viewport
- when a chat opens with no unread history and the user lands at the bottom, the newest visible incoming message may be marked read after render

### Drafts

- draft save failure must not erase local text
- local unsynced draft may remain in composer until next successful save
- do not surface draft errors as noisy blocking modals

### Failed Sends

- failed sends should never silently disappear
- retry should not duplicate persisted messages if original succeeded late
- optimistic messages need reconciliation by client-generated local IDs or equivalent mapping

## Testing Strategy

### Backend

Add coverage for:

- presence connection/disconnection transitions
- typing TTL and stop events
- delivery ack transitions
- read-point persistence
- draft CRUD and empty-draft clear behavior
- unread marker derivation
- idempotent duplicate events

### Frontend

Add coverage for:

- presence label formatting
- typing indicator aggregation
- message status mapping to icons/states
- draft autosave/load/clear behavior
- unread separator placement
- failed optimistic message + retry behavior

### Manual Verification

Must verify on:

- desktop direct chat
- desktop group chat
- mobile direct chat
- mobile group chat

Scenarios:

- open same user in two tabs
- peer online/offline transitions
- typing start/stop
- draft survives navigation
- unread separator on reopening chat
- send failure and retry

## Rollout Plan

Implement in four sub-phases:

1. presence + typing
2. delivered/read
3. drafts
4. unread + retry/error states

This order minimizes regression risk because:

- presence/typing do not mutate stored messages
- delivered/read extends existing semantics
- drafts are private and isolated
- unread/retry have the most UI edge cases and should land last

## Deferred Work

Not part of this design:

- group roles and moderation
- group avatars and extended group settings
- forwarding
- multi-select
- favorites / saved messages
- media galleries (`all photos`, `all audio`, `all links`)

Those belong to later specs so this phase stays shippable and testable.
