# Handover

This branch is not merged. Do not merge it. Merging is the Chairman's call. The pull request stays a draft.

Branch: `cursor/binyanim-drill-dccc`

Starts from `main` at `d9b1674` (PR #267).

No secrets are in this note.

## What was already true on main

Production `https://hebrewmentor.haday.app/iibs/binyanim` answers 307 to `/iibs/verb-lab?view=welcome`. The same redirect is in `legacyVerbTarget`. The identification drill component and its library were still in the repo. Nothing in the Scripture Path menu linked to them.

Scripture Path levels A–E are already open. `levelOpen` and `levelUnlocked` return true for A, B, C, D, and E with no previous level cleared. Grammar Path games, Alef-bet, and the week drill gates were not changed.

Level E lesson 25 word 9 is still זֵרָה, gloss “he scattered”. The coursebook prints זָרָה. `docs/iibs-e-pointing-check.md` already records that the Chairman chose the lexicon form. This branch did not edit that word.

## What this branch does

`/iibs/binyanim` renders `BinyanDrill` again. It is not a Verb Lab door. The level hall and the open level room each have the original card: “Seven stems. Name the stem. Open practice. It does not lock a level.” Verb Lab stays on its own card and at `/iibs/verb-lab`.

A Grammar Path account is still sent home from `/iibs/binyanim`. A Scripture Path account is not.

The drill still deals ten strong perfect, imperfect, and participle forms. Qal, Piel, and Hiphil come first. Nine first answers open Niphal and Hithpael, then Pual and Hophal. That 90% opens the next set of stems. It does not lock a Scripture Path level. Hebrew in the drill was not edited. The “Levels” link sits in the card panel.

## For the Biblical Hebrew Tutor

The drill still names the stems Qal, Niphal, Piel, Pual, Hiphil, Hophal, and Hithpael. Verb Lab on the Scripture Path says Pa·al, Nif·al, Pi·el, Pu·al, Hif·il, Hoof·al, and Hit·pa·el. This branch did not rename either set.

Level E 25.09 remains זֵרָה, not the coursebook’s זָרָה.

## Tests actually run

On 26 Nov 2026, Node v22.23.4, on this branch after the edits:

- `npx tsc --noEmit` — exit 0
- `node --test scripts/*.test.mjs` — 779 tests, 774 pass, 0 fail, 5 skipped
- `node scripts/audit-lemmas.mjs` — exit 0. Counts: a 4, b 2762, c 0, d 12993, e 0, f 760, g 6572, h 0. This branch did not touch lemma data.
- `npm run build` — exit 0. `db:migrate` skipped because `DATABASE_URL` is not set in this workspace.

`npx eslint` on the touched route, door, redirect, and tests reports two warnings that were already in those files: an unused `root` in `scripts/verb-lab.test.mjs`, and a fast-refresh note on `src/components/iibs-door.tsx`. CI’s eslint list does not include those files.
