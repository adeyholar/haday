# Handover

This branch is not merged. Do not merge it. Do not deploy.

It starts from `main` at `6875d52` (PR #245, merged 17 Nov 2026). PR #245 is already on `main`. This branch does not deploy that merge again.

## What this branch does

Both the Grammar Path and the Scripture Path now match the pinned text in `data/wlc` (haday-hebrew-data v1.2.0, dataset `1.2.0`, OSHB pin `3d15126fb1ef74867fc1434be1942e837932691f`). 23,213 verses. 305,501 tokens. Nothing is fetched from `openscriptures/morphhb` `master` or from `tanakh_ai_tutor`.

`scripts/build-strongs.py` rewrites each verse’s `words` and `he` from the written line (`surface` + `trailer`, `kq_role === "qere"` skipped). English (`en`, `enSource`) stays the World English Bible and is joined only by book, chapter, and verse. The Strong’s tag is `Hxxxx|morph` from that same token. A token with two Strong’s numbers, and a ketiv whose number is not the qere’s number, is tagged with the morph only. `scripts/build-strong-map.mjs` and `scripts/build-tanakh-query-index.py` read `data/wlc` directly. `scripts/build-tanakh.py` was not run. A warning at the top says not to run it as-is.

No verse is only in `books` or only in `data/wlc`. See [wlc-rebase-verse-gaps.txt](wlc-rebase-verse-gaps.txt).

Listen timestamps were not rewritten. 984 verses have a different word count than `public/tanakh/align`. `src/lib/reading.ts` already re-spaces those; it was not changed. The list is [wlc-align-count-mismatches.txt](wlc-align-count-mismatches.txt). Genesis has 14 (Gen 8:17, 13:3, 14:2, 14:8, 14:17, 24:33, 25:23, 27:29, 35:22, 36:5, 36:14, 39:20, 49:10, 49:11). The first verse of each Genesis chapter still matches.

A second rebuild from `data/wlc` is byte-identical (`scripts/build-strong-map.mjs` twice, then `scripts/build-strongs.py`). The query index and `public/tanakh/books` are unchanged. `formOfLexicon` was not tightened. The Zechariah 8:23 override was not moved.

The Grammar Path reader display (rule 1.7) is not in this PR. The qere-shown, ketiv-noted rendering and `public/tanakh/ketiv-qere.json` were added on this branch and then removed. That display is a separate follow-up. Grammar Path verses and word cards show the English translation as they did at `e91f983`. The Grade quiz still asks which English the verse is. The Scripture Path reader was not restyled. This branch only withholds the class lemma. The ketiv counts below are unchanged: 1,268 ketivs, 1,034 match, 234 differ.

## Class lemmas that changed

7,253 tokens changed class lemma against `main` (8,312 CSV rows: 6,959 Grammar Path, 1,353 Scripture Path). 1,059 of those tokens changed on both paths. The full list is [strong-map-wlc-rebase-diff.csv](strong-map-wlc-rebase-diff.csv). Columns: verse, token index, surface, old surface, path, old lemma (`id / gloss`), new lemma.

Same-surface rows: 1,388 Grammar Path and 1,353 Scripture Path (2,741 rows, 1,705 tokens). Different-surface rows: 5,571, all Grammar Path. Those are a different word at that index, because the old line had smashed or split the token. Scripture Path has no different-surface row. 984 verses changed word count.

The earlier handover said 1,544 same-surface tokens (351 Grammar Path and 1,194 Scripture Path). Those two counts add to 1,545 rows, and the unique-token count on that CSV was 1,544. The written total was off by one. That figure was also from before this Hebrew review. It is not the live count. The CSV in this commit is the recount above.

The map is still bbh 559 keys. Scripture Path is 1,680 keys. It was 1,683 after the pin landed. H606 was removed, then H6307 and H7418. H3212, H3526, and H5324 stay, narrowed by stem in `lemmaForReading` rather than by extra map rows. H1120, H2699, H2691, H3878, H3881, H3816, H884, H1145, H5046, and H1099 are the same rows as PR #245. H758 Aram and H5045 Negev stay.

Samples:

| Verse | Index | Surface | Strong | Class lemma |
| --- | --- | --- | --- | --- |
| Gen 1:1 | 0 | בְּרֵאשִׁ֖ית | H7225 | unchanged. Grammar Path: no class lemma, not רֹאשׁ. Scripture Path: “beginning, first; first-fruits”. The word-card lock that בְּרֵאשִׁית is רֹאשׁ was not touched |
| 1Chr 1:11 | 3 | לודיים | H3866 | the unpointed ketiv, its own token. The old line had fused ketiv and qere into one word and left the tag empty. No class lemma |
| 1Chr 1:11 | 4 | וְאֶת | H853 | object marker. The old index 4 was עֲנָמִים, because the fused word had shifted the line |
| 1Chr 1:15 | 3 | הַֽעַרְקִ֖י | H6208 | the Arkite. The old surface was הַֽעַרְקִ֖י (the meteg sat on the other side of ה). No class lemma either way. Not H6177 |
| 1Chr 11:4 | 0 | וַיֵּלֶךְ | H3212 qal | Grammar Path: הָלַךְ “to go, walk”. Scripture Path: “he walked; he went”. Not “he led, brought” |

## Hebrew review

Rules are by OSHB stem, not by a verse list, except the tokens named below. Counts are a full walk of the pin, before this review (`e91f983`) and after.

1. **H3212.** Qal (`Vq…`) is הָלַךְ, the same card as H1980 qal: Scripture Path `iibs-a-1msybw9`, Grammar Path `halak`. 998 qal tokens. 995 now take that card. The other 3 are ketivs whose number is not the qere’s (Jer 6:25 #5, Num 23:13 #3, Song 2:13 #8), so rule 6 leaves them with no lemma. Before, all 998 qal tokens were הוֹלִיךְ `iibs-c-1tp6utj` on the Scripture Path and had no Grammar Path lemma. Hiphil (`Vh…`) stays הוֹלִיךְ: 45 before and after. The one other stem had no lemma before and still has none. 1Chr 11:4 #0 is the walk card.

2. **H5324.** Niphal (`VN…`, 50) moves from הִצִּיב `iibs-c-1jg2v39` to נִצַּב `iibs-c-11jl9et`. Hiphil stays הִצִּיב (21). Hophal had that hiphil card and now has no lemma: Gen 28:12 #3, Judg 9:6 #14, Nah 2:8 #0.

3. **H606.** Aramaic אֱנָשׁ. The key is gone. All 25 tokens had `iibs-a-1kna9dn` “men” (Hebrew אֲנָשִׁים) and now have no lemma. No other Aramaic number was dropped. A blanket `(Aramaic)` cut also removed the PR #245 locks for Mede H4076 and Persian H6540. Those stay.

4. **H3526.** Piel (`Vp…`, 44) stays כִּבֵּס `iibs-b-11dtd9c`. The other stems had that card and now have no lemma: pual 2, stem `u` 2 (Lev 13:55 #3, 13:56 #7, 13:58 #14, 15:17 #9), and the qal “fuller” participles (2Kgs 18:17 #31, Isa 7:3 #20, Isa 36:2 #19).

5. **Two Strong’s numbers get no lemma.** Exactly 8 tokens: Num 12:9 #0 and 2Sam 6:7 #0 (`c/2734/639`), 1Chr 20:4 #1, 2Chr 20:1 #1, 2Chr 20:35 #0, 2Sam 8:1 #1 (`310` with `3651`), Ps 149:1 #0 and Ps 150:1 #0 (`1984` with `3050`). Scripture Path already returned none, because a two-number lemma is not one number. Grammar Path used to pack the last number, so 4 were כֵּן and 2 were אַף “also”. All 8 are now none on both paths, and the tag is the morph only. H637 stays אַף “also” only (`aph-also` / `iibs-a-1it90xu`, 134 tokens, unchanged). H639 no longer reaches that card. 216 stay אַף “anger” (`aph` / `iibs-b-qtu1ft`). 58 had been the “also” card and are now none. They are not forced onto the anger card.

6. **Ketiv/qere.** 1,268 ketiv tokens. A ketiv keeps its lemma when its one Strong’s number is anywhere in its qere list, not only in the first qere word. An empty qere uses the adjacent ketiv’s qere, which is where this pin hangs a split reading. After that rule, **1,034** match and **234** do not. The 234 include the review’s Appendix B: 101 ketivs that had a class lemma and whose number is still not in the qere. They stay with no lemma. So do the six written-not-read tokens with no qere anywhere (2Kgs 5:18 #22, Ezek 48:16 #11, Jer 38:16 #9, Jer 39:12 #10, Jer 51:3 #2, Ruth 3:12 #4). The earlier 250 / 1,018 cut compared only `qere[0]` and treated a missing qere as a mismatch. That dropped 16 tokens whose number is in the qere. Those 16 keep the card they had before the strip: Job 38:1 #4–#5, Job 38:12 #3–#4, Job 40:6 #4–#5, Exod 4:2 #3, 1Sam 20:2 #7, 2Sam 21:12 #22–#23, Ezek 42:9 #0–#1, Ezek 9:11 #11, Neh 2:13 #16, 1Kgs 17:15 #5, and Isa 52:5 #1 (Grammar Path “what”; no Scripture Path card). Named tokens that stay unmatched: Isa 44:24 #15, Song 2:13 #8, Isa 10:32 #7. There is no multi-number ketiv.

7. **H1323 is daughter, not Zion.** `zion` and `iibs-a-10um24x` are off both paths for 1323. Daughter stays (`bat` / `iibs-a-ugthyp`). Isa 10:32 #8 צִיּוֹן (H1323, `HNp`) was Zion on both paths and is now none. A later overrides PR may put it back. H6726 is untouched.

8. **A trailing `+` is not one lemma (rule 3.2).** OSHB marks a multi-word proper name with `+` on the Strong’s number (`6307+`, `b/7418+`). That token gets no class lemma on either path. The only exception is H884 Beer-sheba (rule 3.3): 34 tokens, every one `884+`, stay בְּאֵר שֶׁבַע `iibs-a-10eyk0o` on the Scripture Path and none on the Grammar Path. The continuation word repeats the number with no `+`, so the Scripture Path keys 6307 and 7418 are gone. That clears every H6307 and H7418 token on this pin. 10 first words of Paddan-aram were Aram (`iibs-a-1vdejzx`). 10 following אֲרָם tokens were the same card. Gen 48:7 #2 מִפַּדָּן is `m/6307` with no plus, and it was Aram too. 1Sam 30:27 #4–#5 were Negev (`iibs-d-1gzt8ob`). 23 tokens, all none now. The review’s 11th אֲרָם is not in this pin, so the total is 23, not 24. Grammar Path already had no card for these numbers. No other `+` token had a class lemma. H758 and H5045 are untouched.

## PR #245 locks

Still in force, and still green: object marker, gentilics, compounds, Bamoth H1120, Hazerim H2699, H3816 people on the Scripture Path only (35), and the article-first Levite rule including `Rd`. An open sitting is not wiped. Levi/Levite on this pin is still 288 with the article, 58 Levi without it, and 4 gentilic without it.

## Tests

`npx tsc --noEmit` passed (exit 0) on 17 Nov 2026. TanStack Start is 1.168.60.

`node --test scripts/*.test.mjs`: 693 tests, 688 pass, 0 fail, 5 skipped. `scripts/lemma-hold.test.mjs` has one test for each fix above, including the trailing `+` and the 34 Beer-sheba tokens. `scripts/grammar-ketiv.test.mjs` was the display check and is not on this branch. `scripts/surface-alignment.test.mjs` still checks all 305,501 tokens against `data/wlc` and fails on any surface or Strong’s mismatch. The expected tag uses the same pack rule as `build-strongs.py`.

Branch `fix/wlc-pinned-matching`. This branch is not merged. Do not merge. Do not deploy.
