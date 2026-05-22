# Plan: Bootcamp Scout Interactive Map v1 (2026-05-11)

## Goal
Build a single-file, fully interactive HTML map for the Dar Al-Saeed (Edward Said Cultural Institute) scout in Birzeit. Visualises 80 GPS-tagged scout photos + 5 reference screenshots + meeting-note insights. Hands-off, one-shot.

## Constraints (user-stated)
- One-shot, hands off — user is gone.
- Fully interactive HTML (one file or self-contained folder under outputs/).
- Don't reuse the previous map at `docs/kawader-film-camp-map.html` — fresh build.
- Beautiful, see photos, walk through hypothetical activities per zone.
- Use coordinates + the overhead-screenshots-of-Google-Maps + all meeting-note context.

## Inputs (already prepared)
- `outputs/kawader-bootcamp/scout-2026-05-11/manifest.json` — 18 zones with summaries, activities, creative notes, photo-id lists. Sun-path data 2026-05-11. Partners list.
- `outputs/kawader-bootcamp/scout-2026-05-11/photo_data.json` — 86 photos with stem, jpg, lat, lon, dt, zone, is_reference, is_blurred.
- `outputs/kawader-bootcamp/scout-2026-05-11/photos_jpg/` — 86 1600px JPG renditions (~42MB).
- `outputs/kawader-bootcamp/scout-2026-05-11/scout-review.md` — meeting transcript breakdown.
- `outputs/kawader-bootcamp/scout-2026-05-11/transcript.ar.txt` — raw transcript.

## Output
`outputs/kawader-bootcamp/scout-2026-05-11/map/`
- `index.html` — the experience (single file)
- `assets/photos/` — symlinks or copies of the 1600px JPGs (sliced into thumb 640px + full 1600px)
- `assets/data.json` — combined zones + photos + partners + sun (loaded by the page)
- `assets/satellite/` — the two Apple Maps screenshots used as historical context, sun-path PNGs

## Design Direction

**Theme:** day-mode olive + parchment, light + airy (departs from prior dark-theme map). Inspired by film-camp poetic-document feel. Typography: serif headline (e.g. Cormorant Garamond / Playfair), warm sans body (Inter), Arabic body Tajawal/IBM Plex Arabic.

**Layout:** 3 panels
1. **Left rail (collapsible, 280px):** zone index — 18 zones, click to jump map + open details
2. **Map canvas (flex):** Leaflet map, Esri World Imagery satellite tiles, 80 photo pins at their actual GPS coords, clusters at zoom-out, photo-thumb popups at zoom-in. A zone outline (computed convex hull of each zone's photo points) draws a soft watercolour shape per zone, coloured by zone palette. Partner waypoints (5) as differently styled pins.
3. **Right panel (slides in on zone click, 420px):** zone detail — headline, summary, creative notes, activities checklist, photo gallery (grid). Light-box on photo click.

**Header strip (above):**
- Venue name (en + ar), date, scout duration, "Dar Al-Saeed, Birzeit"
- Sun strip: sunrise / solar noon / sunset / golden-hour band for 2026-05-11 (data we have) + a note "August camp dates pending — sun shifts ~1h earlier"
- Compact partners ribbon — clickable pills that fly map to that location

**Bottom strip:**
- Timeline scrubber: drag to move through 10:19 → 11:58 scout (66 photos in time-cluster). As you scrub, pins highlight in time-order. Optional but nice.

## Technical Stack
- Leaflet 1.9.x (CDN) — base map
- Esri World Imagery tile layer (free, no key) for satellite
- Custom Leaflet `divIcon` markers with thumbnail PNGs
- Vanilla JS, no framework
- CSS Grid for layout
- All data inline at first then refactored to data.json once layout works
- Local file:// must work — so no `fetch('./data.json')`. Embed data as `<script type="application/json">` block

## Build Order (no skipping)

### Step 1: assemble assets
- Create `outputs/kawader-bootcamp/scout-2026-05-11/map/assets/photos/` with `thumb/` (640px from /tmp/scout_review, just copy) and `full/` (1600px from photos_jpg, just copy).
- Reuse `/tmp/scout_review/*.jpg` (640px) — copy to map/assets/photos/thumb/
- Copy `photos_jpg/*.jpg` to map/assets/photos/full/
- Copy 5 reference screenshots to map/assets/satellite/

### Step 2: write data.json
- Single combined object: `{ venue, zones, photos, partners, sun, transcript_anchors }`
- Each zone enriched with: a computed visual color (palette of 18), an icon emoji, and the time-range its photos cover.

### Step 3: write index.html
- One file, embed data.json as `<script id="data" type="application/json">…</script>` then `JSON.parse(document.getElementById('data').textContent)` — works on file://
- Leaflet from CDN with integrity hash
- 5 sections of CSS: reset, layout, header, map, panel
- JS:
  - Init Leaflet at venue center, zoom 18, with Esri tiles
  - Draw photo markers (cluster at <17 zoom)
  - Click marker → opens lightbox with full image + zone label + caption
  - Click zone in left rail → flyTo bounds of that zone's photos + open right panel
  - Click partner pill → flyTo partner pin
  - Timeline scrubber + golden-hour overlay
- Lightbox: own implementation (no library), keyboard nav, ESC closes
- Right panel: photo grid (3 cols), each opens lightbox

### Step 4: enrichment (only if Step 3 done and tests pass)
- Add an SVG sun-path arc overlay (sunrise 5:45 east-side, sunset 19:26 west, solar noon almost overhead) as a toggleable layer
- Add a "Walk-through" mode button: cycles through zones, auto-pans + reads notes (no audio, just visual)

### Step 5: verify
- Open the file with `open` and screenshot via Playwright headless if available
- If Playwright unavailable, just `open` and rely on the file://path output
- Print final URL + path to user

## Risk register
- **Leaflet tile attribution must be visible** — keep the `attribution` field on tileLayer.
- **Esri tile usage** — free, but for non-commercial / educational use it's fine here. For production we'd self-host.
- **HEIC / JPEG path issues on file://** — all images converted to .jpg already. Paths must be RELATIVE (./assets/photos/…), no absolute /Users/… paths in HTML.
- **86 large images in DOM** — only render thumbnails; full only via lightbox on demand. Lazy-load.
- **Arabic + LTR mix** — use `dir="auto"` on body, explicit `lang="ar"` on Arabic spans.
- **One-shot constraint** — no opportunity for "but what about X" round-trip. Ship a complete first version; polish is a follow-up.

## Non-goals (defer)
- Editing photo metadata.
- Notion sync (was original ask; now superseded by HTML map).
- Cloudflare Pages deploy — user can deploy when they're back.
- Mobile-perfect responsive layout — desktop-first, mobile-workable.
- Drone-flight overlay, contour map of Birzeit, weather data.
