# HaDay · Hebraic Mentor

Biblical Hebrew vocabulary trainer for first-year students (BIBL 630).

- Game, study, and listen modes
- Tanakh follow-along: all 39 books, recorded Hebrew
- Each classmate creates an account; progress stays with that account

Class site: [https://haday.vercel.app](https://haday.vercel.app)

## Auto-deploy (Vercel)

This repo is the source of truth. Once Vercel is linked to [adeyholar/haday](https://github.com/adeyholar/haday), every push to `main` rebuilds [haday.vercel.app](https://haday.vercel.app).

Connect the existing class project (keeps the same URL):

1. Open [Import adeyholar/haday](https://vercel.com/new/import?s=https://github.com/adeyholar/haday).
2. Choose the existing **haday** project if Vercel offers it. Otherwise import as `haday` and assign the domain `haday.vercel.app`.
3. Leave the root directory empty.
4. Production branch: `main`. Auto-deploy stays on.

Keep these project env vars:

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `BETTER_AUTH_URL` | `https://haday.vercel.app` |
| `BETTER_AUTH_SECRET` | existing secret — do not rotate unless sign-in is broken |

After the first linked deploy, [https://haday.vercel.app/listen](https://haday.vercel.app/listen) should list **Tanakh · all 39 books**.

## Scripts

- `npm run dev` — local app
- `npm run build` — production build + database migrate
- `npm run typecheck` — TypeScript check
