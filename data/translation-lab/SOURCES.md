# Translation lab sources

Genesis 1:3 only. YLT and WEB in `gen-1-3.json` are copies of the pinned texts named below. The test `scripts/translation-lab.test.mjs` checks those two strings still match.

## YLT

- File: `data/paradigms/ylt.json`
- Key: `verses["Gen.1.3"]`
- Text: `and God saith, 'Let light be;' and light is.`

## WEB

- File: `public/tanakh/books/Gen.json`
- Field: chapter 1, verse 3, `en.lines[0].text`
- That line is the versemap reading of the pinned World English Bible.
- Text: `God said, “Let there be light,” and there was light.`

## JPS 1917

JPS 1917 is not in the versemap. The Look line is the verse text in `data/translation-lab/jps1917/GEN.1.3.txt`. That file is one line copied from a public-domain export, not retyped.

- Local file: `data/translation-lab/jps1917/GEN.1.3.txt`
- Upstream: [BibleNLP/ebible](https://github.com/BibleNLP/ebible) `corpus/eng-engjps.txt` at commit `7c76696c0ab2a5b69258342522fdb2c5db055200` (blob `050e194f2903d831541b7d28b569190c4d07dde9`)
- Verse index: `metadata/vref.txt` line `GEN 1:3` in that same commit (blob `93eeaf7efa57b877a3ed2be5de3fa595a99e069f`)
- Work: The Holy Scriptures According to the Masoretic Text, Jewish Publication Society, 1917
- License: Public Domain. eBible.org distributes this Old JPS text as public domain. This file is the verse line only.
- Text: `And God said: 'Let there be light.' And there was light.`

`SHA256SUMS` pins `gen-1-3.json` and `jps1917/GEN.1.3.txt`. `gen-1-3.json` `readings.jps` must equal the verse line.
