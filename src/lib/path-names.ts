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

export const PATH_CHOICE_STAYS =
  "Create an account, then choose the Grammar Path or the Scripture Path. That choice stays with you.";

export const CLASS_VERSE_NOTE =
  "The marked word is class vocabulary when it is on the class word list. Other class words in the same verse are listed so you meet them again.";
