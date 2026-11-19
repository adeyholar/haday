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

JPS 1917 is not in the versemap. The line in `gen-1-3.json` `readings.jps` is a copy.

- Version title: The Holy Scriptures: A New Translation (JPS 1917)
- Page: https://www.sefaria.org/Genesis.1.3?ven=The_Holy_Scriptures:_A_New_Translation_(JPS_1917)
- API: https://www.sefaria.org/api/texts/Genesis.1.3?context=0&commentary=0&ven=The%20Holy%20Scriptures:%20A%20New%20Translation%20(JPS%201917)
- Version source recorded by that API: http://opensiddur.org/2010/08/%D7%AA%D7%A0%D7%B4%D7%9A-the-holy-scriptures-a-new-translation-jps-1917/
- License recorded by that API: Public Domain
- Export snapshot: 2026-11-19. The API `text` field was `And God said: ‘Let there be light.’ And there was light.`
- SHA256 of that `text` field: `b5508f218fed94b3a490692377b241b33e9b4bcc5b8232b54472f89e818fbe1d`

`SHA256SUMS` pins `gen-1-3.json`, which holds this copy.
