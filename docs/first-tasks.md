# First tasks

Three graduated tasks to ramp up. **Do them in order.** Each task teaches a part of the codebase you'll need for the next.

---

## Task 1 — Orientation (½ day)

**Goal:** Be able to draw the architecture on a whiteboard from memory.

### Steps

1. **Walk the live game** for 15 minutes:
   - URL: https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/
   - Move with WASD. Click waypoints. Drop a note (`N`). Open the HUD pill. Open a zone's discussion tab. Export Markdown. Try the Konami code (↑↑↓↓←→←→BA).

2. **Read in this order:**
   - `AGENTS.md` (15 min)
   - `docs/architecture.md` (15 min)
   - `docs/gotchas.md` (10 min — short but critical)
   - `docs/notes-schema.md` (5 min)

3. **Run locally:**
   ```bash
   cd /Users/Kawader/Kawader/Handoffs/bootcamp-interactive-map
   python3 -m http.server 8765
   open http://127.0.0.1:8765/src/simulation/index.html
   ```
   Drop a note locally. Note that it persists across refresh (via `localStorage`) but doesn't sync to other tabs (no KV locally).

4. **Trace one click end-to-end in `src/simulation/index.html`:**
   Find what happens when the user clicks waypoint #3. Use your editor's search:
   - Search for `onWaypointClick` or `selectStation` — find the handler.
   - Follow it to where the briefing pane is populated.
   - Note where `data.json` is read.
   - Note where `renderAllNotesUI()` is called.

5. **Write a 200-word summary** of how the app works, in your own words. Show it to Ameer. If you can't explain it cleanly, re-read.

### Definition of done
- You can answer: *"What happens between pressing N and a remote browser seeing the note?"* (Hint: localStorage → POST → KV → 30s poll → renderAllNotesUI).

---

## Task 2 — Translate 3 zone briefings to Arabic (1 day)

**Goal:** Touch the data layer without breaking the renderer. Practice the edit/test/deploy loop.

### Background

`assets/data.json` has 18 zones. Each has a `summary` field in English. The map currently renders English-only. Ameer wants to add Arabic so the bilingual experience matches the rest of KAWADER materials.

### Steps

1. **Pick 3 zones.** Start with these (they're high-traffic in briefings):
   - `z01_facade_courtyard_entry`
   - `z07_main_theater`
   - `z14_garden_olive_grove`

2. **Read the existing structure** in `assets/data.json` for those 3 zones. Note the fields.

3. **Add `summary_ar` next to `summary`** for those 3 zones. Use Modern Standard Arabic (فصحى), not Palestinian dialect. ~80–120 words each. Match the tone of the English (descriptive, atmospheric, not corporate). Ask Ameer if you need source material — there's a scout transcript at `docs/planning/handoff/2026-05-13-bootcamp-v3-round3-state.md` worth referencing.

4. **Wire the renderer.** In `src/map/index.html`, find where `zone.summary` is rendered into the briefing pane. Add a sibling block:
   ```html
   <p class="zone-summary" lang="en">${zone.summary}</p>
   <p class="zone-summary-ar" lang="ar" dir="rtl">${zone.summary_ar || ''}</p>
   ```
   Add a `.zone-summary-ar` CSS rule with `text-align: right` and your preferred Arabic font stack (try `Tajawal, "IBM Plex Arabic", sans-serif`).

5. **Test locally.** Open the map, click the 3 zones, confirm Arabic renders RTL and reads correctly.

6. **Make the same change in `src/simulation/index.html`** (the zone overlay's briefing pane). Single-file copy-paste — that's the design choice; see `docs/architecture.md`.

7. **Commit and deploy** to your Pages project (see `docs/deployment.md`).

### Definition of done
- 3 zones have `summary_ar` in `data.json`.
- Both map + simulation render Arabic RTL.
- No console errors. Lighthouse a11y still 100.
- Deployed to your `bootcamp-map-trainee.pages.dev` URL.

### Stretch (if you finish fast)
- Add a language toggle in the briefing header (`AR / EN`) that hides the other block.
- Translate the remaining 15 zones.

---

## Task 3 — Mobile fit-to-viewport (2–3 days)

**Goal:** Solve a real open follow-up. Touch the canvas + layout layer.

### Background

The simulation canvas is 1024 × 1024 px fixed-aspect. On portrait mobile (e.g. 390 × 844 iPhone), only ~7 of 18 waypoints are visible at default zoom. Pinch-zoom works natively (we removed `user-scalable=no` in Round 4 A), but there's no fit-to-viewport on initial load.

### The problem to solve

When the simulation loads on a viewport < 768 px wide:
- Scale the canvas down to fit horizontally (preserving aspect).
- Center the avatar.
- Allow pinch-zoom to scale back up.
- Don't break click-to-teleport (canvas coords must still map correctly after CSS transform).

### Hints

1. **Don't change the canvas's internal resolution.** The 1024×1024 is the world coordinate space. Only change CSS transform / display size.

2. **CSS `transform: scale(...)`** is the obvious lever, but watch out: click coordinates from a DOM event are in viewport pixels, and the canvas coord conversion needs to undo the scale. Look at the existing `screenToCanvas()` function (search the file) — extend it with a scale factor.

3. **Try this in DevTools first** before editing the source:
   ```js
   document.getElementById('venue-canvas').style.transform = 'scale(0.4)';
   document.getElementById('venue-canvas').style.transformOrigin = 'top left';
   // Then click a waypoint — does it still teleport correctly?
   ```
   You'll see where the coord math breaks.

4. **The Director Mode overlay (Konami code)** shows the walkable mask and live coords — use it as a debugging surface while you work.

5. **Test on a real device** (or Chrome DevTools mobile emulation at 390 × 844). Don't just resize the desktop browser window — touch events behave differently.

### Definition of done

- On viewports < 768 px, the entire 1024 × 1024 canvas fits horizontally.
- Avatar visible at all 18 waypoints without pinch-zoom required.
- Click-to-teleport still works (regression test by clicking each waypoint).
- Pinch-zoom still works (zooms back up to native size).
- Lighthouse perf still ≥ 90 on mobile.
- Deployed to your Pages project.

### When you're done

Show Ameer the deployed URL on your phone. Walk him through what you did. Open a 1-1 to debrief.

---

## After Task 3

You're ready for production work. Open follow-ups from `CHANGELOG.md`:

- KAWADER-branded avatar sprite (replace the CC0 OpenGameArt one)
- Per-zone ambient audio
- Hand-traced walkable polygon
- Georeferenced Apple Maps overlay at zoom ≥ 19

Ameer will rank these for you.
