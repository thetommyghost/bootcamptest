# Handoff · Bootcamp scout map v2 · Track B — Views & notes

**Date:** 2026-05-11
**Parent plan:** `/Users/Kawader/.claude/plans/it-seams-like-you-glistening-meerkat.md`
**Depends on:** Track A merged + deployed first. Confirm by hitting `https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/` and verifying thumb markers show zone-color borders.
**Sibling track:** Track C (parallel-safe — C writes to `simulation/` folder, B writes to the main `index.html` + `data.json`; minimal conflict)
**Estimated effort:** 1.5 sessions, ~5–7 hours

---

## Read first (in order)
1. `outputs/kawader-bootcamp/scout-2026-05-11/map/README.md`
2. `outputs/kawader-bootcamp/scout-2026-05-11/map/index.html` (post-Track-A version)
3. `outputs/kawader-bootcamp/scout-2026-05-11/map/assets/data.json`
4. `outputs/kawader-bootcamp/scout-2026-05-11/scout-review.md` — the floor + theme classifications below come from here
5. The parent plan for full v2 context

## What Track B delivers (7 sub-tasks)

All work in **`outputs/kawader-bootcamp/scout-2026-05-11/map/index.html`** (plus paired updates to `assets/data.json`).

### B1 — Floor switcher
Assign each zone a `floor` field in `data.json` per the classification below. Add radio chips above the zone list with these values: `All · 3F · 1F · Ground · Basement · Rooftop · Outdoor · Cross-floor`. Selecting filters:
- The zone-list `<li>` items (hide non-matching)
- The map photo markers (set `display:none` on the `divIcon` HTML, or remove/re-add the marker)
- The zone polygons

**Classification (from `scout-review.md` + photo content):**
| Zone | Floor |
|---|---|
| z01_sammer_workshop | Ground |
| z02_bedrooms_3rd_floor | 3F (girls' rooms) + 1F (boys' rooms) — set `floor:"3F"` primary, add `floor_aliases:["1F"]` |
| z03_bathrooms_main | 3F + 1F — same pattern |
| z04_bathroom_derelict | Cross-floor |
| z05_roof | Rooftop |
| z06_music_hall_grand_piano | Ground |
| z07_dining_hall | Ground |
| z08_practice_rooms | Ground + 1F |
| z09_equipment_room_ground | Ground |
| z10_storage_attic | Cross-floor |
| z11_outdoor_courtyard_garden | Outdoor |
| z12_wall_text_motifs | Cross-floor |
| z13_exterior_views | Cross-floor (window views) |
| z14_utility_basement | Basement |
| z15_chalkboard_classroom_assets | Ground |
| z16_kitchen_derelict | Ground |
| z17_rusted_door_arrow | Cross-floor |
| z18_main_stone_facade | Ground (façade) |

### B2 — Themed presets
Add a `themes:[]` array to each zone in `data.json`. Each zone can have multiple themes. Add a multi-select chips strip below the floor switcher. Theme options:
`Accommodation · Workshop spaces · Outdoor · Partners · Set-design · Wall-text · Utility · Equipment`

**Theme assignments:**
| Zone | Themes |
|---|---|
| z01_sammer_workshop | `Workshop spaces`, `Doc subject` |
| z02_bedrooms_3rd_floor | `Accommodation`, `Set-design` |
| z03_bathrooms_main | `Accommodation`, `Utility` |
| z04_bathroom_derelict | `Set-design` |
| z05_roof | `Workshop spaces`, `Outdoor` |
| z06_music_hall_grand_piano | `Workshop spaces` |
| z07_dining_hall | `Accommodation`, `Workshop spaces` |
| z08_practice_rooms | `Workshop spaces`, `Equipment` |
| z09_equipment_room_ground | `Equipment` |
| z10_storage_attic | `Set-design`, `Utility` |
| z11_outdoor_courtyard_garden | `Outdoor`, `Workshop spaces` |
| z12_wall_text_motifs | `Set-design`, `Wall-text` |
| z13_exterior_views | `Set-design` |
| z14_utility_basement | `Set-design`, `Utility` |
| z15_chalkboard_classroom_assets | `Workshop spaces`, `Equipment` |
| z16_kitchen_derelict | `Set-design`, `Utility` |
| z17_rusted_door_arrow | `Set-design`, `Wall-text` |
| z18_main_stone_facade | `Set-design` |

Filtering: AND between selected themes (zone must match all selected). Empty = no filter.

