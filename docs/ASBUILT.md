# HaDay as-built

Living picture of **what the class site is today**. Not a wish list.

| | |
|---|---|
| **Class site** | https://hadayhebbraimentor.jcdisn.com |
| **Old Vercel URL** | https://haday.vercel.app — signpost only; not the app |
| **Repo** | https://github.com/adeyholar/haday (`main`) |
| **Host** | Azure Web App `haday` (Linux container) + Azure Postgres `haday-pg` |
| **Course** | BIBL 630 · *Basics of Biblical Hebrew*, 3rd ed. |
| **Snapshot** | 7 September 2026 |

Each shipped upgrade is recorded on the Notion Change Log, which is the documentation source of truth:

https://app.notion.com/p/3f6058f607b18180a6eeebbcc2180697

Developer Handbook: https://app.notion.com/p/3f6058f607b18144a482f8173456df2a

This file is the older picture of the running app. If it disagrees with Notion, Notion wins. If it disagrees with the code, correct Notion the same day.

---

## What classmates get

| Area | What it does | Why it helps |
|---|---|---|
| **Study** | **Stations** (five stops from alef-bet to the Word), Drill, **Weak pool**, Write, Quiz, Rules, Match, Lexicon, Alef-bet lesson, Zakhor, Grammar lessons | Path: Alef-bet Station → House of Names → Verb Tent → Many Voices Camp → Realm of the Word. Text first, rule last. Drill studies each word (Hebrew and the meaning together), then asks it every way in groups of five. Leave and Continue where you stopped, or Start over. One saved place per week and focus. The weak pool is every weak word, one sitting, and it continues if you leave. |
| **Game** | BBH path Ch. 1–19, Custom mix, Aleph-bet, Ocean letters, Syllables, Nouns, Article & vav, **Grammar exams** (prep → numbers and Verbs & binyan), Ultimate, **Road exam · Week 7**, **Road exam · Week 15** | Grammar Game is closed-book. Prepare in Study first. **90%** to clear. Both road exams are spoken: say the letter or the English word. A right answer turns green. A miss says Not quite and returns to the back. No clap or horn. Week 7 is chapters 2–11. Week 15 is every class lemma, chapters 2–19. Each circle is saved on its own. |
| **Listen · Vocabulary** | Isolated Eliran lexeme when we have it, else TTS, then English | Car / iPad. *Avraham*, then Abraham. Loop one chapter, a mix of chapters, or the whole list. **Owner recordings** play first when present. Neural Hebrew is Hebrew-only (vowel **names**, no digits). |
| **Listen · On the road** | One course week. Hebrew, then the meaning, same clips and pace as Drill (`speakRoadCard` at 0.85). The week repeats. Lock-screen skip. | `/listen/road`. Listen menu, the Listen page, and the BBH home card. |
| **Listen · Alive Pet** | Companion recites class lemmas; owner voice when recorded | Personalization data = Voice bank. Weak lemmas first. |
| **Listen · Tanakh** | All **39 books / 929 chapters**. Follow-along highlight. **Tap a word** for a grammar card. **Echo** the verse (hear / record / hear both). **Ask** HaDay about the open verse. | Recorded Shmuelof audio. Book, chapter, or verse range. |
| **Ask HaDay Hebraic AI** | Questions from the lesson | Clarify without leaving the app. Claude or Grok, capped before the paid call. A failed quota check does not call the model. |
| **Suggest a feature** | Class inventory | Owner reviews: new → planned → building → shipped. |
| **Search** | The doors page, privacy, and credits are the public pages. They render their text without waiting for sign-in. `robots.txt` blocks `/admin` and `/api/`. `sitemap.xml` lists only those three pages. Other pages send `X-Robots-Tag: noindex`. The share title is the full product title. An Azure host 301s to the class site, except `/api/health`. | No textbook pages and no answer keys on a public page. |
| **Account** | Google, X, or email + password | Progress stays with the account. Old Vercel logins do **not** carry over. |

Pass a stage at **90%**. Honor badges and a class leaderboard sit under More.

---

## Listen (as built)

**Vocabulary.** Playback order: owner Voice-bank take → neural clip (loudness-matched; Hebrew gained so it is not quieter than English) → isolated Eliran lexeme → TTS.

