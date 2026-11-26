# Handover

This branch is not merged. Do not merge it. Merging is the Chairman's call.

Branch: `cursor/verb-lab-nov25-3c1f`

Rebased onto `main` at `0e3f85f` (PR #253, Translation Lab card, squash-merged). The rebased code commit is `3e48fd43829f106bb792b7125b05b612b94882f2`.

The only conflict was `docs/HANDOVER.md`. `src/components/path-hub.tsx` did not conflict. It still has both sides: `VerbLabCard` on Learn, Practice, and Play, and the Translation Lab card appended on Listen when `translationLabEnabled()` is on and `showTranslationLabListenCard` is true (Semester 1). The Tutor's Pe-Aleph file is byte for byte the file from the Nov 25 check.

No secrets are in this note.

## What this branch does

The Nov 25 read-only check, against the Biblical Hebrew Tutor's filled Pe-Aleph file.

1. **Pe-Aleph chart.** `data/paradigms/weak-ialeph.json` is the Tutor's file, byte for byte. 207 cells. `sameAsIGuttural` is `[]`. `noFormSlots` is the Pual and Hophal imperatives. The 14 original Qal cells match the previous file. The chart draws every cell, the label `standard form, not in the Bible` where the data carries it, and the verse where a cell or an alternate has one. No עמד or קטל example was added. The kept Qal imperative ms note still names עֲמֹד.

2. **90% is the exam, not each square of four.** The screen says the exam clears at 90% of the forms you answer. That is the number `formPercent` compares with `GAME_STAGE_PASS`. A miss inside one square no longer fails that square when the whole sitting is still at 90% (15 of 16 is 94%, and the square that was 3 of 4 still clears). A sitting that is only those four forms is 75% and does not clear. Fewer than ten forms still need every answer to reach 90%, because 8 of 9 is 89% and 3 of 4 is 75%.

3. **Progress keys.** Boxes, due, cleared, and continue are `class|square`. An old save with a bare square id is kept as `strong|square`. A class key already stored wins over the bare id. Pe-Aleph practice does not move the strong verb's box.

4. **Level 7.** "Dimmed stems are coming" is hidden when `anyStemDimmed` is false. At level 7 every stem is open.

5. **Semester 2 home.** The Verb Lab card on that home uses `from=home`. Back goes to `/bbh`, and the Home tab is the one that lights. Play is still `/hub/play`.

6. **Quiz Next.** The button stays disabled until an answer is chosen.

7. **Pointed type, inside the Verb Lab panels only.** Noto Serif Hebrew (Google Fonts, free) is the lab face. Hebrew runs inside English lines are `dir=rtl` spans with `unicode-bidi: isolate`. Form lines use a taller line height. The rest of the app still uses Frank Ruhl Libre. Stem names, the Hophal pair of spellings, and the welcome table were left as they were.

## For the Chairman and the Tutor

(a) Kept cell `Qal.imperative.ms` still has the note that names עֲמֹד. It was kept byte for byte. The Chairman decides whether that note stays.

(b) Nineteen attested squares depend on allowing a third radical נ or ר (אמן and אמר). They need a second reader. The Tutor's note is the source of that count. This branch did not re-check them.

(c) The other warnings in the Tutor's notes, verbatim:

2. **Piel.infinitive-absolute אַכֵּל:** OSHB has 4 matching tokens (אַבֵּד Deut 12:2; וְאַבֵּד Esth 9:6, 9:12; Jer 12:17), but TAHOT disagrees on all, so it stays standard form.

3. **Qal-passive look-alikes of אכל:** אֻכְּלוּ (Neh 2:3, 2:13; Nah 1:10) and תְּאֻכְּלוּ (Isa 1:20) have exactly the Pual qatal 3cp / yiqtol 2mp shape, but OSHB parses them as Qal passive, so they were not used. Pual.qatal.3cp is attested anyway (אֻסְּרוּ Isa 22:3); Pual.yiqtol.2mp stays standard form.

5. **Dropped unattested alternates** (I-Aleph house rule): Piel inf. abs. אַכֹּל, Hiphil ptc fs מַאֲכִילָה, Hophal ptc fs מָאֳכָלָה.

6. **Single-token or other-root squares:** 57 of 77 attested filled squares use another I-Aleph root (shown above). Qal.participle-passive.fs rests on one token, Ezek 16:30 אֲמֻלָה (אמל), which OSHB and TAHOT both tag as a Qal passive participle.

7. **Hophal:** 0 of 26 attested (all standard form).

## Tests actually run

On 26 Nov 2026, after the rebase onto `0e3f85f`, on the tree at `3e48fd43829f106bb792b7125b05b612b94882f2`:

- `npx tsc --noEmit` — exit 0
- `node --test scripts/*.test.mjs` — 777 tests, 772 pass, 0 fail, 5 skipped
- The lemma audit on the previous head of this branch, before the rebase, was a 4, b 2762, c 0, d 12993, e 0, f 760, g 6572, h 0. This rebase did not touch lemma data.

## Record already on main

PR #253 landed as `0e3f85f`. Its own note, written before that squash, is kept here so the path-hub decision stays on the page.

PR #253 (`cursor/listen-lab-card-2d6d`) was rebased onto `main` at `ff09520b19d1ac44316ed7cc6485539bdc00d97d` and then squash-merged. The rebased app commit those tests covered was `d1620584043d0c6ea025ec00a50e9324a28ad4fd`.

Run on 26 Nov 2026, Node v22.23.4, on `d1620584043d0c6ea025ec00a50e9324a28ad4fd`:

- `npm run typecheck` (`tsc --noEmit`) passed (exit 0).
- `node --test scripts/*.test.mjs`: 769 tests, 764 pass, 0 fail, 5 skipped.
- `node scripts/audit-lemmas.mjs` passed (exit 0). Counts: a 4, b 2,762, c 0, d 12,993, e 0, f 760, g 6,572, h 0.
- `npx eslint` on the file list in `.github/workflows/checks.yml`, with `--max-warnings 0`, passed (exit 0).

`src/components/path-hub.tsx` was the only rebase conflict on that branch. Both import sides were kept: `VerbLabCard` from main, and `translationLabEnabled` plus `showTranslationLabListenCard` from that branch. The Learn, Practice, and Play menus still render `VerbLabCard`. The card list still has the quiz and drill entries main added after PR #252: independent pronouns, pronominal suffixes, and Qal imperfect suffixes, on both semesters. The Verb Lab frame from PR #261 was already on main and was not in the conflict. The Translation Lab card is still appended only when the menu is Listen, `translationLabEnabled()` is on, and `showTranslationLabListenCard` is true (open term Semester 1).

## Earlier record

The notes below were already on `main`. They describe the lemma work from `4eac58a` (PR #246, merged 17 Nov 2026). That branch was not merged again from here. Do not treat the 17 Nov test line as this run.

It starts from `main` at `4eac58a` (PR #246, merged 17 Nov 2026, 6:11 PM America/Indianapolis). Production was already on that SHA when that note was written.

The pin is `data/wlc`, haday-hebrew-data v1.2.0, dataset `1.2.0`, OSHB pin `3d15126fb1ef74867fc1434be1942e837932691f`. 23,213 verses. 305,501 written tokens. Nothing is fetched from `openscriptures/morphhb` `master`.

## What that lemma branch did

Four small jobs. A wrong match is still worse than no match. `formOfLexicon` was not tightened. No new Levite card, no people-sense cards, no audio, no BHS.

1. **Rule 1.7 display.** Where the ketiv and the qere differ, both readers show the qere and note the ketiv beside it. The note is the written word. It has no English gloss. Grammar Path verses and word cards still show the English translation. The page still says “English stays on the page.” The Grade quiz still asks “Which English is this verse?” A differing-number ketiv word card has no gloss. A word card that still has a class lemma keeps its English.

   An empty `qere` borrows the next ketiv’s read form, which is where this pin hangs a split. The qere of that group is drawn once, on the ketiv that borrowed it. The other ketiv is still noted, and it does not draw the qere again. Isa 44:24 reads מֵאִתִּי (מי) (אתי), not the qere twice. The same once-per-group line is on the Grammar Path and the Scripture Path (1Sam 20:2 #6–#7, Job 38:12 #3–#4, and the other 14). The six written-not-read tokens have no read form, so they get no note (2Kgs 5:18 #22, Ezek 48:16 #11, Jer 38:16 #9, Jer 39:12 #10, Jer 51:3 #2, Ruth 3:12 #4). Gen 30:11 #2 shows בָּא גָד with בגד noted, and still has no class card. The note file is [public/tanakh/ketiv-qere.json](../public/tanakh/ketiv-qere.json): 1,262 notes. 1,268 ketivs minus the 6 with no read form. 17 of those notes are the empty-own-`qere` splits, including the 10 whose numbers differ and the 7 whose numbers match. The other 17 notes in those groups are the ketiv only.

2. **Overrides file.** [data/lemma-overrides.json](../data/lemma-overrides.json) is the only named-token list. Each row is verse, index, exact surface, and the OSHB lemma and morph. `lemmaForReading` applies a row only when all four still match. `scripts/build-strongs.py` reads the same file. A test fails if a row’s surface or tag has drifted. The Zechariah 8:23 special case is gone from `strong-lemma.ts`. That token stays Judean/Jew `iibs-e-tbwdu6` on the Scripture Path (rule 4.1) and none on the Grammar Path.

   The 58 H639 `HTa` tokens are on the existing noun card, both paths: Grammar `aph` (“nostril, nose, anger”), Scripture `iibs-b-qtu1ft` (“nostril, nose, face, anger”). Reason recorded: “OSHB tags these HTa, but in context each is the noun.” Ps 115:6 #4 is one of them. They are not sent to H637. The other 216 single-number H639 tokens were already that card. The two two-number tokens (Num 12:9 #0, 2Sam 6:7 #0) stay none under rule 1.6. 274 single-number H639 tokens now have the noun card.

3. **Audit.** `scripts/audit-lemmas.mjs` is read-only. It walks every written token and writes exceptions for LEMMA_RULES §8.1 a, b, c, d, e, f, g, and h. Each row (LEMMA_RULES §8.2) has the verse, the token index, the surface, the OSHB tag (`lemma|morph`), the path, the card id, and the proposed class lemma (`hebrew (gloss)`, or empty when the row is a miss). CI runs it after the tests. It exits non-zero if it cannot finish, if 8.1 e or 8.1 h is not zero, if 8.1 c is no longer zero, or if the report differs from [docs/lemma-audit-baseline.json](lemma-audit-baseline.json). It does not fail only because known a/b/d/f/g rows are still there. Current counts: a 4, b 2,762, c 0, d 12,993, e 0, f 760, g 6,572, h 0. 8.1 g reports the loose `formOfLexicon` hits. The matcher was not tightened.

4. **Two stem mismatches are none.** Neh 2:13 #16 (H6555 pual participle) had Scripture Path `iibs-b-149047p` “he broke through” and Grammar Path none. It is now none on both paths. There is no passive card. Job 38:12 #3 (H3045 piel) had `yada` / `iibs-a-1vjj7fa`. It is now none on both paths. It is not on the hiphil “make known” card. Job 38:12 #4 stays “dawn.” The other 14 of the old keep-16 still have their cards.

## Counts against that main

The CSV is only that PR’s lemma changes. [strong-map-wlc-rebase-diff.csv](strong-map-wlc-rebase-diff.csv): **60 tokens, 119 rows** (59 Grammar Path, 60 Scripture Path). 116 rows are the 58 H639 gains, both paths. 3 rows are the losses: Job 38:12 #3 on both paths, and Neh 2:13 #16 on the Scripture Path only. Zechariah 8:23 did not change. Same-surface only. No index shift.

The map is still bbh 559 keys and Scripture Path 1,680 keys. H758 and H5045 stay. H6307 and H7418 stay gone.

## Locks

Still green, from this pin:

- Levi / Levite **288 / 58 / 4**
- Ketiv comparison **1,268 / 1,034 / 234**. Appendix B is still 101. The six written-not-read tokens still have no lemma.
- Rule 3.2: **23** tokens still none on both paths. H884: **34** still `iibs-a-10eyk0o` on the Scripture Path and none on the Grammar Path.
- The 0.5.3 alignment test: 305,501 tokens, 23,213 verses.

A second rebuild from `data/wlc` plus `data/lemma-overrides.json` is byte-identical (`scripts/build-strong-map.mjs` twice, then `scripts/build-strongs.py` twice). The query index was not rebuilt. `scripts/build-tanakh.py` was not run.

## Earlier tests (17 Nov 2026)

`npx tsc --noEmit` passed (exit 0) on 17 Nov 2026. TanStack Start is 1.168.60.

`node --test scripts/*.test.mjs`: 700 tests, 695 pass, 0 fail, 5 skipped. That covers the locks above, the split-qere display (the qere of each of the 17 groups is drawn once), Gen 30:11, the six written-not-read tokens, the override drift test, and the English-still-on-the-page test. `node scripts/audit-lemmas.mjs` passed against the committed baseline. This is the earlier record, not the 26 Nov run at the top.
