# Handover

The Chairman merged both 2018 coursebook checks. Do not deploy by hand. Do not apply a 2025 Level B form.

## What landed

Level C and Level D are on main in pull request #237. 300 rows each. No stored Hebrew was rewritten. No gloss was rewritten. No word id changed. There is no C or D repair book.

Level A and Level B are this branch, pull request #238. Level A: 481 rows. Level B: 300 rows. Four uncontested headwords were repaired. Old ids were frozen before the string edit. No gloss was rewritten. No row was inserted, deleted, or reordered.

| Level | Place | Old id | New id | Now |
| --- | --- | --- | --- | --- |
| A | 8.02 | iibs-a-1et6eo4 | iibs-a-17m2sh7 | אֱדוֹם |
| A | 14.20 | iibs-a-rykh6t | iibs-a-qw8pzd | יְרוּשָׁלַם / יְרוּשָׁלַיִם |
| B | 18.08 | iibs-b-x412qb | iibs-b-fob5ss | סָלַח (לְ) |
| B | 26.05 | iibs-b-a1u5id | iibs-b-1beiq5t | שֵׂכֶל / שֶׂכֶל |

## Still different

| Level | Lesson | Why it was left |
| --- | --- | --- |
| A | 3.11 | Qamats on the page, patah on the site. Id iibs-a-1f0r1bt. Page 74. |
| A | 9.02 | Patah and dagesh on the page, qamats and dagesh on the site. Id iibs-a-txnp37. Page 239. No lexicon was opened. |
| C | 9.02 and 9.03 | Word-set. The page has טֻמְאָה then גָּבַהּ. The site has גָּבַהּ then טָהֵר. Not renumbered. |
| C | 9.05 | Page נִבָּא (qamats). Site נִבֵּא (tsere). Lexicon note agreed with the site. |
| D | 4.01 | Page חֹרֶב (segol). Site חֹרֵב (tsere). Lexicon note agreed with the site. |

These wait for the Biblical Hebrew Tutor. Do not auto-pick. Same class of decision as Level E 25.09 for the vowel rows.

## Decisions kept

- Site order was not changed.
- Five Level A rows that are not in that unit's table were not moved.
- Level A 14.14 was not reversed.
- Spacing that already matches after NFC was not a repair.
- A holam that an extractor hung on the wrong letter was rejected (B 28.07, D 2.04, C 17.02).
- Footnote rows were not added.

## Next step

Tutor sign-off on the rows that still differ. Nothing else is waiting on this check.
