# Chat Phase 3 Power Tools Design

**Status:** approved by user to proceed without additional questions
**Scope:** favorites, forwarding, and multi-select message actions
**Out of scope:** folders/archives, export, advanced filters, media gallery

## Goal

Add fast power-user actions to the chat without weakening message permissions or breaking one-time media rules.

## Features

### Favorites

Favorites are private per user. A user can mark any visible message as favorite and later remove it.

Backend:

- `PUT /api/chat/conversations/:conversationID/messages/:messageID/favorite`
- `DELETE /api/chat/conversations/:conversationID/messages/:messageID/favorite`
- `GET /api/chat/favorites`

Message DTO includes `favorite: true/false` for the current user.

### Forwarding

Forwarding copies selected messages into another conversation where the current user is a member.

Rules:

- source and target conversations must both include current user
- text messages forward as text
- one-time audio/image and call messages forward as a safe text notice, not as reusable media files
- forwarded messages keep lightweight metadata:
  - original sender login/email
  - original message id
  - original conversation id

Endpoint:

- `POST /api/chat/conversations/:targetConversationID/forward`
- body: `{ "source_conversation_id": "...", "message_ids": ["..."] }`

### Multi-Select

Frontend lets users select several messages and perform batch actions:

- forward selected
- add/remove favorites
- delete selected own editable/deletable messages

The backend remains authoritative. Frontend only enables actions that each message supports.

## UX

Message bubbles get a select affordance in their existing action area. When at least one message is selected, the composer area switches to a compact selection toolbar:

- selected count
- favorite button
- forward button
- delete button when all selected messages are own deletable messages
- cancel selection

Forward action opens a target conversation picker.

## Testing

Backend tests cover:

- private favorites per user
- favorite flag in message DTOs
- forward membership checks
- text forwarding and safe placeholders for one-time media
- forwarded metadata in DTOs

Frontend tests cover:

- favorite normalization
- selected message helpers
- forward/favorite/delete store request payloads
- selection toolbar state
