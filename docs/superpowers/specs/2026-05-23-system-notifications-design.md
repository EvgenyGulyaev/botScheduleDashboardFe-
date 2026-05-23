# System Notifications Chat Design

**Status:** approved for approach 1 in chat conversation  
**Scope:** external systems create per-user system notifications through an HTTP API; users read them inside the existing chat UI  
**Out of scope:** notification templates, broadcast-to-all, rich cards, delivery retries for external callers, separate notification center

## Goal

Add a dedicated "System" dialog where users receive service-generated notifications, for example when another system creates an application or request.

External systems should be able to call the dashboard API with a shared service token. The backend should store the notification as a chat message, publish the existing realtime chat event, and reuse the current unread, WebSocket, and push notification behavior.

## Existing Context

Frontend chat state and rendering already live in:

- `/Users/evgeny/Work/botScheduleDashboardFe-/src/stores/chat.js`
- `/Users/evgeny/Work/botScheduleDashboardFe-/src/lib/chat.js`
- `/Users/evgeny/Work/botScheduleDashboardFe-/src/views/Chat.vue`

Backend chat storage and events already live in:

- `/Users/evgeny/Work/botScheduleDashboard/internal/store/chat.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/model/chatConversation.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/model/chatMessage.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/event/chat_handlers.go`
- `/Users/evgeny/Work/botScheduleDashboard/internal/http/routes`
- `/Users/evgeny/Work/botScheduleDashboard/internal/chat`

The current chat already supports conversation lists, messages, unread counts, WebSocket events, and push notifications. System notifications should extend that model instead of creating a second notification subsystem.

## User Decisions Locked In

- Use approach 1: external systems call an HTTP endpoint.
- Authorize external systems with a shared service token stored in env.
- The token will be shared with other systems manually.
- Users should see notifications inside a dedicated system dialog.

## Recommended Architecture

Introduce a per-user chat conversation of type `system`.

Each user gets at most one system conversation. It is created lazily when the first notification arrives. The conversation title is `Система`. The only member is the recipient user. Messages are stored with type `system` and a synthetic sender such as `system@dashboard.local` / `Система`.

This keeps notification delivery inside the existing chat pipeline:

- Bolt persistence through the chat repository
- `message_persisted` event for realtime UI updates
- unread count derived from member read state
- existing browser push notification flow
- existing message list and conversation list UI

## Backend Design

### Configuration

Add a new env variable:

- `SYSTEM_NOTIFICATIONS_API_TOKEN`

The token must be non-empty for the endpoint to accept requests. If the token is missing, the endpoint returns `503 Service Unavailable`.

### Endpoint

Add:

`POST /chat/system-notifications`

Because this route is called by external systems, `handleChatPost` should dispatch it before the generic `/chat/*` auth middleware. This endpoint must use only the service-token check described below and must not accept normal user JWT authorization as a substitute.

Authorization:

`Authorization: Bearer <SYSTEM_NOTIFICATIONS_API_TOKEN>`

Request body:

```json
{
  "recipient_email": "user@example.com",
  "title": "Заявка сформирована",
  "text": "В системе X сформировалась заявка #123",
  "source": "external-system",
  "external_id": "request-123",
  "url": "https://example.com/requests/123"
}
```

Required fields:

- `recipient_email`
- at least one of `title` or `text`

Optional fields:

- `source`
- `external_id`
- `url`

Response body:

```json
{
  "conversation_id": "system-...",
  "message_id": "msg-..."
}
```

### Validation And Security

The endpoint should:

- compare the bearer token against `SYSTEM_NOTIFICATIONS_API_TOKEN`
- reject missing or invalid tokens with `401 Unauthorized`
- reject missing `recipient_email` with `400 Bad Request`
- reject an unknown recipient with `404 Not Found`
- reject payloads where both `title` and `text` are blank with `400 Bad Request`
- trim text fields
- apply a reasonable text length limit so external systems cannot store very large messages

The service token is a shared secret. It should not grant access to normal user endpoints.

### Storage

Add repository support for:

- creating or loading the recipient's system conversation
- adding a system notification message to that conversation

Conversation rules:

- `Type: "system"`
- `Title: "Система"`
- `CreatedByEmail: "system@dashboard.local"`
- one member: the recipient user
- stable ID based on recipient email and existing key style, for example `system|<email>`

Message rules:

- `Type: "system"`
- `SenderEmail: "system@dashboard.local"`
- `SenderLogin: "Система"`
- `Text`: display text assembled from title/text/source/url
- no replies, reactions, edit/delete, audio/image/file, calls, or Alice announcement

The repository should update `LastMessageID`, `LastMessageText`, `LastMessageAt`, and trim old messages through the existing chat trimming logic.

### Realtime And Push

After persisting the message, the route publishes the existing `ChatMessagePersistedEvent` with the conversation, its member list, and the new message.

Existing WebSocket clients receive `message_persisted`. Existing push notification code can notify the recipient because the sender is the synthetic system sender and the recipient is the only member.

Push title should remain readable for system conversations. If needed, `BuildIncomingMessageNotification` can special-case `system` conversations so the title is `Система`.

## Frontend Design

The frontend should normalize and display `conversation.type === "system"` and `message.type === "system"`.

Conversation list:

- show the title `Система`
- show unread count like any other conversation
- use the existing last-message preview

Conversation view:

- hide composer and media/call controls for system conversations
- hide group/direct management actions that do not apply
- render system messages as readable notification bubbles/cards in the timeline
- allow read marking through the existing read behavior

Actions disabled for system messages:

- reply
- edit
- delete
- react
- favorite
- forward
- remind
- Alice announce

If hiding every action is too large for one pass, the backend remains authoritative; the frontend should at minimum hide the composer and not offer message creation in system conversations.

## Error Handling

External callers get explicit HTTP status codes and short JSON errors.

Frontend users do not see API token/configuration errors directly. If a malformed notification is rejected, it does not create a partial conversation or message.

If realtime publish fails after persistence, the route should still return success and log the publish failure. The next conversation/message load will show the notification.

## Testing

Backend tests:

- missing token returns `401`
- wrong token returns `401`
- missing env token returns `503`
- unknown recipient returns `404`
- valid request creates a system conversation and system message
- second request for the same recipient reuses the same system conversation
- route publishes `message_persisted`
- normal user JWT does not authorize the service endpoint

Frontend tests or focused verification:

- normalizes `system` conversation/message types
- system conversation appears in the list
- opening system conversation shows messages
- composer is hidden/disabled for system conversations

## Rollout Notes

Add `SYSTEM_NOTIFICATIONS_API_TOKEN` to the API environment before sharing the integration contract. Rotate the token by changing env and restarting the API service.

Example curl:

```bash
curl -X POST "$API_URL/chat/system-notifications" \
  -H "Authorization: Bearer $SYSTEM_NOTIFICATIONS_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_email": "user@example.com",
    "title": "Заявка сформирована",
    "text": "В другой системе сформировалась заявка #123"
  }'
```
