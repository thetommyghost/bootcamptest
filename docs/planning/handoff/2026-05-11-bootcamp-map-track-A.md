# Handoff · Bootcamp scout map v2 · Track A — Map foundation

**Date:** 2026-05-11
**Parent plan:** `/Users/Kawader/.claude/plans/it-seams-like-you-glistening-meerkat.md`
**Sibling tracks:** B (depends on A), C (depends on A1 only)
**Estimated effort:** 1 session, ~3-4 hours of focused work
**Owner of this brief:** spawn one fresh Claude Code session against the KAWASIST repo. This brief is self-contained.

---

## Read first (in order)
1. `outputs/kawader-bootcamp/scout-2026-05-11/map/README.md` — what the v1 map is + file layout
2. `outputs/kawader-bootcamp/scout-2026-05-11/map/index.html` — the file you'll be editing (79 KB, single-file)
3. `outputs/kawader-bootcamp/scout-2026-05-11/manifest.json` — zone authoring source (read-only here)
4. `outputs/kawader-bootcamp/scout-2026-05-11/scout-review.md` — meeting notes for context
5. The parent plan above for full v2 context (skim §"FINAL EXECUTABLE PLAN" and §"Track A handoff brief")

## What v1 looks like today (live)
- `https://kawasist-internal.pages.dev/bootcamp-scout/` — current production
- Esri World Imagery satellite tiles, 78 photo pins, 5 partner pins, 18 zone polygons, lightbox, walk-through timeline, mobile drawer + bottom-sheet
- Verified on mobile/tablet/desktop with 0 console errors

## What Track A delivers (5 sub-tasks)

### A1 — Restore zone-color border on thumb markers
**Location:** `outputs/kawader-bootcamp/scout-2026-05-11/map/index.html` — find `makeIcon()` helper in the JS block.
Currently:
```js
html: `<div class="${cls}" style="${bg}background-color:${p._zone.color}; border-color:${dot ? p._zone.color : '#fff'}"></div>`,
```
Change to:
```js
html: `<div class="${cls}" style="${bg}background-color:${p._zone.color}; border-color:${p._zone.color}"></div>`,
```
Add inner white separator for legibility on busy satellite imagery — in the `.photo-marker` CSS rule, add `box-shadow: inset 0 0 0 1.5px #fff, 0 2px 6px rgba(0,0,0,.4), 0 0 0 1px rgba(0,0,0,.25);` (extends existing box-shadow).

### A2 — Manual placement mode (`?edit=1`)
Detect URL flag: `const editMode = new URLSearchParams(location.search).get('edit') === '1';`
If true:
- For every photo marker, call `m.dragging.enable()`
- On `dragend`, capture new `latLng` into an in-memory `corrected = {}` dict keyed by `m._photo.stem`
- Add a button to `.map-controls`: "💾 Download corrected data.json"
- On click: deep-clone `DATA`, walk each `zones[*].photos[*]`, if stem is in `corrected` then set new `lat`/`lon`, then `JSON.stringify(cloned, null, 2)` and trigger a download via a `<a download>` blob URL
- Show a small badge near map controls: "EDIT MODE — drag pins to correct" (red/warning style)

### A3 — Retina sharpness
On the Esri tileLayer config, add `detectRetina: true`. Confirm `maxNativeZoom: 19, maxZoom: 21` (already set). On the labels tile layer too. Don't change `maxZoom` from 21 — over-zoom is acceptable for venue-scale work, sharpness wins via Retina.

### A4 — Georeferenced Apple Maps overlay
The file `outputs/kawader-bootcamp/scout-2026-05-11/map/assets/satellite/satellite_birzeit_zoom.jpg` is a high-res Apple Maps screenshot of the venue compound. We use it as an `L.imageOverlay` to give crisp imagery above zoom 19.

