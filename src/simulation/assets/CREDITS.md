# Simulation assets — credits

## Avatar walk-cycle sprite

- **File:** `avatar.png` (192 × 128 px, 6 cols × 4 rows of 32 × 32 frames)
- **Source:** [OpenGameArt — "2D RPG Character Walk Spritesheet"](https://opengameart.org/content/2d-rpg-character-walk-spritesheet)
- **Direct URL:** https://opengameart.org/sites/default/files/rpg_sprite_walk.png
- **License:** CC-BY 4.0 and CC0 (dual-licensed by uploader). Used here under CC0.
- **Author:** uploaded to OpenGameArt — see asset page for attribution.
- **Date imported:** 2026-05-11

### Frame layout

The sheet has 6 frames per direction (a 6-frame walk cycle). Frame map in `avatar-frames.json`. Row order assumed: `up, right, down, left` from top to bottom. If a direction looks wrong on screen, edit `avatar-frames.json:rows` and reload — no code change needed.

### Follow-up

A KAWADER-branded sprite (matching the bootcamp visual identity) is a v2.1 task. Until then this CC0 placeholder is fine for internal use.

## Tile maps

Same Esri World Imagery / OpenStreetMap tile sources as the main map (see main `index.html`). Tile licenses honored via attribution control.

## Ambient audio bed

- **File:** `audio/ambient/ambient_bed.mp3` (12 s mono, 48 kbps, ~72 KB)
- **Source:** Procedurally generated locally via ffmpeg (three-voice sine pad — fundamental 82.5 Hz + 110 Hz + 165 Hz, soft tremolo 0.3 Hz / depth 0.25, loudness-normalised to -26 LUFS, 0.6 s in/out fades).
- **License:** CC0 — Public Domain. The waveform is a deterministic procedural mix of pure sine tones; under U.S. and EU copyright doctrine, a synthesised waveform with no human-authored melodic, lyrical, or arrangement content is not eligible for copyright. Released by KAWASIST as CC0 in any case.
- **Why procedural and not the original Kenney pick:** Kenney's CC0 audio packs (Music Loops, Music Jingles, RPG Audio, Sci-Fi Sounds) were surveyed during Round 4 polish; the loop-friendly tracks are either too short (jingles) or too varied (preview reels) to function as a quiet background bed. The procedural pad was authorised in the spec's "fallback" path: `docs/superpowers/specs/2026-05-14-bootcamp-polish-design.md`.
- **Build command:** see `docs/superpowers/plans/2026-05-14-bootcamp-polish.md` task D.1 (ffmpeg lavfi pipeline with `amix → tremolo → afade → loudnorm`).
- **Date imported:** 2026-05-14
- **Used as:** quiet ambient loop under the simulation HUD, base volume 0.18, ducked to 0.10 for 180 ms around each footstep, off when the audio mute toggle is engaged or `prefers-reduced-motion: reduce` is set on first visit.
