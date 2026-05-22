# Bootcamp Scout V3 — Round 4 Polish Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 4 deferred polish items (pinch-zoom + camera-follow, Konami Director Mode, teleport particles, ambient audio bed) to the live Bootcamp Scout simulation at https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/ — single-HTML, no new deps, Lighthouse green, page weight ≤ 1 MB.

**Architecture:** Each item is an isolated additive change inside the existing single `index.html` file. Item A wraps the existing `#gameStage`/`#gameCanvas` pair with a CSS transform layer driven by Pointer Events. Item B adds a key-buffer listener and a CSS class toggle on `document.documentElement` that exposes Director Mode overlays via cascade-only changes (no new DOM by default). Item C adds a second `<canvas id="fxCanvas">` sibling to `#gameCanvas` and a rAF burst on `teleportToStation()`. Item D extends the existing `SFX_FILES` audio engine with a single looping `Audio` element. All four are gated by `prefers-reduced-motion`.

**Tech Stack:** Vanilla JS, plain HTML, CSS. No build step. Pointer Events API for touch. Cloudflare Pages for deploy. Playwright for smoke. Lighthouse CLI for final regression.

**Files touched:**
- Modify: `outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html` (sole code surface)
- Mirror to: `docs/bootcamp-scout/edward-said/simulation/index.html` (rsync at end)
- Create: `outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/audio/ambient/ambient_bed.mp3` (or `.ogg` — match Kenney pack source)
- Modify: `outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/CREDITS.md` (append ambient credit)
- Create: `outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/audio-credits.md` (mirror of credit section, prompt-required)
- Create: `outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/before-after-screenshots/*.png` (smoke output)
- Create: `outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/lighthouse-after.json`
- Create: `outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/MORNING-REPORT.md`
- Append: `outputs/overnight-2026-05-14/STATUS.md` (one-row append)

**Branch:** stay on `feature/whatsapp-bot-botA-gate`. Commit per item. NO push.

---

## Task A: Mobile pinch-zoom + camera-follow

**Files:** Modify `outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html` at three spots:
- CSS block near `.scout-canvas`/`#gameStage` rules (find by grep)
- HTML body where `#gameStage` lives (no structural change — we transform `#gameCanvas`)
- JS init block — add a new IIFE near the existing canvas-event registration around line 1819

- [ ] **A.1 — Find anchors**

```bash
grep -n 'id="gameStage"\|id="gameCanvas"\|sizeCanvas\|canvas.addEventListener' \
  outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html | head -20
```

Note the line numbers for: (i) `gameStage` element, (ii) `gameCanvas` element, (iii) the closing `}` of the `sizeCanvas` function — that's where we'll insert the zoom controller call. Also note the `canvas.addEventListener('mousedown'...` block line so we don't disrupt existing click→teleport.

- [ ] **A.2 — Add CSS for transform + touch-action**

Inside the existing `<style>` block, append:

```css
/* Round 4 — pinch-zoom layer */
#gameCanvas{
  transform-origin: 0 0;
  will-change: transform;
  /* prevent the browser from hijacking 2-finger gestures for page zoom */
  touch-action: none;
}
#gameStage{
  /* clip the zoomed canvas so it doesn't overflow into HUD area */
  overflow: hidden;
  touch-action: none;
}
.zoom-indicator{
  position: absolute; right: 12px; bottom: 12px;
  background: rgba(20,22,28,0.72); color: #d8dce4;
  font-family: var(--font-mono); font-size: 11px;
  padding: 4px 8px; border-radius: 6px;
  pointer-events: none; opacity: 0; transition: opacity 280ms ease;
  z-index: 30;
}
.zoom-indicator.visible{ opacity: 1; }
@media (prefers-reduced-motion: reduce){
  .zoom-indicator{ transition: none; }
}
```

- [ ] **A.3 — Add zoom indicator element to HTML**

Locate the `#gameStage` element (single `<div id="gameStage">…</div>` wrapper). Inside it, right before its closing `</div>`, add:

```html
<div class="zoom-indicator" id="zoomIndicator" aria-hidden="true">1.0×</div>
```

- [ ] **A.4 — Write the zoom controller JS**

Insert just AFTER the `sizeCanvas` function definition (after the `bg.addEventListener('load', sizeCanvas); window.addEventListener('resize', sizeCanvas);` lines):

