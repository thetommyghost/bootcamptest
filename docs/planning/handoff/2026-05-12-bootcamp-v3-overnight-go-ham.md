# Bootcamp Scout Map V3 — Overnight "Go Ham" Optimization Handoff

**Created:** 2026-05-12 22:34
**Target end state:** V3 game polished on every axis (visual / mechanical / content / a11y / perf / engineering) and redeployed.
**Run mode:** hands-off overnight, multiple cron firings, each picks up the next phase from the state log.
**Live now (V3 round 1):** https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/ — deploy `e86dbde2`.

---

## Copy-pasteable prompt for the first cron firing

```
You are picking up an overnight "go ham" optimization run on the Bootcamp Scout Map
V3 game. Read .planning/handoff/2026-05-12-bootcamp-v3-overnight-go-ham.md for the
full plan and state-log convention. The game is live at
https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/.

Operating rules — non-negotiable:
1. Use the superpowers skill chain end-to-end: brainstorming → writing-plans →
   subagent-driven-development → systematic-debugging (for any bug) →
   verification-before-completion → finishing-a-development-branch. Invoke each
   skill via the Skill tool at the right moment; don't skip.
2. Dispatch parallel agents (superpowers:dispatching-parallel-agents) wherever
   work is genuinely independent — research, image gen, audits, etc.
3. State log convention:
   .planning/handoff/2026-05-12-bootcamp-v3-overnight-state.md
   Append a dated entry after every phase completion. First firing creates it.
   Last firing closes it with a final summary block.
4. Visual verification gate at the end of every phase (Playwright screenshot at
   3 viewports + `/tmp/sim-v3-smoke.py` extended assertions). NEVER advance to
   the next phase with a failing gate.
5. Each cron firing reads the state log first, identifies the next pending phase,
   executes ONLY that phase (or as many as fit in 60 min), updates the state log,
   stops. Don't try to do everything in one firing.
6. Truth + safety rules from CLAUDE.md still apply: never claim "deployed" or
   "verified" without session evidence; if blocked, document the block in the
   state log and stop cleanly.
7. Cost control: pre-budget Gemini Pro Image at ~$3/firing max (~30 images).
   Pre-budget Flash at ~$1/firing max (~50 images). Stop and log if a phase
   would exceed.
8. Prod is untouched. Everything lands at the same Cloudflare Pages URL.

Pick the first pending phase from the state log and start. If the state log
doesn't exist yet, you are firing #1 — create it with a "FIRING #1 START"
header and begin Phase 0.
```

---

## Phase plan (10 phases, designed to fit ~5–6 cron firings overnight)

### Phase 0 — Audit + baseline (Firing #1, ~30 min)

**Goal:** know the V3 game cold before changing anything.

Use `superpowers:brainstorming` to set the frame, then dispatch **3 parallel Explore agents**:

1. **Visual audit** — open the live URL across desktop+tablet+mobile in Playwright, capture 9 screenshots (3 viewports × 3 states: idle / station hover / briefing open). Score against a rubric: (a) station coverage of the painted bg, (b) icon distinctness, (c) primary-vs-discovery hierarchy, (d) HUD legibility on bg, (e) mini-map usefulness, (f) briefing pane balance. Output a numbered punch-list of visual issues.
2. **Mechanics audit** — Playwright-script every input: WASD continuous walk, arrows, single-click empty, double-click, click-station, click-thru station-then-bg, Escape, backtick, N, drag-on-bg, blur, visibility-change, touch-tap, touch-hold. For each: works/broken/edge-case. Output a numbered binding map.
3. **Content audit** — diff `data.json` zones × `layout.json` stations × `mockups/manifest.json` entries. Find: zones with empty `activities`, stations with no mockup, stations whose `icon` doesn't match the inline-SVG library, briefing rendering that swallows long Arabic strings, any "Dar Al-Saeed" / "السعيد" regression. Output a content delta report.

