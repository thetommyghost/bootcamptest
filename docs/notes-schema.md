# Notes schema & API

## Note object

Every note (canvas pin, reply, pinned message) is the same shape:

```js
{
  id:         "string ≤ 64 chars",   // unique; e.g. "n_1716383421_abc"
  zone:       "string | null",       // zone id (e.g. "z01_facade_courtyard_entry"); null = unzoned
  pos:        { x: 50.3, y: 48.7 },  // % of canvas width/height; required for canvas pins
  title:      "string ≤ 120 chars",
  body:       "string ≤ 1200 chars",
  author:     "string ≤ 40 chars",   // user's chosen display name
  reply_to:   "string | null",       // parent note id; null = top-level
  pinned:     false,                 // boolean
  created_at: 1716383421000,         // unix ms
  updated_at: 1716383421000,         // unix ms; bumped on every write
  deleted_at: null                   // null | unix ms (soft-delete)
}
```

`title` OR `body` must be non-empty (the validator rejects both-empty notes). Everything else is optional except `id`.

## KV layout

Storage namespace: `NOTES_KV` (bound via `wrangler.toml`).

**One key per workspace.** The key is the workspace id (e.g. `edward-said`). The value is JSON:

```json
{
  "schema_version": 1,
  "workspace_id": "edward-said",
  "notes": [
    { "id": "n_...", "zone": "z01_...", ... },
    { "id": "n_...", ... }
  ]
}
```

This means every note read/write rewrites the entire workspace blob. KV's 25 MB value ceiling × ~300 B per note = ~80 k notes theoretical limit, but we cap at **1000 per workspace** for predictable read latency.

## API endpoints

All mounted at `/api/notes` by Cloudflare Pages (because the function lives at `functions/api/notes/index.js`).

### `GET /api/notes?workspace=<id>&since=<ms>`

Returns all notes in the workspace, optionally filtered to those with `updated_at > since`.

```json
{
  "workspace_id": "edward-said",
  "schema_version": 1,
  "notes": [ ... ],
  "server_time": 1716383421000
}
```

Use `server_time` from the response as the next `since` value to avoid clock skew. The browser polls this every 30 s.

### `POST /api/notes?workspace=<id>`

Body: a single note object (per schema above).

The server:
- Sets `updated_at = Date.now()`.
- Sets `created_at` if missing.
- Looks up by `id` — updates if exists, inserts if new.
- Returns the note (with server-set timestamps) + `server_time`.

Errors:
- `400 invalid_json` — body wasn't parseable JSON.
- `400 invalid_note` — failed `validNote()` schema check.
- `409 workspace_full` — workspace already has 1000 notes.
- `503 kv_unavailable` / `503 kv_write_failed` — Cloudflare KV transient errors.

### `DELETE /api/notes?workspace=<id>&id=<note_id>`

Soft-delete. Sets `deleted_at` + `updated_at` on the matching note. Doesn't remove from the array (so other clients see the tombstone and can hide it locally).

Errors:
- `400 missing_id` — no `id` query param.
- `404 not_found` — no note with that id in this workspace.

### `OPTIONS /api/notes`

CORS preflight. Returns 204 with permissive headers (origin `*`). Intentional for an internal tool URL.

## Workspace ID rules

The `workspace` query param is sanitized server-side:
- Lowercased.
- Filtered to `[a-z0-9_-]`.
- Truncated to 64 chars.
- Empty/invalid → defaults to `edward-said`.

So `?workspace=Edward Said!` becomes `?workspace=edwardsaid` after sanitization. If you're creating new workspaces (e.g. different venues), pick clean ids upfront.

## localStorage fallback

The browser also writes every note to `localStorage["kawader_scout_notes_v1"]` immediately, before the POST. This means:

- **Offline:** Notes save locally and are pushed on next online cycle.
- **KV down:** Notes still save locally; sync resumes when KV is back.
- **First load (no internet):** App still works, notes just don't sync to other devices.

The push queue is opportunistic — there's no retry loop with backoff; the next user action triggers another attempt.

## Adding new fields

Bump `schema_version` and migrate clients before the server. The function passes the schema_version through but doesn't enforce it server-side — old clients that don't recognize a field will just ignore it (additive changes are safe).

Don't repurpose existing fields. If you need a different meaning, add a new field.
