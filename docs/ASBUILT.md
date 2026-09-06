# HaDay as-built

Living picture of **what the class site is today**. Not a wish list.

| | |
|---|---|
| **Class site** | https://hadayhebbraimentor.jcdisn.com |
| **Repo** | https://github.com/adeyholar/haday (`main`) |
| **Host** | Azure Web App `haday` (Linux container) + Azure Postgres `haday-pg` |
| **Course** | BIBL 630 · *Basics of Biblical Hebrew*, 3rd ed. |
| **Snapshot** | 6 September 2026 |

Each shipped upgrade: add a row in [CHANGELOG.md](../CHANGELOG.md) and edit the section here that changed.

---

## What classmates get

| Area | What it does | Why it helps |
|---|---|---|
| **Study** | Drill, Write, Quiz, Rules, Match, Lexicon, Alef-bet lesson, Zakhor | Same BBH lemmas as class. Misses come back. Daily keep so new chapters do not bury old ones. |
| **Game** | BBH path Ch. 1–19, Aleph-bet, Syllables, Nouns, Ultimate Challenge | Stages unlock in order. **90%** to clear a stage. Citation form only (יָם, not בַּיָּם). |
| **Listen · Vocabulary** | Isolated Eliran lexeme when we have it, else TTS, then English | Car / iPad. *Avraham*, then Abraham. Loop one chapter or the whole list. |
| **Listen · Tanakh** | All **39 books / 929 chapters**. Follow-along highlight | Recorded Shmuelof audio. Book, chapter, or verse range (e.g. Genesis 2:7–10). |
| **Ask HaDay Hebraic AI** | Questions from the lesson | Clarify without leaving the app. |
| **Suggest a feature** | Class inventory | Owner reviews: new → planned → building → shipped. |
| **Account** | Google, X, or email + password | Progress stays with the account. Old Vercel logins do **not** carry over. |

Pass a stage at **90%**. Honor badges and a class leaderboard sit under More.

---

## Listen (as built)

**Vocabulary.** Hebrew as an isolated lexeme from Open Hebrew Bible (Eliran Wong, CC BY-NC) when the citation form is in Genesis (**275** lemmas, BHS word index, vowels/dagesh preferred so Isaac is the name not “he laughed”). Otherwise TTS. Lingua Libre is not used. Prefixes are not clipped. Tanakh sentence-cuts are not used here.

**Tanakh follow-along.** Nikkud text is `public/tanakh/books/*.json`. Word intervals are `public/tanakh/align/*.json` with `engine: "mfa-kaldi-v1"` for every chapter. Audio is Mechon Mamre MP3s (Genesis 1–5 also local). Highlight uses the spoken interval, not a guessed clock lead.

Passage picker: whole book, one chapter, or a continuous verse range.

---

## Accounts and mail

| Piece | As built |
|---|---|
| Sign-in | Google, X (Grok broker), email + password |
| New email accounts | Domain must accept mail; no throwaway inbox; classmate opens a 24-hour confirmation link before sign-in |
| Reset | Forgot password emails a one-hour link (Gmail SMTP on Azure) |
| Roster | Owner sees names, last login, last study, sign-in method, mail confirmed or waiting, visitor country (from IP on Azure). **Remove** deletes an unwanted account (not the owner). |
| Email reset | Owner can send or copy a link; **Revoke** / **Revoke all** kills it immediately |
| Flood cap | Forgot password: one live token per person; a few mails per address and network per 15 minutes |
| Privacy | Public `/legal` — what we store, that we do not sell it, local/international disclaimer, 13+ |

Mailer settings (Azure): `SMTP_USER`, `SMTP_PASS` (Gmail App password), `MAIL_FROM`. Optional Resend / SendGrid instead.

Mailer settings (Azure): `SMTP_USER`, `SMTP_PASS` (Gmail App password), `MAIL_FROM`. Optional Resend / SendGrid instead.

---

## Data on disk

| Path | Role |
|---|---|
| `src/lib/vocab.ts` | BBH 3rd-ed. class lemmas (source of truth for Game and Study) |
| `src/lib/vocab-clips.json` | One Shmuelof clip per lemma (`scripts/vocab-clips.py`) |
| `public/tanakh/books/` | Westminster Leningrad nikkud + WEB English |
| `public/tanakh/align/` | Kaldi MFA word / phone times, 929/929 |
| `scripts/mfa-align-tanakh.py` | Murillo-style MFA runner (resume skips finished chapters) |
| `migrations/*.sql` | Auth, study, game, leaderboard, visits, handwriting, ideas, existing-user emailVerified backfill |

Postgres on Azure holds users, sessions, progress, ideas, visits. Local preview uses PGLite.

---

## How to keep this current

When a feature ships to `main`:

1. **CHANGELOG.md** — newest date at the top. One short bullet: what classmates can do now.
2. **This file** — change only the section that is no longer true (table row, count, URL).
3. Do not leave the as-built ahead of production. Azure deploys from `main`.

In-app **Suggest a feature** is the student list. This file is the engineering picture of what actually runs.
