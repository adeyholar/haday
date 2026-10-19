import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { getMyPath } from "@/lib/learner-path";
import { termForAccount } from "@/lib/path";

type HubKind = "learn" | "practice" | "play" | "listen";

type Card = {
  to:
    | "/study"
    | "/rules"
    | "/alphabet"
    | "/browse"
    | "/finder"
    | "/lessons"
    | "/drill"
    | "/quiz"
    | "/write"
    | "/match"
    | "/weak"
    | "/cards"
    | "/keep"
    | "/game"
    | "/game/alefbet"
    | "/game/balloons"
    | "/game/syllables"
    | "/game/nouns"
    | "/game/article"
    | "/game/verbal-system"
    | "/game/verb-paradigm-quest"
    | "/game/qal-perfect"
    | "/game/lessons/$track"
    | "/game/road"
    | "/game/week7"
    | "/game/final"
    | "/game/final-vocab"
    | "/challenge"
    | "/listen"
    | "/listen/road"
    | "/listen/pet"
    | "/listen/read"
    | "/study/term2"
    | "/study/term2/game"
    | "/study/term2/listen"
    | "/study/term2/listen/road";
  params?: { chapter: string } | { track: string };
  title: string;
  line: string;
};

const TERM1: Record<HubKind, { title: string; line: string; cards: Card[] }> = {
  learn: {
    title: "Learn",
    line: "See how the language works before you are scored.",
    cards: [
      { to: "/study", title: "Stations", line: "From the alef-bet to a verse you can read." },
      { to: "/lessons", title: "Grammar lessons", line: "The rule, then the text." },
      { to: "/rules", title: "Rules", line: "One rule, shown in a real line." },
      { to: "/alphabet", title: "Alef-bet lesson", line: "See the letter, then write it." },
      { to: "/browse", title: "Lexicon", line: "This week’s lemmas." },
      { to: "/finder", title: "Tanakh cards", line: "A form, then the verses that use it." },
    ],
  },
  practice: {
    title: "Practice",
    line: "Remember the words. A miss gathers in Weak words.",
    cards: [
      { to: "/drill", title: "Drill", line: "This week’s words, six ways." },
      { to: "/quiz", title: "Quiz", line: "Choose the gloss, or type it." },
      { to: "/write", title: "Write", line: "Type the meaning, or write it by hand." },
      { to: "/match", title: "Match", line: "Pair the Hebrew with the English." },
      { to: "/weak", title: "Weak words", line: "Words you miss will gather here." },
      { to: "/cards", title: "Cards", line: "Turn a card. Say it before you look." },
      { to: "/keep", title: "Zakhor", line: "A short keep for today." },
    ],
  },
  play: {
    title: "Play",
    line: "Scored work. A stage clears at 90% on the first answer.",
    cards: [
      { to: "/game", title: "Chapter path", line: "Recognize, gloss, then spell." },
      { to: "/game/alefbet", title: "Aleph-bet mastery", line: "Letters, until they stay." },
      { to: "/game/balloons", title: "Ocean letters", line: "Catch the letter’s name." },
      { to: "/game/syllables", title: "Syllables", line: "Open, closed, and shewa." },
      { to: "/game/nouns", title: "Nouns", line: "Gender and number." },
      { to: "/game/article", title: "Article and vav", line: "The, and." },
      { to: "/game/verbal-system", title: "Verb Lab · Verbal System", line: "Root, stem, conjugation. Ten builds." },
      { to: "/game/verb-paradigm-quest", title: "Verb Lab · Paradigm Quest", line: "Only the root. You add the vowels." },
      { to: "/game/qal-perfect", title: "Verb Lab · Qal perfect", line: "Nine forms, with the accent and the meteg." },
      { to: "/game/road", title: "Exam prep · Week 7 road", line: "Say A, B, C, or D." },
      { to: "/game/week7", title: "Exam prep · Week 7 mock", line: "Grammar, then the word list." },
      { to: "/game/final", title: "Exam prep · Week 15 road", line: "All the words, on the road." },
      { to: "/game/final-vocab", title: "Exam prep · Final vocab", line: "The Week 15 word list." },
      { to: "/challenge", title: "Ultimate Challenge", line: "The whole list, one sitting." },
    ],
  },
  listen: {
    title: "Listen",
    line: "Hear the word, then its meaning.",
    cards: [
      { to: "/listen", title: "Vocabulary", line: "Hebrew, then English." },
      { to: "/listen/road", title: "On the road", line: "This chapter, while you drive." },
      { to: "/listen/pet", title: "Alive Pet", line: "The class voice, your weak words first." },
      { to: "/listen/read", title: "Tanakh reader", line: "Torah, Nevi'im, and Ketuvim are inside the reader." },
    ],
  },
};

