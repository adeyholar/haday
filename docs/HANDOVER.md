# Handover

This branch is not merged. Do not merge it. Do not deploy. Do not apply a 2025 Level B form.

## What this branch repairs

Three Tutor-confirmed headwords were repaired to the 2018 coursebook page. Gloss, plural, and kind were not rewritten. No row was inserted, deleted, or reordered. The old study id was frozen before the string edit, so a saved card and a paused drill follow the new id.

| Level | Place | Old id | New id | Now |
| --- | --- | --- | --- | --- |
| A | 9.02 | iibs-a-txnp37 | iibs-a-1l0rl94 | גַּג |
| C | 9.05 | iibs-c-1xgsae3 | iibs-c-1ndz7hc | נִבָּא |
| D | 4.01 | iibs-d-po0ue2 | iibs-d-b3oitr | חֹרֶב |

The place slots iibs-a-09-02, iibs-c-09-05, and iibs-d-04-01 chain to those new ids. Level D also still chains the older gloss ids iibs-d-z6rwq7 and iibs-d-81iy5q. The proper name stays in the note only. The Level D vocabulary table is printed page 42 and is stored in the check as page 50. That page number was not changed.

The four repairs already on main were left as they are. Their freeze ids were not regenerated: A 8.02 (iibs-a-1et6eo4), A 14.20 (iibs-a-rykh6t), B 18.08 (iibs-b-x412qb), B 26.05 (iibs-b-a1u5id).

## Still different

| Level | Lesson | Why it was left |
| --- | --- | --- |
| A | 3.11 | Qamats on the page, patah on the site. Id iibs-a-1f0r1bt. Page 74. |
| C | 9.02 and 9.03 | Word-set. The page has טֻמְאָה then גָּבַהּ. The site keeps גָּבַהּ then טָהֵר. Not renumbered. |

Level B was not touched.

## Tests

`npx tsc --noEmit` passed. `node --test scripts/*.test.mjs` passed 663, failed 0, skipped 5.

## Next step

Derek review. Do not merge. Do not deploy.
