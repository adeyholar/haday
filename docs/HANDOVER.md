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
| מִצְרִי | H4713 | gentilic, “Egyptian” |
| כְּנַעֲנִי | H3669 | gentilic, “Canaanite”. This number is back on the map |
| פְּלִשְׁתִּים | H6430 | gentilic, פְּלִשְׁתִּי “Philistine” |
| יְהוּדִי | H3064 | gentilic, “Judean, Jew” |
| הַלֵּוִי with the article (הַ, or לַ / בַּ) | H3878 or H3881 | gentilic, “Levite”, even when the tag says a name |
| לֵוִי with no article and a name morph | H3878 or H3881 | name, “Levi”. A plain לְ is not the article |
| לֵוִי with no article and an Ng morph | H3881 | gentilic, “a Levite”. Judges 17:7, 17:9, 19:1, and Nehemiah 10:1 לְוִיֵּנוּ |
| יְמִינִי | H1145 | gentilic, “Benjamite” |
| אִישׁ inside אִישׁ יְמִינִי | H1145 | no class lemma. Not “man”, and not “Benjamite” |
| אִישׁ | H376 | still “man” |
| הַמָּדִי | H4075 | gentilic, “Mede”. The place מָדַי (H4074, a name) stays “Media” |
| אַשּׁוּר where the morph is Ng | H804 | gentilic, “Assyrian”. A name tag stays “Asshur, Assyria” |
| כַּשְׂדִּים where the morph is Ng | H3778 | gentilic, “Chaldean”. A name tag stays “Chaldeans” |
| פָּרַס where the morph is Ng | H6540 | gentilic, “Persian”. A name tag stays “Persia” |
| יְהוּדִי in Zechariah 8:23 | H3064 | gentilic, even though the tag says a name |

H853 is never “with” and never אַתְּ. Prefixed numbers (`b/7225`, `c/1961`, `d/5892 b`) still give the content word. הִגִּיד stays H5046. בְּרֵאשִׁית stays H7225, not רֹאשׁ. Names such as Jonah, Amittai, Tarshish, and Jaffa stay full strength.

A personal name does not take the article. הַלֵּוִי is the Levite on H3878 and on H3881, including 1 Chronicles 12:27, Malachi 2:8, and Nehemiah 10:40, where the tag says a name. לַלְוִיִּם and בַּלְוִיִּם keep the article inside the preposition, and they stay Levite. Without the article, a name tag stays Levi and an Ng tag stays Levite.

A compound or a fused name is not the ordinary word inside it. בַּת־שֶׁבַע is not seven. קִרְיַת אַרְבַּע is not four. אִישׁ־בֹּשֶׁת is not man. רַבְשָׁקֵה is not רַב. The full name stays when the class headword is that whole name: בְּאֵר שֶׁבַע stays Beer Sheva, and the “seven” inside it does not. The Grammar Path has no H3816 lemma. On the Scripture Path, H3816 is לְאֹם “people,” and בַּל stays unmatched. Stem pairs such as הִגִּיד and the lexicon root נָגַד stay. The class word is the stem.

The people-cards Levite, Benjamite, Assyrian, Chaldean, Mede, and Persian are reading-pool cards. They are not lesson rows. The coursebook counts stay A 481, B/C/D 300, E 280.

Dim unknowns is pale and still readable. The manuscript keeps its own ink: `#705848` on `#f6edd8` (5.67:1) and `#a89880` on `#1b1612` (6.38:1). Grammar Listen uses `#6a5648` on the card (6.46:1), `#5c4a3c` when the lamp is dim (5.72:1), and `#b5a48c` when the lamp is dark (6.66:1). No inline color. A word the student has opened stays full strength. The word being read still fades if it is unknown.

An open sitting is not wiped. Continue keeps the old queue. Drill unknowns again, or Start over, to take the new list.

The name יוֹנָה does not say “the word means dove,” and a related form is not labeled “related to.” That teaching note was not added.

If אֵת has no morph, the class does not guess between the object marker (H853), “with” (H854), and the hoe (H855). With the morph, the marker and “with” stay apart. Genesis 1:27 אֹתוֹ is the object marker. Genesis 39:2 אֶת־יוֹסֵף is “with.”

H1120 Bamoth / Bamoth-baal has no class lemma. The lexicon cites the fuller form בָּמוֹת בַּעַל, so neither בָּמוֹת nor בַּעַל is Baal. Six tokens: Joshua 13:17 (twice), Numbers 21:19, Numbers 21:20, Numbers 22:41 (twice). H2699 Hazerim, Deuteronomy 2:23 בַּחֲצֵרִים, has no class lemma. It is the place, not “villages.” H2691 חָצֵר still has “enclosure, courtyard” and “villages.” H1099 בְּלִימָה is a common noun, “nothing whatever,” not a compound name. It has no class lemma.

## Tests

`npx tsc --noEmit` passed (exit 0) on 17 Nov 2026. TanStack Start is 1.168.60.

`node --test scripts/*.test.mjs` passed 677, failed 0, skipped 5 (682 tests). The new Levi checks sit in the existing test, so the count did not rise. Local grok files that are not part of this branch were set aside for that run. They are not in the commit.

The lexicon-form check was left as it is. A tighter match would drop real spellings such as Aaron and אַתֶּם. Nothing new was mismatched.

Branch `fix/passage-strong-lemmas`. This branch is not merged. Do not merge. Do not deploy.