const TERM2: Record<HubKind, { title: string; line: string; cards: Card[] }> = {
  learn: {
    title: "Learn",
    line: "Semester 2. The same five tabs.",
    cards: [
      { to: "/study/term2", title: "Lessons", line: "This semester, chapter by chapter." },
      { to: "/browse", title: "Lexicon", line: "This chapter’s lemmas." },
    ],
  },
  practice: {
    title: "Practice",
    line: "The words of the open chapter.",
    cards: [
      { to: "/drill", title: "Drill", line: "This chapter’s words." },
      { to: "/quiz", title: "Quiz", line: "Choice, or type the gloss." },
      { to: "/write", title: "Write", line: "Type the meaning." },
      { to: "/match", title: "Match", line: "Select the pairs." },
      { to: "/weak", title: "Weak words", line: "Words you miss will gather here." },
    ],
  },
  play: {
    title: "Play",
    line: "Scored work. A stage clears at 90% on the first answer. Semester 1 exams stay in Semester 1.",
    cards: [
      { to: "/study/term2/game", title: "Chapter path", line: "This semester’s vocabulary. Recognize, gloss, then spell." },
      { to: "/game/verbal-system", title: "Verb Lab · Verbal System", line: "Root, stem, conjugation. Ten builds." },
      { to: "/game/verb-paradigm-quest", title: "Verb Lab · Paradigm Quest", line: "Only the root. You add the vowels." },
      { to: "/game/qal-perfect", title: "Verb Lab · Qal perfect", line: "Nine forms, with the accent and the meteg." },
      {
        to: "/game/lessons/$track",
        params: { track: "verbs" },
        title: "Verb Lab · Stems",
        line: "Qal through the derived stems. 90% opens the next unit.",
      },
    ],
  },
  listen: {
    title: "Listen",
    line: "Hebrew, then English.",
    cards: [
      { to: "/study/term2/listen", title: "Vocabulary", line: "This chapter." },
      { to: "/study/term2/listen/road", title: "On the road", line: "This chapter, while you drive." },
    ],
  },
};

export function PathHub({ kind }: { kind: HubKind }) {
  const [term, setTerm] = useState<1 | 2>(1);
  useEffect(() => {
    let cancel = false;
    getMyPath()
      .then((gate) => {
        if (!cancel) setTerm(termForAccount(gate) === 2 ? 2 : 1);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);
  const room = (term === 2 ? TERM2 : TERM1)[kind];
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar Path</p>
      <h1 className="mt-1 font-display text-4xl font-bold text-ink">{room.title}</h1>
      <p className="mt-2 max-w-prose text-muted">{room.line}</p>
      <ul className="mt-4 grid gap-2">
        {room.cards.map((card) => (
          <li key={card.title}>
            <Link
              to={card.to}
              params={card.params}
              className="block rounded-[var(--radius-xl)] bg-card p-4 text-ink shadow-[var(--shadow-border)]"
            >
              <span className="block font-display text-2xl font-bold">{card.title}</span>
              <span className="mt-1 block text-sm text-muted">{card.line}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link to="/guide" className="font-semibold text-primary">
          How this room works
        </Link>
      </p>
    </>
  );
}
