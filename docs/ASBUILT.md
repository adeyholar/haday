# HaDay as-built

Living picture of **what the class site is today**. Not a wish list.

| | |
|---|---|
| **Class site** | https://hebrewmentor.haday.app |
| **Previous address** | https://hadayhebbraimentor.jcdisn.com — redirects here |
| **Old Vercel URL** | https://haday.vercel.app — signpost only; not the app |
| **Repo** | https://github.com/adeyholar/haday (`main`) |
| **Host** | Azure Web App `haday` (Linux container) + Azure Postgres `haday-pg` |
| **Course** | BIBL 630 · *Basics of Biblical Hebrew*, 3rd ed. |
| **Check** | The unit tests find files from the repo itself. They do not depend on a fixed machine path. |

Each shipped upgrade is recorded on the Notion Change Log, which is the documentation source of truth:

https://app.notion.com/p/3f6058f607b18180a6eeebbcc2180697

Developer Handbook: https://app.notion.com/p/3f6058f607b18144a482f8173456df2a

This file is the older picture of the running app. If it disagrees with Notion, Notion wins. If it disagrees with the code, correct Notion the same day.

---

## What classmates get

| Area | What it does | Why it helps |
|---|---|---|
| **Study** | **Stations** (five stops from alef-bet to the Word), Drill, **Weak pool**, Write, Quiz, Rules, Match, Lexicon, Alef-bet lesson, Zakhor, Grammar lessons | Path: Alef-bet Station → House of Names → Verb Tent → Many Voices Camp → Realm of the Word. Text first, rule last. Drill studies each word (Hebrew and the meaning together), then asks it every way in groups of five. While a week is open, the student sees cards left in this drill and words left in that week's list (mastered, still to learn, and met). A new card starts clean. A right answer is a short chime. A miss is a soft tick. The clap plays once, when the sitting is done. Play again stops whatever is already sounding, then plays the word through. A tap that leaves with Next does not grade the next word. On a card whose answer is Hebrew, Show me lights the next letter, then names it, the same way as the game. It does not print the word. A word built with that help comes back once and is not scored correct. Leave and Continue where you stopped, or Start over. One saved place per week and focus. The weak pool is every weak word, one sitting, and it continues if you leave. A Study quiz shows a final percent from the first answer only. A corrected second try does not count, in Study or in a Game exam. On Quiz, Weak book is only the missed words, most misses first, and words you know stay out. Due + weak is every word in the week, with the weak and the due first. לֹא is “not (statement).” אַל is “do not (command).” “Not” does not pass for אַל. When a card is marked, the answer is shown. A miss also shows what was written. Try again, before that mark, does not. |
| **Game** | Vocabulary is one menu row. On that page, choose the chapter path or Custom mix. A chapter plays that chapter only. A week plays the open chapters in that week. Aleph-bet, Ocean letters, Syllables, Nouns, Article & vav, **Grammar** (topics stay on the Grammar page), **Verbal System** (a Tanakh root, then a stem, then a conjugation; ten builds, and 90% clears the round; on the Qal perfect, 2ms, 1cs, and 1cp require the accent on the second letter, and 3fs and 3cp require the meteg under the first), **Verb Paradigm Quest** (Qal perfect: only the three root letters are given; the student types every vowel, the ending, the accent on 2ms/1cs/1cp, and the meteg on 3fs/3cp; the meteg is its own key, not the stem of the qamets, and an unfinished word is not told that the meteg is missing; the app does not write vowels onto the root and there is no Show me; the first Check is the grade; a miss comes back once and that card counts, so one miss can still be 90%; the same lab is on the Scripture Path at `/iibs/verb-paradigm-quest`, and Qal imperfect is at `/iibs/qal-imperfect`, so that path stays in its own shell), **Qal Perfect Builder** (first card on the quest, and the first row in the Game menu; all nine forms of one strong or assimilating root, chosen as the two stem vowels and the ending; ת+ת and נ+נ are written once with a dagesh; 2ms, 1cs, and 1cp also require the accent on the second letter, and 3fs and 3cp require the meteg under the first), Ultimate, **Road exam · Week 7**, **Road exam · Week 15**, **Week 7 mock exam**, **Final vocab** | Grammar Game is closed-book. Prepare in Study first. **90%** to clear. The verb paradigm does not play a chime or a clap. Both road exams are spoken: say the letter or the English word. A right answer turns green. A miss says Not quite and returns to the back. No clap or horn. Week 7 is chapters 2–11. Week 15 is every class lemma, chapters 2–19. Each circle is saved on its own. Final vocab is the professor’s Week 15 list: Hebrew, then four meanings, same first-answer grade as the Week 7 mock. When a card is marked, the answer is shown. A miss also shows what was written. Try again, before that mark, does not. |
| **Listen · Tanakh** | The text fills the page. Follow, Repeat, and Grade are one row. The player is a short bar above the tabs: previous verse, play, next verse, the speed, and more. More holds loop, five seconds, replay, the verse range, and volume on a computer. A hand scroll is not pulled back. Back to the reader, or Play, follows again. Phone landscape keeps the player and hides the other bars. | `/listen/read`. The Reading Lab is a different page and is unchanged. |
| **Listen · Vocabulary** | Isolated Eliran lexeme when we have it, else TTS, then English | Car / iPad. *Avraham*, then Abraham. Loop one chapter, a mix of chapters, or the whole list. **Owner recordings** play first when present. Neural Hebrew is Hebrew-only (vowel **names**, no digits). |
| **Listen · On the road** | One course week. Hebrew, then the meaning, same clips and pace as Drill (`speakRoadCard` at 0.85). The week repeats. Lock-screen skip. Optional music under the word: Hatikvah (U.S. Navy Band, public domain) or Solemn (original). Default is quiet. The volume slider moves a gain control, because a phone ignores the player’s own volume. Left is silent. The word stays louder. | `/listen/road`. Listen menu, the Listen page, and the Grammar Path home. |
| **Scripture Path · Study** | Opening the Scripture Path asks “Which level?” You enter one level and stay there for its thirty lessons. Vocab, study, and listening stay in that room. Leave this level returns to the five doors. A locked level stays locked until the previous level is cleared. Each level’s words stay in lesson order and are split across thirty weeks. The same pointed word with the same meaning is kept once. Different vowels stay, so עִם and עַם are both drilled. A pointed spelling kept twice, with two meanings, accepts either meaning. A week is that slice, not the whole level. The sitting is the Grammar Path drill: study the word, then every way, and a miss comes back in the group. A card id is a hash of the level, the pointed word, and the meaning, so editing a lesson does not move a score onto another word. A save keeps those cards, and rewrites a place-based id from 14 Oct onto the word it named. The place is saved per level, week, and focus, apart from the Grammar Path weeks. | Bottom bar, the header, and the level room. The address is `/iibs/study`. |
| **Scripture Path · Audio** | The open level only. Hebrew, then the plural when the lesson has one, then the Scripture Path gloss. Same voice path as Drill. No saved place: leaving starts that level at the first word. Same music and volume slider. Other levels are not on this screen. The Scripture Path bar has an Audio tab once a level is open. The address is still `/iibs/road`. Internal ids stay `bbh` and `iibs`. | Bottom bar, the headphones in the header, and a card in the level room. |
| **Scripture Path · Reading Lab** | A tab beside Levels, on the level hall and on the text itself. Also in the header and the bottom bar, and a card inside a level. The page is the Leningrad Tanakh: accents, stress, and the pause path stay on the word. Ezra SIL draws the te‘amim in the manuscript frame, so a signed correction is the word on the leaf, not a note beside it. The stress line sits below the meteg. The word card names the accent, the meteg, and the stress label (one pashta says the stress is final). A chapter already opened in this visit is kept in memory, keyed by book and chapter. The chapter sits on a manuscript sheet. The page scrolls. One bar holds Books, the chapter, the size, and the note. The note is shown once, then only from ⓘ. Light is the paper, unless the device is dark and nothing is saved. Dim is the lamp turned down. Tight and Small set the type smaller so more of the chapter sits on the leaf. Page is the ordinary size. Large is for a closer look. The lamp and the type size are kept on the device. A signed-in Scripture Path student loads a chapter from `data/wlc/` (haday-hebrew-data v1.2.0). The Grammar Path is refused. The recorded reading at Listen → Tanakh is a different text: nikkud only, no cantillation. Do not replace `public/tanakh/books`. | The **Learn** tab. The address is `/iibs/wlc`. |
| **Listen · Alive Pet** | Companion recites class lemmas; owner voice when recorded | Personalization data = Voice bank. Weak lemmas first. |
| **Listen · Tanakh** | All **39 books / 929 chapters**. Follow-along highlight. **Tap a word** for a grammar card. **Echo** the verse (hear / record / hear both). **Ask** HaDay about the open verse. | Recorded Shmuelof audio. Book, chapter, or verse range. |
| **Ask HaDay** | Questions from the lesson | Clarify without leaving the app. Claude or Grok, capped before the paid call. A failed quota check does not call the model. The round button is on every signed-in page. It is not a menu row. |
| **Suggest a feature** | Class inventory | Owner reviews: new → planned → building → shipped. |
| **Search** | The doors page, the memorization guide, privacy, credits, About, and Blogs are the public pages. About names Adeola Adegbolagun and uses the approved biography. Blogs are public posts, not only lessons. They are written from the owner desk at `/admin/blogs` and stay off the public page while marked draft. The public address is `/blogs`. An old `/teachings` address, including a post and the feed, sends the visitor to `/blogs`. The doors page title is “Learn to Read Biblical Hebrew” and the heading is “Learn to Read the Bible in Hebrew.” Each public page sends its own share title, description, and image. They render their text without waiting for sign-in. `robots.txt` blocks `/admin` and `/api/`. `sitemap.xml` and `llms.txt` are built from one list of those pages. `llms.txt` groups Scripture posts under Teachings at `/blogs` and app guides under Learning HebRabbAi at `/learning-hebrabbai`. A post in the wrong section redirects. A signed-in reader can comment on a public post. Visitors can read the comments. A draft has none. The owner, or the person who wrote it, can remove it. Each new comment is also mailed to HaDay.assistant@mail.grokbot.com. The mail is sent without making the reader wait. Public blog pages, the feeds, and the sitemap send a short public cache header when the visitor is signed out. Pictures on a post are uploaded from the owner desk: paste, drop, or choose a WebP, JPEG, or PNG. The browser makes a WebP no wider than 1600 pixels, refuses anything still over 2 MB, and requires alt text. The file is stored at images.haday.app. A post can include a pipe table: a header row, a separator such as `| --- | :---: | ---: |`, then the cells. At most 8 columns and 100 rows. `\|` is a literal pipe. The desk inserts a starter table at the cursor, and a spreadsheet paste becomes a table. Ads and a newsletter are not in this version. Other pages send `X-Robots-Tag: noindex`. An Azure host 301s to the class site, except `/api/health`. The previous class address does the same, and a form there uses 308. | No textbook pages and no answer keys on a public page. |
| **Account** | Google, X, or email + password | Progress stays with the account. On create, the student says how they heard about HaDay. College or school suggests the Grammar Path. An online Bible school suggests the Scripture Path. Internet or a friend chooses the course. The student confirms the path before the account is created. After sign-in, the student opens that study. The home page stays available, with Continue to your study. The path chooser stays hidden from a placed student, including while the account is still loading. The owner still sees both doors. Opening the Grammar Path greets them with “Which semester?” Semester 1 and Semester 2 are separate rooms. Leave this room returns to those two doors, and the other semester’s words and scores stay out. Semester 2 uses the same five tabs. Play has this semester’s chapter path and every verb stem: Verbal System, Paradigm Quest, Qal perfect, Qal imperfect, then Qal, Niphal, Piel, Pual, Hiphil, Hophal, and Hithpael, each opened on that stem. The stem exams are open in this room; 90% clears a unit and does not lock the next one. Week 7, Week 15, and the first-term word path stay in Semester 1. It has the second-term word list, drill, quiz, write, match, a lesson for each chapter, a closed-book exam for each chapter, and its own vocabulary game and listen. Semester 1’s Game, Listen, and Zakhor stay in Semester 1. A student on the Grammar Path gets the same greeting when they enter. Old Vercel logins do **not** carry over. A saved shortcut is named **HaDay** and shows a brown ה on parchment (`#603619` on `#F3EEE4`). iPhone keeps an old shortcut’s picture until it is removed and added again. |

