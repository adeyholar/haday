# Handover

This branch is not merged. Do not merge it. Do not deploy.

It starts from `main` at `6875d52` (PR #245, merged 17 Nov 2026). PR #245 is already on `main`. This branch does not deploy that merge again.

## What this branch does

Both the Grammar Path and the Scripture Path now match the pinned text in `data/wlc` (haday-hebrew-data v1.2.0, dataset `1.2.0`, OSHB pin `3d15126fb1ef74867fc1434be1942e837932691f`). 23,213 verses. 305,501 tokens. Nothing is fetched from `openscriptures/morphhb` `master` or from `tanakh_ai_tutor`.

`scripts/build-strongs.py` rewrites each verse’s `words` and `he` from the written line (`surface` + `trailer`, `kq_role === "qere"` skipped). English (`en`, `enSource`) stays the World English Bible and is joined only by book, chapter, and verse. The Strong’s tag is `Hxxxx|morph` from that same token. `scripts/build-strong-map.mjs` and `scripts/build-tanakh-query-index.py` read `data/wlc` directly. `scripts/build-tanakh.py` was not run. A warning at the top says not to run it as-is.

No verse is only in `books` or only in `data/wlc`. See [wlc-rebase-verse-gaps.txt](wlc-rebase-verse-gaps.txt).

Listen timestamps were not rewritten. 984 verses have a different word count than `public/tanakh/align`. `src/lib/reading.ts` already re-spaces those; it was not changed. The list is [wlc-align-count-mismatches.txt](wlc-align-count-mismatches.txt). Genesis has 14 (Gen 8:17, 13:3, 14:2, 14:8, 14:17, 24:33, 25:23, 27:29, 35:22, 36:5, 36:14, 39:20, 49:10, 49:11). The first verse of each Genesis chapter still matches.

## Class lemmas that changed

7,160 tokens changed class lemma (7,161 CSV rows: 5,967 Grammar Path, 1,194 Scripture Path). One token changed on both paths. The full list is [strong-map-wlc-rebase-diff.csv](strong-map-wlc-rebase-diff.csv). Columns: verse, token index, surface, old surface, path, old lemma (`id / gloss`), new lemma.

1,544 of those tokens are the same surface with a different class lemma (351 Grammar Path, 1,194 Scripture Path). The other 5,616 Grammar Path rows are a different word at that index, because the old line had smashed or split the token. 984 verses changed word count.

The map is still bbh 559 keys. Scripture Path went from 1,679 keys to 1,683. Added H606 (men), H3212 (he led, brought), H3526 (he washed), H5324 (he stationed). None removed. H1120, H2699, H2691, H3878, H3881, H3816, H884, H1145, H5046, and H1099 are the same rows as PR #245. `formOfLexicon` was not tightened. The Zechariah 8:23 override was not moved.

Samples:

| Verse | Index | Surface | Strong | Class lemma |
| --- | --- | --- | --- | --- |
| Gen 1:1 | 0 | בְּרֵאשִׁ֖ית | H7225 | unchanged. Grammar Path: no class lemma, not רֹאשׁ. Scripture Path: “beginning, first; first-fruits”. The word-card lock that בְּרֵאשִׁית is רֹאשׁ was not touched |
| 1Chr 1:11 | 3 | לודיים | H3866 | the unpointed ketiv, its own token. The old line had fused ketiv and qere into one word and left the tag empty. No class lemma |
| 1Chr 1:11 | 4 | וְאֶת | H853 | object marker. The old index 4 was עֲנָמִים, because the fused word had shifted the line |
| 1Chr 1:15 | 3 | הַֽעַרְקִ֖י | H6208 | the Arkite. The old surface was הַֽעַרְקִ֖י (the meteg sat on the other side of ה). No class lemma either way. Not H6177 |

A same-surface Scripture Path change: 1Chr 11:4 וַיֵּלֶךְ now has “he led, brought” (H3212). That number was not on the map before.

## PR #245 locks

Still in force, and still green: object marker, gentilics, compounds, Bamoth H1120, Hazerim H2699, H3816 people on the Scripture Path only, and the article-first Levite rule including `Rd`. An open sitting is not wiped.

## Tests

`npx tsc --noEmit` passed (exit 0) on 17 Nov 2026. TanStack Start is 1.168.60.

`node --test scripts/*.test.mjs` passed 679, failed 0, skipped 5 (684 tests). The new file is `scripts/surface-alignment.test.mjs`. It checks all 305,501 tokens against `data/wlc` and fails on any surface or Strong’s mismatch.

Branch `fix/wlc-pinned-matching`. This branch is not merged. Do not merge. Do not deploy.
