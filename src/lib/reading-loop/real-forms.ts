/** Attested Qal forms from the Tanakh. The student names the parse. Paradigms stay in Verb Lab. */

export type RealForm = {
  id: string;
  form: string;
  gloss: string;
  ref: string;
  aspect: "perfect" | "imperfect";
  answer: string;
  choices: string[];
};

export const REAL_FORMS: RealForm[] = [
  {
    id: "amar-3ms",
    form: "אָמַר",
    gloss: "he said",
    ref: "Gen 1:3",
    aspect: "perfect",
    answer: "Qal perfect 3ms",
    choices: ["Qal perfect 3ms", "Qal perfect 3fs", "Qal imperfect 3ms", "Piel perfect 3ms"],
  },
  {
    id: "amrah",
    form: "אָמְרָה",
    gloss: "she said",
    ref: "Gen 3:2",
    aspect: "perfect",
    answer: "Qal perfect 3fs",
    choices: ["Qal perfect 3fs", "Qal perfect 3ms", "Qal imperfect 3fs", "Qal perfect 2ms"],
  },
  {
    id: "amarta",
    form: "אָמַרְתָּ",
    gloss: "you said",
    ref: "Gen 3:17",
    aspect: "perfect",
    answer: "Qal perfect 2ms",
    choices: ["Qal perfect 2ms", "Qal perfect 1cs", "Qal perfect 3fs", "Qal imperfect 2ms"],
  },
  {
    id: "shamar",
    form: "שָׁמַר",
    gloss: "he kept",
    ref: "Gen 37:11",
    aspect: "perfect",
    answer: "Qal perfect 3ms",
    choices: ["Qal perfect 3ms", "Qal imperfect 3ms", "Piel perfect 3ms", "Qal perfect 3cp"],
  },
  {
    id: "yishmor",
    form: "יִשְׁמֹר",
    gloss: "he will keep",
    ref: "Ps 121:7",
    aspect: "imperfect",
    answer: "Qal imperfect 3ms",
    choices: ["Qal imperfect 3ms", "Qal perfect 3ms", "Qal imperfect 2ms", "Hiphil imperfect 3ms"],
  },
  {
    id: "tishmeru",
    form: "תִּשְׁמְרוּ",
    gloss: "you will keep",
    ref: "Deut 6:17",
    aspect: "imperfect",
    answer: "Qal imperfect 2mp",
    choices: ["Qal imperfect 2mp", "Qal imperfect 3mp", "Qal perfect 2mp", "Qal imperative 2mp"],
  },
  {
    id: "raah",
    form: "רָאָה",
    gloss: "he saw",
    ref: "Gen 1:4",
    aspect: "perfect",
    answer: "Qal perfect 3ms",
    choices: ["Qal perfect 3ms", "Qal perfect 3fs", "Qal imperfect 3ms", "Niphal perfect 3ms"],
  },
  {
    id: "raatah",
    form: "רָאֲתָה",
    gloss: "she saw",
    ref: "Gen 3:6",
    aspect: "perfect",
    answer: "Qal perfect 3fs",
    choices: ["Qal perfect 3fs", "Qal perfect 3ms", "Qal imperfect 3fs", "Qal perfect 2fs"],
  },
  {
    id: "akol",
    form: "אָכַל",
    gloss: "he ate",
    ref: "Gen 3:6",
    aspect: "perfect",
    answer: "Qal perfect 3ms",
    choices: ["Qal perfect 3ms", "Qal imperfect 3ms", "Qal perfect 3cp", "Piel perfect 3ms"],
  },
  {
    id: "tochal",
    form: "תֹּאכַל",
    gloss: "you may eat",
    ref: "Gen 2:16",
    aspect: "imperfect",
    answer: "Qal imperfect 2ms",
    choices: ["Qal imperfect 2ms", "Qal imperfect 3fs", "Qal perfect 2ms", "Qal imperfect 3ms"],
  },
  {
    id: "natan",
    form: "נָתַן",
    gloss: "he gave",
    ref: "Gen 3:12",
    aspect: "perfect",
    answer: "Qal perfect 3ms",
    choices: ["Qal perfect 3ms", "Qal imperfect 3ms", "Qal perfect 3fs", "Niphal perfect 3ms"],
  },
  {
    id: "yiten",
    form: "יִתֵּן",
    gloss: "he will give",
    ref: "Gen 28:4",
    aspect: "imperfect",
    answer: "Qal imperfect 3ms",
    choices: ["Qal imperfect 3ms", "Qal perfect 3ms", "Qal imperfect 1cs", "Hiphil imperfect 3ms"],
  },
];

function randOf(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function realFormDeck(aspect?: RealForm["aspect"], seed = 1): RealForm[] {
  const pool = aspect ? REAL_FORMS.filter((row) => row.aspect === aspect) : REAL_FORMS.slice();
  const rand = randOf(seed);
  const out = pool.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    const swap = out[i];
    out[i] = out[j]!;
    out[j] = swap!;
  }
  return out;
}

export function gradeRealForm(form: RealForm, choice: string): boolean {
  return choice === form.answer;
}