Synthesize the three reports into `state.md` under a "Phase 0 — baseline" heading. No code changes this firing.

**Gate:** state log has the baseline, three audit punch-lists are present, screenshots saved to `outputs/.../map/simulation/v3-audit-*.png`.

---

### Phase 1 — Higher-fidelity painted background + avatar (Firing #1 or #2, ~40 min)

**Goal:** retire the 1024×1024 bg + the V2 pixel-sprite avatar. Land a 2048×2048 painted bg and a painterly avatar that matches the Disco-Elysium register.

1. **Painted bg regen at 2048×2048.** Extend [tools/bootcamp-scout/generate_venue_background.py](tools/bootcamp-scout/generate_venue_background.py) to request 2048×2048 native output (Gemini 3 Pro Image; if model caps at 1024, generate at 1024 and upscale via Real-ESRGAN x2 via a Pillow + Replicate fallback OR via Topaz Photo AI if installed; otherwise stay at 1024 and document). Refine the Disco prompt with the user's feedback now baked in (no longer needs cutaway since briefings show interiors).
2. **Painterly avatar.** New `generate_avatar.py` tool: ask Gemini Pro Image for 4 walk-cycle frames × 4 directions (top-down view, painterly Disco-Elysium register, neutral utility wear, no facial detail, holding a small clipboard or camera-bag silhouette to fit "scout" identity). Sheet layout matches the existing `avatar-frames.json` (24×32 frames, 4 cols × 4 rows). If Gemini won't produce a coherent sheet, fall back to 4 separate idle images, one per direction, with no walk animation — still a visual win over the V2 pixel sprite.
3. **Wire** the new bg + new avatar PNGs into `simulation/index.html` (file paths in layout.json + the avatar `background-image` rule). Re-run station coords against the new bg — if Gemini gave back a slightly different composition, re-author the affected stations.

**Gate:** screenshots at 3 viewports compared against Phase 0 baseline. Console errors = 0. Avatar walks across the bg without z-fighting the station icons.

---

### Phase 2 — Walkable-mask pathfinding (Firing #2, ~40 min)

**Goal:** avatar respects walls, trees, and walled-garden boundaries on the painted bg. No more walking through stone walls.

1. **Derive a candidate mask** from the painted bg luminance via Pillow: `assets/venue/venue_walkable_v1.png` 1024×1024 alpha (paths/grass/courtyard light areas → 255, walls/foliage dark areas → 0). Threshold at L=120 then dilate 3 px to smooth.
2. **Headless-only refinement** — the manual Preview/Pixelmator touch-up step is NOT possible overnight. Instead: (a) iterate threshold + morphological ops in Pillow (try L=110/120/130, dilate 2/3/5 px, erode 1 px) and pick the variant with the highest courtyard-coverage + lowest wall-bleed via a Playwright probe that samples 12 known-walkable and 12 known-blocked coords from layout.json; (b) save the chosen mask. Queue "manual mask polish in Pixelmator" as a follow-up in the state log for awake review. Don't try to hand-paint.
3. **Sample-on-move** in the simulation JS: load the mask as an off-screen `<canvas>`, read `getImageData(x*1024/100, y*1024/100, 1, 1).data[3]` per movement-frame, allow move only if alpha > 200. Implement axis-only fallback (already in V2) for slide-along-edge.
4. **Hotspot teleport ignores the mask** — clicking a station icon still teleports through walls (intended).
5. **Safety net** — if the auto-mask scores below 70% probe accuracy after 3 threshold variants, DON'T ship a half-broken collision system. Keep walkable = full canvas (V3 round 1 behavior), log the failure in the state log, mark Phase 2 as "partial: collision deferred to manual polish."

**Gate:** Playwright test holds Right for 5 s starting from the courtyard; assert avatar doesn't cross any of 6 hand-picked wall coordinates. Visual screenshot showing walkable-mask debug-overlay (only in `?debug=walkable` mode).

---

