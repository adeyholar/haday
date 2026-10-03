/** Readable parsing for Open Scriptures Hebrew morphology codes. */

const STEM_H: Record<string, string> = {
  q: "Qal",
  N: "Niphal",
  p: "Piel",
  P: "Pual",
  h: "Hiphil",
  H: "Hophal",
  t: "Hithpael",
  o: "Polel",
  O: "Polal",
  r: "Hithpolel",
  m: "Poel",
  M: "Poal",
  k: "Palel",
  K: "Pulal",
  Q: "Qal passive",
  l: "Pilpel",
  L: "Polpal",
  f: "Hithpalpel",
  D: "Nithpael",
  j: "Pealal",
  i: "Pilel",
  u: "Hothpaal",
  c: "Tiphil",
  v: "Hishtaphel",
  w: "Nithpalel",
  y: "Nithpoel",
  z: "Hithpoel",
};

const STEM_A: Record<string, string> = {
  q: "Peal",
  Q: "Peil",
  u: "Hithpeel",
  N: "Niphal",
  p: "Pael",
  P: "Ithpaal",
  M: "Hithpaal",
  a: "Aphel",
  h: "Haphel",
  s: "Saphel",
  e: "Shaphel",
  H: "Hophal",
  i: "Ithpeel",
  t: "Hishtaphel",
  v: "Ishtaphel",
  w: "Hithaphel",
  o: "Polel",
  z: "Ithpoel",
  r: "Hithpolel",
  f: "Hithpalpel",
  b: "Hephal",
  c: "Tiphel",
  m: "Poel",
  l: "Palpel",
  L: "Ithpalpel",
  O: "Ithpolel",
  G: "Ittaphal",
};

const ASPECT: Record<string, string> = {
  p: "perfect",
  q: "weqatal",
  i: "imperfect",
  w: "wayyiqtol",
  h: "cohortative",
  j: "jussive",
  v: "imperative",
  r: "participle",
  s: "passive participle",
  a: "infinitive absolute",
  c: "infinitive construct",
};

const NOUN: Record<string, string> = { c: "common noun", g: "gentilic", p: "proper noun" };
const ADJ: Record<string, string> = { a: "adjective", c: "cardinal", g: "gentilic", o: "ordinal" };
const PRON: Record<string, string> = {
  d: "demonstrative",
  f: "indefinite pronoun",
  i: "interrogative",
  p: "personal pronoun",
  r: "relative",
};
const PART: Record<string, string> = {
  a: "affirmation",
  d: "definite article",
  e: "exhortation",
  i: "interrogative",
  j: "interjection",
  m: "demonstrative",
  n: "negative",
  o: "direct object marker",
  p: "preposition with the article",
  r: "relative",
};
const SUF: Record<string, string> = {
  d: "directional he",
  h: "paragogic he",
  n: "paragogic nun",
  p: "pronominal suffix",
};

function png(code: string, at: number): string {
  let i = at;
  let person = "";
  const personCh = code[i] ?? "";
  if (personCh === "1" || personCh === "2" || personCh === "3") {
    person = personCh;
    i += 1;
  }
  const g = code[i] ?? "";
  const both = g === "b";
  const gender = g === "m" || g === "f" || g === "c" ? g : "";
  if (gender || both) i += 1;
  const n = code[i] ?? "";
  const number = n === "s" || n === "p" || n === "d" ? n : "";
  if (number) i += 1;
  const st = code[i] ?? "";
  const state = st === "a" ? "absolute" : st === "c" ? "construct" : st === "d" ? "determined" : "";
  if (both) {
    const numWord = number === "p" ? "plural" : number === "d" ? "dual" : "singular";
    return [numWord, "masculine or feminine", state].filter(Boolean).join(" ");
  }
  const bits = [`${person}${gender}${number}`.trim(), state].filter(Boolean);
  return bits.join(" ");
}

function parseChunk(code: string, aramaic: boolean): string {
  const pos = code[0] ?? "";
  const rest = code.slice(1);
  if (pos === "V") {
    const stem = (aramaic ? STEM_A : STEM_H)[rest[0] ?? ""] ?? "";
    const aspect = ASPECT[rest[1] ?? ""] ?? "";
    const tail = png(rest, 2);
    return [stem, aspect, tail].filter(Boolean).join(" ");
  }
  if (pos === "N") return [NOUN[rest[0] ?? ""] ?? "noun", png(rest, 1)].filter(Boolean).join(" ");
  if (pos === "A") return [ADJ[rest[0] ?? ""] ?? "adjective", png(rest, 1)].filter(Boolean).join(" ");
  if (pos === "P") return [PRON[rest[0] ?? ""] ?? "pronoun", png(rest, 1)].filter(Boolean).join(" ");
  if (pos === "T") return PART[rest[0] ?? ""] ?? "particle";
  if (pos === "S") return [SUF[rest[0] ?? ""] ?? "suffix", png(rest, 1)].filter(Boolean).join(" ");
  if (pos === "R") return rest[0] === "d" ? "preposition with the article" : "preposition";
  if (pos === "C") return rest[0] === "v" ? "vav consecutive" : "conjunction";
  if (pos === "D") return "adverb";
  return "";
}

export function explainMorph(code: string): string {
  const blocks = code
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  const lines = blocks.map((block) => {
    const aramaic = block.startsWith("A");
    const body = block.startsWith("H") || block.startsWith("A") ? block.slice(1) : block;
    return body
      .split("/")
      .map((chunk) => parseChunk(chunk, aramaic))
      .filter(Boolean)
      .join(", ");
  });
  return lines.filter(Boolean).join(" · ");
}

export function splitStrongTag(tag: string): { id: string; morph: string } {
  const [id = "", morph = ""] = tag.split("|");
  return { id, morph };
}
