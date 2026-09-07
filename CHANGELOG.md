# Changelog

Newest first. Class-facing upgrades only — not every alignment batch.

Format: **date** · what shipped · why it matters.

## How to add an entry

When you push a feature to `main`, put a bullet **above** this list. Update [docs/ASBUILT.md](docs/ASBUILT.md) if the current picture changed.

---

## 2026-09-07

- **Custom mix.** Under Game, for every student: pick open BBH chapters and play that combined list in one sitting (Recognize, Gloss, or Spell). Chapter 1 starts open. Does not unlock or lock the path.

- **Old Vercel address closed.** [haday.vercel.app](https://haday.vercel.app) now only points classmates to the class site: [hadayhebbraimentor.jcdisn.com](https://hadayhebbraimentor.jcdisn.com). The app itself also refuses to run on `*.vercel.app`.

- **Don’t know on every quiz.** Recognize, Gloss, Spell, Aleph-bet, Syllables, Nouns, Article, Study quiz, Write, Match, Drill, Rules, Classify, closed-book exam, and Ultimate Challenge. The word is shown (except Ultimate, which stays closed-book) and returns later in the round.

## 2026-09-06

- **Spell · strict waits for Check.** No green ring, no “Correct,” no prefix coaching, and the Hebrew is not shown until you submit. Lenient still grades as you type.
- **Article & vav game (Ch. 5):** six units — definite vs indefinite, ordinary הַ + dagesh, guttural spellings (הָ / הַ / הֶ), dropped dagesh and vowel-changing nouns, conjunction וְ (bump, hateph, וֵאלֹהִים), then Tanakh reading. Pair the form, then 12 questions from a large pool with review from earlier units. Week 3 study still reads chapters 4 and 5 together; games stay chapter by chapter. Grammar to live by now hunts the same prefixes.
- **Email confirmation:** new email-and-password accounts must open a 24-hour link. Throwaway inboxes and domains that cannot receive mail are blocked. Existing classmates stay signed in.
- **Roster remove:** the course owner can remove an unwanted account (not their own, not another owner). Progress, sessions, and ideas for that person go with it.
- **Privacy and disclaimer:** a public page at `/legal` — we do not sell data; Indiana operator; not legal advice; 13+. Sign-up asks you to read it.
- **Quiz pools:** syllabus (syllables + nouns) and Grammar to live by draw 12 from a large pool and skip the last two rounds in this sitting, so the same twelve do not return immediately.
- **Visitor country on Azure** — looks up the classmate’s IP (Vercel’s country header is gone). Blank rows fill on the next visit.
- **As-built docs** live in GitHub (`docs/ASBUILT.md` + this file) so each upgrade has a place to land.
- **Revoke reset links** on the class roster; no need to wait out the hour. Forgot password is capped so a flood cannot fill Gmail.
- **Gmail** sends password-reset mail (`SMTP_USER` / `SMTP_PASS` / `MAIL_FROM`).
- **Kaldi MFA follow-along complete:** 929/929 Tanakh chapters (`mfa-kaldi-v1`). 1 Kings 8 and Psalm 119 split at silences so Kaldi would not run out of memory.

## 2026-09-05

- Custom class host: [hadayhebbraimentor.jcdisn.com](https://hadayhebbraimentor.jcdisn.com).
- Email + password accounts, Forgot password, class roster, last-resort copy-link if mail is off.
- Azure is the class host (Postgres + container). Old Vercel accounts do not carry over.
- Follow-along highlight stays on the spoken word interval (Murillo-style), not a clock lead.

## 2026-09 (earlier)

- Full Tanakh in Listen: book, chapter, or verse range. Genesis–Chronicles audio from Mechon Mamre / Shmuelof.
- Game path BBH Ch. 1–19, 90% to clear a stage, citation lemmas only.
- Study: Drill, Write, Quiz, Match, Rules, Lexicon, Alef-bet, Zakhor.
- Ask HaDay Hebraic AI; Suggest a feature inventory.
- Syllable, noun, and aleph-bet games; Ultimate Challenge.
