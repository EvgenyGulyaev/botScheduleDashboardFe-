# Drawing Stamps Design

## Context

The admin app already has a drawing module backed by three projects:

- Frontend: `/Users/evgeny/Work/botScheduleDashboardFe-`
- Main API gateway: `/Users/evgeny/Work/botScheduleDashboard`
- Drawing storage service: `/Users/evgeny/Work/drawingService`

The current drawing flow has a gallery view, a full-screen editor, and a `drawingService` that stores saved drawings in Google Drive through the main API gateway. Access to the drawing module is controlled by the `drawing` app permission.

We need to add a shared stamp/brush library. A stamp can be either text, an uploaded image, or both. When both exist, the user chooses which one has priority.

## Goals

- Add a shared stamp catalog for all users who have the `drawing` permission.
- Let any `drawing` user create, edit, delete, choose, and use shared stamps.
- Support text stamps, image stamps, and stamps that contain both text and image.
- Let users choose priority per stamp: `text` or `image`.
- Store uploaded stamp images separately from saved drawing images.
- Compress and resize uploaded stamp images in `drawingService`.
- Add an ergonomic stamp picker in the drawing toolbar.
- Add a separate "Кисти" screen for stamp catalog management.

## Non-Goals

- Per-user private stamp libraries.
- Separate stamp admin permission.
- Layer/object editing after a stamp has been placed.
- Full rich-text formatting for text stamps.
- SVG/vector stamp uploads.

## Permissions

The existing `drawing` app permission is enough.

- Users without `drawing` must not see `/drawing` or use drawing/stamp API routes.
- Users with `drawing` can manage the shared stamp catalog.
- The main API must enforce `drawing` permission before proxying stamp requests.
- `drawingService` still validates its service token and allowed user policy like existing image endpoints.

## Storage

Saved drawings and stamp assets must use different Google Drive folders.

- Existing drawings folder: current `GOOGLE_DRIVE_FOLDER_ID`.
- New stamp images folder: `GOOGLE_DRIVE_STAMPS_FOLDER_ID=1gPV3gHmJoXmt4HNB68aANz24W8I_2sPb`.
- Text-only stamps are stored only in the `drawingService` database.
- Image stamp files are uploaded by `drawingService` after compression.
- The service stores Drive file ids in its database and never exposes them in API responses.

## Data Model

Add a stamp model in `drawingService`.

Fields:

- `id`: stable generated id.
- `name`: required display name shown in dropdown and management screen.
- `text_value`: optional text content to draw on canvas.
- `image_drive_file_id`: optional internal Drive file id.
- `image_mime_type`: optional output mime type. For the first implementation this is always `image/png`.
- `image_size`: optional compressed file size.
- `image_width`: optional compressed image width.
- `image_height`: optional compressed image height.
- `priority`: `text` or `image`.
- `created_at`, `updated_at`.
- `created_by`, `updated_by`: actor label from gateway headers.

Validation:

- `name` is required and trimmed.
- A stamp must have at least one of `text_value` or image.
- `priority=image` is valid only when an image exists.
- `priority=text` is valid only when `text_value` is not empty.
- If the preferred content is removed, backend should reject the update unless priority is changed in the same request.

## API Design

`drawingService` internal endpoints:

- `GET /internal/drawing/stamps`
- `GET /internal/drawing/stamps/:id`
- `GET /internal/drawing/stamps/:id/content`
- `POST /internal/drawing/stamps`
- `PUT /internal/drawing/stamps/:id`
- `DELETE /internal/drawing/stamps/:id`

Main API gateway endpoints:

- `GET /drawing/stamps`
- `GET /drawing/stamps/:id`
- `GET /drawing/stamps/:id/content`
- `POST /drawing/stamps`
- `PUT /drawing/stamps/:id`
- `DELETE /drawing/stamps/:id`

Create/update requests use `multipart/form-data`:

- `metadata`: JSON object with `name`, `textValue`, `priority`.
- `file`: optional uploaded image.
- `removeImage`: optional metadata flag for edit flows.

`GET content` returns the compressed stamp image body. If the stamp has no image, it returns `404`.

Responses expose safe stamp fields only:

```json
{
  "id": "stamp-id",
  "name": "Евгений",
  "textValue": "Евгений",
  "hasImage": true,
  "imageMimeType": "image/png",
  "imageSize": 32144,
  "imageWidth": 512,
  "imageHeight": 512,
  "priority": "text",
  "createdAt": "...",
  "updatedAt": "..."
}
```

## Image Processing

`drawingService` owns compression and resizing.

Rules:

- Accept PNG and JPEG uploads.
- Decode uploaded image server-side.
- Resize to a bounded max dimension, recommended `512px` on the longest side.
- Preserve transparency when possible.
- Output PNG for the first implementation. This avoids adding a WebP encoder dependency and keeps transparency predictable.
- Enforce max upload size before decode.
- Enforce max decoded dimensions to avoid image bombs.
- Save the compressed output to `GOOGLE_DRIVE_STAMPS_FOLDER_ID`.

