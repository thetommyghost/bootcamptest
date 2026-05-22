# Deployment

The Cloudflare Pages project, KV namespace, and GitHub repo are all already provisioned. Deploying is one command.

## What's wired up

| Resource | Value |
|---|---|
| GitHub repo | https://github.com/management-art/kawader-bootcamp-app (private) |
| Cloudflare Pages project | `kawader-bootcamp-app` |
| Staging URL | https://kawader-bootcamp-app.pages.dev |
| KV namespace title | `BOOTCAMP_APP_NOTES` |
| KV namespace id | `e31b5b7202814dba8700b3e8d8b55b7c` |
| KV binding in code | `env.NOTES_KV` |

The KV id is already in `wrangler.toml`. You don't need to set anything up.

## Deploying

```bash
npm install                  # one-time, installs wrangler + playwright
npx wrangler login           # one-time, opens browser to authenticate
npm run deploy               # = wrangler pages deploy . --project-name kawader-bootcamp-app
```

Each deploy gets a unique preview URL (`<hash>.kawader-bootcamp-app.pages.dev`) and updates the production alias.

## Verifying

After your first deploy:

```bash
curl -s https://kawader-bootcamp-app.pages.dev/src/simulation/index.html | head -3
```

Then open the simulation in a browser, press `N`, drop a note. Refresh — the note should still be there. If it isn't, the KV binding in the Cloudflare dashboard might not be linked. Check **Pages → kawader-bootcamp-app → Settings → Functions → KV namespace bindings** and confirm `NOTES_KV` points to namespace id `e31b5b7202814dba8700b3e8d8b55b7c`.

> Cloudflare requires KV bindings to be set in both `wrangler.toml` **and** the dashboard for Pages Functions. The first deploy auto-creates this binding from `wrangler.toml`. If it doesn't, set it manually once.

## Local development

Two options:

```bash
# Static-only (notes save to localStorage, no KV sync)
python3 -m http.server 8765
open http://127.0.0.1:8765/src/simulation/index.html

# Full stack with KV emulator (notes round-trip the function)
npx wrangler pages dev . --kv NOTES_KV
# then open http://localhost:8788/src/simulation/index.html
```

`wrangler pages dev` is the right choice when you're debugging anything involving `/api/notes`.

## Rolling back

```bash
npx wrangler pages deployment list --project-name kawader-bootcamp-app
```

Pick a previous deployment hash and use the Cloudflare dashboard's Rollback button on it.

## Custom domain (optional)

If you want `bootcamp.kawader-cine.com` instead of `.pages.dev`:

1. Cloudflare dashboard → Pages → kawader-bootcamp-app → Custom domains → Add.
2. Add a CNAME record pointing to `kawader-bootcamp-app.pages.dev`.
3. Wait for SSL provisioning (~5 min).

Don't do this until Ameer asks. The `.pages.dev` URL is fine for development and even for sharing with campers during the camp.

## Forking the KV namespace (only if you need an isolated dev environment)

If you want a personal KV that doesn't mix with the shared staging notes, create your own:

```bash
npx wrangler kv namespace create MY_BOOTCAMP_NOTES
# Copy the id from the output, then edit wrangler.toml:
# id = "<your-new-id>"
```

Then redeploy. Don't commit that change to `main` — keep it on a personal branch.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `wrangler login` opens but page won't load | VPN / proxy interfering | Disable VPN, retry |
| `kv_unavailable` in browser console | Dashboard binding missing | Pages → Settings → Functions → KV bindings (see above) |
| Notes save locally but disappear in another browser | Same as above | Same fix |
| `404 on /api/notes` | Function not deployed | `functions/` must be at repo root, not under `src/` |
| Avatar walks but no photos load | You served `src/` instead of repo root | Always `python3 -m http.server` from repo root |
