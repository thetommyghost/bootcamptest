# Changelog

All notable changes to the Bootcamp Interactive Map & Game.

## v3 Round 4 — 2026-05-14

Final polish round. Lighthouse 99/96/100/100. 14/14 smoke gates green.

- **A.** Pinch-zoom + camera-follow on mobile (PointerEvent, dual-pointer pinch).
- **B.** Konami code (↑↑↓↓←→←→BA) unlocks Director Mode overlay: live coords, walkable mask outline, zone-note badges.
- **C.** Teleport particle FX — 22 particles, 600 ms lifespan, quad-out easing.
- **D.** Ambient audio bed (Freesound CC0 loops, toggleable, default off, ducks under footstep SFX).

## v3 Round 3 — 2026-05-13

Notes feature shipped end-to-end.

- **Phase 2.** Notes visibility across 4 UI surfaces (canvas pins, mini-map dots, HUD pill, briefing thread) via single `renderAllNotesUI()`.
- **Phase 3.** Cloudflare Pages Function + KV backend (`functions/api/notes/`). 30 s polling client. `localStorage` fallback. Author-name prompt. Ripple-ping on incoming remote notes.
- **Phase 4.** Discussion threads — tabbed briefing (Overview · Discussion), reply UI, author chips (deterministic 8-color hash), Markdown lite (bold/italic/link), pin/unpin, unread pulse.
- **Phase 5.** Notes browser side panel — filter, search, zone/author dropdowns, Markdown export/import (ISO timestamp round-trip).
- **Phase 6.** Lighthouse gate + close-out (deploy `d91ee54a`).

## v3 Round 2 — 2026-05-13

Animation fixes after overnight bug hunt.

- Fixed fractional `bg-position` smearing on the avatar walk cycle — added `Math.floor(avatarFrame)` ([gotchas.md](docs/gotchas.md) §1).
- Collision detection removed per user request; `canWalk()` reduced to bounds check.
- Idle-breathing avatar, stop-dust puff, walking shadow squash added.
- Soft-mask edges on zone entry overlays.
- Direction hysteresis to stop sprite jitter on diagonal walk.

## v3 Round 1 — 2026-05-12

Venue twin / play mode shipped.

- Canvas-based avatar movement (WASD / arrows / tap-to-walk).
- Zone entry → photo-room overlay with scout images + notes.
- Shared notes store via `localStorage` (KV came in Round 3).
- Visited progress tracking, reset button.

## v2 Tracks A / B / C — 2026-05-11

Parallel feature batch on top of v1.

- **Track A.** Zone color restoration on markers, edit mode (`?edit=1`), Retina sharpness, Apple Maps overlay scaffolding, GPS-approximate badge, venue rename.
- **Track B.** Floor switcher, themed presets, basemap picker (5 layers), visualization modes (Identity / Heatmap / Best-light), notes layer with export/import, deep-link notes.
- **Track C.** Venue twin scaffolding, movement controls, zone entry overlays, avatar sprite (OpenGameArt CC0).

## v1 — 2026-05-11

Initial HTML scaffold.

- Leaflet base map at Edward Said Cultural Institute coordinates.
- 18 zone polygons (convex hulls from photo GPS clusters).
- 86 scout photos as Leaflet markers.
- 5 partner pins.
- 3-panel layout (zone rail · canvas · briefing).

## Deferred / open follow-ups

See [docs/first-tasks.md](docs/first-tasks.md) for the trainee's pickup list.

- Georeferenced Apple Maps overlay at zoom ≥ 19 (manual 4-corner GPS calibration).
- Hand-traced walkable polygon to replace the bounding rectangle.
- KAWADER-branded avatar sprite to replace the CC0 OpenGameArt one.
- Per-zone ambient audio (currently one shared bed).
- Mobile canvas fit-to-viewport (only 7/18 stations visible on portrait 390×844).
- Arabic translation pass on zone briefings.
