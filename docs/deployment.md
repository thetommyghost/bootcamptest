# Deployment guide

This walks you through setting up **your own** Cloudflare Pages project from scratch. You'll get a unique URL (e.g. `bootcamp-map-trainee.pages.dev`) that you control, separate from the production URL.

## One-time setup (~15 minutes)

### Step 1 — Install wrangler

```bash
npm install     # installs wrangler from package.json devDependencies
npx wrangler --version
# Expected: wrangler 3.x or 4.x
```

If `npm install` complains, install wrangler globally instead:

```bash
npm install -g wrangler
wrangler --version
```

### Step 2 — Log into Cloudflare

```bash
npx wrangler login
```

A browser tab opens. Approve. Ameer will have invited you to the Kawader Cloudflare team (or given you a personal account) — pick that one. Verify:

```bash
npx wrangler whoami
```

### Step 3 — Create the Pages project

Pick a project name. Suggestion: `bootcamp-map-<yourname>` so it doesn't collide with the production project.

```bash
npx wrangler pages project create bootcamp-map-trainee --production-branch main
```

Note the output URL — that's your live preview address.

### Step 4 — Create the KV namespace for notes

```bash
npx wrangler kv:namespace create NOTES_KV
```

Output looks like:

```
🌀 Creating namespace with title "bootcamp-interactive-map-NOTES_KV"
✨ Success!
Add the following to your configuration file:
[[kv_namespaces]]
binding = "NOTES_KV"
id = "abc123def456..."
```

**Copy that `id` value.** You'll plug it into `wrangler.toml` next.

### Step 5 — Update `wrangler.toml`

Open `wrangler.toml` in the repo root. Replace the `CHANGE_ME` markers:

```toml
name = "bootcamp-map-trainee"                # ← your project name from Step 3
pages_build_output_dir = "."
compatibility_date = "2025-04-01"

[[kv_namespaces]]
binding = "NOTES_KV"
id = "abc123def456..."                       # ← from Step 4 output
```

Optional: also create a preview namespace if you want a separate `preview` environment:

```bash
npx wrangler kv:namespace create NOTES_KV --preview
# then add: preview_id = "xyz789..." under [[kv_namespaces]]
```

### Step 6 — Deploy

```bash
npm run deploy
# = npx wrangler pages deploy . --project-name bootcamp-map-trainee
```

You'll get a URL like `https://abc1234.bootcamp-map-trainee.pages.dev`. The `.pages.dev` root URL is your stable production alias.

### Step 7 — Verify the deploy

Open your URL and walk through:

```
https://bootcamp-map-trainee.pages.dev/src/simulation/index.html
```

Test that:
- Avatar walks (WASD)
- Click teleports
- Press N → note saves (check Cloudflare dashboard → Workers KV → your namespace → workspace key `edward-said`)
- Refresh — note is still there (proves KV round-trip worked, not just `localStorage`)

If the `N` note doesn't survive a refresh, your KV binding isn't wired. Check:

```bash
npx wrangler pages deployment list --project-name bootcamp-map-trainee
# Then in the Cloudflare dashboard: Pages → your project → Settings → Functions → KV namespace bindings
# Ensure NOTES_KV is bound to your namespace ID.
```

## Day-to-day workflow

After the one-time setup, deploying is one command:

```bash
npm run deploy
```

Each deploy gets a unique preview URL (`<commit-hash>.bootcamp-map-trainee.pages.dev`) and updates the production alias.

## Rolling back

```bash
npx wrangler pages deployment list --project-name bootcamp-map-trainee
# Pick a previous deployment hash
npx wrangler pages deployment tail <deployment-id>
```

Or use the Cloudflare dashboard → Pages → your project → "Rollback" button.

## Custom domain (optional, deferred)

If you want `map.bootcamp.kawader-cine.com` instead of `.pages.dev`:

1. Cloudflare dashboard → your project → Custom domains → Add.
2. Add a CNAME record pointing to `bootcamp-map-trainee.pages.dev`.
3. Wait for SSL provisioning (~5 min).

Don't do this until Ameer asks — the `.pages.dev` URL is fine for trainee work.

## Local testing without deploying

You can run `wrangler pages dev` to test the Pages Function locally:

```bash
npx wrangler pages dev . --kv NOTES_KV
# Then open http://localhost:8788/src/simulation/index.html
# Notes will save to a local KV emulator, not your real KV.
```

This is useful when you're debugging the `/api/notes` endpoint without burning real KV writes.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `wrangler login` opens but page won't load | VPN / proxy interfering | Disable VPN, retry |
| `kv_unavailable` in browser console | NOTES_KV binding missing | Re-check Step 5 + Cloudflare dashboard bindings |
| Notes save locally but disappear in another browser | KV not bound, hitting localStorage only | Same as above |
| `404 on /api/notes` | Function not deployed (wrong folder layout) | `functions/` must be at repo root, not under `src/` |
| Avatar walks but no photos load | You served only `src/` instead of repo root | Always `python3 -m http.server` from repo root |
