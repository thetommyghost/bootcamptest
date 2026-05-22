# Gotchas

Read this **before** editing anything. Each item below cost us real time to figure out.

---

## 1. The `Math.floor` sprite frame bug

**Severity:** Critical — broke the walk animation invisibly for 5 rounds.

**Symptom:** Avatar looked "smeared" / "double-exposed" while walking. Frame-by-frame screenshots showed two sprite frames blending.

**Root cause:** `avatarFrame` accumulates as a float (`avatarFrame += dt * FRAMES_PER_SECOND`). When we computed `col = avatarFrame % FRAMES_PER_DIR`, the result was fractional (0.125, 0.25...). Setting `style.backgroundPositionX = -col * SPRITE_WIDTH + 'px'` yielded `-19.18px`, halfway between frames. CSS rendered a blend of two sprite tiles.

**Fix:** In `src/simulation/index.html`, around the walk-cycle render code:

```js
// WRONG
const col = avatarFrame % FRAMES_PER_DIR;

// RIGHT
const col = Math.floor(avatarFrame) % FRAMES_PER_DIR;
```

**Lesson:** Smoke tests that check "bg-position changed between frames" pass even when the sprite is blending. **Assert on discrete values:**

```js
expect(['0px', '-36px', '-72px', '-108px']).toContain(currentBgX);
```

---

## 2. Collision detection was removed on purpose

**Symptom:** You'll see references to `loadWalkableMask()`, `canWalk()`, axis fallbacks, and an "escape budget" in the movement loop.

**Status:** All dead. `canWalk()` always returns `true` for the bounding rectangle. The walkable mask PNG still preloads (90 KB of bandwidth per page load) but is never consulted.

**Why it's still there:** Removing the wrapping code would destabilize the movement loop's structure. Ameer explicitly asked: "remove collision completely" — so we kept the framework but neutered the check.

**Don't:**
- "Clean up" the dead code without coordinating with Ameer.
- Re-enable `canWalk()` without thoroughly testing the axis-fallback edge cases (it was buggy when active).

**Do:**
- If you want collision back: read `docs/planning/handoff/2026-05-13-bootcamp-v3-round3-state.md` for the historical context, then propose a fresh approach.

---

## 3. Mockup cards exist for 7 zones, not all 18

**Symptom:** Click waypoint #8 → briefing has no mockup cards. Bug?

**Status:** Not a bug. By design.

**Why:** The 7 "primary" waypoints (WP-01 to WP-07) got full creative briefing including activity mockups. The 11 "discovery" waypoints (WP-08 to WP-18) have photos + activities only, intentionally lighter to keep mockup-generation work bounded.

**Don't:**
- Auto-generate mockups for all 18 zones.
- "Fix" the empty mockup section by hiding it.

**Do:**
- If a discovery zone graduates to primary, generate mockups via `tools/bootcamp-scout/generate_mockups.py` and add the references to `data.json`.

---

## 4. The walkable mask preload is wasteful

**Status:** Known. ~90 KB wasted on every page load.

**Why we haven't removed it:** It's wired into the bootstrap Promise chain. Removing it cleanly requires unthreading 3 places. Round 4 polish was about visible UX, not invisible cleanup.

**When you can fix it:** Once we either re-enable collision (Item 2) or commit to never using the mask. Either way, talk to Ameer first.

---

## 5. Mobile portrait shows ~7 of 18 stations

**Status:** Open follow-up. See `docs/first-tasks.md` Task 3.

**Why:** Canvas is fixed at 1024 × 1024 px. Portrait mobile viewports are ~390 px wide. No fit-to-viewport logic on initial load.

**Pinch-zoom does work** (we removed `user-scalable=no` in Round 4 A), so users can manually zoom out. But you shouldn't ship a UX that requires that.

---

## 6. All asset paths are RELATIVE

**Symptom:** You add an `<img>` with `src="/assets/photo.jpg"` and it works on the deployed URL but breaks for `file://` debugging.

**Status:** Use `./assets/photo.jpg` (relative), not `/assets/photo.jpg` (root-absolute).

**Why:** Relative paths work in both `file://` and HTTP contexts. Root-absolute paths only work over HTTP. Local debugging via `file://` is a common workflow; don't break it.

**Exception:** API calls (`fetch('/api/notes')`) must be root-absolute. That's fine — they're meaningless in `file://` anyway.

---

## 7. Esri tile licensing

**Status:** OK for educational/internal use. Not OK for public commercial deployment.

**Why:** The current map uses Esri World Imagery tiles. Esri's free tier allows non-commercial / educational use. If the map is ever embedded into a paid product or public marketing site, switch to OSM Carto or a Mapbox token.

**The basemap picker already supports OSM:** Just change the default in `src/map/index.html` (search for `esri` and swap the default tile layer).

---

## 8. Cloudflare Pages Function cold starts

**Symptom:** First request to `/api/notes` after a deploy takes ~1–2 seconds.

**Status:** Expected. Cold start of the JS isolate. Subsequent requests within the same region are < 50 ms.

**Browser handling:** The notes-sync client already handles failed pushes gracefully (queues + retries on next user action). Don't add a UI spinner for the cold start — it'll show on every fresh deploy + confuse users.

---

## 9. KV is eventually-consistent

**Symptom:** You POST a note, then GET right after, and the new note isn't there.

**Status:** KV reads can serve stale data for up to 60 seconds globally (typically < 1 s in the same region).

**Browser handling:** After every local note creation, the browser inserts the note into its in-memory `notesState` and re-renders immediately. It then POSTs in the background. The 30-s poll fetches authoritative state.

**Don't:** Write a flow that reads-after-write expecting strong consistency.

---

## 10. Notes API has no auth

**Status:** Intentional. Documented.

**Why:** It's an internal tool. The workspace ID is the only access gate ("security through URL"). If the URL leaks, anyone can spam that workspace's notes.

**Don't:** Add auth without coordinating with Ameer. Adding auth means a login flow, which means a frontend route, which means a build step, which violates the "no frameworks" rule. Big change.

**Do:** If abuse happens, the 1000-note cap and `workspace_full` 409 are the safety net. You can also rotate the workspace ID by giving users a fresh URL.

---

## When in doubt

Re-read this file. Almost every bug we've shipped already had a warning here.