### B3 — Basemap picker
Add a radio control (small dropdown or radio chips) in the map controls bar. Options + tile sources:
- **Satellite** — Esri World Imagery (current)
- **Streets** — `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` (osm.org)
- **Hybrid** — Esri satellite + Esri labels overlay (current setup)
- **OSM Carto** — `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Blank** — solid `#1d2630` (no tiles, useful for the "venue twin" look in Track C)

Implementation: keep a `tileLayerByName` registry, swap by removing/adding to map. Save the choice in `localStorage` as `kawader_map_basemap`.

### B4 — Visualisation modes
Radio: `Identity · Activity-heatmap · Best-light`. Default Identity (current per-zone colors).

- **Activity-heatmap:** for each zone polygon, set `fillOpacity` proportional to `activities.length` normalized to [0.05, 0.55]. Add a legend bar.
- **Best-light:** include SunCalc.js from CDN (`https://unpkg.com/suncalc@1.9.0/suncalc.js`). Add a time-of-day slider (00:00 → 23:59 in 15-min steps). For each zone centroid, compute sun azimuth + altitude. If altitude > 0, set fill to a gold tint proportional to `cos(altitude)` (warmth = how oblique the light is). If altitude < 0, set fill to a dim blue tint. Use Aug 5–10 as the camp dates (configurable date input). Add a legend.

### B5 — Notes layer (localStorage)
Add a "Notes mode" toggle button in the map controls bar. When ON:
- Cursor changes to crosshair on map hover
- Click any map point → drops a yellow-speech-bubble divIcon marker → opens an inline edit popover (title input · body textarea · file picker for optional photo · zone-auto-tag dropdown that defaults to "nearest zone")
- Save persists to `localStorage` under `kawader_scout_notes_v1` (JSON array of `{id, lat, lon, title, body, photo (base64 or null), zone, created_at, updated_at}`)
- Re-render note markers on every save

When OFF: notes are still visible but the map is in normal-pan mode. Clicking a note marker opens its read/edit popover.

Schema:
```json
{
  "schema_version": 1,
  "notes": [
    {"id":"n_<6char>","lat":31.97,"lon":35.196,"title":"","body":"","photo":null,"zone":"z05_roof","created_at":"2026-05-11T14:00:00Z","updated_at":"..."}
  ]
}
```

Photo handling: if attached photo is < 100 KB, store as base64 inline; if larger, refuse with "Upload to Drive and link instead" message and a field to paste a URL.

### B6 — Export / Import notes JSON
Two buttons in a small notes toolbar:
- **Export:** downloads `kawader_scout_notes_<date>.json` containing `{venue, exported_at, notes:[...]}`
- **Import:** file-picker → reads JSON → merges by `id` (existing IDs are kept, new IDs are added); show count of imported + skipped

### B7 — Deep-link notes
URL hash form `#z05_roof&note=n_abc` opens the zone panel + finds note `n_abc` and opens its popover. On note open, update `history.replaceState` to include the note id. On note close, strip it.

---

## Verification (must pass before deploy)
1. Floor switcher: select "3F" → only z02, z03 visible. Select "Outdoor" → only z11 visible.
2. Themes + floor stack: select "Ground" + "Workshop spaces" → z01, z06, z08, z15 visible.
3. Basemap switch preserves zoom + center + pin positions. Refresh keeps the saved basemap.
4. Activity heatmap shows clearly distinct opacity per zone.
5. Best-light at 06:00 shows roof zones brighter than indoor; at 18:00 shows west-facing windows brighter than east.
6. Notes: drop a note at the dining hall, write "Need 50 plates", reload — note is still there.
7. Export → fresh Chrome incognito → Import → same note appears.
8. URL `…/#z05_roof&note=n_xyz` opens that exact note.
9. Playwright sweep at 375×667 / 768×1024 / 1440×900: 0 console errors.

## Deploy
Same as Track A:
```bash
rsync -a --delete \
  /Users/Kawader/KAWASIST/outputs/kawader-bootcamp/scout-2026-05-11/map/ \
  /Users/Kawader/KAWASIST/docs/bootcamp-scout/edward-said/

wrangler pages deploy /Users/Kawader/KAWASIST/docs \
  --project-name kawasist-internal --commit-dirty=true
```

## When you're done
- Verify Track C didn't merge-conflict (likely safe — they touch `simulation/`)
- Update `STATUS.md`
- Update `README.md` in the map folder with the new features

## Out of scope (do not do)
- Notes types/status (deferred to v2.5 — keep schema flat in v1)
- Notes collaborative store (deferred)
- Notes drawing/annotation tool (deferred)
- Anything in Track A or Track C
- PWA / offline / geolocation (deferred)
