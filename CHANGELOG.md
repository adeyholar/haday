# Changelog

Newest first. Class-facing upgrades only — not every alignment batch.

Format: **date** · what shipped · why it matters.

## How to add an entry

When you push a feature to `main`, put a bullet **above** this list. Update [docs/ASBUILT.md](docs/ASBUILT.md) if the current picture changed.

---

## 2026-09-06

- **Gen 3:17 שָׁמַעְתָּ:** silent shewa closes מַעְ; dagesh in תּ is **lene** (silent shewa is not a vowel). Split שָׁ | מַעְ | תָּ — do not cut the tav.
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