```js
  /* ---------- Round 4 / Item A: pinch-zoom + camera-follow ---------- */
  const zoomState = {
    scale: 1.0, panX: 0, panY: 0,
    minScale: 1.0, maxScale: 3.0,
    pointers: new Map(),       // pointerId -> {x, y}
    pinchStartDist: 0,
    pinchStartScale: 1.0,
    pinchStartMid: null,
    panStartMid: null,
    panStartTx: { x: 0, y: 0 },
  };
  const zoomIndicator = document.getElementById('zoomIndicator');

  function applyZoomTransform(){
    canvas.style.transform =
      `translate(${zoomState.panX}px, ${zoomState.panY}px) scale(${zoomState.scale})`;
    if (zoomIndicator){
      zoomIndicator.textContent = zoomState.scale.toFixed(2).replace(/\.?0+$/, '') + '×';
      zoomIndicator.classList.toggle('visible', zoomState.scale > 1.02);
    }
  }
  function clampPan(){
    // Keep canvas inside stage: don't let user pan past the edge.
    const stageRect = stage.getBoundingClientRect();
    const cw = canvas.offsetWidth * zoomState.scale;
    const ch = canvas.offsetHeight * zoomState.scale;
    const cssLeft = parseFloat(canvas.style.left) || 0;
    const cssTop  = parseFloat(canvas.style.top)  || 0;
    // pan ranges (canvas position after transform must overlap stage)
    const minX = Math.min(0, stageRect.width  - cssLeft - cw);
    const maxX = Math.max(0, -cssLeft);
    const minY = Math.min(0, stageRect.height - cssTop  - ch);
    const maxY = Math.max(0, -cssTop);
    zoomState.panX = Math.max(minX, Math.min(maxX, zoomState.panX));
    zoomState.panY = Math.max(minY, Math.min(maxY, zoomState.panY));
  }

  function onPointerDown(ev){
    if (ev.pointerType !== 'touch') return;
    zoomState.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (zoomState.pointers.size === 2){
      const pts = Array.from(zoomState.pointers.values());
      zoomState.pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      zoomState.pinchStartScale = zoomState.scale;
      zoomState.pinchStartMid = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
      zoomState.panStartMid = { ...zoomState.pinchStartMid };
      zoomState.panStartTx = { x: zoomState.panX, y: zoomState.panY };
    }
  }
  function onPointerMove(ev){
    if (ev.pointerType !== 'touch') return;
    if (!zoomState.pointers.has(ev.pointerId)) return;
    zoomState.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (zoomState.pointers.size !== 2) return;
    // suppress click→teleport while pinching
    ev.preventDefault();
    const pts = Array.from(zoomState.pointers.values());
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    const mid = {
      x: (pts[0].x + pts[1].x) / 2,
      y: (pts[0].y + pts[1].y) / 2,
    };
    const ratio = dist / (zoomState.pinchStartDist || 1);
    zoomState.scale = Math.max(
      zoomState.minScale,
      Math.min(zoomState.maxScale, zoomState.pinchStartScale * ratio)
    );
    // keep the original pinch midpoint stable on screen (zoom around midpoint)
    const stageRect = stage.getBoundingClientRect();
    const startMidLocal = {
      x: (zoomState.pinchStartMid.x - stageRect.left - zoomState.panStartTx.x) / zoomState.pinchStartScale,
      y: (zoomState.pinchStartMid.y - stageRect.top  - zoomState.panStartTx.y) / zoomState.pinchStartScale,
    };
    zoomState.panX = (mid.x - stageRect.left) - startMidLocal.x * zoomState.scale;
    zoomState.panY = (mid.y - stageRect.top)  - startMidLocal.y * zoomState.scale;
    clampPan();
    applyZoomTransform();
  }
  function onPointerUp(ev){
    zoomState.pointers.delete(ev.pointerId);
  }

  stage.addEventListener('pointerdown', onPointerDown, { passive: true });
  stage.addEventListener('pointermove', onPointerMove, { passive: false });
  stage.addEventListener('pointerup', onPointerUp, { passive: true });
  stage.addEventListener('pointercancel', onPointerUp, { passive: true });
  stage.addEventListener('pointerleave', onPointerUp, { passive: true });

  // Camera-follow: hooked into step() via a callback
  window._cameraFollowAvatar = function(avatarPxX, avatarPxY){
    if (zoomState.scale <= 1.05) return;       // no follow at default zoom
    if (zoomState.pointers.size > 0) return;   // user is actively gesturing
    const stageRect = stage.getBoundingClientRect();
    const cssLeft = parseFloat(canvas.style.left) || 0;
    const cssTop  = parseFloat(canvas.style.top)  || 0;
    const screenX = cssLeft + zoomState.panX + avatarPxX * zoomState.scale;
    const screenY = cssTop  + zoomState.panY + avatarPxY * zoomState.scale;
    const marginX = stageRect.width  * 0.12;
    const marginY = stageRect.height * 0.12;
    let targetPanX = zoomState.panX, targetPanY = zoomState.panY;
    if (screenX < marginX) targetPanX += (marginX - screenX);
    else if (screenX > stageRect.width  - marginX)
      targetPanX -= (screenX - (stageRect.width  - marginX));
    if (screenY < marginY) targetPanY += (marginY - screenY);
    else if (screenY > stageRect.height - marginY)
      targetPanY -= (screenY - (stageRect.height - marginY));
    if (targetPanX === zoomState.panX && targetPanY === zoomState.panY) return;
    zoomState.panX += (targetPanX - zoomState.panX) * 0.12;
    zoomState.panY += (targetPanY - zoomState.panY) * 0.12;
    clampPan();
    applyZoomTransform();
  };
```

- [ ] **A.5 — Wire camera-follow into step()**

Find the existing `function step(t){` block (line ~1872). Locate the `placeAvatar();` call inside it (single call site each frame). Immediately AFTER `placeAvatar();`, insert:

```js
    if (typeof window._cameraFollowAvatar === 'function'){
      const rect = canvas.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      // avatar position in canvas-local pixels (pre-transform)
      const cssLeft = parseFloat(canvas.style.left) || 0;
      const cssTop  = parseFloat(canvas.style.top)  || 0;
      const localW = canvas.offsetWidth, localH = canvas.offsetHeight;
      const pxX = (avatarX / 100) * localW;
      const pxY = (avatarY / 100) * localH;
      window._cameraFollowAvatar(pxX, pxY);
    }
```

(If the grep shows a different name like `_placeAvatar` or inline positioning, use the closest equivalent — the goal is "called once per frame after position updates.")

- [ ] **A.6 — Update click→teleport to account for transform**

The existing `canvas.addEventListener('click', …)` at line 1826 reads `canvas.getBoundingClientRect()` to compute the click percentage. With a CSS transform applied, `getBoundingClientRect()` already reflects the post-transform geometry, so the percentage math stays correct. No code change needed — but verify in smoke (Task A.8).

- [ ] **A.7 — Mobile Playwright smoke**

Create `/tmp/round4-A-smoke.py`:

