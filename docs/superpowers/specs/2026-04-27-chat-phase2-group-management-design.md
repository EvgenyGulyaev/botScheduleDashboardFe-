# Chat Phase 2 Group Management Design

**Status:** approved by user to proceed without additional questions
**Scope:** group roles, permissions, and group settings UI
**Out of scope:** forwarding, favorites, multi-select power tools; those are Phase 3

## Goal

Make group chats safe to administer by adding explicit roles and permission checks on both backend and frontend.

## Roles

- `owner`: creator or transferred owner. Can rename group, add members, remove members, change roles, and delete the group.
- `admin`: can rename group, add members, and remove regular members.
- `member`: can read/write messages and leave the group, but cannot manage other users or delete the group.

Existing groups without stored roles treat `created_by_email` as `owner` and everyone else as `member`.

## Backend Contract

Conversation DTOs include:

- member `role`
- current user role
- permission flags:
  - `can_rename`
  - `can_add_members`
  - `can_remove_members`
  - `can_manage_roles`
  - `can_delete`
  - `can_leave`

Mutation authorization:

- non-members cannot rename, add/remove members, change roles, or delete group
- regular members can only remove themselves
- admins cannot remove or demote owner/admin users
- only owner can delete the group or change roles
- owner cannot remove themselves through member removal

Role update endpoint:

- `PATCH /api/chat/conversations/group/:conversationID/members/:email`
- body: `{ "role": "admin" | "member" }`

## Frontend UX

Group header gets a compact settings button instead of exposing dangerous destructive actions inline.

Settings modal:

- shows group title editor when user can rename
- shows member list with role badges
- shows role selector for owner-managed members
- shows remove buttons only when allowed
- shows add-member checklist when user can add members
- shows leave group for all non-owner members
- shows delete group only for owner

When the backend denies an action, the UI shows the existing notification error and refreshes conversations.

## Testing

Backend tests cover:

- creator becomes owner
- DTO role and permission fields
- non-member mutation denial
- member can self-leave but cannot remove others
- owner can add/remove members and set admin/member roles
- admin can rename/add/remove regular members, but not manage owner/admin roles
- only owner can delete group

Frontend tests cover:

- normalization of roles and permissions
- store calls for group settings mutations
- UI helper logic for available member actions
