# Handover

This branch is not merged. Do not merge it. Merging is the Chairman's call. This PR stays a draft.

Branch: `cursor/listen-choice-dupes-baf3`

Starts from `main` at `d9b1674` (PR #267).

No secrets are in this note. No vocabulary row was edited or deleted.

## What this branch does

The Listen card (“Listen, then pick the Hebrew”) and the other multiple-choice drills that use the same distractor picker no longer deal two buttons with the same displayed Hebrew.

The picker is `closeItems` in `src/lib/vocab.ts`. Listen uses it through `drillCardChoices` (`contrast` + `audio`) in `src/lib/etch.ts`. The same picker fills the other Hebrew contrast cards, the study and verse boards, and `contrastChoices`. The English-button fallback (`englishMates`) uses the same displayed form, so a short list does not put the skipped twin back.

A distractor is skipped when its displayed Hebrew equals the answer or a distractor already chosen. Displayed Hebrew is NFC, then cantillation (U+0591–U+05AF) removed. Vowel points stay. Dagesh and the shin/sin dots stay. The picker keeps walking the ranked pool until it has enough distinct buttons. If the pool runs out, the card has fewer buttons. It does not repeat a form.

`displayedHebrew` lives in `src/lib/hebrew.ts`.

## The Chairman’s card

Verb, Ch. 12, the Listen card. The screenshot was read as רָעָה, אָכַל, אָמַר, אָכַל.

`אָכַל` is stored once on the Grammar Path: `akol`, chapter 12, “to eat, consume”. Scripture Path has one `אָכַל` (`iibs-a-1yjcxrd`, “he ate, he consumed”) and one `אֹכֶל` (`iibs-e-1lni4kl`, “food”), which keeps different vowels. The final-exam list uses the same `akol` once.

On a week-15 sitting with seed 42, the Listen card for `akol` deals רָעָה (`raah-pasture`), אָכַל (`akol`), אָמַר (`amar`), אָבַל (`abal`, chapter 20, “to mourn”). Bet and kaf are lookalikes, so the picker prefers `abal`. That pair is not the same displayed spelling, and this branch does not remove lookalike traps. The Chairman can decide whether אָבַל beside אָכַל should stay.

The test that fails on the old picker puts a second `אָכַל` in the pool with a tipcha (`אָכַ֖ל`), plus an exact copy and an NFD copy. The Listen card then has four buttons and none of those copies.

## Identical displayed Hebrew

Compared with `displayedHebrew`. Left for the Chairman. Nothing below was changed.

### Grammar Path `VOCAB` (422 items, 4 groups, same stored string)

- אַף — `aph` (ch 9, noun, “nostril, nose, anger”); `aph-also` (ch 15, particle, “also, indeed, even”)
- זָקֵן — `zaqen` (ch 7, adj, “old; elder, old man”); `zaqen-v` (ch 20, verb, “to be old”)
- עָנָה — `anah` (ch 15, verb, “to answer, respond, testify”); `anah-sing` (ch 20, verb, “to sing, answer”)
- רָעָה — `raah-evil` (ch 7, noun, “evil, wickedness, calamity, disaster”); `raah-pasture` (ch 18, verb, “to pasture, shepherd, feed”)

### Semester 2 `VOCAB_S2` (206 items, 3 groups, same stored string)

- טָמֵא — `s2-20-1` (ch 20, verb, “to be unclean, become unclean”); `s2-26-14` (ch 26, adj, “unclean”)
- פָּלָא — `s2-24-12` (ch 24, verb, “to be extraordinary, be wonderful, be too difficult”); `s2-32-3` (ch 32, verb, “to be extraordinary, wonderful”)
- שִׁיר — `s2-25-14` (ch 25, noun, “song”); `s2-26-10` (ch 26, verb, “to sing”)

### Scripture Path `iibsPathItems` (1,665 items, 45 groups)

Five groups match only after NFC. The stored mark order differs, so the old raw-string check treated them as different buttons:

- גִּבְעָה — `iibs-b-wfaz6f` (noun, “hill”); `iibs-d-1e886m8` (name, “Gibeah”)
- גֶּפֶן — `iibs-a-1cnmw38` (noun, “vine”); `iibs-d-gta6b0` (noun, “vine”)
- כֵּן — `iibs-a-1tmpzvy` (particle, “so, thus”); `iibs-d-5ncgxe` (noun, “base, pedestal; place, position”)
- מֶמְשָׁלָה — `iibs-a-1w8hrg6` (noun, “Dominion”); `iibs-d-1p5xev7` (noun, “dominion, rule, kingdom”)
- שְׁכֶם — `iibs-a-1cgr0bj` (noun, “shoulder”); `iibs-c-bafrgs` (name, “Shechem”)

The other 40 groups are the same stored string, with two meanings (טוֹב has three):

- אֱדוֹם — `iibs-a-17m2sh7` (name, “Edom”); `iibs-b-17m2sh7` (name, “Edom”)
- אֵי — `iibs-a-bg21i8` (particle, “where”); `iibs-d-4c6p59` (particle, “where?”)
- אֵיךְ — `iibs-a-1n8cuib` (particle, “how”); `iibs-e-p93w6c` (particle, “how?”)
- אַל — `iibs-a-1bbovii` (particle, “do not”); `iibs-b-octpkz` (particle, “not [prohibition]”)
- אֳנִיָּה — `iibs-a-192ctob` (noun, “Ship”); `iibs-b-gis657` (noun, “ship”)
- אַף — `iibs-a-1it90xu` (particle, “also, more than this”); `iibs-b-qtu1ft` (noun, “nostril, nose, face, anger”)
- אַשּׁוּר — `iibs-a-1al3aff` (name, “Asshur, Assyria”); `iibs-a-w88ren` (gentilic, “Assyrian”)
- אֵת — `iibs-a-p1czcu` (prep, “with”); `iibs-a-64hl1l` (particle, “direct object marker, untranslated”)
- בַּעַל — `iibs-a-1ne6iwr` (noun, “owner, lord, husband”); `iibs-a-1kored0` (name, “Baal”)
- בְּרָכָה — `iibs-a-109995c` (noun, “blessing”); `iibs-b-1c3s93x` (noun, “blessing; gift”)
- דָּבַק — `iibs-a-33nzx8` (verb, “he clinged”); `iibs-b-1ey8avt` (verb, “he clung”)
- הֵנָּה — `iibs-a-xdqaxq` (pron, “they”); `iibs-b-h1zudg` (particle, “hither”)
- זָקֵן — `iibs-a-qv0rz` (adj, “old”); `iibs-d-1mbgq9n` (verb, “he was/became old”)
- חָסֵר — `iibs-d-16daspt` (adj, “lacking”); `iibs-d-4ut1fp` (verb, “he lacked, was lacking/in want; it diminished”)
- טָהֵר — `iibs-b-1ahsfdb` (verb, “he was clean”); `iibs-c-zbnlpx` (verb, “he was/became clean”)
- טוֹב — `iibs-a-763rt6` (adj, “good, pleasing”); `iibs-b-1in3fej` (noun, “a good thing, benefit, welfare”); `iibs-c-1l442ey` (verb, “he was good, well, glad, pleasing”)
- טָמֵא — `iibs-a-gsmbe` (adj, “unclean”); `iibs-c-1k3opjq` (verb, “he was/became unclean”)
- יָרֵחַ — `iibs-a-1rv77to` (noun, “moon”); `iibs-b-pu4nsu` (noun, “moon, month”)
- כָּלָה — `iibs-c-126a6uk` (verb, “it was finished, ended, determined, exhausted; he perished”); `iibs-e-1v02ftt` (noun, “completion, complete destruction”)
- כַּשְׂדִּים — `iibs-b-oaqs2e` (name, “Chaldeans”); `iibs-b-1hhwjoh` (gentilic, “Chaldean”)
- לָבָן — `iibs-a-1ujpsqb` (name, “Laban”); `iibs-d-sw4bk6` (adj, “white”)
- לֵוִי — `iibs-a-zwt083` (name, “Levi, Levite”); `iibs-a-mk4j9d` (gentilic, “Levite”)
- מַדּוּעַ — `iibs-a-t7a4j` (particle, “why”); `iibs-b-16fq126` (particle, “why? for what reason?”)
- מָדַי — `iibs-e-1mgo7n8` (name, “Media, Medes”); `iibs-e-mpyxmr` (gentilic, “Mede”)
- מִין — `iibs-a-10o14yj` (noun, “species”); `iibs-e-1yu3d6d` (noun, “kind, species”)
- מָלֵא — `iibs-a-rc4hjb` (adj, “full”); `iibs-c-o7bayn` (verb, “he was full; he filled”)
- נֵבֶל — `iibs-d-1v9zqa` (noun, “harp, lute”); `iibs-e-1rxuv7f` (noun, “skin, jar”)
- נִחַם — `iibs-b-l5gswc` (verb, “he comforted, he consoled”); `iibs-c-15gcabo` (verb, “he regretted, relented, repented; he comforted himself”)
- עַד — `iibs-a-15cc04s` (prep, “as far as, up to, until”); `iibs-c-okkf2j` (noun, “eternity”)
- עֵזֶר — `iibs-a-e4glo4` (noun, “help, support”); `iibs-b-17a3f6l` (noun, “help, aid”)
- עֳנִי — `iibs-a-ynnaz1` (noun, “affliction, misery”); `iibs-d-wcdwa7` (noun, “affliction, misery; poverty”)
- פָּרָה — `iibs-c-1be1qh4` (verb, “he/it bore fruit, was fruitful”); `iibs-e-14qlxqz` (noun, “cow, heifer”)
- פָּרַס — `iibs-e-gqs0in` (name, “Persia”); `iibs-e-1up7fqb` (gentilic, “Persian”)
- צְבִי — `iibs-d-17uk4mv` (noun, “gazelle”); `iibs-e-yvusfq` (noun, “glory”)
- צַר — `iibs-b-14l704l` (noun, “adversary, enemy”); `iibs-c-138hg97` (noun, “distress, narrowness”)
- צָרַר — `iibs-e-d9qqo4` (verb, “he bound, tied up, shut up; he was cramped, impeded, distressed”); `iibs-e-zkwvqk` (verb, “he was hostile toward; he vexed, harassed”)
- רָעָה — `iibs-a-1x3gx40` (noun, “evil, misery, distress, injury”); `iibs-b-t31bct` (verb, “he pastured, he tended, he grazed”)
- שָׁבַר — `iibs-a-nb90ol` (verb, “he broke”); `iibs-e-1hj3j5s` (verb, “he bought [grain]”)
- שֵׂעָר — `iibs-a-upxfd5` (noun, “hair”); `iibs-b-upxfd5` (noun, “hair”)
- תֵּבָה — `iibs-a-1pvdrmj` (noun, “ark”); `iibs-b-1pvdrmj` (noun, “ark”)

Final exam (80), independent pronouns (11), pronominal suffixes (10), and Qal imperfect suffixes (12) have no display-identical group.

## Tests actually run

On 26 Nov 2026, Node v22.23.4, on this branch after the edits:

- `npm run typecheck` (`tsc --noEmit`) — exit 0
- `node --test scripts/*.test.mjs` — 779 tests, 774 pass, 0 fail, 5 skipped. The new test is “a listen card never shows two choices with the same Hebrew”. It watched the old picker fail first (the card was אָכַל, אָמַר, הָלַךְ, אָכַל).
- `npx eslint` on the file list in `.github/workflows/checks.yml`, with `--max-warnings 0` — exit 0
- `npm run build` — exit 0. `db:migrate` skipped because `DATABASE_URL` is not set. That is the local path in `scripts/migrate.mjs`.

`npx eslint src/lib/hebrew.ts src/lib/vocab.ts src/lib/etch.ts` still reports `no-misleading-character-class` on older regexes that contain a literal combining mark (`consonantsOf`, and three sites in `hebrew.ts`). Those lines were already on main. The new check uses `\u0591-\u05AF`. CI does not lint those files. This branch does not change those regexes.

## Record already on main

The note below was already on `main` at `d9b1674`. It describes PR #267.

# Handover

This branch is not merged. Do not merge it. Merging is the Chairman's call.

Branch: `cursor/pe-aleph-rulings-d911`

Starts from `main` at `566f639` (PR #266, the filled Pe-Aleph chart).

No secrets are in this note.

## What this branch does

Chairman rulings on `data/paradigms/weak-ialeph.json`, plus a phone fit for the Verb Lab charts. No other Hebrew file was edited. The file still has 207 cells.

1. **Qal imperative ms.** The note no longer contains the sentence that names עֲמֹד. The rest of that note stays: א is a consonant with ḥaṭeph seghol, and אמר has אֱמֹר, pausal אֱמָר.

2. **Pual yiqtol 2mp.** Was `paradigm-standard` with the label `standard form, not in the Bible`. It is now an attested example, Isa 1:20 #5, teaching root אכל (H398). The example word is the WLC token, normalized to NFC, including its accent. The note says OSHB tags it Qal passive and STEPBible tags it Pual. OSHB on that token is `HVQi2mp`. The tahot morph is recorded as `HVPi2mp` (Pual imperfect 2mp in this file's codes), `agreesWithOSHB` false, comparison `stem`. `parseEligible` is true. The display mark is gone. `attestedTokenCount` is 1 and `teachingRootTokenCount` is 1, for this approved token.

3. **Niphal qatal 3ms.** The displayed example is no longer Exod 22:5 (a weqatal). It is Num 27:13 #9, the WLC token נֶאֱסַ֖ף (patah under the samekh, with the tipcha), root אסף H622, `exampleRootClass` I-Aleph, no waw prefix. tahot is `HVNp3ms` and agrees. `attestedTokenCount` stays 5 and `teachingRootTokenCount` stays 1.

4. **Hiphil participle mp** (Deut 1:32 מַאֲמִינִם). A spelling note was added: written without the yod (defective), with the same vowels. The example word and the reference were not changed.

5. **Eleven displayed examples.** Only `exampleWord`, `exampleRef`, and `exampleStrongs` changed, copied NFC from the approved list. `attestedTokenCount` and every other field on those cells stayed. 1Kgs 5:3 is the file's existing reference style (`1Kgs 12:18` is already in the file). That verse is Hebrew numbering; English 1 Kings 4:23 is the same verse. Niphal.participle.ms is the Tutor's warning: the example was swapped to Gen 49:29 #6, and the cell's tahot was left as it was (`HVNrmsa`, comparison `agree`). OSHB on that token is `HVNsmsa`. The two tags differ only by the participle letter (s versus r).

6. **Phone width.** On main, the strong-verb chart and the Pe-Aleph chart both use one table with `min-w-[36rem]` (576px). At a 390px viewport the page scroll width was 611px, so the page scrolled sideways. The same was true of the strong Qal perfect chart. Under 640px the Verb Lab charts, including the seven-stems welcome table, now stack each row inside the panel. Noto Serif Hebrew and the form line-height from PR #266 stay. At 390px the page scroll width equals the client width (374px) and the table is 303px. At 360px the page scroll width equals the client width (345px) and the table is 273px.

## Tests actually run

On 26 Nov 2026, Node v22.23.4, on this branch after the edits:

- `npx tsc --noEmit` — exit 0
- `node --test scripts/*.test.mjs` — 778 tests, 773 pass, 0 fail, 5 skipped
- `node scripts/audit-lemmas.mjs` — exit 0. Counts: a 4, b 2762, c 0, d 12993, e 0, f 760, g 6572, h 0. This branch did not touch lemma data.

## Record already on main

PR #253 landed as `0e3f85f`. Its own note, written before that squash, is kept here so the path-hub decision stays on the page.

PR #253 (`cursor/listen-lab-card-2d6d`) was rebased onto `main` at `ff09520b19d1ac44316ed7cc6485539bdc00d97d` and then squash-merged. The rebased app commit those tests covered was `d1620584043d0c6ea025ec00a50e9324a28ad4fd`.

Run on 26 Nov 2026, Node v22.23.4, on `d1620584043d0c6ea025ec00a50e9324a28ad4fd`:

- `npm run typecheck` (`tsc --noEmit`) passed (exit 0).
- `node --test scripts/*.test.mjs`: 769 tests, 764 pass, 0 fail, 5 skipped.
- `node scripts/audit-lemmas.mjs` passed (exit 0). Counts: a 4, b 2,762, c 0, d 12,993, e 0, f 760, g 6,572, h 0.
- `npx eslint` on the file list in `.github/workflows/checks.yml`, with `--max-warnings 0`, passed (exit 0).

`src/components/path-hub.tsx` was the only rebase conflict on that branch. Both import sides were kept: `VerbLabCard` from main, and `translationLabEnabled` plus `showTranslationLabListenCard` from that branch. The Learn, Practice, and Play menus still render `VerbLabCard`. The card list still has the quiz and drill entries main added after PR #252: independent pronouns, pronominal suffixes, and Qal imperfect suffixes, on both semesters. The Verb Lab frame from PR #261 was already on main and was not in the conflict. The Translation Lab card is still appended only when the menu is Listen, `translationLabEnabled()` is on, and `showTranslationLabListenCard` is true (open term Semester 1).

## Earlier record

The notes below were already on `main`. They describe the lemma work from `4eac58a` (PR #246, merged 17 Nov 2026). That branch was not merged again from here. Do not treat the 17 Nov test line as this run.

It starts from `main` at `4eac58a` (PR #246, merged 17 Nov 2026, 6:11 PM America/Indianapolis). Production was already on that SHA when that note was written.

The pin is `data/wlc`, haday-hebrew-data v1.2.0, dataset `1.2.0`, OSHB pin `3d15126fb1ef74867fc1434be1942e837932691f`. 23,213 verses. 305,501 written tokens. Nothing is fetched from `openscriptures/morphhb` `master`.

## What that lemma branch did

Four small jobs. A wrong match is still worse than no match. `formOfLexicon` was not tightened. No new Levite card, no people-sense cards, no audio, no BHS.

1. **Rule 1.7 display.** Where the ketiv and the qere differ, both readers show the qere and note the ketiv beside it. The note is the written word. It has no English gloss. Grammar Path verses and word cards still show the English translation. The page still says “English stays on the page.” The Grade quiz still asks “Which English is this verse?” A differing-number ketiv word card has no gloss. A word card that still has a class lemma keeps its English.

   An empty `qere` borrows the next ketiv’s read form, which is where this pin hangs a split. The qere of that group is drawn once, on the ketiv that borrowed it. The other ketiv is still noted, and it does not draw the qere again. Isa 44:24 reads מֵאִתִּי (מי) (אתי), not the qere twice. The same once-per-group line is on the Grammar Path and the Scripture Path (1Sam 20:2 #6–#7, Job 38:12 #3–#4, and the other 14). The six written-not-read tokens have no read form, so they get no note (2Kgs 5:18 #22, Ezek 48:16 #11, Jer 38:16 #9, Jer 39:12 #10, Jer 51:3 #2, Ruth 3:12 #4). Gen 30:11 #2 shows בָּא גָד with בגד noted, and still has no class card. The note file is [public/tanakh/ketiv-qere.json](../public/tanakh/ketiv-qere.json): 1,262 notes. 1,268 ketivs minus the 6 with no read form. 17 of those notes are the empty-own-`qere` splits, including the 10 whose numbers differ and the 7 whose numbers match. The other 17 notes in those groups are the ketiv only.

2. **Overrides file.** [data/lemma-overrides.json](../data/lemma-overrides.json) is the only named-token list. Each row is verse, index, exact surface, and the OSHB lemma and morph. `lemmaForReading` applies a row only when all four still match. `scripts/build-strongs.py` reads the same file. A test fails if a row’s surface or tag has drifted. The Zechariah 8:23 special case is gone from `strong-lemma.ts`. That token stays Judean/Jew `iibs-e-tbwdu6` on the Scripture Path (rule 4.1) and none on the Grammar Path.

   The 58 H639 `HTa` tokens are on the existing noun card, both paths: Grammar `aph` (“nostril, nose, anger”), Scripture `iibs-b-qtu1ft` (“nostril, nose, face, anger”). Reason recorded: “OSHB tags these HTa, but in context each is the noun.” Ps 115:6 #4 is one of them. They are not sent to H637. The other 216 single-number H639 tokens were already that card. The two two-number tokens (Num 12:9 #0, 2Sam 6:7 #0) stay none under rule 1.6. 274 single-number H639 tokens now have the noun card.

3. **Audit.** `scripts/audit-lemmas.mjs` is read-only. It walks every written token and writes exceptions for LEMMA_RULES §8.1 a, b, c, d, e, f, g, and h. Each row (LEMMA_RULES §8.2) has the verse, the token index, the surface, the OSHB tag (`lemma|morph`), the path, the card id, and the proposed class lemma (`hebrew (gloss)`, or empty when the row is a miss). CI runs it after the tests. It exits non-zero if it cannot finish, if 8.1 e or 8.1 h is not zero, if 8.1 c is no longer zero, or if the report differs from [docs/lemma-audit-baseline.json](lemma-audit-baseline.json). It does not fail only because known a/b/d/f/g rows are still there. Current counts: a 4, b 2,762, c 0, d 12,993, e 0, f 760, g 6,572, h 0. 8.1 g reports the loose `formOfLexicon` hits. The matcher was not tightened.

4. **Two stem mismatches are none.** Neh 2:13 #16 (H6555 pual participle) had Scripture Path `iibs-b-149047p` “he broke through” and Grammar Path none. It is now none on both paths. There is no passive card. Job 38:12 #3 (H3045 piel) had `yada` / `iibs-a-1vjj7fa`. It is now none on both paths. It is not on the hiphil “make known” card. Job 38:12 #4 stays “dawn.” The other 14 of the old keep-16 still have their cards.

## Counts against that main

The CSV is only that PR’s lemma changes. [strong-map-wlc-rebase-diff.csv](strong-map-wlc-rebase-diff.csv): **60 tokens, 119 rows** (59 Grammar Path, 60 Scripture Path). 116 rows are the 58 H639 gains, both paths. 3 rows are the losses: Job 38:12 #3 on both paths, and Neh 2:13 #16 on the Scripture Path only. Zechariah 8:23 did not change. Same-surface only. No index shift.

The map is still bbh 559 keys and Scripture Path 1,680 keys. H758 and H5045 stay. H6307 and H7418 stay gone.

## Locks

Still green, from this pin:

- Levi / Levite **288 / 58 / 4**
- Ketiv comparison **1,268 / 1,034 / 234**. Appendix B is still 101. The six written-not-read tokens still have no lemma.
- Rule 3.2: **23** tokens still none on both paths. H884: **34** still `iibs-a-10eyk0o` on the Scripture Path and none on the Grammar Path.
- The 0.5.3 alignment test: 305,501 tokens, 23,213 verses.

A second rebuild from `data/wlc` plus `data/lemma-overrides.json` is byte-identical (`scripts/build-strong-map.mjs` twice, then `scripts/build-strongs.py` twice). The query index was not rebuilt. `scripts/build-tanakh.py` was not run.

## Earlier tests (17 Nov 2026)

`npx tsc --noEmit` passed (exit 0) on 17 Nov 2026. TanStack Start is 1.168.60.

`node --test scripts/*.test.mjs`: 700 tests, 695 pass, 0 fail, 5 skipped. That covers the locks above, the split-qere display (the qere of each of the 17 groups is drawn once), Gen 30:11, the six written-not-read tokens, the override drift test, and the English-still-on-the-page test. `node scripts/audit-lemmas.mjs` passed against the committed baseline. This is the earlier record, not the 26 Nov run at the top.