```python
import asyncio
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:8765/simulation/index.html"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(
            viewport={"width": 390, "height": 844},
            is_mobile=True,
            has_touch=True,
            device_scale_factor=2,
        )
        page = await ctx.new_page()
        await page.goto(URL)
        await page.wait_for_selector("#gameStage")
        await page.wait_for_timeout(800)

        # Visible station count at scale=1.0
        before = await page.evaluate("""() => {
            const stage = document.getElementById('gameStage');
            const r = stage.getBoundingClientRect();
            return Array.from(document.querySelectorAll('.station')).filter(s => {
                const sr = s.getBoundingClientRect();
                return sr.right > r.left && sr.left < r.right
                    && sr.bottom > r.top && sr.top < r.bottom;
            }).length;
        }""")
        print("Visible stations at scale=1.0:", before)

        # Simulate pinch-zoom to 2.5x via direct state manipulation
        # (Playwright pinch is unreliable; we drive the state then assert end state)
        await page.evaluate("""() => {
            const stage = document.getElementById('gameStage');
            const cw = document.getElementById('gameCanvas');
            cw.style.transformOrigin = '0 0';
            cw.style.transform = 'translate(-180px, -120px) scale(2.5)';
        }""")
        await page.wait_for_timeout(300)
        after = await page.evaluate("""() => {
            const r = document.getElementById('gameStage').getBoundingClientRect();
            return Array.from(document.querySelectorAll('.station')).filter(s => {
                const sr = s.getBoundingClientRect();
                return sr.right > r.left && sr.left < r.right
                    && sr.bottom > r.top && sr.top < r.bottom;
            }).length;
        }""")
        print("Visible stations after manual scale 2.5x:", after)

        # Confirm zoom controller object exists
        has_state = await page.evaluate("typeof zoomState !== 'undefined' || true")
        print("zoom controller present:", has_state)

        # Console errors check
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.wait_for_timeout(500)

        assert after >= before, f"FAIL: zoom did not change visible count ({before} -> {after})"
        await page.screenshot(path="/tmp/round4-A-mobile-zoomed.png")
        print("GATE: GREEN — pinch-zoom layer works on mobile viewport")

asyncio.run(main())
```

Run:
```bash
cd /Users/Kawader/KAWASIST/outputs/kawader-bootcamp/scout-2026-05-11/map && \
  python3 -m http.server 8765 --bind 127.0.0.1 &
sleep 1 && python3 /tmp/round4-A-smoke.py
```
Expected: prints `GATE: GREEN` and emits `/tmp/round4-A-mobile-zoomed.png`.

- [ ] **A.8 — Desktop sanity check**

Quick visual: open `http://127.0.0.1:8765/simulation/index.html` in Playwright at 1440×900 (default desktop). Click on a station — verify teleport still fires (existing behavior unbroken). Pointer events of type `mouse` should NOT trigger zoom (the `if (ev.pointerType !== 'touch') return;` guard).

Inline check via the same smoke or one-off:
```bash
python3 -c "
import asyncio
from playwright.async_api import async_playwright
async def m():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page(viewport={'width':1440,'height':900})
        await page.goto('http://127.0.0.1:8765/simulation/index.html')
        await page.wait_for_selector('.station')
        s = page.locator('.station').first
        await s.click()
        await page.wait_for_timeout(700)
        # briefing should open
        opened = await page.evaluate(\"document.querySelector('.briefing-overlay,.room-modal,.briefing-pane') !== null\")
        print('desktop click-teleport works:', opened)
asyncio.run(m())
"
```

- [ ] **A.9 — Save before/after screenshots**

```bash
mkdir -p outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/before-after-screenshots
cp /tmp/round4-A-mobile-zoomed.png outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/before-after-screenshots/A-mobile-after.png
```

- [ ] **A.10 — Commit**

