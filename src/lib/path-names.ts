/** Names students see. The stored ids stay `bbh` and `iibs`. */

export const GRAMMAR_PATH = {
  title: "Grammar Path",
  hebrew: "דִּקְדּוּק",
  translit: "Diqduq",
  line: "Build the language step by step: letters, forms, rules, then words, chapter by chapter.",
  locked: "Locked. This account is on the Scripture Path.",
  short: "Grammar",
  move: "Move to Grammar Path",
} as const;

export const SCRIPTURE_PATH = {
  title: "Scripture Path",
  hebrew: "מִקְרָא",
  translit: "Miqra",
  line: "Learn Hebrew by reading the Tanakh: words met in their verses, Levels A to E, then the Reading Lab.",
  locked: "Locked. This account is on the Grammar Path.",
  short: "Scripture",
  move: "Move to Scripture Path",
} as const;

export const PATH_CHOICE = "Choose the Grammar Path or the Scripture Path.";

export const HEARD_PROMPT = "How did you hear about HaDay?";

export const HEARD_NEED = "Tell us how you heard about HaDay.";

export const PATH_CHOICE_STAYS =
  "College or school opens the Grammar Path. An online Bible school opens the Scripture Path. Internet or a friend chooses the course. You confirm the path before the account is created.";

export const TERM_WHICH = "Which semester?";
export const TERM_WHICH_LINE =
  "Same order as a college first-year grammar class. Each semester is its own room. You enter one.";
export const TERM_ONE_TITLE = "Semester 1";
export const TERM_ONE_LINE = "Letters, forms, and the words of the first term.";
export const TERM_TWO_TITLE = "Semester 2";
export const TERM_TWO_LINE = "The next term. Its lessons are not in this room yet.";
export const TERM_TWO_NOTE = "Semester 1 stays behind this door. Its words and scores are not in this room.";
export const TERM_LEAVE = "Leave this room";

export const CLASS_VERSE_NOTE =
  "The marked word is class vocabulary when it is on the class word list. Other class words in the same verse are listed so you meet them again.";
