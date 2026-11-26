# Handover

This branch is not merged. Do not merge it. Merging is the Chairman's call. The pull request stays a draft.

Branch: `cursor/framed-text-dccc`

Rebased onto `main` at `97d5411` (PR #268, the Listen choice fix).

No secrets are in this note.

## What this branch does

Chairman design rule (21 Nov): written content sits in a solid light panel, off the brown lettered scroll. PR #261 (`ff09520`) did that for the Verb Lab only. This branch uses the same `Panel` (`src/components/panel.tsx`: card background, large radius, border shadow) everywhere else the audit found text on the scroll.

Wording and Hebrew are unchanged. The Listen choice picker from PR #268 is unchanged. This rebase did not edit `src/lib/etch.ts`, `src/lib/vocab.ts`, `src/lib/hebrew.ts`, or `scripts/etch.test.mjs`.

Screens and pieces framed:

- Legal and Credits. The lockup, the HebRabbAi Mentor tagline, and Back to HaDay sit in one panel. The bottom links sit in another. The public footer nav is the same panel, solid, not a 90% card. That footer is on the public pages.
- Grammar Path hubs (Learn, Practice, Play, Listen): the title, the lede, and How this room works.
- The room link (Learn, Practice, Play, or Listen) uses the same card fill, so it is off the scroll on Study, Play, and Listen.
- Scripture Path Learn title. The level hall’s opening line and error. Listen’s “This level” link.
- Reading Lab toolbar is a solid card. A missing chapter, and a chapter that fails to open, sit in a panel. Listen → Tanakh puts the chapter title and the Follow / Repeat / Grade row in a panel.
- Translation lab heading and step names.
- Account (settings): the heading, the line when X sign-in is off, and an error.
- Sign-in: “Opening your study.” The home path question, when it shows, is in a panel. The sign-in form was already a card.
- Quiz, Drill, Match, and Write: empty and dealing states, and the week picker when it sat above the card.
- Rules, Weak, the classify drill, and Play’s game stage: the count line, Try again, and Back in the pool.
- A lesson’s “This lesson is trained” and All stations. Ultimate Challenge’s Back home.
- Paradigms: the school chart, and the board heading plus the wide table.
- Correct / Not quite, the marked answer, and “Attempt it before I tell you” use the panel.
- The signed-in shell’s opening line.

The Verb Lab frames from PR #261 were already on main and were not edited.

## Tests actually run

Recorded after the rebase onto `97d5411`. The counts below are filled once that run finishes.

## Left open

Phone and wide were checked on Legal, Credits, the front door, and sign-in before the rebase. Signed-in hubs were checked in the source, not in a signed-in browser. The Reading Lab sheet is its own solid page; the toolbar is now solid too.

## Already on main

PR #268 (`97d5411`) is on main. A Listen card, and the other multiple-choice drills that use `closeItems`, skip a distractor whose displayed Hebrew matches the answer or a button already chosen. Displayed Hebrew is NFC with cantillation removed. Vowel points, dagesh, and the shin/sin dots stay. This branch does not change that.
