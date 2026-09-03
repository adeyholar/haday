# HaDay · Hebraic Mentor

Biblical Hebrew vocabulary trainer for first-year students (BIBL 630).

- Game, study, and listen modes
- Tanakh follow-along: all 39 books, recorded Hebrew
- Each classmate creates an account; progress stays with that account

Class site: [https://haday.vercel.app](https://haday.vercel.app)

## Update the class site

The live class URL only changes when Vercel rebuilds from this repo.

1. Open [Vercel](https://vercel.com) and select the **haday** project.
2. Connect Git to [adeyholar/haday](https://github.com/adeyholar/haday). Leave the root directory empty (this folder *is* the app).
3. Deploy. When it finishes, [https://haday.vercel.app/listen](https://haday.vercel.app/listen) should list **Tanakh · all 39 books**, not Genesis 1–5.

Keep these project env vars:

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon connection string |
| `BETTER_AUTH_URL` | `https://haday.vercel.app` |
| `BETTER_AUTH_SECRET` | existing secret — do not rotate unless sign-in is broken |

## Scripts

- `npm run dev` — local app
- `npm run build` — production build + database migrate
- `npm run typecheck` — TypeScript check
