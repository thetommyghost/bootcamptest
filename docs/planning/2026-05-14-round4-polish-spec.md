---
title: Bootcamp Scout V3 — Round 4 Polish (4 deferred items)
date: 2026-05-14
status: approved-by-user-via-prompt
source-prompt: "Overnight Session 8 — Bootcamp V3 Polish Leftovers"
live-url: https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/
---

# Bootcamp Scout V3 — Round 4 Polish

User has pre-authorized scope in the session prompt and told me not to ask clarifying questions, so this spec is a structured restatement of that prompt with my own implementation choices locked in. Each section has a single chosen approach (no A/B alternatives to debate) plus an acceptance gate.

## Goal

Ship the 4 deferred polish items from Round 2/3 to the live simulation. End state is one deploy of the existing `kawasist-internal` Cloudflare Pages project with all four items live, Lighthouse green, page weight under 1 MB.

## Hard constraints (carried forward verbatim from prompt)

- Single HTML file. No new JS framework or build step.
- Page weight ≤ 1 MB total after all four items land.
- Lighthouse desktop preset: perf ≥ 90, a11y = 100, best-practices = 100, SEO = 100.
- `prefers-reduced-motion` respected for B + C + D.
- Cloudflare Pages deploy goes to the existing `kawasist-internal` project. No new project.
- Out-of-scope: WhatsApp bot, Odoo, gear-talk, anything outside `outputs/kawader-bootcamp/scout-2026-05-11/`.
- One commit per polish item on `feature/whatsapp-bot-botA-gate`. No push.
- CC0 audio attribution lands in a CREDITS file.

## Ship order

A → B → C → D. Reasoning:

- A (pinch-zoom + camera-follow) is the only structural change to the canvas event surface. Land it first so B/C/D layer on top without re-wiring touch handlers.
- B (Konami / Director Mode) is purely additive UI overlay and depends on nothing.
- C (teleport particles) is purely additive `<canvas>` work and depends on nothing.
- D (ambient bed) requires network fetch (Kenney CC0) and is the biggest weight risk. Land last so it can be cut/swapped without unblocking A/B/C if Lighthouse drops.

## Item A — Mobile pinch-zoom + camera-follow

**Problem.** On mobile (~375 px wide) only ~7 of 18 stations fit on the canvas viewport. Round 2 deferred a proper fit. Round 3's "partial pinch-zoom mitigation" only removed `user-scalable=no`, which lets the browser zoom the whole page rather than zoom the canvas.

**Approach.**

1. Add a CSS `transform: scale()` layer on `.scout-canvas-wrap` (the canvas container, not the canvas itself, so the avatar / pins / overlays all scale together). Default scale = 1.0. State held in JS: `viewState = { scale, panX, panY }`.
2. Touch handlers on the canvas wrap:
   - 2-finger pinch → adjust `scale` by `currentPinchDistance / startPinchDistance`. Clamp to `[1.0, 3.0]`.
   - 2-finger drag (pinch in progress) → adjust `panX/panY` by midpoint delta.
   - 1-finger touch is left alone (existing tap-to-teleport stays as-is).
3. Camera-follow: when avatar's screen-space position falls inside the outer 12% margin of the viewport AND `scale > 1.05`, smoothly ease `panX/panY` (lerp 0.12 per frame) so the avatar stays in the inner 76% of the visible area. Disabled at `scale ≈ 1.0` to avoid jitter at the default zoom.
4. Pointer Events API (not TouchEvent) for cross-platform consistency. Use `pointerType === 'touch'` to gate.
5. Mouse / desktop stays untouched — no wheel-zoom, no drag-pan. (Out of scope per prompt.)

**Acceptance.**

- iPhone 12/13 preset (390×844) in Playwright: pinch-out doubles the scale, station tiles visible count goes from ~7 to ~13+ without any new horizontal scroll bar on the page.
- WASD-walk near right edge of viewport at scale 2.0: camera follows so avatar never crosses the rightmost 12% of viewport.
- Desktop behavior unchanged: drag/wheel do nothing, click teleport unchanged.
- No new console errors. `<meta viewport>` keeps `user-scalable=no` so OS-level page zoom doesn't double-zoom on top.

## Item B — Konami code → Director Mode

**Problem.** Round 2 left a "Konami easter egg" as TBD. Need a tasteful payoff, not a meme.

**Approach.** Sequence `↑ ↑ ↓ ↓ ← → ← → B A` toggles a "Director Mode" overlay that exposes the data scout-staff actually want when reviewing a recording of the simulation:

1. Top-right HUD pill labelled `DIRECTOR` (cyan, faint) appears.
2. Avatar always renders an outline showing current world coordinates as `x,y px / (gx,gy) tile` in a small DOM badge that follows the avatar.
3. The walkable-mask PNG is overlaid on the canvas at 35% opacity so collision boundaries are visible (Round 3 disabled collision, but the mask is still loaded — we just paint it for diagnostic value).
4. Each note pin gets a small numeric badge showing its zone slug.
5. Press the same Konami sequence again to toggle off. Page reload resets to off.
6. The mode is invisible to anyone who doesn't enter the code. Zero impact on default load.

**Acceptance.**

- Default page load: no `DIRECTOR` pill in DOM (or pill is `aria-hidden="true"` and `display:none`).
- After Konami sequence: pill appears, avatar coord badge appears, mask overlay paints, zone slugs on pins.
- Sequence again: clean teardown, no leftover DOM nodes, no console errors.
- `prefers-reduced-motion`: badge / pill use no animation. (Already CSS-static by default.)
- Sequence buffer is forgiving: out-of-order key resets the buffer; the user can retry without reloading.

