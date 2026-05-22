# Handoff · Bootcamp scout map v2 · Track C — Venue twin / playable team-ops sim

**Date:** 2026-05-11
**Parent plan:** `/Users/Kawader/.claude/plans/it-seams-like-you-glistening-meerkat.md`
**Depends on:** Track A1 merged (zone-color border fix). Otherwise parallel-safe with Track B.
**Output path:** `outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/` (new subfolder; the main map gets a "Play mode" button that links here)
**Estimated effort:** 2 sessions, ~6–8 hours

---

## Purpose lock-in (re-read this before designing)
This is **NOT** a video-game demo for sponsors. The user explicitly said: **"internal team usage for development, planning, and onsite usage"**. So the simulation is a **playable venue twin** — a tool for the team to:
- Walk a colleague through the venue without being there
- Drop operational notes anchored to a place ("install blackout curtains here", "set up editing station in this corner")
- Build shared spatial intuition before camp
- Onboard new team members or trainers without needing a physical visit

Drop from your design any sponsor-pitch flourishes: no auto-play sequence, no music, no narrator copy. Aesthetic is closer to "playful field tool" than "interactive ad". Avatar walk-cycle stays because it makes the tool fun to use.

## Read first (in order)
1. `outputs/kawader-bootcamp/scout-2026-05-11/map/README.md`
2. `outputs/kawader-bootcamp/scout-2026-05-11/map/index.html` (lift the data block + Leaflet setup; you'll reuse them)
3. `outputs/kawader-bootcamp/scout-2026-05-11/map/assets/data.json`
4. `outputs/kawader-bootcamp/scout-2026-05-11/scout-review.md` — adjacency hints (which rooms are physically next to which)
5. Parent plan §"Track C handoff brief"

---

## What Track C delivers

### C1 — Avatar sprite + walk-cycle
Source a top-down 32×32 px walk-cycle sprite. 4 directions × 4 frames = 16 frames packed into a single sprite sheet.

**Recommended placeholder source:** OpenGameArt.org — search "top-down character walk cycle CC0". Aim for a generic urban person, neutral palette so it works on satellite. Save as:
- `simulation/assets/avatar.png` (sprite sheet)
- `simulation/assets/avatar-frames.json` (frame map: `{down: [{x,y,w,h}, ...], up:[...], left:[...], right:[...]}`)

Document the source + license in `simulation/assets/CREDITS.md`. KAWADER-branded sprite is a follow-up (mention in CREDITS).

### C2 — Movement engine (vanilla JS on Leaflet)
**Architecture:**
- Reuse Leaflet + same satellite tiles + same zone polygons as the main map. Pull `data.json` via a relative path or inline.
- The avatar is a custom `L.marker` whose `divIcon` HTML is a `<canvas>` or a positioned `<img>` clipping the sprite sheet.
- A `requestAnimationFrame` loop updates avatar position based on a `velocity` vector + animates the sprite frame based on direction + 4-frame cycle.

**Movement controls:**
- Keyboard: WASD or arrow keys → set velocity
- Touch: tap a point → set destination, avatar walks toward it (constant speed)
- Diagonal allowed

**Constrain to walkable area:**
- Trace a `walkable.geojson` polygon once by hand from satellite — the boundary of the compound + outdoor paths. Stored at `simulation/walkable.geojson`.
- On each frame, if next position is outside the polygon, project back to the boundary (or just reject the move).
- Use `@turf/turf` (CDN) or hand-roll point-in-polygon — turf is ~50 KB extra so probably hand-roll.

**Speed:** ~0.5 m/s in-game. At zoom 19, 1 pixel ≈ 0.3 m, so avatar moves ~1.5 px/frame at 60 fps.

### C3 — Zone-entry → photo-room overlay
On every avatar position update, point-in-polygon-test against all zone polygons.
- When avatar enters a new zone (debounced; require 1.5 s of being inside) → fade in a full-screen photo-room overlay.
- Photo-room shows:
  - Horizontal swipeable carousel of the zone's photos (full-resolution)
  - Zone title + Arabic
  - Activities list (from `data.json`)
  - Creative notes
  - Footer bar with two buttons: "Drop note here" + "← Exit room"
- Exit room: fade out, return to map with avatar in same position. Mark this zone as "visited" (subtle UI change — checkmark in some list).

### C4 — "Drop note here" hook
This button creates a note pinned at the avatar's current GPS, opens the same note-edit popover that Track B5 uses. Critical: both Tracks B and C must read/write the same `localStorage` key (`kawader_scout_notes_v1`) so notes are unified.

If Track B isn't done yet when you're building C: stub out the note-edit popover here in C with the same schema, and B will pick up the shared store later. The schema spec is in the Track B brief, sub-task B5.

### C5 — *(defer, stretch)* Ambient audio per zone
Loop a 30-s lo-fi ambient track per zone-type. CC0 sources from Freesound.org. Toggleable, default OFF. Don't auto-play (browsers block it). Add a 🔊 button in the map controls.

### Entry from main map
Add a "▶ Play mode" button in the main `index.html`'s `.map-controls` bar. Links to `./simulation/index.html`. The simulation has a back button "← Map" that returns to the main map.

---

## File layout
```
outputs/kawader-bootcamp/scout-2026-05-11/map/
├── index.html          (main map — Tracks A + B; only edit: add Play mode button)
├── assets/             (Track A + B own this)
└── simulation/         (Track C owns this entirely)
    ├── index.html      (the simulation page)
    ├── walkable.geojson
    └── assets/
        ├── avatar.png
        ├── avatar-frames.json
        ├── ambient/    (deferred — C5)
        └── CREDITS.md
```

## Verification (must pass before deploy)
1. Walk every zone in <5 min using keyboard.
2. Touch works on mobile (tap to walk, swipe in photo-room, can dismiss room).
3. Entering same zone twice without leaving in-between doesn't re-trigger the overlay (debounce works).
4. Avatar can't walk through walls (walkable polygon enforced).
5. Sprite walk-cycle visibly animates while moving, stays still when idle.
6. "Drop note" inside photo-room creates a note that's then visible on the main map after exit.
7. The Play mode button on the main map is non-intrusive on mobile.
8. Playwright sweep at 375×667 / 768×1024 / 1440×900: 0 console errors.

## Deploy
Same as Tracks A and B:
```bash
rsync -a --delete \
  /Users/Kawader/KAWASIST/outputs/kawader-bootcamp/scout-2026-05-11/map/ \
  /Users/Kawader/KAWASIST/docs/bootcamp-scout/edward-said/

wrangler pages deploy /Users/Kawader/KAWASIST/docs \
  --project-name kawasist-internal --commit-dirty=true
```

Simulation URL: `https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/`

## When you're done
- Update `STATUS.md` with "Track C complete"
- Update the map `README.md`
- Add a `CREDITS.md` for the sprite source

## Out of scope (do not do)
- 360 panorama tour (deferred to Track C2 / post-shoot day)
- Three.js / full 3D walkable model (deferred)
- Quests / objectives / "find X in 60 seconds" gamification (out of internal-tool scope)
- Auto-play guided tour (out of scope — this is for the team to USE, not WATCH)
- Sponsor pitch flourishes (out of scope per purpose lock-in)
- Multiplayer (out of scope; future Track once D+E exist)
- PWA / offline (deferred to Track D)
