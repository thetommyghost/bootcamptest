# AGENTS.md — Bootcamp Interactive Map & Game

This file is read by any coding agent (OpenCode, Claude Code, etc.) opened on this repo. Read it before editing anything.

## What this project is

A single-page web app for the **KAWADER Film Camp 2026**. Two surfaces:

1. **Map** (`src/map/index.html`) — Leaflet-based satellite map of the Edward Said Cultural Institute (Birzeit, Palestine) with 18 zone polygons, 86 GPS-tagged scout photos, 5 partner pins, lightbox, and a 3-panel layout (zone rail · canvas · briefing).
2. **Simulation / Game** (`src/simulation/index.html`) — Canvas-based playable venue twin. Avatar walks via WASD/arrows, teleports on tap, zone entry opens a photo-room overlay. Includes shared team notes (Cloudflare KV-backed), Konami-code Director Mode, pinch-zoom, ambient audio bed.

Live URL (production, owned by Ameer): https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/

This repo is a **handoff bundle** — a clean fork-point for a new trainee deploying to **their own** Cloudflare Pages project (see `docs/deployment.md`).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla HTML/CSS/JS — **no frameworks**, **no build step** |
| Map library | Leaflet 1.9.x (CDN, integrity-pinned) |
| Tiles | Esri World Imagery (educational use), plus OSM Carto fallback |
| Canvas | Native `<canvas>` 2D for simulation movement + FX |
| Data | Single `assets/data.json` (51 KB), embedded in HTML as `<script type="application/json">` so `file://` loads work |
| Backend | One Cloudflare Pages Function: `functions/api/notes/index.js` |
| Storage | Cloudflare KV namespace `NOTES_KV` (per-workspace JSON blob) + browser `localStorage` fallback |
| Hosting | Cloudflare Pages (`wrangler pages deploy .`) |
| Tests | Playwright (Node, headless Chromium) |

## File layout

```
.
├── src/
│   ├── map/index.html              v2 base map (1882 lines, 113 KB)
│   └── simulation/
│       ├── index.html              v3 R4 game (3563 lines, 136 KB)
│       ├── walkable.geojson        avatar walking bounds
│       └── assets/                 avatar sprite + frames + CREDITS
├── assets/                         ~86 MB — see below
│   ├── data.json                   18 zones + 86 photos + 5 partners + sun-path
│   ├── photos/{thumb,full}/        640px + 1600px scout JPGs
│   ├── satellite/                  Apple Maps overheads + sun arcs
│   ├── venue/                      painted background + layout.json
│   ├── mockups/                    27 WebP activity cards
│   └── audio/                      Freesound CC0 ambient + SFX
├── functions/api/notes/index.js    Cloudflare Pages Function (notes CRUD)
├── tools/bootcamp-scout/           Python helpers (regenerate mockups/background)
├── tests/smoke.mjs                 Playwright skeleton
└── docs/
    ├── architecture.md             read this first
    ├── deployment.md               how to deploy to a new Pages project
    ├── first-tasks.md              starter work for the trainee
    ├── notes-schema.md             notes object + KV layout
    ├── gotchas.md                  CRITICAL — read before editing
    └── planning/                   original v1→v3 plans + state logs
```

## Critical constraints (do not break)

1. **No frameworks.** Don't pull React/Vue/Svelte. Don't add a bundler. The whole appeal of this codebase is that it edits as plain HTML.
2. **No build step.** Files in `src/` and `assets/` must be servable directly by `python3 -m http.server` and by Cloudflare Pages with zero transformation.
3. **All paths in HTML are relative.** `./assets/...` not `/assets/...`. This keeps `file://` loads working for local debugging.
4. **The sprite frame index MUST be `Math.floor(...)`.** See `docs/gotchas.md` — a 5-round bug taught us this. If you touch the avatar walk cycle, verify `bg.x ∈ {0px, -36px, -72px, -108px}` not fractional.
5. **Collision detection was intentionally removed.** `canWalk()` exists but returns true for the whole rectangle. There's dead code around it (axis fallbacks, escape budget). Leave it; don't "clean up".
6. **Lighthouse gates are locked at perf≥90, a11y=100, best-practices=100.** Don't regress. Every `<button>` has aria-label; every animation respects `prefers-reduced-motion`.
7. **Notes schema is strict.** `validNote()` in the Pages Function rejects malformed posts with 400 `invalid_note`. See `docs/notes-schema.md`.
8. **Workspaces are URL-isolated, not auth-protected.** Anyone with the URL can read/write that workspace's notes. Documented as intentional for an internal tool.

## Common commands

```bash
# Serve locally (needed because file:// breaks for some fetches)
python3 -m http.server 8765
open http://127.0.0.1:8765/src/simulation/index.html
open http://127.0.0.1:8765/src/map/index.html

# Or via npm script
npm run serve

# Deploy to YOUR OWN Cloudflare project (after first-time setup per docs/deployment.md)
npm run deploy
# = wrangler pages deploy . --project-name <your-project-name>

# Smoke test
npm run smoke
```

## Smoke test pattern

Don't write smoke checks that just assert "something changed". They miss real bugs. Assert on **discrete values**:

```js
// BAD — passes even when sprite blends between frames
expect(bgPosition).not.toEqual(prevBgPosition);

// GOOD — only passes when frame index landed cleanly
expect(['0px', '-36px', '-72px', '-108px']).toContain(bgX);
```

## When in doubt

- Read `docs/gotchas.md` first.
- Look at `docs/planning/handoff/2026-05-13-bootcamp-v3-round3-state.md` for the longest worked-example narrative.
- The two HTML files (`src/map/index.html` and `src/simulation/index.html`) are the source of truth — everything else is documentation about them.