## Item C — Particle FX on teleport

**Problem.** Round 2 deferred a small confetti-like burst when the avatar teleports to a zone.

**Approach.** A second `<canvas class="fx-canvas">` layered on top of the avatar/world canvas, same size, `pointer-events: none`. On every `teleportTo(zone)` call:

1. Spawn 22 particles at the destination point.
2. Each particle: random unit-circle velocity × `[40..110] px/s`, random size `[2..4] px`, hue picked from a 4-color brand-aligned palette (amber, cyan, off-white, charcoal). Gravity-free (settle into outward fade).
3. Each particle has lifespan 600 ms with easing: position lerps outward, opacity fades from 0.9 → 0 on a quad-out curve.
4. rAF loop runs only while particles exist; clears canvas + cancels on empty array. No constant compositing.
5. `prefers-reduced-motion: reduce` → spawn 0 particles, fall through to existing instant teleport behaviour.

**Acceptance.**

- Each `teleportTo()` paints a visible burst at the destination for 600 ms.
- Page idle (no teleport) → no rAF activity attributable to FX (verify in Performance tab: no recurring tasks beyond Round 3 baseline).
- Reduced-motion enabled → no burst, no particles, no rAF wakeups.
- Mobile: same behaviour, no jank when fired during pinch-zoom.

## Item D — Ambient audio bed

**Problem.** Round 3 explicitly carried forward "drop CC0 olive-grove track at `assets/audio/ambient_bed.mp3` for wiring." The mute toggle and footstep/teleport SFX system already exist and work.

**Approach.**

1. **Source.** Pull one short loop from Kenney's CC0 audio packs. Kenney audio packs are uniformly CC0; the canonical pack URL is `https://kenney.nl/assets`. We will not call the audio "olive-grove" since Kenney doesn't ship a literal olive-grove field recording. Instead, pick a **soft mellow / ambience loop** from the "Music Loops" or "Sci-Fi Sounds" pack that reads as neutral background bed (low-energy synth pad / wind layer). Single MP3, target ≤ 80 KB at 96 kbps mono / 30 s loop. The total page weight headroom after Round 3 is ~880 KB so this is well within budget.
2. **Wiring.** Reuse the existing `AUDIO_SOURCES` + `playSfx()` system in [index.html:1410-1450](outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html#L1410). Add an `ambient_bed` entry that loops via `HTMLAudioElement.loop = true` at base volume 0.18 (significantly under footstep 0.32 / hover 0.25). Start playback inside the same gesture-gated init flow that footsteps use, so autoplay-policy stays happy.
3. **Mute toggle.** Existing `♪/♪̸` mute button already mutes all SFX. Hook `ambient_bed` into the same mute set. When mute is on, `ambient_bed.pause()` + record desired-play state, so unmuting resumes correctly.
4. **Cross-fade with footsteps.** When a footstep plays, briefly duck `ambient_bed.volume` from 0.18 → 0.10 over 80 ms, hold during the footstep, ramp back over 220 ms. Implementation: track `duckUntil` timestamp; rAF loop in the existing audio block applies the ramp. (One rAF, cheap.)
5. **Reduced-motion.** Reduced-motion is for visual, not audio, but for courtesy we also respect `prefers-reduced-motion: reduce` by **starting ambient muted by default**. User can manually unmute via the existing button. This satisfies the prompt constraint.
6. **CREDITS.** Append a "## Ambient audio" section to the existing [assets/CREDITS.md](outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/CREDITS.md) and mirror to `audio-credits.md` in the polish output dir.

**Acceptance.**

- Page loads → ambient bed audible at low volume (or muted if mobile / reduced-motion default).
- Mute toggle stops/restarts ambient.
- Walking → footsteps audible above ambient with no clipping or audible pumping.
- CREDITS line names the Kenney pack + URL + CC0 declaration.
- Final MP3 ≤ 80 KB; total page weight ≤ 1 MB.

## Closeout

- Per item: commit on `feature/whatsapp-bot-botA-gate` (do NOT push).
- After D: rsync `outputs/.../simulation/index.html` to `docs/bootcamp-scout/edward-said/simulation/index.html`. Add the audio file to `docs/bootcamp-scout/edward-said/simulation/assets/audio/ambient/`.
- Single Wrangler deploy: `wrangler pages deploy docs/ --project-name kawasist-internal --commit-dirty=true`.
- Final Lighthouse against the live URL, save JSON to `outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/lighthouse-after.json`.
- `MORNING-REPORT.md` per the prompt template.
- `PushNotification` call at the very end with per-item verdicts + live URL.

## Out of scope (explicit)

- Round 3 follow-ups: mobile canvas sizing beyond pinch-zoom, discovery-station mockups, painterly avatar, RTL toggle. None of these are touched.
- Production sites, Odoo, WhatsApp bot, gear-talk. None of these are touched.
- Code refactors of the Round 3 movement engine, notes backend, or briefing UI. None of these are touched.

## Risks + scope cuts in priority order

If anything is going to blow the 90-min-per-item budget, cut in this order (highest first):

1. **D's cross-fade duck.** Drop to a flat ambient volume. Acceptance still passes minus the cross-fade line.
2. **A's camera-follow.** Ship pinch-zoom alone; pan stays at user's last 2-finger drag.
3. **B's mask overlay.** Director Mode keeps the coord badge + zone slugs but skips the walkable-mask paint.
4. **C's palette.** Drop to a single brand color (amber) instead of 4-color.

Items A and D are the only items that touch shared state (camera transform / audio system). B and C are leaf features. If a leaf feature won't ship cleanly inside 90 min, cut the whole item and document in MORNING-REPORT as "🟡 partial" or "🔴 reverted".