Pass a stage at **90%**. Honor badges and a class leaderboard sit under More.

---

## Listen (as built)

**Vocabulary.** Playback order: owner Voice-bank take → neural clip (loudness-matched; Hebrew gained so it is not quieter than English) → isolated Eliran lexeme → TTS.

**Swap engine.** Download `/audio/neural/corpus.txt`. Synthesize `{id}.he.mp3` / `{id}.en.mp3`. Put them in `public/audio/neural/inbox/`. `python3 scripts/voice-import.py` normalizes and rebuilds the manifest.

**Tanakh follow-along.** The recorded reading is `public/tanakh/books/*.json`. Those verse strings keep the cantillation. They are not the dataset: no per-word stress, no rhythm tree, no signed review. The Grammar Path still reads that file under Listen → Tanakh. Do not swap it for the dataset in the same change as the audio. The Leningrad dataset, dataset 1.2.0, all 39 books, is the Scripture Path **Reading Lab** at `/iibs/wlc`. Chapters are gzipped in `data/wlc/`. A signed-in Scripture Path student, or the owner, loads a chapter through the server. The Grammar Path is refused. It is not a Genesis 1–3 flag. The page uses Ezra SIL so the te‘amim draw; the class face is unchanged. Play on that page uses the same Mechon Mamre recording and the same `public/tanakh/align` word times as Listen → Tanakh. It does not open the Grammar Path player, and it does not replace those files. A verse whose Leningrad word count does not match the recording (ketiv/qere) marks the verse, not a guessed word. Word intervals are `public/tanakh/align/*.json` with `engine: "mfa-kaldi-v1"` for every chapter. Audio is Mechon Mamre MP3s (Genesis 1–5 also local). Highlight uses the spoken interval, not a guessed clock lead.

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
| Credits | Public `/credits` — Shmuelof / Talking Bibles / Mechon Mamre audio, WLC, WEB, OSHB, Eliran Wong, MFA. Legal, Credits, and the method page have **Back to your study** at the top. A signed-in student keeps the study header on those pages. |

Mailer settings (Azure): `SMTP_USER`, `SMTP_PASS` (Gmail App password), `MAIL_FROM`. Optional Resend / SendGrid instead.

Mailer settings (Azure): `SMTP_USER`, `SMTP_PASS` (Gmail App password), `MAIL_FROM`. Optional Resend / SendGrid instead.

---

## Data on disk

| Path | Role |
|---|---|
| `src/lib/vocab.ts` | Class lemmas, chapters 2–19 (source of truth for Game and Study). The Grammar Path follows that chapter order. |
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
