# Handover

Branch `fix/level-ab-coursebook-strings`. Not merged. The Chairman merges. No deploy.

## Findings

Level A and Level B headwords were checked against the 2018 coursebook vocabulary tables, read from the rendered page. Level A: 481 rows. Level B: 300 rows. The whole pointed string was compared after NFC.

Level A vocabulary pages (the first page of each unit that has a Hebrew column; some lists continue on later pages): 13, 41, 73, 105, 135, 163, 189, 213, 239, 263, 289, 313, 335, 365, 391, 440, 470, 498, 528, 548, 578, 610, 642, 662, 690, 714, 740, 758, 786, 816.

Level B vocabulary pages: 10, 26, 38, 52, 64, 82, 96, 108, 122, 136, 150, 166, 180, 192, 210, 228, 244, 256, 272, 288, 300, 316, 332, 344, 356, 372, 386, 402, 416, 430. Pages 60 and 103 say Vocabulary but have no Hebrew column and were skipped.

## Repaired

Four uncontested headwords were repaired. Old ids were frozen before the string edit. No gloss was rewritten. No row was inserted, deleted, or reordered.

| Level | Place | Old id | New id | Now |
| --- | --- | --- | --- | --- |
| A | 8.02 | iibs-a-1et6eo4 | iibs-a-17m2sh7 | אֱדוֹם |
| A | 14.20 | iibs-a-rykh6t | iibs-a-qw8pzd | יְרוּשָׁלַם / יְרוּשָׁלַיִם |
| B | 18.08 | iibs-b-x412qb | iibs-b-fob5ss | סָלַח (לְ) |
| B | 26.05 | iibs-b-a1u5id | iibs-b-1beiq5t | שֵׂכֶל / שֶׂכֶל |

## Still different

| Level | Lesson | Id | Site | Coursebook | Page | Why it was left |
| --- | --- | --- | --- | --- | ---: | --- |
| A | 3.11 | iibs-a-1f0r1bt | רַע | רָע | 74 | Qamats on the page, patah on the site. |
| A | 9.02 | iibs-a-txnp37 | גָּג | גַּג | 239 | Patah and dagesh on the page, qamats and dagesh on the site. No lexicon was opened. |

These wait for the Biblical Hebrew Tutor and the Chairman. 3.11 is the same class of decision as Level E 25.09. Level B has no remaining full-string mismatch.

## Decisions

- Headwords in `src/lib/iibs-a-coursebook.ts` and `src/lib/iibs-b-coursebook.ts` are the page forms used for the check. A row the page and the site already shared was stored as the site string.
- Site order was not changed, even where a table order differs (Level A tables; Level B lessons 5, 6, 24, and 30).
- Five Level A rows that are not in that unit's table were not moved: 3.04, 7.04, 13.16, 14.14, and 18.18. Lesson 14 place 14 was not reversed to the page's form order.
- Lesson 7 place 16 prints the two forms with the English word "or". The site keeps a slash. The pointed forms match.
- Spacing that already matches after NFC was not treated as a repair (Level B lessons 20, 21, and 25).
- A position-only reading that hung a holam on the wrong letter (Level B 28.07) was rejected. The site matches the page.
- Footnote rows were not added (Level B lessons 3, 19, and 25).
- No 2025 Level B form was applied.
- Level C and Level D are a separate unmerged pull request, #237. This branch does not include that work.

## Blockers

Tutor and Chairman sign-off on A 3.11 and A 9.02. Do not auto-pick.

## Tests

`npx tsc --noEmit` clean. `node --test scripts/*.test.mjs`: 661 pass, 0 fail, 5 skip. TanStack Start 1.168.60. The counts are from a tree without the uncommitted sandbox preview files.

## Next step

Derek reviews. Do not merge this branch. Do not deploy. Do not apply a 2025 Level B form. Do not write a Notion Live row until the Chairman merges.
