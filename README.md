# HaDay · Hebraic Mentor

Biblical Hebrew vocabulary trainer for first-year students (BIBL 630).

- Game, study, and listen modes
- Tanakh follow-along: all 39 books, recorded Hebrew
- Each classmate creates an account; progress stays with that account

Class site today: [https://haday.vercel.app](https://haday.vercel.app)

## Publish on Azure (recommended if you already have compute)

The app runs as a Linux container. Use **App Service** or **Container Apps** — student / pay-as-you-go credits work. This is not blocked by Vercel’s free plan.

### App Service from this GitHub repo

1. In Azure Portal, create a **Web App**: Linux, **Docker Container**, new or existing App Service plan.
2. **Deployment Center** → GitHub → **adeyholar/haday** → branch `main` → Dockerfile at the repo root.
3. **Configuration → Application settings** (same names as Vercel):

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `BETTER_AUTH_URL` | Your Azure URL, e.g. `https://haday.azurewebsites.net` |
| `BETTER_AUTH_SECRET` | Long random string (keep it private) |
| `VITE_AUTH_ENABLED` | `true` |
| `WEBSITES_PORT` | `8080` |

4. Save and restart. Classmates use the `*.azurewebsites.net` address (or a custom domain you attach).

That GitHub connection auto-rebuilds Azure on every push to `main`.

## Auto-deploy (Vercel)

Hobby is enough. The class URL is stale because the **haday** project is not linked to this repo — not because of the free plan.

1. Open [Import adeyholar/haday](https://vercel.com/new/import?s=https://github.com/adeyholar/haday).
2. Choose the existing **haday** project if Vercel offers it. Otherwise import as `haday` and assign `haday.vercel.app`.
3. Leave the root directory empty. Production branch: `main`.

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `BETTER_AUTH_URL` | `https://haday.vercel.app` |
| `BETTER_AUTH_SECRET` | existing secret — do not rotate unless sign-in is broken |

## Scripts

- `npm run dev` — local app
- `npm run build` — production build (Vercel) + database migrate
- `npm run build:azure` — production Node server for Azure/Docker
- `npm run typecheck` — TypeScript check
