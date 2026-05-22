# Coordinator note · Bootcamp scout map v2 · 2026-05-11

One-pager that ties the three track handoffs together. Read this before kicking off Sessions 2 and 3 so we don't double-deploy or step on each other.

## Live URLs
- v1 (current): `https://kawasist-internal.pages.dev/bootcamp-scout/`
- v2 (after Track A redirect): `https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/`

## Plan + handoffs (all in this repo)
- Plan file: `/Users/Kawader/.claude/plans/it-seams-like-you-glistening-meerkat.md`
- Track A: `.planning/handoff/2026-05-11-bootcamp-map-track-A.md`
- Track B: `.planning/handoff/2026-05-11-bootcamp-map-track-B.md`
- Track C: `.planning/handoff/2026-05-11-bootcamp-map-track-C.md`

## Session order (one Claude session per row)

| # | Session | Tracks | Why this order | Deploy at end? |
|---|---|---|---|---|
| 1 | Foundation | A only | A renames the venue + moves URL path + restores color borders + adds GPS-correction mode + Retina + georef. B and C both depend on the new URL path and the color fix. | Yes — deploy A standalone |
| 2 | Map paint + sim launch | B + C in parallel | B paints view filters + notes onto the main map. C builds the simulation page in a fresh `simulation/` subfolder. Files don't overlap. | Yes — single combined deploy after both finish |
| 3 | Polish + close | finish B / C, optional Track D if onsite friction is real | One last pass | Final deploy |

## Single-deploy rule
- Never `wrangler pages deploy` mid-track.
- At the end of each session, do ONE deploy that bundles all completed tracks.
- The deploy command is always:
  ```bash
  rsync -a --delete \
    /Users/Kawader/KAWASIST/outputs/kawader-bootcamp/scout-2026-05-11/map/ \
    /Users/Kawader/KAWASIST/docs/bootcamp-scout/edward-said/
  wrangler pages deploy /Users/Kawader/KAWASIST/docs \
    --project-name kawasist-internal --commit-dirty=true
  ```

## Shared state across tracks
- `data.json` schema bumps on every change. Add a `schema_version` field at top level. Track A sets it to 2. Track B adds `floor` + `themes` fields (bumps to 3). Track C reads but doesn't write the data.
- `localStorage` namespace: notes live at `kawader_scout_notes_v1`. Both Tracks B and C read/write it. Schema in Track B handoff §B5.
- URL hash routing: zone format `#z05_roof`. Note format `#z05_roof&note=n_abc` (Track B). Simulation has its own state (no shared hash format).

## Merge conflict risk
- Tracks A and B both edit `index.html`. They're sequential — no conflict.
- Tracks B and C: B edits `index.html`, C edits `simulation/index.html`. **Only conflict point:** the small "▶ Play mode" button C adds to the main map's controls bar. C should write that line after B finishes its controls-bar paint, OR C and B sync at start of Session 2.

## Out of scope for v2 (so we don't drift)
- PWA / offline / "you are here" / camera-attach in notes — these are Track D, **deferred** until real onsite friction is felt. Do not include in v2.
- 360 panorama tour — needs a re-shoot day. **Deferred**.
- Drone orthophoto, full RTL UI, schedule overlay, notes types/status, notes drawing tool, notes collaborative store, multi-venue registry — **all deferred**. See plan file's "Deferred to v2+" section.

## Success criteria (v2 done when all of these pass)
1. `https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/` loads in <2 s on a cold Retina display; tiles are visibly crisp.
2. Thumb markers show their zone-color border.
3. `?edit=1` shows draggable pins + Download data.json button.
4. Floor switcher, themed presets, basemap picker, and visualisation modes all work without page reload.
5. Adding a note via the main map persists across reload.
6. Export notes → fresh browser → Import notes → notes restored.
7. Play mode boots the simulation; avatar walks; entering Sammer's workshop opens the photo-room; "Drop note" creates a note that's visible on the main map after exit.
8. Playwright sweep at 375×667 / 768×1024 / 1440×900: 0 console errors on each.
9. Old URL `/bootcamp-scout/` redirects to `/bootcamp-scout/edward-said/`.

## If a track stalls
- Track A: minimum-viable is A1 (color fix) + A3 (Retina) + A6 (rename). A2, A4, A5 are individually deferrable.
- Track B: minimum-viable is B1 (floor switcher) + B5/B6 (notes + export). B2/B3/B4 can ship in v2.1.
- Track C: minimum-viable is C1 (sprite) + C2 (movement) + C3 (photo-room). C4 (drop-note) is the highest-value optional. C5 (audio) is fully optional.

## Contact / authoring
- Venue manager Amjad — pending email confirmation per the scout meeting notes
- Scout author Ameer + Azouz — primary stakeholders for content questions
- All data lives under `outputs/kawader-bootcamp/scout-2026-05-11/` — never edit `docs/` directly (it's a deploy mirror)