**Swap engine.** Download `/audio/neural/corpus.txt`. Synthesize `{id}.he.mp3` / `{id}.en.mp3`. Put them in `public/audio/neural/inbox/`. `python3 scripts/voice-import.py` normalizes and rebuilds the manifest.

**Tanakh follow-along.** Nikkud text is `public/tanakh/books/*.json`. Word intervals are `public/tanakh/align/*.json` with `engine: "mfa-kaldi-v1"` for every chapter. Audio is Mechon Mamre MP3s (Genesis 1–5 also local). Highlight uses the spoken interval, not a guessed clock lead.

Passage picker: whole book, one chapter, or a continuous verse range.

---

## Accounts and mail

| Piece | As built |
|---|---|
| Sign-in | Google, X (Grok broker), email + password |
| New email accounts | Domain must accept mail; no throwaway inbox; classmate opens a 24-hour confirmation link before sign-in |
| Reset | Forgot password emails a one-hour link. The link always opens on the class site. A request header cannot point it somewhere else. |
| Roster | Owner sees names, last login, last study, sign-in method, mail confirmed or waiting, visitor country (from IP on Azure). Last study moves when they answer Quiz, Quiz myself, Rules, or another study task — not from signing in. **Remove** deletes an unwanted account (not the owner). |
| Voice bank | Owner records Hebrew / English takes of the corpus (letters, vowels, names, lemmas). Alive Pet, Listen, and Ocean letters use them first. Neural Hila/Jenny fills every line that has no owner take. Corpus text: `/audio/neural/corpus.txt`. |
| **Tanakh cards** | `/finder` hub: **Find a Hebrew word** (every verse) + grammar decks. `/finder/word` concordance. `/finder/deck` flashcards. | Flip, then open the verse in Listen/Read. English gloss is marked to the Hebrew in focus. |
| Email reset | Owner can send or copy a link; **Revoke** / **Revoke all** kills it immediately |
| Flood cap | Forgot password: one live token per person; a few mails per address and network per 15 minutes |
| Privacy | Public `/legal` — what we store, that we do not sell it, local/international disclaimer, 13+ |
| Credits | Public `/credits` — Shmuelof / Talking Bibles / Mechon Mamre audio, WLC, WEB, OSHB, Eliran Wong, MFA |

Mailer settings (Azure): `SMTP_USER`, `SMTP_PASS` (Gmail App password), `MAIL_FROM`. Optional Resend / SendGrid instead.

Mailer settings (Azure): `SMTP_USER`, `SMTP_PASS` (Gmail App password), `MAIL_FROM`. Optional Resend / SendGrid instead.

---

## Data on disk

| Path | Role |
|---|---|
| `src/lib/vocab.ts` | BBH 3rd-ed. class lemmas (source of truth for Game and Study) |
| Study cards | A save keeps lemma ids, `ch1-` letters, `alef:` letter and vowel cards, and `tv:` Tanakh forms. A junk key is dropped. A real card of those kinds is not. |
| `src/lib/vocab-clips.json` | One Shmuelof clip per lemma (`scripts/vocab-clips.py`) |
| `public/tanakh/books/` | Westminster Leningrad nikkud + WEB English |
| `public/tanakh/align/` | Kaldi MFA word / phone times, 929/929 |
| `scripts/mfa-align-tanakh.py` | Murillo-style MFA runner (resume skips finished chapters) |
| `migrations/*.sql` | Auth, study, game, leaderboard, visits, handwriting, ideas, existing-user emailVerified backfill, voice bank |

Postgres on Azure holds users, sessions, progress, ideas, visits. Local preview uses PGLite.

---

## How to keep this current

When a feature ships to `main`:

1. **Notion Change Log** — newest row at the top. What changed, why, the pull request, and what must not be reversed.
2. **Developer Handbook** — the section that would now be false.
3. **This file** — the section that describes that running behavior.
4. **In-app Guide** — only if a student would follow the old words.
5. Do not add a new entry to `CHANGELOG.md`. That file is the archive.

In-app **Suggest a feature** is the student list. This file is the engineering picture of what actually runs. The next four builds (tap-word, echo verse, Ask on this verse, pronunciation later) live in [ROADMAP.md](ROADMAP.md).