### Phase 3 — Camera + zoom + mobile gestures (Firing #2 or #3, ~30 min)

**Goal:** the game scales gracefully across desktop / tablet / mobile, and the user can zoom in for detail.

1. **Smooth camera follow** option (toggle, default on) — when avatar approaches the outer 20% of the viewport, smoothly pan the canvas. Otherwise stay centered.
2. **Pinch-to-zoom** on mobile + mouse-wheel zoom on desktop. Min 1.0×, max 2.5×. Persist last zoom in localStorage.
3. **Click on mini-map = fast travel** — clicking a dot on the mini-map teleports the avatar to that station (same animation as icon click).
4. **Onboarding overlay** — first-time visitors (no localStorage flag) see a 3-step coachmark: "WASD or click to walk → click a station to fast-travel → press N to drop a note". Dismissible with ✕, never shown again. Persisted as `kawader_sim_onboarded_v3`.

**Gate:** Playwright on 3 viewports asserts: zoom-in increases the rendered canvas size, mini-map click teleports, onboarding shows on first visit and is gone on second.

---

### Phase 4 — Sound design + ambient (Firing #3, ~30 min)

**Goal:** subtle audio bed + UI sound effects make the game feel alive without being noisy.

1. **Ambient bed** — pick one CC0/CC-BY ambient field-recording from Freesound (olive grove + distant Birzeit village hum). License + attribution at `assets/audio/CREDITS.md`. Loop seamlessly via WebAudio gainNode crossfade.
2. **UI SFX (CC0 from Kenney.nl Game Audio):** footstep cycle (4 alternating samples, gated to avatar moving), station-icon-hover blip, station-click teleport whoosh, briefing-open click, briefing-close click, mission-ribbon chime. ~6 short MP3/OGG files.
3. **Mute toggle** in the HUD (musical-note glyph). Default-on for desktop, default-muted for mobile (to respect autoplay policies). Persisted as `kawader_sim_audio_v3`.
4. **Volume cap** — ambient at 0.25, SFX at 0.5. Never blast.

**Gate:** Playwright + audio output mock: assert 0 console errors related to audio, mute toggle persists, ambient loops without seam (test by sampling currentTime around the loop boundary).

---

### Phase 5 — Content fill: discovery stations + EN/AR pass (Firing #3 or #4, ~40 min)

**Goal:** the 11 discovery stations stop feeling like dim leftovers. Every station has at least scout-photos + a 1-paragraph summary + Arabic title.