**Process (~30 min careful work):**
1. Open the screenshot in a viewer. Identify 4 corner reference points that are also visible at high zoom in Esri tiles (e.g., distinct building corner, intersection, tree, water tank).
2. For each, find its true GPS via Google Maps satellite (drop a pin, copy coords). Record as `(pixel_x, pixel_y, lat, lon)`.
3. Compute an affine transform from pixel→latlon (or just use 2 opposite corners if the screenshot is axis-aligned). Compute the SW + NE geographic bounds of the image.
4. Add to the map JS:
```js
const orthoBounds = [[lat_sw, lon_sw], [lat_ne, lon_ne]];
const ortho = L.imageOverlay('./assets/satellite/satellite_birzeit_zoom.jpg', orthoBounds, {
  opacity: 1, interactive: false, zIndex: 250,
});
// Show only at zoom >= 19
map.on('zoomend', () => {
  const z = map.getZoom();
  if (z >= 19 && !map.hasLayer(ortho)) ortho.addTo(map);
  else if (z < 19 && map.hasLayer(ortho)) map.removeLayer(ortho);
});
if (map.getZoom() >= 19) ortho.addTo(map);
```

**If the manual georef proves hard:** fall back to skipping A4. A3 alone is a big win. Document the skip in the deploy notes.

### A5 — "GPS-approximate" honesty badge
In the detail panel `Photos · N` section header, append a small italic sub-line:
```html
<span style="font-size:11px; font-style:italic; color:var(--ink-2); display:block; margin-top:2px;">
  Pin positions are approximate (iPhone EXIF GPS, indoor drift ±10–30 m).
</span>
```

### A6 — Venue rename + URL path
Update everywhere:
- `data.json` (and the inline data block in `index.html`):
  - `venue.name_en`: `"Edward Said Cultural Institute (Dar Al-Saeed)"`
  - `venue.name_ar`: stays `إدوارد سعيد`
- README.md, manifest.json: same rename
- Deploy mirror: change rsync target from `docs/bootcamp-scout/` to `docs/bootcamp-scout/edward-said/`
- Add a tiny `docs/bootcamp-scout/index.html` that redirects to `./edward-said/`:
  ```html
  <!DOCTYPE html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=./edward-said/">
  <title>Bootcamp scout</title><p>Redirecting to <a href="./edward-said/">edward-said</a>…
  ```

## Tools available
- `wrangler` — deploy command at end of brief
- `python3` with `playwright` already installed for verification
- macOS `sips` for any image processing
- Standard text editor tooling

## Verification (must pass before deploy)
1. Visual diff: thumb markers ring in zone color, not white. Take before/after Playwright screenshots at zoom 19 to confirm.
2. `?edit=1` shows draggable pins + Download button. Drag one, download, grep the JSON for the new lat/lon.
3. Compare Retina screenshot before/after A3 at zoom 20 — text on tiles should be 2× crisper.
4. If A4 done: at zoom ≥19, the overlay appears with crisp custom imagery; at zoom 18, it disappears.
5. The "GPS-approximate" badge is visible in every zone's photo grid header.
6. URL `/bootcamp-scout/` redirects to `/bootcamp-scout/edward-said/`.
7. Playwright sweep at 375×667, 768×1024, 1440×900: 0 console errors. Reuse `/tmp/test_map_full.py` from the v1 build.

## Deploy
```bash
# 1. Mirror source to docs
rsync -a --delete \
  /Users/Kawader/KAWASIST/outputs/kawader-bootcamp/scout-2026-05-11/map/ \
  /Users/Kawader/KAWASIST/docs/bootcamp-scout/edward-said/

# 2. Drop in the redirect at the old path
cat > /Users/Kawader/KAWASIST/docs/bootcamp-scout/index.html <<'EOF'
<!DOCTYPE html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=./edward-said/">
<title>Bootcamp scout</title><p>Redirecting to <a href="./edward-said/">edward-said</a>…</p>
EOF

# 3. Deploy
wrangler pages deploy /Users/Kawader/KAWASIST/docs \
  --project-name kawasist-internal --commit-dirty=true

# 4. Smoke
curl -s -o /dev/null -w "edward-said: %{http_code}\n" \
  "https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/"
curl -s -o /dev/null -w "redirect: %{http_code}\n" \
  "https://kawasist-internal.pages.dev/bootcamp-scout/"
```

## When you're done
- Add a "Track A complete" note in `STATUS.md`
- Update `outputs/kawader-bootcamp/scout-2026-05-11/map/README.md` with the new URL
- Track B can start (it depends on A merged)
- Track C can start in parallel (only needed A1's color fix)

## Out of scope for this track (do not do)
- Notes layer (Track B)
- Floor switcher / themes / basemap picker / visualisation modes (Track B)
- Simulation / avatar / photo-rooms (Track C)
- PWA / offline / geolocation (deferred to v2.5+)
- 360 panoramas (deferred)
- Multi-venue registry (deferred)
