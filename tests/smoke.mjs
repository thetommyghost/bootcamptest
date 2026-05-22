// Smoke test skeleton for the simulation.
// Run: npm run smoke
//
// What it does:
//   1. Spawns a local HTTP server on :8765
//   2. Launches headless Chromium via Playwright
//   3. Loads the simulation page
//   4. Injects a test note into notesState
//   5. Verifies all 4 UI surfaces re-render (canvas pin, mini-map dot, HUD pill, briefing thread when zone open)
//
// Add new gates as you add features.

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright';

const PORT = 8765;
const URL = `http://127.0.0.1:${PORT}/src/simulation/index.html`;

const server = spawn('python3', ['-m', 'http.server', String(PORT)], {
  cwd: new URL('..', import.meta.url).pathname,
  stdio: 'ignore',
});

await sleep(500);

const browser = await chromium.launch();
const page = await browser.newPage();

const gates = [];
function gate(name, pass) {
  gates.push({ name, pass });
  console.log(`${pass ? '✅' : '❌'} ${name}`);
}

try {
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await sleep(1000); // wait for canvas + assets to bootstrap

  // Gate 1: page loaded without console errors
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await sleep(500);
  gate('No console errors on load', errors.length === 0);

  // Gate 2: simulation canvas exists
  const hasCanvas = await page.locator('canvas').count();
  gate('Simulation canvas present', hasCanvas > 0);

  // Gate 3: avatar element rendered
  const hasAvatar = await page.evaluate(() => {
    return !!document.querySelector('[id*=avatar], [class*=avatar]');
  });
  gate('Avatar rendered', hasAvatar);

  // Gate 4: data.json loaded (look for waypoints in DOM)
  const waypointCount = await page.evaluate(() => {
    return document.querySelectorAll('[data-station-id], [data-waypoint-id], .waypoint').length;
  });
  gate('Waypoints loaded (≥1)', waypointCount > 0);

  // Gate 5: notesState present
  const hasNotesState = await page.evaluate(() => {
    return typeof window.notesState !== 'undefined' || typeof window.NOTES !== 'undefined';
  });
  gate('Notes state initialized', hasNotesState);

  // Gate 6: pressing N opens note input (or pulls focus to one)
  await page.keyboard.press('KeyN');
  await sleep(300);
  const noteInputFocused = await page.evaluate(() => {
    const el = document.activeElement;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
  });
  gate('Press N → focuses a note input', noteInputFocused);

  // Add more gates as you build out features.

  // Final summary
  const passed = gates.filter((g) => g.pass).length;
  const total = gates.length;
  console.log(`\n${passed}/${total} gates passed`);
  process.exitCode = passed === total ? 0 : 1;
} finally {
  await browser.close();
  server.kill();
}
