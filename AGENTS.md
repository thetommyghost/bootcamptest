# AGENTS.md — kawader-bootcamp-app

This file is read by any coding agent (OpenCode, Claude Code, etc.) opened on this repo. Read it before editing anything.

## What this project is becoming

This started as a scouting twin of the Edward Said Cultural Institute, the venue for KAWADER Bootcamp 2026. The current build (`src/map/index.html` and `src/simulation/index.html`) is the polished scout layer: a Leaflet satellite map and a canvas-based venue twin with shared notes, deployed at `kawasist-internal.pages.dev/bootcamp-scout/edward-said/`.

The work ahead is to evolve this into the **in-camp app** used by participants and team during the August 2026 camp. That likely means: identity, per-participant progress tracking, on-the-ground check-ins, creative-output capture (photos / voice memos / notes), team awareness, and a portfolio export at the end. None of that is locked yet. See `docs/directions.md` for the open exploration space.

## What's live today

- **Scouting tool (production):** https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/
- **This project's staging:** https://kawader-bootcamp-app.pages.dev
- **Lighthouse:** 99 / 96 / 100 / 100 (don't regress)

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vanilla HTML/CSS/JS, no frameworks, no build step |
| Map library | Leaflet 1.9.x (CDN, integrity-pinned) |
| Tiles | Esri World Imagery (educational use) + OSM Carto fallback |
| Canvas | Native `<canvas>` 2D for simulation movement + FX |
| Data | Single `assets/data.json` (51 KB), embedded inline so `file://` works |
| Backend | Cloudflare Pages Function: `functions/api/notes/index.js` |
| Storage | Cloudflare KV (`NOTES_KV` binding) + browser `localStorage` fallback |
| Hosting | Cloudflare Pages (`wrangler pages deploy .`) |
| Tests | Playwright (Node, headless Chromium) |

## File layout

```
.
├── src/
│   ├── map/index.html              Leaflet base map (1882 lines, 113 KB)
│   └── simulation/
│       ├── index.html              canvas venue twin (3563 lines, 136 KB)
│       ├── walkable.geojson        avatar walking bounds
│       └── assets/                 avatar sprite + frames + CREDITS
├── assets/                         ~86 MB
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
    ├── directions.md               creative-space doc (v2 vision + possibility menu)
    ├── anchor-tasks.md             2 concrete starter tasks
    ├── architecture.md             how the current build fits together
    ├── deployment.md               Cloudflare wiring (already provisioned)
    ├── gotchas.md                  pre-paid bug lessons; read before editing
    ├── notes-schema.md             notes object + KV layout + API
    └── planning/                   v1 → v3 R4 history
```

## Critical constraints (do not break)

1. **No frameworks.** Don't pull React/Vue/Svelte. Don't add a bundler. The whole appeal of this codebase is that it edits as plain HTML.
2. **No build step.** Files in `src/` and `assets/` must be servable directly by `python3 -m http.server` and by Cloudflare Pages with zero transformation.
3. **All paths in HTML are relative.** `./assets/...` not `/assets/...`. Local `file://` debugging depends on this.
4. **The sprite frame index MUST be `Math.floor(...)`.** See `docs/gotchas.md` §1. If you touch the avatar walk cycle, verify `bg.x ∈ {0px, -36px, -72px, -108px}` (discrete), not fractional.
5. **Collision detection was intentionally removed.** `canWalk()` exists but always returns true. Dead code around it (axis fallbacks, escape budget) is intentional. Don't "clean up". See `docs/gotchas.md` §2.
6. **Lighthouse gates locked at perf ≥ 90, a11y = 100, best-practices = 100.** Every animation respects `prefers-reduced-motion`. Don't regress.
7. **Notes schema is strict.** `validNote()` in the Pages Function rejects malformed posts with 400. See `docs/notes-schema.md`.
8. **Workspaces are URL-isolated, not auth-protected.** This is intentional for the current scope, but is one of the big open design questions for v2. See `docs/directions.md` § "Identity layer".

## Common commands

```bash
# Serve locally
python3 -m http.server 8765
open http://127.0.0.1:8765/src/simulation/index.html

# Deploy (Cloudflare project + KV already provisioned)
npm run deploy

# Local Pages dev with KV emulator
npx wrangler pages dev . --kv NOTES_KV

# Smoke test
npm run smoke
```

## When in doubt

- For "what does this codebase do today" → `docs/architecture.md`
- For "where are we going next" → `docs/directions.md`
- For "I just want to start coding something useful" → `docs/anchor-tasks.md`
- For "this broke and I don't know why" → `docs/gotchas.md`
- For "how do I work with notes" → `docs/notes-schema.md`
- For long historical context → `docs/planning/`
