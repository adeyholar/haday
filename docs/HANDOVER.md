# Handover

Draft only. Do not merge. Do not deploy. Merging is the Chairman's call.

Branch: `cursor/framed-text-c04b`
Base: `main` at `ff09520` (PR #261, Verb Lab frame).
This file's commit hash is filled in the follow-up note at the bottom once the branch is committed.

## Framed text

Chairman's rule (21 Nov): written content sits in a solid framed panel, off the brown lettered scroll. PR #261 (`ff09520`) did this for Verb Lab only, and named three leftovers: Grammar Path hub titles in `path-hub.tsx`, Scripture Path Learn, and module quiz headings.

`src/components/path-hub.tsx` was not edited. PR #253 (`cursor/listen-lab-card-2d6d`) is still an open draft and was last updated 20 Nov, so another agent may still be rebasing it. The four hub routes wrap `PathHub` in the same `Panel` (`bg-card`, radius xl, border shadow). Cards inside that frame use the surface tone so they stay a step in from the frame.

## Screens whose text was on the scroll

- Grammar Path hubs: Learn, Practice, Play, Listen (`/hub/*`), phone and wide. Title, lede, and "How this room works" are in the frame. Cards stay inside it.
- Scripture Path Learn (`/iibs/learn`): title and lede. Cards stay on the scroll, each already a card.
- Account (`/account`): title, the sign-in line, the "X is not offered" line, and an error.
- Sign-in: "Opening your study." The form was already a card. Confirm email was already a card.
- Quiz: empty set, dealing, and the round-complete heading. The live sitting already wrapped `QuizSetBar`.
- Drill: empty set and dealing. The live sitting already used `Panel`. Etch prompts (the line above the word card) now use `Panel`.
- Alphabet quiz: dealing, the kind picker, and the count line. The letter itself was already on a card.
- Stations lesson footer ("This lesson is trained", "All stations") and the room link (`Learn` / `Practice` / `Play` / `Listen`).
- Reading Lab library: Torah, Nevi'im, and Ketuvim headings, with the Hebrew names unchanged.
- Reading Lab chapter toolbar: solid card, so the book title no longer sits on an 8% transparent wash.
- Tanakh reader title row (book, chapter, verse count).
- Translation Lab welcome (Genesis 1:3 and the step names). The steps below were already panels.
- Paradigms: the school chart, the phone header, and the wide grid.
- Verb Paradigm Quest: the shown form, the build area, and the lesson link. The header was already a panel.
- Loading lines: Grammar term, Scripture level hall, study, vocab, road, and `/iibs/$level`.
- Public footer: solid card. It was 90% card, so the scroll showed through the links.
- Shell skeleton while the room opens.

Verb Lab was left as PR #261 framed it. The manuscript sheet is already its own leaf. The error page uses its own solid background, not the scroll.

Wording and Hebrew are unchanged.

## Tests

`npx tsc --noEmit` passed on 26 Nov 2026.

`node --test scripts/*.test.mjs`: 770 tests, 765 pass, 0 fail, 5 skipped. That includes `scripts/framed-copy.test.mjs` (2 tests). The new tests check that the hubs frame `PathHub` from the routes and that `path-hub.tsx` itself is not given a `Panel`.

Phone and wide screenshots, before and after, are in the PR. Local preview used `VITE_AUTH_ENABLED=false` on ports 8081 and 8082. No production deploy.

## Left open

- PR #253 still owns `path-hub.tsx`. If that rebase lands, the hub frame stays in the route files and should not conflict.
- A room link that already lived inside a panel is now a small panel inside that panel (Stations, Quiz, Drill). The text was already off the scroll there. The extra edge is so the same link stays framed on the lesson page, where it sat outside.

## Earlier note

The previous text of this file described the 17 Nov lemma pin at `4eac58a`. That work is already on `main`. It is not part of this draft.
