# Architecture

## Two surfaces

This repo ships **two** independent single-file web apps:

| | Map (`src/map/index.html`) | Simulation (`src/simulation/index.html`) |
|---|---|---|
| **Purpose** | Overhead Leaflet map of the venue with photo pins | Playable canvas-based venue twin |
| **Tech** | Leaflet 1.9.x + DOM | `<canvas>` 2D + DOM |
| **Movement** | Pan/zoom map | Avatar with WASD/arrows/tap-to-walk |
| **Shared data** | Both read `assets/data.json` and `assets/photos/` |

They share nothing else. You can edit one without breaking the other.

## Data flow

```
assets/data.json
   │
   ▼  (embedded at build-free "build time" via <script type="application/json">)
src/map/index.html  ──renders──▶  Leaflet markers, zone polygons, briefing panel
src/simulation/index.html  ──renders──▶  canvas waypoints, zone entry overlay
```

`data.json` is the single source of truth for venue content. It contains:

- 1 venue object (name_en, name_ar, lat/lon)
- 18 zones (id, name, summary, activities, creative_notes, themes, color, emoji, photo_ids[])
- 86 photos (id, stem, lat, lon, timestamp, zone)
- 5 partners (name, lat, lon, kind)
- 1 sun-path object (sunrise, golden_hour, noon, golden_hour_pm, sunset)

Edit `data.json` to change content; both surfaces pick it up on next reload.

## Notes lifecycle (the only stateful feature)

```
  ┌──────── User presses N in simulation
  │
  ▼
{ id, zone, pos:{x,y}, title, body, author, created_at }
  │
  ├── localStorage["kawader_scout_notes_v1"]   ◀── always written first
  │
  ▼
POST /api/notes?workspace=edward-said    ◀── Cloudflare Pages Function
  │
  ▼
env.NOTES_KV.put(workspace_id, JSON.stringify({ schema_version, notes }))
  │
  │   ...30 s later, every other browser polls:
  ▼
GET /api/notes?workspace=edward-said&since=<last_seen_ms>
  │
  ▼
renderAllNotesUI()  ◀── refreshes 4 surfaces in one call
```

### The 4 surfaces

When a note is added, edited, or remotely synced, **one function** (`renderAllNotesUI()`) refreshes all of these:

1. **Canvas pins** — golden circles drawn on the simulation canvas at note coordinates.
2. **Mini-map dots** — amber dots on the corner mini-map.
3. **HUD pill** — bottom-left counter showing total notes.
4. **Briefing thread** — when a zone is open, its tab shows discussion + replies.

If you add a new feature that mutates notes, **call `renderAllNotesUI()`** instead of touching surfaces individually.

## Cloudflare Pages Function

`functions/api/notes/index.js` is a single Pages Function. Cloudflare auto-mounts files under `functions/` to `/api/*` routes. The function exports four handlers:

- `onRequestOptions` — CORS preflight (`*` origin, intentional for an internal tool).
- `onRequestGet` — list notes (optionally since a timestamp).
- `onRequestPost` — upsert one note (strict `validNote()` schema check).
- `onRequestDelete` — soft-delete (sets `deleted_at`, doesn't remove from KV).

KV access via `env.NOTES_KV` (binding configured in `wrangler.toml` + Cloudflare dashboard).

Per-workspace cap: 1000 notes (~300 KB), enforced server-side with 409 `workspace_full`.

## Workspace isolation

Workspace ID is URL-driven (`?workspace=edward-said`), sanitized to `[a-z0-9_-]{1,64}`, used as a single KV key. **No auth.** Anyone with the URL can read/write. This is intentional for an internal tool and documented as a hard rule.

## Why no framework

Three reasons, ranked:

1. **Edit-and-refresh velocity.** Open the HTML in a browser, save, refresh. No bundler, no HMR, no node_modules. A trainee can be productive in 10 minutes.
2. **Inspectability.** Everything the app does is one Cmd+F away. No abstraction layer to chase.
3. **Lighthouse budget.** No framework overhead → 99 perf, even on mobile. Adding a framework would mean trimming features to stay above 90.

Don't undo this without a written rationale + buy-in from Ameer.

## Why two files instead of one

The map and simulation began as a single page, then diverged enough that splitting them was clearer than threading a mode switch through 3000 lines of JS. They share assets but not behavior. If a new feature is "map only" or "sim only", it goes in that file. If it's shared, you copy-paste (this is a DRY violation by design — we prefer copy-paste over a fragile abstraction).
