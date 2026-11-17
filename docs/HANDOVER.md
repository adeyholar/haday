# Handover

This branch is not merged. Do not merge it. Do not deploy.

## What this branch repairs

A passage word is drilled only when the verse’s own Strong’s number names a class lemma. A morph code is not a number. `HR/Sp1cp` does not become H1, so Jonah 1:6, 1:7, and 1:8 לָנוּ are not אָב “father.” A tag with no Strong’s number is not guessed.

On the Scripture Path the verse’s own word now stays:

| Word | Strong | Class word |
| --- | --- | --- |
| אֱלֹהִים | H430 | noun, “God; gods” |
| מָה | H4100 | particle, “what” |
| אוּלַי | H194 | particle, “perhaps” |
| הַגְּדוֹלָה | H1419 | גָּדוֹל. The slash form גָּדוֹל / גָּדֹל is two headwords |
| אֵת, וְאֵת | H853 | “direct object marker, untranslated” |
| אִתּוֹ | H854 | “with”, a different word |
| עִבְרִי | H5680 | gentilic, not a name |

H853 is never “with” and never אַתְּ. Prefixed numbers (`b/7225`, `c/1961`, `d/5892 b`) still give the content word. הִגִּיד stays H5046. בְּרֵאשִׁית stays H7225, not רֹאשׁ. Names such as Jonah, Amittai, Tarshish, and Jaffa stay full strength.

Dim unknowns is pale and still readable. The manuscript keeps its own ink: `#705848` on `#f6edd8` (5.67:1) and `#a89880` on `#1b1612` (6.38:1). Grammar Listen uses `#6a5648` on the card (6.46:1), `#5c4a3c` when the lamp is dim (5.72:1), and `#b5a48c` when the lamp is dark (6.66:1). No inline color. A word the student has opened stays full strength. The word being read still fades if it is unknown.

An open sitting is not wiped. Continue keeps the old queue. Drill unknowns again, or Start over, to take the new list.

The name יוֹנָה does not say “the word means dove,” and a related form is not labeled “related to.” That teaching note was not added.

## Tests

`npx tsc --noEmit` passed (exit 0) on 17 Nov 2026.

`node --test scripts/*.test.mjs` passed 670, failed 0, skipped 5 (675 tests). Local grok files that are not part of this branch were set aside for that run. They are not in the commit.

The GitHub Actions check is the next gate. Do not merge. Do not deploy.

