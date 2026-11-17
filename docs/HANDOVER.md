# Handover

This branch is not merged. Do not merge it. Do not deploy.

It starts from `main` at `4eac58a` (PR #246, merged 17 Nov 2026, 6:11 PM America/Indianapolis). Production is already on that SHA. This branch does not deploy it again.

## What this branch does

Four small jobs. A wrong match is still worse than no match. `formOfLexicon` was not tightened. No new Levite card, no people-sense cards, no audio, no BHS.

1. **Rule 1.7 display.** Where the ketiv and the qere differ, both readers show the qere and note the ketiv beside it. The note is the written word. It has no English gloss. Grammar Path verses and word cards still show the English translation. The page still says “English stays on the page.” The Grade quiz still asks “Which English is this verse?” A differing-number ketiv word card has no gloss. A word card that still has a class lemma keeps its English.

   An empty `qere` borrows the next ketiv’s read form, which is where this pin hangs a split. The six written-not-read tokens have no read form, so they get no note (2Kgs 5:18 #22, Ezek 48:16 #11, Jer 38:16 #9, Jer 39:12 #10, Jer 51:3 #2, Ruth 3:12 #4). Gen 30:11 #2 shows בָּא גָד with בגד noted, and still has no class card. The note file is [public/tanakh/ketiv-qere.json](../public/tanakh/ketiv-qere.json): 1,262 notes. 1,268 ketivs minus the 6 with no read form. 17 of those notes are the empty-own-`qere` splits, including the 10 whose numbers differ and the 7 whose numbers match.

2. **Overrides file.** [data/lemma-overrides.json](../data/lemma-overrides.json) is the only named-token list. Each row is verse, index, exact surface, and the OSHB lemma and morph. `lemmaForReading` applies a row only when all four still match. `scripts/build-strongs.py` reads the same file. A test fails if a row’s surface or tag has drifted. The Zechariah 8:23 special case is gone from `strong-lemma.ts`. That token stays Judean/Jew `iibs-e-tbwdu6` on the Scripture Path (rule 4.1) and none on the Grammar Path.

   The 58 H639 `HTa` tokens are on the existing noun card, both paths: Grammar `aph` (“nostril, nose, anger”), Scripture `iibs-b-qtu1ft` (“nostril, nose, face, anger”). Reason recorded: “OSHB tags these HTa, but in context each is the noun.” Ps 115:6 #4 is one of them. They are not sent to H637. The other 216 single-number H639 tokens were already that card. The two two-number tokens (Num 12:9 #0, 2Sam 6:7 #0) stay none under rule 1.6. 274 single-number H639 tokens now have the noun card.

3. **Audit.** `scripts/audit-lemmas.mjs` is read-only. It walks every written token and writes exceptions for LEMMA_RULES §8.1 a, b, c, d, e, f, g, and h. CI runs it after the tests. It exits non-zero if it cannot finish, if 8.1 e or 8.1 h is not zero, if 8.1 c is no longer zero, or if the report differs from [docs/lemma-audit-baseline.json](lemma-audit-baseline.json). It does not fail only because known a/b/d/f/g rows are still there. Current counts: a 4, b 2,762, c 0, d 12,993, e 0, f 760, g 6,572, h 0. 8.1 g reports the loose `formOfLexicon` hits. The matcher was not tightened.

4. **Two stem mismatches are none.** Neh 2:13 #16 (H6555 pual participle) had Scripture Path `iibs-b-149047p` “he broke through” and Grammar Path none. It is now none on both paths. There is no passive card. Job 38:12 #3 (H3045 piel) had `yada` / `iibs-a-1vjj7fa`. It is now none on both paths. It is not on the hiphil “make known” card. Job 38:12 #4 stays “dawn.” The other 14 of the old keep-16 still have their cards.

## Counts against this main

The CSV is only this PR’s lemma changes. [strong-map-wlc-rebase-diff.csv](strong-map-wlc-rebase-diff.csv): **60 tokens, 119 rows** (59 Grammar Path, 60 Scripture Path). 116 rows are the 58 H639 gains, both paths. 3 rows are the losses: Job 38:12 #3 on both paths, and Neh 2:13 #16 on the Scripture Path only. Zechariah 8:23 did not change. Same-surface only. No index shift.

The map is still bbh 559 keys and Scripture Path 1,680 keys. H758 and H5045 stay. H6307 and H7418 stay gone.

## Locks

Still green, from this pin:

- Levi / Levite **288 / 58 / 4**
- Ketiv comparison **1,268 / 1,034 / 234**. Appendix B is still 101. The six written-not-read tokens still have no lemma.
- Rule 3.2: **23** tokens still none on both paths. H884: **34** still `iibs-a-10eyk0o` on the Scripture Path and none on the Grammar Path.
- The 0.5.3 alignment test: 305,501 tokens, 23,213 verses.

A second rebuild from `data/wlc` plus `data/lemma-overrides.json` is byte-identical (`scripts/build-strong-map.mjs` twice, then `scripts/build-strongs.py` twice). The query index was not rebuilt. `scripts/build-tanakh.py` was not run.

## Tests

`npx tsc --noEmit` passed (exit 0) on 17 Nov 2026. TanStack Start is 1.168.60.

`node --test scripts/*.test.mjs`: 699 tests, 694 pass, 0 fail, 5 skipped. That covers the locks above, the split-qere display, Gen 30:11, the six written-not-read tokens, the override drift test, and the English-still-on-the-page test. `node scripts/audit-lemmas.mjs` passed against the committed baseline.