1. For each discovery station, verify `data.json` has `title_en`, `summary`, ≥1 photo, ≥1 activity. Where missing, generate ONLY the **English** summary + activity bullets via Gemini 2.5 Pro text using existing zone descriptions. **Do NOT machine-translate Arabic body copy overnight** — unsupervised Arabic regresses (user has corrected venue naming 4+ times). For `title_ar`, use only values already present in the existing data.json or the V3 layout.json `label_ar` field; if missing, leave as empty string and queue "Arabic title sweep" as a follow-up for awake review.
2. Briefing pane re-renders to handle no-mockup discovery zones cleanly: hides the workshop-grid section, shows the scout photos + activity bullet list + creative note at the same visual weight as primary stations (just no painted mockup cards).
3. Activities language is "ideas / explorations", not "scheduled events", everywhere (V3 Phase 6 already did the user-visible pass; now do data.json content too).
4. **Bilingual hover labels on discovery stations** — `data-label-en` + `data-label-ar` (AR pulled from existing layout.json, not invented); HUD waypoint indicator shows EN by default, swaps to AR when document.dir or user language is Arabic. If a station has no existing AR label, fall back to EN gracefully (don't synthesize one).

**Gate:** all 18 stations have non-empty briefings on a fresh-localStorage visit. Playwright clicks each station in sequence, asserts briefing has ≥1 photo + ≥1 activity + Arabic title. Zero stations with empty `activities[]`.

---

### Phase 6 — A11y + keyboard nav (Firing #4, ~30 min)

**Goal:** the game is operable with keyboard only and screen reader narrates the scene.

1. **Tab through stations** — each `.station` div gets `tabindex="0"` + a `keydown` Enter/Space handler that triggers `teleportToStation(id)`. Tab order: WP-01 → WP-18.
2. **ARIA labels** — every station has `aria-label="WP-NN ${label}, tier ${tier}, ${visited ? 'visited' : 'unvisited'}"`. Briefing pane has `aria-live="polite"` on the heading.
3. **Reduced motion** — respect `@media (prefers-reduced-motion: reduce)`: teleport snaps instead of animating, halo-pulse stops, ribbon-in is instant. Walk animation still runs (it's needed for user feedback).
4. **High-contrast mode** — `@media (prefers-contrast: more)`: thicker borders, brighter amber, white avatar outline.
5. **Lighthouse audit** — run via `npx lighthouse https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/ --view --output html --output-path /tmp/sim-v3-lh.html`. Target: a11y ≥ 95, perf ≥ 85, best-practices = 100. Fix anything that drops below.

**Gate:** Lighthouse a11y ≥ 95 on the live URL. Playwright keyboard-only run: tab through 18 stations, hit Enter on WP-06, asserts briefing opens.

---

### Phase 7 — Performance + asset pipeline (Firing #4 or #5, ~30 min)

**Goal:** first-paint < 2 s on desktop, < 3 s on mid-tier mobile. Painted bg + mockups load efficiently.

1. **Image format** — convert `venue_painted_v1.jpg` to WebP (Pillow `.save(format='webp', quality=82)`). Serve via `<picture>` with JPG fallback. Same for all 27 mockup cards.
2. **Lazy-load** — mockup cards already `loading="lazy"`; verify discovery-station mini-icons + minimap dots are not painted off-screen until needed.
3. **Preload** — `<link rel="preload" as="image" href="venue_painted_v1.webp">` so the painted bg paints alongside the HTML.
4. **Bundle audit** — confirm single HTML file < 80 KB gzipped. Inline-SVG icons stay inline (small enough). No external libs added overnight.
5. **CDN cache headers** — verify via `curl -sI` that the bg + mockups have `cache-control: public, max-age=...` (Cloudflare Pages handles this; just confirm).

**Gate:** Lighthouse perf ≥ 85, LCP < 2.5 s, total page weight < 4 MB.

---

### Phase 8 — Final visual polish + easter eggs (Firing #5, ~30 min)

**Goal:** the surprise-and-delight pass.

1. **Time-of-day tint** — bg `filter: hue-rotate / sepia / brightness` shifts based on local time at the venue (Jerusalem TZ): morning = neutral, golden hour = warm sepia, night = cool blue dim. Optional toggle in HUD (☀ / 🌙 / 🌅) overrides auto.
2. **Particle layer** — 3–5 subtle dust-mote sprites drifting across the bg, parallax with avatar movement. CSS animations, ~0 perf cost.
3. **Easter eggs** — Konami code (↑↑↓↓←→←→BA) drops the user a "GHOST MODE" toggle (avatar leaves a 5-frame trail). Clicking the WP-01 luthier icon 5 times triggers a one-time chime + amber pulse on every primary station ("scout's chord struck").
4. **URL hash state** — `#zone=z06` opens the briefing for that zone on page load. Useful for sharing.
5. **Per-station spawn presets** — `#spawn=z06` puts the avatar at that station on first load. Useful for stakeholder demos.

**Gate:** Playwright asserts each easter egg, URL hash state, time-of-day shift visible at 3 sample times (mock `Date.now()`).

---

### Phase 9 — Final verification + deploy (last firing, ~20 min)

**Goal:** comprehensive smoke + screenshot diff + production deploy + state log close-out.

1. Run `/tmp/sim-v3-smoke.py` (extended with every assertion accumulated across phases). All green.
2. Lighthouse run on live URL post-deploy: perf ≥ 85, a11y ≥ 95, best-practices = 100, SEO ≥ 85.
3. Final screenshot suite: 3 viewports × 4 states (idle / hover / briefing / time-of-day-night) = 12 PNGs into `simulation/v3-final-*.png`.
4. `rsync` simulation/ + assets/venue/ + assets/audio/ + assets/mockups/ → `docs/bootcamp-scout/edward-said/...`.
5. `wrangler pages deploy docs/ --project-name kawasist-internal`.
6. `curl -sI` the canonical URL + 4 sampled assets → all 200.
7. State log close-out: "FIRING #N COMPLETE — V3 round 2 shipped". Final summary block listing every phase outcome with deploy ID.
8. Update STATUS.md current focus + next actions.
9. Append a Session 10 block to `notes/daily/2026-05-13.md` (will exist by then).

---

## State log convention

**Path:** `.planning/handoff/2026-05-12-bootcamp-v3-overnight-state.md`

**First firing creates it with:**

```markdown
---
type: handoff-state
created: <ISO timestamp>
plan: .planning/handoff/2026-05-12-bootcamp-v3-overnight-go-ham.md
live_url: https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/
---

# V3 Overnight Improvement Run — State Log

## Phase status

- [ ] Phase 0 — Audit + baseline
- [ ] Phase 1 — Higher-fidelity bg + avatar
- [ ] Phase 2 — Walkable-mask pathfinding
- [ ] Phase 3 — Camera + zoom + gestures
- [ ] Phase 4 — Sound design + ambient
- [ ] Phase 5 — Content fill + EN/AR pass
- [ ] Phase 6 — A11y + keyboard nav
- [ ] Phase 7 — Perf + asset pipeline
- [ ] Phase 8 — Polish + easter eggs
- [ ] Phase 9 — Final verify + deploy

## Cost tracker

- Gemini Pro Image: $0.00
- Gemini Flash: $0.00
- Wrangler deploys: 0

---

## FIRING #1 — <ISO timestamp>

(append phase output here as each one completes)
```

**Each subsequent firing appends:**

```markdown
---

## FIRING #N — <ISO timestamp>

### Read state, picked up at: Phase X

### Phase X — <name>

- What was done (specific files + line refs)
- Verification gate result (pass/fail, screenshot paths, smoke output)
- Cost delta (images generated, API spend if available)
- Blockers if any (DO NOT SKIP — stop cleanly and log)

### Marked complete: [x] Phase X

### Next firing should: pick up at Phase X+1
```

---

## Cron schedule recommendation

Below assumes a 22:30 first-firing start. Each firing is given ~60 min of clock time but expected to complete in 30–45 min of real work. Cron via `/schedule` skill:

| Firing | Time     | Wall-clock | Phases targeted |
|-------:|----------|-----------:|----------------------------------------|
|     #1 | 22:45    |     60 min | Phase 0 audit + Phase 1 bg/avatar gen  |
|     #2 | 00:00    |     75 min | Phase 1 wire + Phase 2 walkable mask   |
|     #3 | 01:30    |     75 min | Phase 3 camera + Phase 4 audio         |
|     #4 | 03:15    |     75 min | Phase 5 content fill + Phase 6 a11y    |
|     #5 | 05:00    |     75 min | Phase 7 perf + Phase 8 polish          |
|     #6 | 06:30    |     45 min | Phase 9 final verify + deploy + STATUS |

Total estimated wall-clock: 22:45 → 07:15 = ~8.5 hours, 6 firings. If a firing finishes early it will simply stop and wait for the next. If a phase runs long, the cron after it should pick up where it stopped (state log is the source of truth).

**To set up the schedule, the user pastes (from any session):**

```
/schedule create overnight-bootcamp-v3 "Read .planning/handoff/2026-05-12-bootcamp-v3-overnight-go-ham.md and execute the next pending phase from the state log. Stop cleanly when the firing budget is exhausted." cron "45 22,*/90 12 5 *"
```

(Or simply 6 one-shot scheduled runs at the times above — `/schedule` supports both. Whichever the user prefers.)

---

## Skills the agent must invoke during this run

In order of typical use:

- `superpowers:using-superpowers` — already auto-loaded at session start.
- `superpowers:brainstorming` — before Phase 0 audit, to frame what "go ham" means concretely.
- `superpowers:dispatching-parallel-agents` — for Phase 0 (3 audits in parallel), Phase 1 (bg + avatar in parallel), Phase 5 (per-zone content fill).
- `superpowers:writing-plans` — to upgrade this handoff into a concrete written plan if a phase needs detail beyond what's here.
- `superpowers:test-driven-development` — before any new mechanic (walkable mask sample, camera zoom). Write the Playwright assertion FIRST.
- `superpowers:systematic-debugging` — for any bug encountered (the V2 ESC-after-blur quirk was solved this way; same pattern).
- `superpowers:verification-before-completion` — before marking ANY phase complete in the state log.
- `superpowers:requesting-code-review` — at Phase 9 before deploy, run an adversarial code review against the merged delta.
- `superpowers:finishing-a-development-branch` — at session end, decide commit / push / leave-uncommitted.

If you find yourself NOT invoking the relevant superpower, stop, read its description, and use it.

---

## Hard rules the agent must follow

1. **Prod is untouched.** All work lands on `kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/` only. Never touch `www.kawader-cine.com` or `kawader-cine1.odoo.com`.
2. **No new external libraries.** No Phaser, no Pixi, no Lottie, no Three.js. Pure DOM/CSS/inline-SVG + the existing stack. The only fetch-from-CDN allowed is the Lucide-style inline icon library expansions if the existing one runs short — and even then, inline the SVG, don't link a CDN.
3. **Image-gen via Gemini, not Higgsfield.** See [feedback_image-gen-gemini-not-higgsfield.md](.claude/projects/-Users-Kawader-KAWASIST/memory/feedback_image-gen-gemini-not-higgsfield.md). Use `GOOGLE_API_KEY="$(grep ^GEMINI_API_KEY= .env | cut -d= -f2-)" python3 …` to bypass the stale shell env (the shell `GOOGLE_API_KEY` is expired; the renewed key lives in `.env` as `GEMINI_API_KEY`).
4. **Naming rule:** the venue is always **Edward Said Cultural Institute** / **Edward Said**. Never "Dar Al-Saeed" / "السعيد". Enforced via [feedback_venue-naming-edward-said.md](.claude/projects/-Users-Kawader-KAWASIST/memory/feedback_venue-naming-edward-said.md). User has corrected this 4+ times.
5. **Plan mode for any phase whose scope is unclear.** If a phase reveals a fork (e.g. "should the walkable mask use luminance or a hand-painted JSON of polygons?"), enter plan mode, write the choice to the state log, ask the user via AskUserQuestion if blocked, then proceed.
6. **Atomic commits per phase** are nice-to-have but not required overnight. The state log is the source of truth for what's done.
7. **If a phase fails its gate twice**, STOP. Write a `### BLOCKED — needs user` block to the state log with the failure mode and what was tried. The next firing reads this and either retries with a fixed approach or escalates.

---

## Existing files the agent should know about

**Live game:**
- [outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html](outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html) — V3 simulation (1447 lines pure DOM/CSS over painted bg).
- [outputs/kawader-bootcamp/scout-2026-05-11/map/assets/venue/venue_painted_v1.jpg](outputs/kawader-bootcamp/scout-2026-05-11/map/assets/venue/venue_painted_v1.jpg) — current Disco-Elysium-painted bg (1024×1024).
- [outputs/kawader-bootcamp/scout-2026-05-11/map/assets/venue/layout.json](outputs/kawader-bootcamp/scout-2026-05-11/map/assets/venue/layout.json) — 18 station coords + tiers + icons.
- [outputs/kawader-bootcamp/scout-2026-05-11/map/assets/venue/candidates/](outputs/kawader-bootcamp/scout-2026-05-11/map/assets/venue/candidates/) — 4 alternate painted-bg candidates.
- [outputs/kawader-bootcamp/scout-2026-05-11/map/assets/mockups/manifest.json](outputs/kawader-bootcamp/scout-2026-05-11/map/assets/mockups/manifest.json) — 27 painted briefing cards.
- [outputs/kawader-bootcamp/scout-2026-05-11/map/assets/data.json](outputs/kawader-bootcamp/scout-2026-05-11/map/assets/data.json) — 18 zones with photos/activities/themes.

**Tools:**
- [tools/bootcamp-scout/generate_venue_background.py](tools/bootcamp-scout/generate_venue_background.py) — 4-variant Gemini Pro Image bg generator (extend for Phase 1).
- [tools/bootcamp-scout/generate_mockups.py](tools/bootcamp-scout/generate_mockups.py) — Gemini Flash Image mockup batch (reference for Phase 1 avatar generator pattern).

**Plan + memory:**
- `~/.claude/plans/claude-plans-its-broken-review-the-star-wise-lark.md` — V3 plan file (V2 content already overwritten). Read for V3 round 1 history.
- [feedback_image-gen-gemini-not-higgsfield.md](.claude/projects/-Users-Kawader-KAWASIST/memory/feedback_image-gen-gemini-not-higgsfield.md)
- [feedback_venue-naming-edward-said.md](.claude/projects/-Users-Kawader-KAWASIST/memory/feedback_venue-naming-edward-said.md)
- [feedback_plan_mode.md](.claude/projects/-Users-Kawader-KAWASIST/memory/feedback_plan_mode.md) — plan-mode discipline (no side-effects, user pushback = STOP).
- [feedback_superpowers-chain.md](.claude/projects/-Users-Kawader-KAWASIST/memory/feedback_superpowers-chain.md) — run the chain end-to-end.

**Deploy:**
- `rsync outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/ docs/bootcamp-scout/edward-said/simulation/`
- `rsync outputs/kawader-bootcamp/scout-2026-05-11/map/assets/venue/ docs/bootcamp-scout/edward-said/assets/venue/`
- `wrangler pages deploy docs/ --project-name kawasist-internal`

---

## Out of scope (don't try to do these overnight)

- Multi-user / real-time presence (Liveblocks/Yjs).
- Full WebGL / 3D rendering.
- Live multi-player game features.
- Voice narration of briefings.
- Authentication / per-user state beyond localStorage.
- Backend / database.
- Moving any of this to `www.kawader-cine.com`.

---

## End-of-run report shape (Phase 9)

Final state-log block should match this template:

```markdown
## FIRING #N — V3 OVERNIGHT COMPLETE — <ISO timestamp>

### Deploy
- Canonical URL: https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/
- Deploy ID: <id>.kawasist-internal.pages.dev
- HTTP 200 on: canonical, painted_bg, layout.json, walkable_mask, mockup manifest, audio bed

### Phases shipped (10/10)
- [x] Phase 0 audit · screenshots at v3-audit-*.png
- [x] Phase 1 bg + avatar · regenerated assets at …
- [x] Phase 2 walkable mask · venue_walkable_v1.png
- … etc

### Lighthouse
- Perf X · A11y Y · Best-Practices Z · SEO W

### Cost
- Gemini Pro Image: $X.XX (N images)
- Gemini Flash: $X.XX (M images)
- Wrangler deploys: K

### What changed for the user
- 5–7 bullets describing the user-visible delta vs V3 round 1

### Pending follow-ups
- Anything the agent flagged but didn't action (with a recommendation each)

### Recommended next session
- One-line.
```

This block is what the user reads first when they wake up.
