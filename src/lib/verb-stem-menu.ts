import type { StemId } from "@/lib/verbal-system";

/** Named stems on the Semester 2 Play menu. The hash opens Verbal System on that stem. */
export const VERB_STEM_MENU: { id: StemId; title: string; line: string }[] = [
  { id: "qal", title: "Verb Lab · Qal", line: "The plain stem. Every conjugation, not only perfect and imperfect." },
  { id: "niphal", title: "Verb Lab · Niphal", line: "Nun, or the dagesh it leaves behind." },
  { id: "piel", title: "Verb Lab · Piel", line: "Dagesh in the middle letter." },
  { id: "pual", title: "Verb Lab · Pual", line: "The passive of Piel. Qibbuts, and the same dagesh." },
  { id: "hiphil", title: "Verb Lab · Hiphil", line: "Causative. הִ in the perfect, patach on the prefix." },
  { id: "hophal", title: "Verb Lab · Hophal", line: "The passive of Hiphil. U or o on the prefix." },
  { id: "hithpael", title: "Verb Lab · Hithpael", line: "הִתְ names it. The middle letter is doubled." },
];
