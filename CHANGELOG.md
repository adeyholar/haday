# Changelog

Newest first. Class-facing upgrades only — not every alignment batch.

Format: **date** · what shipped · why it matters.

## How to add an entry

When you push a feature to `main`, put a bullet **above** this list. Update [docs/ASBUILT.md](docs/ASBUILT.md) if the current picture changed.

---

## 2026-09-08

- **Ocean letters.** Balloons drop toward the water; a voice calls the letter name; tap the matching glyph before it splashes. Three lives, +1 life per wave (cap 6). Five waves: first line, middle, last, look-alikes, then finals. Streak of four slows the fall. Hear again if the name is missed. Letters or vowels, listen-only (blind), two-player (one hears / one taps), weak marks return, and the first call of each wave is slow and highlighted.

- **Grammar mix, vocab mix stay apart.** Custom mix has two tabs: Vocabulary (BBH lemmas only) and Grammar (topics only). Grammar mix plays open units from the topics you tick. Neither mix unlocks the path.

- **Game menu grouped.** Header Game has one Grammar item (opens the six topics). The in-page Game picker uses native groups — Play, Letters & forms, Grammar — so the list is not a long flat dump on a phone.

- **Grammar topics, not textbook chapters.** Game lists Prepositions, Adjectives, Pronouns, Existence & nouns, Construct nouns, and Numbers by topic name only. No “Ch. 6–11” labels, so the paths do not look like a reprint of the class book.

## 2026-09-07

- **Grammar topics stand alone.** Game lists Prepositions through Numbers as separate paths — each with its own title, intro, and units.

- **Closer quiz traps.** Recognize and Study quiz now mix look-alikes and same-family glosses (man/woman, sea/water/heaven). Grammar games drop giveaways like “A verb” / “Heaven” for a wrong reading of the same form — compensatory vs regular article, dual vs plural — so the right pick needs a second look.

- **Hebrew letters in explanations.** Learn notes, Rules, and grammar quizzes now name letters with the glyph (ה, א, ש), not English “He / Alef / Shin,” so “He” is never confused with the English pronoun.

- **Grammar topic games.** Six independent paths (see “Grammar topics stand alone” above): original notes, Masoretic verses, class vocab marked. Learn → pair → 12-question quiz. 90% held opens the next unit.

- **Learn · class vocab in the verse.** In the Tanakh cards name the BBH lemma, list other class words in that verse, and add the sample-word verses so the same vocabulary keeps coming back.

- **Weak book.** A Tell me / revealed answer is high weak. A miss after trying is still weak, but less so. High weak lead Daily keep, Drill, and the home Weak book.

- **Tell me.** The old Don’t know button now reads Tell me. First tap asks for one more try before the answer is shown; a second tap (or a miss after that) reveals it.

- **Don’t know on Game.** Same full-width button as Rules, under the answers — not buried under the verse.

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
