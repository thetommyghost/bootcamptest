# Bootcamp Interactive Map & Game

<div dir="rtl" lang="ar">

## أهلاً وسهلاً

هذا المشروع هو الخريطة التفاعلية وتجربة اللعب المرافقة لمعسكر كوادر السينمائي 2026، والذي سيُعقد في مؤسّسة إدوارد سعيد الثقافية في بيرزيت. الهدف من المشروع تمكين المشاركين في المعسكر من استكشاف الموقع بصرياً قبل وصولهم، التعرّف على الفضاءات الـ18 التي ستحتضن النشاطات، وتسجيل ملاحظاتهم الجماعية حول كل فضاء.

تم تطوير المشروع على ثلاثة إصدارات (v1، v2، v3) خلال شهر أيار 2026، ووصل حالياً إلى نسخة v3 Round 4. النسخة الإنتاجية الحالية تعمل على شبكة كلاودفلير عبر الرابط الموجود في قسم Live URLs أدناه.

دورك في هذه المرحلة هو استلام المشروع، فهم بنيته، وإكمال المهام المؤجّلة الموثّقة في `docs/first-tasks.md`. لا حاجة لمعرفة سابقة بأطر العمل الحديثة (React/Vue) لأنّ المشروع مبنيٌّ بـ HTML/CSS/JavaScript خام بدون أي خطوة بناء. ابدأ بقراءة `AGENTS.md` ثم `docs/gotchas.md`، وبعدها افتح اللعبة محلياً عبر الأمر في قسم Quick Start.

</div>

---

## English overview

This is the interactive scouting map and venue-twin game for **KAWADER Film Camp 2026**, held at the Edward Said Cultural Institute in Birzeit. Campers explore the 18 activity zones visually, drop collaborative notes per zone, and orient themselves before arriving on site.

You're picking up a **fully-shipped V3 Round 4** build (Lighthouse 99/96/100/100). The job is **maintain + extend**, not start over.

## Quick start

```bash
# 1. Serve the folder
cd /Users/Kawader/Kawader/Handoffs/bootcamp-interactive-map
python3 -m http.server 8765

# 2. Open in browser
open http://127.0.0.1:8765/src/simulation/index.html   # the game
open http://127.0.0.1:8765/src/map/index.html          # the map

# 3. Walk around: WASD or arrow keys. Click any waypoint to teleport.
# 4. Drop a team note: press N
```

> **Note:** The shared notes feature talks to `/api/notes`, which only runs in production. Locally, notes save to `localStorage` only — that's expected.

## Live URLs (current production, owned by Ameer)

- **Map:** https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/
- **Simulation / game:** https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/

Your own deploy (created in `docs/deployment.md`) will live at a separate Cloudflare Pages URL.

## What's in this folder

| Path | What |
|---|---|
| `src/` | The two HTML apps (map + simulation). Single-file, no build step. |
| `assets/` | All photos, mockups, satellite tiles, venue art, audio (~86 MB). |
| `functions/` | One Cloudflare Pages Function for shared notes (KV-backed). |
| `tools/` | Python scripts that regenerate venue background + mockups. |
| `tests/` | Playwright smoke test skeleton. |
| `docs/` | **Read these.** Architecture, deployment, gotchas, first tasks, planning archive. |
| `AGENTS.md` | Brief for your coding agent. Read first when starting a coding session. |
| `CHANGELOG.md` | Version history v1 → v3 R4. |

## Where to go next

1. **`AGENTS.md`** — Tells your AI agent what it needs to know.
2. **`docs/gotchas.md`** — Bugs we already paid for. Don't repeat them.
3. **`docs/architecture.md`** — How map + simulation + notes fit together.
4. **`docs/first-tasks.md`** — Three starter tasks ranked easy → harder.
5. **`docs/deployment.md`** — When you're ready to push your own version live.

## Contact

- **Project owner:** Ameer Zabaneh
- **Email:** management@kawader-cine.com · info@kawader-cine.com
- **Notion handoff page (bilingual):** _added below after the page is created_

## Notion handoff page

<!-- NOTION_LINK_PLACEHOLDER -->

## License & credits

- Avatar sprite: OpenGameArt.org "2D RPG Character Walk Spritesheet" (CC0). See `src/simulation/assets/CREDITS.md`.
- Ambient audio: Freesound.org CC0 tracks. See `assets/audio/CREDITS.md`.
- Scout photos + mockups: KAWADER Art Productions, 2026.
- Map tiles: Esri World Imagery (educational/non-commercial). Switch tile provider before any external launch.
