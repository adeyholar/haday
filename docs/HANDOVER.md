# Handover

Branch `fix/level-cd-coursebook-strings`. Not merged. The Chairman merges. No deploy.

## Findings

Level C and Level D headwords were checked against the 2018 coursebook vocabulary tables, read from the rendered page. 300 rows each. The whole pointed string was compared after NFC.

The vocabulary pages are the ones named Unit N with a Hebrew column. Level C: 10, 24, 36, 50, 64, 80, 92, 110, 126, 142, 154, 168, 182, 196, 210, 224, 236, 250, 266, 282, 296, 310, 324, 338, 352, 364, 376, 390, 402, 414. Level D: 10, 22, 36, 50, 62, 76, 90, 102, 116, 128, 140, 156, 168, 182, 196, 208, 220, 236, 252, 266, 278, 290, 302, 316, 330, 346, 358, 374, 386, 398.

No stored Hebrew was rewritten. No gloss was rewritten. No word id changed. There is no C or D repair book.

## Still different

| Level | Lesson | Why it was left |
| --- | --- | --- |
| C | 9.02 and 9.03 | Word-set. The page has טֻמְאָה then גָּבַהּ. The site has גָּבַהּ then טָהֵר. Not renumbered. |
| C | 9.05 | Page נִבָּא (qamats). Site נִבֵּא (tsere). Lexicon note agreed with the site. |
| D | 4.01 | Page חֹרֶב (segol). Site חֹרֵב (tsere). Lexicon note agreed with the site. |

These wait for the Biblical Hebrew Tutor and the Chairman. Same class of decision as Level E 25.09 for the two vowel rows.

## Decisions

- Headwords in `src/lib/iibs-c-coursebook.ts` and `src/lib/iibs-d-coursebook.ts` are the page forms.
- A row the page and the site already shared was not edited.
- A position-only reading that hung a holam on the wrong letter (D 2.04, C 17.02) was rejected after the crop. The site form matches the page.
- Spacing around a slash or a parenthesis was not treated as a pointing difference when the pointed words matched.

## Blockers

Tutor and Chairman sign-off on C 9.02, C 9.03, C 9.05, and D 4.01. Do not auto-pick.

## Tests

`npx tsc --noEmit` clean. `node --test scripts/*.test.mjs`: 658 pass, 0 fail, 5 skip. TanStack Start 1.168.60. The counts are from a tree without the uncommitted sandbox preview files.

## Next step

Level A (481 rows) and Level B (300 rows), 2018 coursebooks, in `fix/level-ab-coursebook-strings`. Do not apply a 2025 Level B form without direction. Do not merge this branch.
