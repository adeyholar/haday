# Handover

Draft only. Do not merge. Do not deploy. Merging is the Chairman's call.

Branch: `cursor/binyanim-drill-c04b`
Base: `main` at `ff09520`.
The commit hash is added in the next commit on this branch.

## Binyanim identification drill

Checked on `main` and on production `https://hebrewmentor.haday.app` on 26 Nov 2026.

Production `GET /iibs/binyanim` returned **307** to `/iibs/verb-lab?view=welcome`. `main` does the same: PR #260 (`65b5ad1`) registered that path as an old verb door. The drill component was still in the repo (`src/components/binyan-drill.tsx`, `src/lib/binyan-drill.ts`) and was not mounted. The Scripture Path menus did not link it. Verb Lab is a different room (charts, person practice, exams). They conflicted only because the drill's address had been given to Verb Lab.

This draft puts the identification drill back at `/iibs/binyanim`. It does not redirect. Cards on the level hall, inside a level, and on Learn say "Seven stems" / "Name the stem." Verb Lab stays on its own card and at `/iibs/verb-lab`. The Grammar Path still cannot open `/iibs/binyanim` (`blockedDestination` sends a Grammar Path student home). `path-hub.tsx` has no link to it.

Levels A–E are already open. `levelOpen` and `levelUnlocked` return true for A–E with no previous level required. That was not changed. Grammar Path games, Alef-bet, and the other drill gates were not changed.

Level E lesson 25 word 9 is זֵרָה ("he scattered"). It was not edited. A test locks that spelling.

The drill's own round is unchanged: ten first answers, and 90% opens the next stem set (Qal, Piel, and Hiphil, then Niphal and Hithpael, then Pual and Hophal). That is not a level gate. The page still says it does not lock a level.

## For the Biblical Hebrew Tutor

No Hebrew was changed. Please review these as they stand:

- On this Scripture Path drill the stem names are Qal, Niphal, Piel, Pual, Hiphil, Hophal, and Hithpael. Verb Lab on the same path says Pa·al, Nif·al, Pi·el, Pu·al, Hif·il, Hoof·al, and Hit·pa·el.
- The short English under each stem (plain, passive, intensive, causative) is the existing card text.
- The clues after a miss name the prefix and the dagesh. They were not rewritten.

## Tests

`npx tsc --noEmit` passed on 26 Nov 2026.

`node --test scripts/*.test.mjs`: 769 tests, 764 pass, 0 fail, 5 skipped.

Local preview: `/iibs/binyanim` stays on that address and shows Name the stem, Find the form, and Same root. The level hall shows Levels A–E with no lock, then Verb Lab, then Seven stems. The Grammar Path Learn hub does not offer the drill.

## Earlier note

The previous text of this file described the 17 Nov lemma pin at `4eac58a`. That work is already on `main`. It is not part of this draft.
