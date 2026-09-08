/** Near-miss distractors so the right pick is not obvious at a glance. */

export type ChoiceQ = {
  q: string;
  he?: string;
  choices: string[];
  answer: string;
};

const GIVEAWAY =
  /^(A verb|Heaven|Kings|Silver|The woman|A dual|Always a verb|Always construct|Always numbers|Always dual|Always “the”|Always the|A misspelling only|Guess from English word order|A new lemma hayam|Seas \(plural\)|Stop — prefixes are the whole word|Always add “a” in English)$/i;

function isGiveaway(choice: string, answer: string): boolean {
  if (choice === answer) return false;
  const c = choice.trim();
  if (GIVEAWAY.test(c)) return true;
  if (/^(Indefinite|No article|The article|The conjunction|A proper name|Plural|A name|A glory — no article)$/i.test(c) && answer.length > 22) {
    return true;
  }
  return false;
}

function unique(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of list) {
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/** Wrong readings of the same form — student has to look at vowels and dagesh. */
export function nearMissesFor(q: ChoiceQ): string[] {
  const he = q.he ?? "";
  const stem = `${q.q} ${q.answer}`;
  const out: string[] = [];

  if (/^הַ/.test(he)) {
    out.push("Compensatory הָ — qamets, no dagesh (guttural spelling)");
    out.push("Seghol article הֶ — no dagesh");
    out.push("The same noun, but indefinite — no article");
    out.push("Conjunction וְ on the noun, not the article");
  }
  if (/^הָ/.test(he)) {
    out.push("Regular הַ + dagesh — missed that this letter refuses doubling");
    out.push("Seghol article הֶ");
    out.push("No article — the qamets is the noun’s own vowel");
    out.push("Virtual doubling הַ (pathach stays) rather than compensatory הָ");
  }
  if (/^הֶ/.test(he)) {
    out.push("Regular הַ + dagesh");
    out.push("Compensatory הָ");
    out.push("Default conjunction וְ");
  }
  if (/^וּ/.test(he)) {
    out.push("Default shewa וְ — missed the bump / shewa rule");
    out.push("Qamets וָ, as in תֹהוּ וָבֹהוּ");
    out.push("The article הַ, not the conjunction");
  } else if (/^ו[ְִֵֶָ]/.test(he)) {
    out.push("Bump shureq וּ (labial or shewa)");
    out.push("The article הַ");
    out.push("Default shewa וְ");
  }

  if (/ַיִם/.test(he) || /ָּיִם/.test(he)) {
    out.push("Masculine plural ִים — hireq-י-ם, no diphthong");
    out.push("Feminine plural וֹת");
  } else if (/ִים$/.test(he) || /ים$/.test(he.replace(/[\u0591-\u05C7]/g, ""))) {
    out.push("Dual — the ay diphthong plus ם");
    out.push("Feminine plural וֹת");
  }
  if (/וֹת/.test(he) || /ֹת$/.test(he) || /ות$/.test(he.replace(/[\u0591-\u05C7]/g, ""))) {
    out.push("Masculine plural ִים");
    out.push("Feminine singular ָה");
  }

  if (/dagesh/i.test(stem)) {
    out.push("Dagesh lene — not a double, do not split");
    out.push("Dagesh forte — split through the letter");
  }
  if (/shewa|šewa/i.test(stem)) {
    out.push("Vocal shewa — reduced, not a full syllable of its own");
    out.push("Silent shewa — closes the syllable");
    out.push("Hateph — the guttural stand-in for vocal shewa");
  }
  if (/article|הַ|הָ|הֶ/.test(stem) && !he) {
    out.push("Regular הַ + dagesh in the next letter");
    out.push("Compensatory הָ before א ע ר");
    out.push("The conjunction וְ, not the article");
  }

  return unique(out.filter((s) => s !== q.answer));
}

/** Keep the keyed answer; swap joke options for near-misses of the same form. */
export function hardenQuizChoices<T extends ChoiceQ>(q: T): T {
  const n = Math.max(3, q.choices.length);
  const keep = q.choices.filter((c) => c === q.answer || !isGiveaway(c, q.answer));
  const bag = unique([...keep.filter((c) => c !== q.answer), ...nearMissesFor(q), ...q.choices.filter((c) => c !== q.answer)]);
  const choices = [q.answer];
  for (const c of bag) {
    if (choices.length >= n) break;
    if (!choices.includes(c)) choices.push(c);
  }
  return { ...q, choices };
}
