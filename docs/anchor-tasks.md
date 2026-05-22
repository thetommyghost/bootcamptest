# Anchor tasks

Two concrete things to chew on while you're getting your bearings. Both teach you something useful about the codebase regardless of which direction in `docs/directions.md` we end up pursuing. Pick either, neither, or both, in any order. Or skip them entirely if you already have a stronger idea.

These are anchors, not assignments.

---

## Anchor A — Mobile fit-to-viewport

The simulation canvas is 1024 × 1024 px fixed-aspect. On portrait mobile (390 × 844 iPhone), only ~7 of 18 waypoints are visible at default zoom. Pinch-zoom works natively (we removed `user-scalable=no` in v3 R4), but there's no fit-to-viewport on initial load.

Almost any v2 direction needs the app to feel right on a phone, so solving this unlocks the rest.

**The hard part:** click coordinates from a DOM event are in viewport pixels. The canvas's internal coordinate space is 0–1024 regardless of how it's displayed. If you apply `transform: scale(...)` to the canvas, click-to-teleport breaks unless `screenToCanvas()` (find it via search) is taught about the scale factor.

**A useful first probe:** in DevTools, try
```js
const c = document.getElementById('venue-canvas');
c.style.transform = 'scale(0.4)';
c.style.transformOrigin = 'top left';
```
Then click a waypoint. Watch where the avatar goes vs where you tapped. The delta tells you what `screenToCanvas()` needs to learn.

**Definition of done that ships:**
- On viewports < 768 px, the entire canvas fits horizontally on load.
- All 18 waypoints visible without pinch-zoom needed.
- Click-to-teleport correct at every waypoint.
- Pinch-zoom still works (zooms back up to native size).
- Lighthouse perf ≥ 90 on mobile.

---

## Anchor B — Translate 3 zone briefings to Arabic in `data.json`

The current UI renders English-only zone descriptions. Bilingual data is one of the small things that signal "this is a real KAWADER tool" to participants.

This task touches the data layer (`assets/data.json`), the renderer (both `src/map/index.html` and `src/simulation/index.html`), and a tiny bit of CSS for RTL alignment. It's a clean way to trace a value end-to-end through both surfaces.

**Pick 3 zones**, suggested high-traffic ones:
- `z01_facade_courtyard_entry`
- `z07_main_theater`
- `z14_garden_olive_grove`

**What to do:**
1. Add `summary_ar` next to `summary` in those 3 zone objects. Modern Standard Arabic (فصحى), ~80–120 words each. Match the descriptive, atmospheric tone of the English. Source material in `docs/planning/handoff/2026-05-13-bootcamp-v3-round3-state.md` if you need it; ask Ameer for the scout transcript.
2. In `src/map/index.html`, find where `zone.summary` is rendered and add a sibling block:
   ```html
   <p class="zone-summary" lang="en">${zone.summary}</p>
   <p class="zone-summary-ar" lang="ar" dir="rtl">${zone.summary_ar || ''}</p>
   ```
3. Add `.zone-summary-ar { text-align: right; font-family: Tajawal, "IBM Plex Arabic", sans-serif; }`.
4. Do the same in `src/simulation/index.html` (the zone overlay's briefing pane).
5. Deploy to staging, confirm Arabic renders RTL on both surfaces.

**Stretch if it goes fast:**
- Add a language toggle in the briefing header (AR / EN) that hides the other block.
- Translate the remaining 15 zones.

This anchor doubles as the first step on the "bilingual UI" direction in `docs/directions.md`.

---

## After you ship either anchor

You'll have touched the canvas + layout layer (Anchor A) or the data + render layer (Anchor B), which means you have a sense of the codebase. That's a better time to pick a direction from `docs/directions.md` and propose how you'd attack it. Send Ameer a short message with the proposal.

If both anchors feel off and you already have a stronger first move, skip them and propose that instead.