Configuration:

- `GOOGLE_DRIVE_STAMPS_FOLDER_ID`.
- `MAX_STAMP_IMAGE_BYTES`, default around `5MB`.
- `MAX_STAMP_IMAGE_DIMENSION`, default `512`.

Database:

- Use the existing `drawingService` database approach.
- Add a dedicated stamps bucket/table for public stamp metadata.
- Add a dedicated stamp Drive-id bucket/table if the existing repository pattern separates public metadata from internal Drive ids.

## Frontend UX

### Editor Toolbar

Add a stamp tool near pencil/eraser.

Behavior:

- Clicking the stamp button opens a dropdown.
- Dropdown shows stamp names and a small type marker: `Имя` or `Картинка`.
- Dropdown includes an action row: `Управление кистями`.
- Selecting a stamp activates stamp mode and closes the dropdown.
- When stamp mode is active, the existing brush slider label changes from `Кисть` to `Размер`.
- Stamp size range should be suitable for text and image placement, recommended `16-240px`.
- Clicking/tapping the canvas places the selected stamp at that point.

Placement:

- Text priority: draw `textValue` on the canvas.
- Image priority: load compressed image content and draw it on the canvas.
- Text stamps use the active color picker value.
- Text stamps use `700 {stampSize}px system-ui, sans-serif`.
- Image stamps are drawn with their longest side equal to `stampSize`; aspect ratio is preserved.
- Stamp placement is centered on the pointer location.
- Before placement, push the current canvas snapshot into undo history.
- Redo/undo behavior should treat a stamp placement as one operation.

For the first implementation, placed stamps are rasterized immediately onto canvas. There is no post-placement object selection, resize handle, or layer editor.

### "Кисти" Management Screen

The "Кисти" screen is a separate view inside the drawing module, not a modal.

Entry points:

- Toolbar dropdown action `Управление кистями`.
- Optional top header button `Кисти` if space allows.

Layout:

- Minimal header with back button and `Добавить`.
- List/grid of stamp cards.
- Each card shows:
  - name,
  - priority badge `Имя` or `Картинка`,
  - text preview when present,
  - image preview when present,
  - edit and delete actions.

Create/edit form:

- `Название`.
- `Текст` optional.
- Image upload optional.
- Preview of current image if present.
- `Приоритет`: segmented control `Имя / Картинка`.
- Save button.
- Delete image action when editing a stamp with image.

## Frontend State

Extend the drawing store or add a focused stamp store.

Recommended split:

- Keep drawing image CRUD in `stores/drawing.js`.
- Add `stores/drawing-stamps.js` for stamp CRUD and image content caching.
- Add pure helpers in `src/lib/drawing-stamps.js` for normalization and validation.
- Add canvas helpers for drawing text/image stamps in `src/lib/drawing-canvas.js`.

State:

- `stamps`.
- `selectedStampId`.
- `stampSize`.
- `stampContentUrls` cache for image stamps.
- `loading`, `saving`, `error`.

## Error Handling

- Empty catalog: dropdown shows "Штампов пока нет" and management action.
- Missing selected stamp after deletion: reset stamp selection.
- Image download failure: show notification and do not mutate canvas.
- Invalid stamp save: show backend message in form.
- Unsupported image upload: show clear Russian error.
- If priority content is absent, backend rejects the save and FE mirrors validation before request.

## Testing

Frontend:

- Navigation to "Кисти" screen and back.
- Dropdown lists stamps and management action.
- Selecting a stamp activates stamp mode.
- Brush slider label changes to `Размер` in stamp mode.
- Text stamp placement draws text and pushes undo snapshot.
- Image stamp placement loads content and draws image.
- Create/edit form validation for priority/content combinations.
- Store tests for stamp CRUD, multipart payload, deletion, and error handling.

Main API:

- Stamp routes reject unauthenticated users.
- Stamp routes reject users without `drawing`.
- Stamp routes proxy authenticated `drawing` users to `drawingService`.
- Multipart payload is forwarded.
- Upstream errors are propagated.

`drawingService`:

- CRUD stamp metadata.
- Text-only stamp create/update.
- Image stamp upload with compression.
- Priority validation.
- Delete removes DB row and Drive file when present.
- Update replaces old Drive file when a new image is uploaded.
- `GET content` returns only image content for image stamps.

## Implementation Notes

- Follow existing Go route and service patterns from drawing image endpoints.
- Keep the stamp API internal to `drawingService`; frontend should only talk to the main API gateway.
- Do not expose Drive ids.
- Keep shared catalog ordering stable, newest first unless product later asks for manual ordering.
- Do not add a separate microservice; `drawingService` is the correct owner.

## Open Follow-Ups

- Decide whether a future version needs manual ordering/favorites in the dropdown.
