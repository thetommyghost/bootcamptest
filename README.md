# kawader-bootcamp-app

KAWADER Bootcamp 2026 — an interactive map, a scouting tool, and (work in progress) the **in-camp app** participants and team will use throughout the August 2026 camp at the Edward Said Cultural Institute in Birzeit.

## Where we are

What's in this repo today is a polished foundation: a satellite map and a canvas-based venue twin with shared notes. It works, it's accessible, it ships at Lighthouse 99 / 96 / 100 / 100. But it's a **scouting tool**. The next chapter is turning it into the tool a camper opens on their phone every day in August, the tool a mentor uses to see where the cohort is at, the tool that becomes the camper's portfolio at the end.

The trainee picking this up is a collaborator on that next chapter, not a maintainer of what already exists.

## Live URLs

| | |
|---|---|
| **Production (current scouting tool)** | https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/ |
| **This project's staging** | https://kawader-bootcamp-app.pages.dev (provisioned 2026-05-22, deploys from `main`) |
| **GitHub repo** | https://github.com/management-art/kawader-bootcamp-app |
| **Notion brief** | https://www.notion.so/Bootcamp-Interactive-Map-Game-Trainee-Handoff-368ce6a70d69812c8469c77369784236 |

## What this folder is

A self-contained, git-initialized working copy of the project. ~86 MB on disk (assets included so it runs offline with zero setup). Everything you need to read, run, modify, and deploy.

| Path | What |
|---|---|
| `src/map/index.html` | Leaflet satellite map with 18 zones + 86 photos |
| `src/simulation/index.html` | Canvas-based venue twin (walk around with WASD, drop notes) |
| `assets/` | Photos, mockups, satellite tiles, venue art, audio |
| `functions/api/notes/index.js` | Cloudflare Pages Function (shared notes API) |
| `tools/bootcamp-scout/` | Python helpers (regenerate venue background, mockups) |
| `tests/smoke.mjs` | Playwright skeleton |
| `docs/` | Project intelligence (read these) |
| `AGENTS.md` | Brief for any AI coding agent opened on the repo |

## Where to go in the docs

| File | When |
|---|---|
| `AGENTS.md` | Opening the repo in OpenCode or another AI editor. Sets up the agent. |
| `docs/directions.md` | Thinking about what to build next. The creative-space doc. |
| `docs/anchor-tasks.md` | Want a concrete thing to chew on while you find your footing. |
| `docs/architecture.md` | How map + simulation + notes fit together today. |
| `docs/gotchas.md` | Before touching the avatar walk cycle or anything sprite-related. |
| `docs/deployment.md` | How the existing Cloudflare project + KV are wired. |
| `docs/notes-schema.md` | The API shape if you're extending the notes layer. |
| `docs/planning/` | Original v1 → v3 R4 planning archive. Historical context. |

## Quick start

```bash
git clone https://github.com/management-art/kawader-bootcamp-app.git
cd kawader-bootcamp-app
python3 -m http.server 8765
open http://127.0.0.1:8765/src/simulation/index.html
```

Walk around with WASD. Click waypoints to teleport. Press `N` to drop a note.

> Local notes save to `localStorage` only. The Cloudflare KV sync only kicks in when running on the live URL.

## Deploying

```bash
npm install
npx wrangler login        # one-time, opens browser
npm run deploy            # = wrangler pages deploy . --project-name kawader-bootcamp-app
```

The Cloudflare Pages project + KV namespace are already provisioned. `wrangler.toml` is filled in. First deploy publishes to `https://kawader-bootcamp-app.pages.dev`.

## Contact

**Ameer Zabaneh** · management@kawader-cine.com · info@kawader-cine.com

## License & credits

- Avatar sprite: OpenGameArt.org (CC0). See `src/simulation/assets/CREDITS.md`.
- Ambient audio: Freesound.org (CC0). See `assets/audio/CREDITS.md`.
- Scout photos + mockups: KAWADER Art Productions, 2026.
- Map tiles: Esri World Imagery (educational/non-commercial). Swap before any external launch.