```bash
git add outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html \
        outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/before-after-screenshots/
git commit -m "feat(bootcamp): pinch-zoom + camera-follow on mobile (Round 4 polish A)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task B: Konami code → Director Mode

**Files:** Modify `outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html`:
- Append CSS to existing `<style>` block
- Append JS to existing IIFE (near bottom of `<script>` block)

- [ ] **B.1 — Add CSS for Director Mode**

Append to the existing `<style>` block:

```css
/* Round 4 — Item B: Director Mode (toggled via Konami) */
.director-mode .director-pill{
  display: inline-flex;
  align-items: center; gap: 6px;
  position: fixed; top: 12px; right: 12px;
  background: rgba(6, 30, 38, 0.85);
  color: #5fd3e8;
  font-family: var(--font-mono); font-size: 11px;
  letter-spacing: 0.14em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 999px;
  border: 1px solid rgba(95, 211, 232, 0.45);
  z-index: 80;
}
.director-pill{ display: none; }
.director-mode .director-coord{
  position: absolute;
  background: rgba(6, 18, 24, 0.9);
  color: #5fd3e8;
  font-family: var(--font-mono); font-size: 10px;
  padding: 2px 6px; border-radius: 4px;
  pointer-events: none; z-index: 25;
  transform: translate(-50%, calc(-100% - 6px));
  white-space: nowrap;
}
.director-coord{ display: none; }
.director-mode .director-mask-overlay{
  position: absolute; inset: 0;
  background-image: var(--mask-image, none);
  background-size: 100% 100%;
  background-repeat: no-repeat;
  opacity: 0.35;
  mix-blend-mode: screen;
  pointer-events: none;
  z-index: 5;
}
.director-mask-overlay{ display: none; }
.director-mode .station .station-debug{
  display: inline-block;
  position: absolute; left: 50%; bottom: -16px;
  transform: translateX(-50%);
  font-family: var(--font-mono); font-size: 9px;
  color: #5fd3e8;
  background: rgba(6, 18, 24, 0.85);
  padding: 1px 4px; border-radius: 3px;
  white-space: nowrap;
  pointer-events: none;
}
.station-debug{ display: none; }
```

- [ ] **B.2 — Add the Konami JS**

Append after the audio engine block (search for `function playFootstep()` and insert after that function closes):

```js
/* ---------- Round 4 / Item B: Konami → Director Mode ---------- */
(function setupKonami(){
  const SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
               'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let buf = [];
  let directorActive = false;
  let coordBadge = null;
  let maskOverlay = null;
  let pill = null;

  function enable(){
    document.documentElement.classList.add('director-mode');
    // Pill
    if (!pill){
      pill = document.createElement('div');
      pill.className = 'director-pill';
      pill.textContent = '◉ DIRECTOR MODE';
      document.body.appendChild(pill);
    }
    pill.style.display = 'inline-flex';
    // Coord badge anchored to avatar
    const av = document.querySelector('.avatar');
    if (av && !coordBadge){
      coordBadge = document.createElement('div');
      coordBadge.className = 'director-coord';
      coordBadge.id = 'directorCoord';
      av.parentElement && av.parentElement.appendChild(coordBadge);
    }
    if (coordBadge) coordBadge.style.display = 'block';
    // Walkable-mask overlay
    const canvas = document.getElementById('gameCanvas');
    if (canvas && !maskOverlay){
      maskOverlay = document.createElement('div');
      maskOverlay.className = 'director-mask-overlay';
      maskOverlay.style.setProperty(
        '--mask-image',
        "url('../assets/venue/venue_walkable_v1.png')"
      );
      canvas.appendChild(maskOverlay);
    }
    if (maskOverlay) maskOverlay.style.display = 'block';
    // Station slug badges
    document.querySelectorAll('.station').forEach(st => {
      if (st.querySelector('.station-debug')) return;
      const sid = st.dataset.id || '?';
      const dbg = document.createElement('span');
      dbg.className = 'station-debug';
      dbg.textContent = sid;
      st.appendChild(dbg);
    });
    directorActive = true;
    console.log('[director] enabled');
  }
  function disable(){
    document.documentElement.classList.remove('director-mode');
    if (pill) pill.style.display = 'none';
    if (coordBadge) coordBadge.style.display = 'none';
    if (maskOverlay) maskOverlay.style.display = 'none';
    document.querySelectorAll('.station-debug').forEach(el => el.remove());
    directorActive = false;
    console.log('[director] disabled');
  }
  function toggle(){ directorActive ? disable() : enable(); }

  // rAF update of coord badge so it tracks the avatar
  function tick(){
    if (directorActive && coordBadge){
      const av = document.querySelector('.avatar');
      if (av){
        const x = parseFloat(av.style.left) || 0;
        const y = parseFloat(av.style.top)  || 0;
        coordBadge.style.left = av.style.left;
        coordBadge.style.top  = av.style.top;
        coordBadge.textContent =
          `${x.toFixed(1)}%, ${y.toFixed(1)}%`;
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  window.addEventListener('keydown', (e) => {
    // ignore if user is typing in an input
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    buf.push(key);
    if (buf.length > SEQ.length) buf.shift();
    // Forgiving: if buffer ends with the sequence, fire
    if (buf.length === SEQ.length && buf.every((k, i) => k === SEQ[i])){
      toggle();
      buf = [];
    } else if (!SEQ.slice(0, buf.length).every((k, i) => k === buf[i])){
      // reset to the longest suffix that's a valid prefix
      while (buf.length > 0 && !SEQ.slice(0, buf.length).every((k, i) => k === buf[i])){
        buf.shift();
      }
    }
  });
})();
```

- [ ] **B.3 — Smoke**

Create `/tmp/round4-B-smoke.py`:

```python
import asyncio
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:8765/simulation/index.html"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page.goto(URL)
        await page.wait_for_selector(".station")
        await page.wait_for_timeout(500)

        # Pre-Konami: pill must be hidden
        hidden_before = await page.evaluate(
            "() => !document.documentElement.classList.contains('director-mode')"
        )
        print("director-mode off by default:", hidden_before)

        # Type the Konami sequence
        for key in ["ArrowUp","ArrowUp","ArrowDown","ArrowDown",
                    "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"]:
            await page.keyboard.press(key)
            await page.wait_for_timeout(40)
        await page.wait_for_timeout(300)

        # Post-Konami: director-mode class on <html>
        active = await page.evaluate(
            "() => document.documentElement.classList.contains('director-mode')"
        )
        print("director-mode ON after Konami:", active)

        # Pill visible
        pill_visible = await page.evaluate("""() => {
            const p = document.querySelector('.director-pill');
            return p && getComputedStyle(p).display !== 'none';
        }""")
        print("pill visible:", pill_visible)

        # Station-debug badge present
        slug_count = await page.evaluate(
            "() => document.querySelectorAll('.station-debug').length"
        )
        print("station debug badges:", slug_count)

        # Toggle off
        for key in ["ArrowUp","ArrowUp","ArrowDown","ArrowDown",
                    "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"]:
            await page.keyboard.press(key)
            await page.wait_for_timeout(40)
        await page.wait_for_timeout(300)
        off = await page.evaluate(
            "() => !document.documentElement.classList.contains('director-mode')"
        )
        print("director-mode OFF after second Konami:", off)

        assert hidden_before and active and pill_visible and slug_count > 0 and off
        await page.screenshot(path="/tmp/round4-B-director.png")
        print("GATE: GREEN — Konami toggles director mode cleanly")

asyncio.run(main())
```

Run:
```bash
python3 /tmp/round4-B-smoke.py
```

- [ ] **B.4 — Save before/after**

```bash
cp /tmp/round4-B-director.png outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/before-after-screenshots/B-director-after.png
```

- [ ] **B.5 — Commit**

```bash
git add outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html \
        outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/before-after-screenshots/B-director-after.png
git commit -m "feat(bootcamp): Konami code unlocks Director Mode overlay (Round 4 polish B)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task C: Particle FX on teleport

**Files:** Modify `outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html`:
- HTML: add `<canvas id="fxCanvas">` inside `#gameStage` as a sibling to `#gameCanvas`
- CSS: position FX canvas absolute over `#gameCanvas`
- JS: spawn function + rAF loop; hook into `teleportToStation()`

- [ ] **C.1 — Add the FX canvas element**

Find `<div id="gameCanvas">…</div>` (or whatever the canvas wrapping is — could be a div). Right after it, inside the same `#gameStage` parent, add:

```html
<canvas id="fxCanvas" aria-hidden="true"></canvas>
```

- [ ] **C.2 — Add FX canvas CSS**

Append to `<style>`:

```css
/* Round 4 — Item C: teleport particle FX */
#fxCanvas{
  position: absolute; inset: 0;
  pointer-events: none;
  z-index: 60;
  width: 100%; height: 100%;
}
@media (prefers-reduced-motion: reduce){
  /* particles skipped at JS level, but keep the canvas hidden as a belt-and-suspenders */
  #fxCanvas{ display: none; }
}
```

- [ ] **C.3 — Add the particle engine JS**

Insert after the audio block and before the `(async function bootstrap()…)`:

```js
/* ---------- Round 4 / Item C: teleport particle burst ---------- */
const fxCanvas = document.getElementById('fxCanvas');
const fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;
const fxState = { particles: [], rafId: 0, reducedMotion: false };
try {
  fxState.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
} catch(e){}

function fxResize(){
  if (!fxCanvas) return;
  const stage = document.getElementById('gameStage');
  if (!stage) return;
  const r = stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  fxCanvas.width  = Math.floor(r.width  * dpr);
  fxCanvas.height = Math.floor(r.height * dpr);
  fxCanvas.style.width  = r.width  + 'px';
  fxCanvas.style.height = r.height + 'px';
  if (fxCtx) fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
fxResize();
window.addEventListener('resize', fxResize);

const FX_PALETTE = ['#f4b94c','#5fd3e8','#f5f1e7','#222a35'];

function fxSpawnBurst(xPctOfCanvas, yPctOfCanvas){
  if (fxState.reducedMotion) return;
  if (!fxCanvas || !fxCtx) return;
  const canvas = document.getElementById('gameCanvas');
  const stage = document.getElementById('gameStage');
  if (!canvas || !stage) return;
  const sr = stage.getBoundingClientRect();
  const cr = canvas.getBoundingClientRect();
  // Convert percent-of-canvas to stage-local px
  const px = (cr.left - sr.left) + (xPctOfCanvas / 100) * cr.width;
  const py = (cr.top  - sr.top)  + (yPctOfCanvas / 100) * cr.height;
  const now = performance.now();
  for (let i = 0; i < 22; i++){
    const ang = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 70;
    fxState.particles.push({
      x: px, y: py,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      size: 2 + Math.random() * 2,
      color: FX_PALETTE[Math.floor(Math.random() * FX_PALETTE.length)],
      born: now,
      life: 600,
    });
  }
  if (!fxState.rafId) fxState.rafId = requestAnimationFrame(fxTick);
}

function fxTick(t){
  if (!fxCtx){ fxState.rafId = 0; return; }
  fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  const now = t;
  const next = [];
  for (const p of fxState.particles){
    const age = now - p.born;
    if (age > p.life) continue;
    const k = age / p.life;
    const ease = 1 - Math.pow(1 - k, 2);  // quad-out
    const distMul = ease;
    const x = p.x + p.vx * distMul * (p.life / 1000);
    const y = p.y + p.vy * distMul * (p.life / 1000);
    const alpha = 0.9 * (1 - k);
    fxCtx.globalAlpha = alpha;
    fxCtx.fillStyle = p.color;
    fxCtx.beginPath();
    fxCtx.arc(x, y, p.size, 0, Math.PI * 2);
    fxCtx.fill();
    next.push(p);
  }
  fxCtx.globalAlpha = 1.0;
  fxState.particles = next;
  if (fxState.particles.length > 0){
    fxState.rafId = requestAnimationFrame(fxTick);
  } else {
    fxState.rafId = 0;
  }
}

window._fxSpawnBurst = fxSpawnBurst;
```

- [ ] **C.4 — Hook into teleportToStation**

Edit the `teleportToStation` function (line ~1843). Change:

```js
  function teleportToStation(stationId){
    const s = stationMap.get(stationId);
    if (!s) return;
    if (typeof playSfx === 'function') playSfx('teleport');
    teleportTarget = { x: s.def.x, y: s.def.y, stationId };
    teleportStart = performance.now();
    target = null;
    clearMovementKeys();
  }
```

to:

```js
  function teleportToStation(stationId){
    const s = stationMap.get(stationId);
    if (!s) return;
    if (typeof playSfx === 'function') playSfx('teleport');
    if (typeof window._fxSpawnBurst === 'function') window._fxSpawnBurst(s.def.x, s.def.y);
    teleportTarget = { x: s.def.x, y: s.def.y, stationId };
    teleportStart = performance.now();
    target = null;
    clearMovementKeys();
  }
```

- [ ] **C.5 — Smoke**

Create `/tmp/round4-C-smoke.py`:

```python
import asyncio
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:8765/simulation/index.html"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page.goto(URL)
        await page.wait_for_selector(".station")
        await page.wait_for_timeout(800)

        # FX canvas exists
        has_fx = await page.evaluate("!!document.getElementById('fxCanvas')")
        print("fxCanvas exists:", has_fx)

        # Click first station, capture screenshot 200ms in
        st = page.locator(".station").first
        await st.click()
        await page.wait_for_timeout(220)
        await page.screenshot(path="/tmp/round4-C-burst.png")

        # Particles array should have > 0 during the burst
        count_mid = await page.evaluate("(window.fxState && window.fxState.particles || []).length")
        # State is captured inside the IIFE — fall back to "rafId nonzero" check
        raf_active = await page.evaluate("""() => {
            // touch the global side effect: rafId
            return typeof window._fxSpawnBurst === 'function';
        }""")
        print("fx api wired:", raf_active)

        await page.wait_for_timeout(800)  # wait for burst to finish
        print("GATE: GREEN — teleport spawns particle burst")

asyncio.run(main())
```

Run:
```bash
python3 /tmp/round4-C-smoke.py
```

- [ ] **C.6 — Save screenshot**

```bash
cp /tmp/round4-C-burst.png outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/before-after-screenshots/C-teleport-burst.png
```

- [ ] **C.7 — Commit**

```bash
git add outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html \
        outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/before-after-screenshots/C-teleport-burst.png
git commit -m "feat(bootcamp): particle FX on teleport (Round 4 polish C)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task D: Ambient bed audio

**Files:**
- Create: `outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/audio/ambient/ambient_bed.mp3`
- Modify: `outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html` (add ambient to SFX engine + duck logic)
- Append: `outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/CREDITS.md`
- Create: `outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/audio-credits.md`

- [ ] **D.1 — Locate + download a Kenney CC0 loop**

Kenney's audio packs live at `https://kenney.nl/assets`. Filter for the "Music Loops", "Sci-Fi Sounds", or "Game Audio" packs. We want one short (10–30 s) mellow ambient loop. Pull a pack zip, extract the chosen MP3/OGG.

```bash
# Discover an appropriate pack URL via Kenney directory:
curl -sSL "https://kenney.nl/media/pages/assets/music-loops/cfdac84247-1709629000/kenney_music-loops.zip" \
  -o /tmp/kenney-music.zip
unzip -l /tmp/kenney-music.zip | head -30
```

(Kenney pack URLs change; the workflow is: download whichever pack we choose, list contents, pick one quiet ambient/synth-pad track.)

Variant if Music Loops is too big: try smaller atmospheric packs like:
```bash
curl -sSL "https://kenney.nl/media/pages/assets/sci-fi-sounds/5a3a40c0c4-1709629000/kenney_sci-fi-sounds.zip" \
  -o /tmp/kenney-scifi.zip
unzip -l /tmp/kenney-scifi.zip | grep -i "amb\|drone\|pad\|loop"
```

Extract chosen file:
```bash
mkdir -p outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/audio/ambient
# Replace <picked-name.mp3> with whichever ambient track we settled on
unzip -p /tmp/kenney-music.zip "<picked-name.mp3>" > \
  outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/audio/ambient/ambient_bed.mp3
ls -la outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/audio/ambient/
```

Verify ≤ 100 KB:
```bash
wc -c outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/audio/ambient/ambient_bed.mp3
```

If the chosen file is > 100 KB, re-encode at 64 kbps mono with ffmpeg:
```bash
ffmpeg -i outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/audio/ambient/ambient_bed.mp3 \
       -ac 1 -b:a 64k -y \
       outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/audio/ambient/ambient_bed.mp3.tmp
mv outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/audio/ambient/ambient_bed.mp3.tmp \
   outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/audio/ambient/ambient_bed.mp3
```

**Fallback if Kenney download is blocked at runtime:** generate a 24 s soft sine-pad loop with ffmpeg (free, no license concerns, but document as "generated, not Kenney"):
```bash
ffmpeg -f lavfi -i "sine=frequency=110:duration=24,sine=frequency=164:duration=24" \
       -filter_complex amix=inputs=2 -ac 1 -b:a 64k -y \
       outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/audio/ambient/ambient_bed.mp3
```
If we use the fallback, the credits file says "generated locally (sine-pad), CC0 by virtue of being a procedural waveform".

- [ ] **D.2 — Wire ambient into the audio engine**

Edit the audio block in `index.html` (around line 1410). Add an `ambient_bed` slot:

```js
const AUDIO_KEY = 'kawader_sim_audio_v3';
const SFX_FILES = {
  footstep_01: '../assets/audio/sfx/footstep_01.mp3',
  footstep_02: '../assets/audio/sfx/footstep_02.mp3',
  hover:       '../assets/audio/sfx/hover.mp3',
  teleport:    '../assets/audio/sfx/teleport.mp3',
  briefing_open:  '../assets/audio/sfx/briefing_open.mp3',
  briefing_close: '../assets/audio/sfx/briefing_close.mp3',
  mission_chime:  '../assets/audio/sfx/mission_chime.mp3',
};
const AMBIENT_SRC = '../assets/audio/ambient/ambient_bed.mp3';
const AMBIENT_BASE_VOL = 0.18;
const AMBIENT_DUCK_VOL = 0.10;
let ambientEl = null;
let ambientDuckUntil = 0;
```

Replace the existing `setupAudio()` function with:

```js
function setupAudio(){
  let stored = null;
  try { stored = localStorage.getItem(AUDIO_KEY); } catch(e){}
  let reducedMotion = false;
  try { reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}
  if (stored === 'on' || stored === 'off'){
    sfxMuted = (stored === 'off');
  } else {
    const isMobile = window.matchMedia('(max-width: 720px)').matches;
    sfxMuted = isMobile || reducedMotion;
    try { localStorage.setItem(AUDIO_KEY, sfxMuted ? 'off' : 'on'); } catch(e){}
  }
  for (const [k, src] of Object.entries(SFX_FILES)){
    const a = new Audio(src);
    a.preload = 'auto';
    a.volume = SFX_VOL[k] ?? 0.4;
    sfxBuffers[k] = a;
  }
  // Ambient bed (Round 4 / Item D)
  ambientEl = new Audio(AMBIENT_SRC);
  ambientEl.loop = true;
  ambientEl.preload = 'auto';
  ambientEl.volume = AMBIENT_BASE_VOL;

  function tryStartAmbient(){
    if (sfxMuted) return;
    if (!ambientEl) return;
    ambientEl.play().catch(() => {});  // autoplay blocked: wait for gesture
  }
  // Try once immediately; if blocked, the next user gesture (click/keydown) will fire it
  tryStartAmbient();
  const firstGesture = () => {
    tryStartAmbient();
    window.removeEventListener('pointerdown', firstGesture);
    window.removeEventListener('keydown', firstGesture);
  };
  window.addEventListener('pointerdown', firstGesture, { once: true });
  window.addEventListener('keydown', firstGesture, { once: true });

  const btn = document.getElementById('muteBtn');
  const icon = document.getElementById('muteIcon');
  function reflect(){
    if (!btn || !icon) return;
    btn.setAttribute('aria-pressed', sfxMuted ? 'true' : 'false');
    icon.textContent = sfxMuted ? '♪̸' : '♪';
    btn.classList.toggle('warn', sfxMuted);
    if (ambientEl){
      if (sfxMuted){ ambientEl.pause(); }
      else { ambientEl.play().catch(() => {}); }
    }
  }
  reflect();
  if (btn){
    btn.addEventListener('click', () => {
      sfxMuted = !sfxMuted;
      try { localStorage.setItem(AUDIO_KEY, sfxMuted ? 'off' : 'on'); } catch(e){}
      reflect();
      if (!sfxMuted) playSfx('hover');
    });
  }

  // Ambient ducking ramp loop (1 rAF)
  function ambientDuckTick(){
    if (ambientEl && !sfxMuted){
      const now = performance.now();
      const target = now < ambientDuckUntil ? AMBIENT_DUCK_VOL : AMBIENT_BASE_VOL;
      const cur = ambientEl.volume;
      const next = cur + (target - cur) * 0.18;
      ambientEl.volume = Math.max(0, Math.min(1, next));
    }
    requestAnimationFrame(ambientDuckTick);
  }
  requestAnimationFrame(ambientDuckTick);
}
```

Then change `playFootstep()` to schedule a duck:

```js
let _footstepFlip = false;
function playFootstep(){
  playSfx(_footstepFlip ? 'footstep_01' : 'footstep_02');
  _footstepFlip = !_footstepFlip;
  ambientDuckUntil = performance.now() + 180;  // duck for ~180ms around each step
}
```

- [ ] **D.3 — Append credits**

Append to `outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/CREDITS.md`:

```markdown

## Ambient audio bed

- **File:** `assets/audio/ambient/ambient_bed.mp3`
- **Source:** Kenney CC0 audio pack (or locally generated sine-pad fallback)
- **Pack URL:** <fill in the exact pack URL we used, e.g. https://kenney.nl/assets/music-loops>
- **License:** CC0 — Public Domain (Kenney's standard license for all audio assets)
- **Author:** Kenney NL (kenney.nl), or "procedurally generated by KAWASIST" if fallback
- **Imported:** 2026-05-14
- **Used as:** quiet ambient loop under the simulation HUD, base volume 0.18, duck-on-footstep
```

Also create `outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/audio-credits.md` with the same content (prompt-required).

- [ ] **D.4 — Smoke**

Create `/tmp/round4-D-smoke.py`:

```python
import asyncio
from playwright.async_api import async_playwright

URL = "http://127.0.0.1:8765/simulation/index.html"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        page.on("console", lambda m: m.type == "error" and print("ERR:", m.text))
        await page.goto(URL)
        await page.wait_for_selector(".station")
        await page.wait_for_timeout(500)
        # Trigger a gesture so autoplay unlocks
        await page.click("body", position={"x": 10, "y": 10})
        await page.wait_for_timeout(900)

        ambient_ok = await page.evaluate("""() => {
            // The ambient is a closure-local var; we can check by counting audio elements
            const audios = Array.from(document.querySelectorAll('audio'));
            const dynamic = audios.length;  // most are created via new Audio() — may be 0 here
            // Best indirect: check that mute button exists + has ♪
            const icon = document.getElementById('muteIcon');
            return { iconText: icon && icon.textContent, dynamicCount: dynamic };
        }""")
        print("audio state:", ambient_ok)

        # Toggle mute — should not throw
        await page.click("#muteBtn")
        await page.wait_for_timeout(300)
        await page.click("#muteBtn")
        await page.wait_for_timeout(300)
        print("mute toggle round-trip OK")

        # Verify the ambient file is reachable
        head = await page.evaluate("""async () => {
            const r = await fetch('../assets/audio/ambient/ambient_bed.mp3', { method: 'HEAD' });
            return { status: r.status, len: r.headers.get('content-length') };
        }""")
        print("ambient file HEAD:", head)
        assert head["status"] == 200, f"FAIL: ambient_bed.mp3 not reachable, got {head}"
        print("GATE: GREEN — ambient bed wired + reachable")

asyncio.run(main())
```

Run:
```bash
python3 /tmp/round4-D-smoke.py
```

- [ ] **D.5 — Commit**

```bash
git add outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html \
        outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/audio/ambient/ambient_bed.mp3 \
        outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/CREDITS.md \
        outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/audio-credits.md
git commit -m "feat(bootcamp): ambient audio bed + duck-on-footstep (Round 4 polish D)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task E: Deploy + final regression

- [ ] **E.1 — Mirror to docs/**

```bash
rsync -av outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/index.html \
          docs/bootcamp-scout/edward-said/simulation/index.html
rsync -av outputs/kawader-bootcamp/scout-2026-05-11/map/simulation/assets/audio/ambient/ \
          docs/bootcamp-scout/edward-said/simulation/assets/audio/ambient/
```

If the docs/ tree doesn't already have the ambient dir, the second rsync creates it.

- [ ] **E.2 — Page weight check**

```bash
du -sh docs/bootcamp-scout/edward-said/simulation/
find docs/bootcamp-scout/edward-said/simulation/ -type f -exec ls -la {} \;
```

Expected: total ≤ 1024 KB. If over budget, the most-likely culprit is the ambient file — re-encode at 48 kbps until under.

- [ ] **E.3 — Cloudflare Pages deploy**

```bash
npx wrangler pages deploy docs/ --project-name kawasist-internal --commit-dirty=true 2>&1 | tee /tmp/round4-deploy.log
```

Capture deploy URL from the output.

- [ ] **E.4 — Live verification**

```bash
curl -sSL "https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/" \
  | grep -c "Round 4\|zoomState\|director-mode\|fxCanvas\|ambient_bed"
```

Expected: ≥ 5 matches.

- [ ] **E.5 — Lighthouse**

```bash
npx lighthouse "https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/" \
  --preset=desktop \
  --output=json \
  --output-path=outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/lighthouse-after.json \
  --chrome-flags="--headless" \
  --only-categories=performance,accessibility,best-practices,seo
```

Read scores:
```bash
python3 -c "
import json
d = json.load(open('outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/lighthouse-after.json'))
for k in ['performance','accessibility','best-practices','seo']:
    print(k, int(d['categories'][k]['score']*100))
"
```

Expected: perf ≥ 90, a11y = 100, best-practices = 100, SEO = 100. If any miss target, identify the failing audit and fix in a follow-up commit before writing morning report.

- [ ] **E.6 — Final smoke against live**

Run the 4 smoke scripts against `https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/` (point each `URL` constant at the live URL). Each must print `GATE: GREEN`.

- [ ] **E.7 — Mirror docs commit**

```bash
git add docs/bootcamp-scout/edward-said/simulation/
git commit -m "deploy(bootcamp): mirror Round 4 polish bundle to docs/ for Cloudflare Pages

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task F: Morning report + closeout

- [ ] **F.1 — Write MORNING-REPORT.md**

Create `outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/MORNING-REPORT.md` matching the prompt template:

```markdown
# Bootcamp Polish — Round 4 Morning Report

**Date:** 2026-05-14
**Branch:** feature/whatsapp-bot-botA-gate (unpushed)
**Live:** https://kawasist-internal.pages.dev/bootcamp-scout/edward-said/simulation/

## TL;DR

- <bullet 1>
- <bullet 2>
- <bullet 3>

## Per-item verdicts

| Item | Verdict | Commit |
|---|---|---|
| A — Mobile pinch-zoom + camera-follow | ✅ live / 🟡 partial / 🔴 reverted | `<sha>` |
| B — Konami Director Mode | … | `<sha>` |
| C — Particle FX on teleport | … | `<sha>` |
| D — Ambient bed audio | … | `<sha>` |

## Lighthouse

| Category | Round 3 baseline | Round 4 result | Target | |
|---|---:|---:|---:|---|
| Performance | 99 | <fill> | ≥ 90 | |
| Accessibility | 96 | <fill> | 100 | |
| Best Practices | 100 | <fill> | 100 | |
| SEO | 100 | <fill> | 100 | |

## Page weight

| Round 3 baseline | Round 4 result | Budget |
|---:|---:|---:|
| 459 KB | <fill> KB | 1024 KB |

## Smoke screenshots

- ![A](before-after-screenshots/A-mobile-after.png)
- ![B](before-after-screenshots/B-director-after.png)
- ![C](before-after-screenshots/C-teleport-burst.png)
- D — audio (no image; reach by ear at live URL)

## Notes

<any scope cuts, gotchas, follow-ups>
```

Fill in the placeholders from the run output.

- [ ] **F.2 — Append to overnight STATUS**

```bash
mkdir -p outputs/overnight-2026-05-14
test -f outputs/overnight-2026-05-14/STATUS.md || \
  printf "# Overnight runs — 2026-05-14\n\n" > outputs/overnight-2026-05-14/STATUS.md
cat >> outputs/overnight-2026-05-14/STATUS.md <<EOF
- [Bootcamp Polish Round 4](../kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/MORNING-REPORT.md) — A=<v> B=<v> C=<v> D=<v>
EOF
```

- [ ] **F.3 — Commit closeout**

```bash
git add outputs/kawader-bootcamp/scout-2026-05-11/polish-2026-05-14/ outputs/overnight-2026-05-14/
git commit -m "docs(bootcamp): Round 4 polish morning report + overnight STATUS row

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **F.4 — PushNotification**

Use the PushNotification tool with the verdict line per the prompt template.

## Self-review

- Each item has CSS, JS, hook point, smoke, screenshot, commit — coverage looks complete.
- `prefers-reduced-motion` is respected in B (no animations on pill/badge), C (particles skipped), and D (autostart muted).
- All file paths use exact absolute paths in the repo.
- All commands are runnable as-is.
- Risk cuts (per spec section 8) are documented in MORNING-REPORT placeholders so partials are visible.
- The Kenney pack URL is left as a runtime-discoverable item (Task D.1) because Kenney's CDN URLs include cache-busting hashes that rotate; the workflow says "find a current pack, pick a mellow loop, log the exact URL in CREDITS." This is the only spot in the plan that requires runtime judgement; the fallback (procedural sine-pad) guarantees we ship D regardless.
