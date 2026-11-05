# Next Stop: Asia

*Two countries. One unforgettable trip.* An interactive travel site that helps a private group of friends choose between Thailand and Malaysia for May 2027, ending in a shared, persistent vote. All user-facing content is in Spanish.

## Quick start

```bash
pnpm install
pnpm dev        # http://localhost:5173, demo voting, no cloud needed
```

| Command | What it does |
| --- | --- |
| `pnpm dev` | Web app with the local-only demo voting adapter |
| `pnpm dev:full` | Web app plus the real API handlers (in memory), so voting works across browsers |
| `pnpm build` | Production build of the web app and the API bundle |
| `pnpm test` | Unit and integration tests (the Table repository runs against a local Azurite emulator) |
| `pnpm test:e2e` | Playwright journeys on desktop and mobile. First run: `pnpm --filter @nsa/web exec playwright install chromium` |
| `pnpm typecheck`, `pnpm lint` | Static checks |

In `pnpm dev:full` sign-in uses a local form instead of Google. The admin account is `admin@example.com`; invite other addresses from `/admin`. This stand-in exists only in the local dev server.

## Layout

```
apps/web         React + Vite front end, one folder per feature under src/features
apps/api         Azure Functions (v4 model). service.ts holds all the logic; main.ts is a thin adapter
packages/shared  Zod schemas, API types and vote aggregation used on both sides
infra            Bicep template and explicit deployment scripts
scripts          Image pipeline: curated Wikimedia Commons files become WebP + attribution manifest
docs             Deployment, cost and security notes
```

## Key decisions

- **Same-origin API through a Vercel rewrite.** Browsers increasingly block third-party cookies, so a session cookie set by `*.azurewebsites.net` for a `*.vercel.app` page would not work reliably (notably on Safari). `/api/*` is rewritten to the Function App, which makes the cookie first-party.
- **Invite-only Google sign-in.** The browser gets an ID token from Google, the API verifies it, checks the invitation list and sets its own session cookie. Votes, results and names require a session. The destination guides are public static content.
- **Shared budget.** Signed-in friends replace the editorial estimates item by item. Each edit is one table row, so only the changed price can conflict. Trip length, travelers and comfort stay personal.
- **One Table Storage partition per group.** Vote rows are keyed by participant, so "one active vote per participant" holds by construction, and ETags guard updates. See the comment in `apps/api/src/table-repository.ts`.
- **Handlers are framework-free.** Tests and the dev server call the same `execute()` that Azure Functions does.
- **Admin endpoints are under `/api/manage/*`**, because the Azure Functions host refuses routes that start with `admin`. Only the real host reveals this, so `func start` is worth running after touching routes.
- **Adaptive polling** instead of SignalR: 15 s while the vote is on screen, 60 s otherwise, paused in hidden tabs.
- **No Recharts.** Every chart here is a simple bar, which CSS handles at no bundle cost.
- **Images are self-hosted** from `apps/web/public/images`. Rebuild them with `node scripts/fetch-images.mjs` after editing `scripts/image-sources.json`.
- **Map tiles** come from OpenFreeMap, which needs no key. If it were unavailable the map shows a fallback and the stop list keeps working.

## Next steps

Deployment needs an Azure subscription and a Vercel project: see [docs/deployment.md](docs/deployment.md). Security limits, including what anonymous voting cannot guarantee, are in [docs/security.md](docs/security.md).
