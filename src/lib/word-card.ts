import { lemmaForSurface } from "@/lib/tanakh-pool";
import { shortGloss } from "@/lib/tanakh-learn-note";
import { kindLabel, lettersOf, type QueryForm, type QueryKind } from "@/lib/tanakh-query";
import type { VocabItem } from "@/lib/vocab";

const TAG_SHOW = [
  "noun",
  "verb",
  "adj",
  "pron",
  "qal",
  "piel",
  "pual",
  "niphal",
  "hiphil",
  "hophal",
  "hithpael",
  "qatal",
  "yiqtol",
  "wayy",
  "weqatal",
  "ptcp",
  "impv",
  "infcst",
  "infabs",
  "v3ms",
  "v3fs",
  "v2ms",
  "v2fs",
  "v3mp",
  "v2mp",
  "v2fp",
  "v1cs",
  "v1cp",
  "cst",
  "abs",
  "fs",
  "ms",
  "fp",
  "mp",
  "dual",
  "pl",
  "article",
  "vav",
  "hatuf",
  "gadol",
  "shewaVocal",
  "shewaSilent",
  "shewaPair",
  "hateph",
] as const;

const EXTRA_LABEL: Record<string, string> = {
  verb: "Verb",
  adj: "Adjective",
};

export function describeTags(tags: string[]): string[] {
  const have = new Set(tags);
  return TAG_SHOW.filter((k) => have.has(k)).map((k) => EXTRA_LABEL[k] ?? kindLabel(k as QueryKind));
}

export function grammarAskFromTags(tags: string[]): { q: string; label: string } | null {
  const t = new Set(tags);
  if (t.has("hatuf")) return { q: "give me 10 qamets hatuf", label: "Qamets hatuf cards" };
  if (t.has("qal") && t.has("qatal")) return { q: "give me 10 qal perfect", label: "Qal perfect cards" };
  if (t.has("qal") && t.has("yiqtol")) return { q: "give me 10 qal imperfect", label: "Qal imperfect cards" };
  if (t.has("wayy")) return { q: "give me 10 wayyiqtol", label: "Wayyiqtol cards" };
  if (t.has("piel")) return { q: "give me 10 piel", label: "Piel cards" };
  if (t.has("pual")) return { q: "give me 10 pual", label: "Pual cards" };
  if (t.has("niphal")) return { q: "give me 10 niphal", label: "Niphal cards" };
  if (t.has("hiphil")) return { q: "give me 10 hiphil", label: "Hiphil cards" };
  if (t.has("hophal")) return { q: "give me 10 hophal", label: "Hophal cards" };
  if (t.has("hithpael")) return { q: "give me 10 hithpael", label: "Hithpael cards" };
  if (t.has("cst")) return { q: "give me 10 construct", label: "Construct cards" };
  if (t.has("article")) return { q: "give me 10 definite article", label: "Article cards" };
  if (t.has("shewaPair")) return { q: "give me 10 two shewas together", label: "Two shewas" };
  if (t.has("shewaVocal")) return { q: "give me 10 vocal shewa", label: "Vocal shewa cards" };
  if (t.has("shewaSilent")) return { q: "give me 10 silent shewa", label: "Silent shewa cards" };
  if (t.has("fs")) return { q: "give me 10 feminine nouns", label: "Feminine singular cards" };
  if (t.has("fp")) return { q: "give me 10 feminine plural", label: "Feminine plural cards" };
  if (t.has("dual")) return { q: "give me 10 dual endings", label: "Dual cards" };
  if (t.has("mp")) return { q: "give me 10 masculine plural", label: "Masculine plural cards" };
  return null;
}

export function matchFormForWord(forms: QueryForm[], word: string, ref?: string): QueryForm | null {
  const want = lettersOf(word);
  if (want.length < 1) return null;
  const hits = forms.filter((f) => lettersOf(f.w.split("־")[0] ?? "") === want);
  const pool = hits.length ? hits : forms.filter((f) => lettersOf(f.w) === want);
  if (!pool.length) return null;
  if (ref) {
    const at = pool.filter((f) => f.r.includes(ref));
    if (at.length) return at.sort((a, b) => b.n - a.n)[0] ?? null;
  }
  return pool.sort((a, b) => b.n - a.n)[0] ?? null;
}

export function classLemmaForWord(word: string): VocabItem | undefined {
  return lemmaForSurface(word);
}

export function vocabLine(item: VocabItem | undefined): string | undefined {
  if (!item) return undefined;
  const gloss = shortGloss(item.gloss);
  return `${item.hebrew} · ${gloss} (Ch. ${item.chapter})`;
}

const SKIP_EN = new Set(["the", "a", "an", "and", "of", "to", "in", "on", "or"]);

/** WEB uses inflected English. Map citation glosses to those forms. */
const IRREGULAR: Record<string, string[]> = {
  say: ["say", "says", "said", "saying"],
  speak: ["speak", "speaks", "spoke", "spoken", "speaking"],
  go: ["go", "goes", "went", "gone", "going"],
  come: ["come", "comes", "came", "coming"],
  see: ["see", "sees", "saw", "seen", "seeing"],
  give: ["give", "gives", "gave", "given", "giving"],
  take: ["take", "takes", "took", "taken", "taking"],
  know: ["know", "knows", "knew", "known", "knowing"],
  make: ["make", "makes", "made", "making"],
  do: ["do", "does", "did", "done", "doing"],
  eat: ["eat", "eats", "ate", "eaten", "eating"],
  sit: ["sit", "sits", "sat", "sitting"],
  send: ["send", "sends", "sent", "sending"],
  keep: ["keep", "keeps", "kept", "keeping"],
  hear: ["hear", "hears", "heard", "hearing"],
  find: ["find", "finds", "found", "finding"],
  write: ["write", "writes", "wrote", "written", "writing"],
  lie: ["lie", "lies", "lay", "lain", "lying"],
  fall: ["fall", "falls", "fell", "fallen", "falling"],
  die: ["die", "dies", "died", "dying"],
  bear: ["bear", "bears", "bore", "born", "borne", "bearing"],
  rise: ["rise", "rises", "rose", "risen", "rising"],
  stand: ["stand", "stands", "stood", "standing"],
  build: ["build", "builds", "built", "building"],
  put: ["put", "puts", "putting"],
  set: ["set", "sets", "setting"],
  be: ["was", "were", "been", "being"],
  become: ["become", "becomes", "became", "becoming"],
  create: ["create", "creates", "created", "creating"],
  man: ["man", "men"],
  woman: ["woman", "women"],
  child: ["child", "children"],
  son: ["son", "sons"],
  daughter: ["daughter", "daughters"],
  brother: ["brother", "brothers"],
  sister: ["sister", "sisters"],
  father: ["father", "fathers"],
  mother: ["mother", "mothers"],
  king: ["king", "kings"],
  priest: ["priest", "priests"],
  prophet: ["prophet", "prophets"],
  city: ["city", "cities"],
  house: ["house", "houses", "household"],
  land: ["land", "lands"],
  earth: ["earth"],
  heaven: ["heaven", "heavens"],
  water: ["water", "waters"],
  day: ["day", "days"],
  night: ["night", "nights"],
  life: ["life", "lives"],
  wife: ["wife", "wives"],
  people: ["people", "peoples"],
  god: ["god", "gods"],
};

function regularInflections(word: string): string[] {
  const w = word.toLowerCase();
  if (w.length < 3) return [word];
  const out = [word];
  if (w.endsWith("y") && w.length > 3 && !/[aeiou]y$/.test(w)) {
    out.push(`${w.slice(0, -1)}ies`);
  } else if (w.endsWith("s") || w.endsWith("x") || w.endsWith("ch") || w.endsWith("sh")) {
    out.push(`${w}es`);
  } else {
    out.push(`${w}s`);
  }
  if (w.endsWith("e")) {
    out.push(`${w}d`, `${w.slice(0, -1)}ing`);
  } else if (w.endsWith("y") && w.length > 3) {
    out.push(`${w.slice(0, -1)}ied`, `${w}ing`);
  } else {
    out.push(`${w}ed`, `${w}ing`);
  }
  return out;
}

function expandGlossToken(raw: string): string[] {
  const w = raw.replace(/^to\s+/i, "").trim();
  if (!w) return [];
  const key = w.toLowerCase();
  if (IRREGULAR[key]) return IRREGULAR[key];
  if (SKIP_EN.has(key)) return [];
  if (w.includes(" ")) return [w];
  return regularInflections(w);
}

/** Gloss phrases we can look up in a WEB verse. Longest first. */
export function englishKeysForWord(word: string): string[] {
  const item = lemmaForSurface(word);
  if (!item) return [];
  const raw = [item.gloss, ...item.alts]
    .flatMap((s) => s.split(/[;,/]/))
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .flatMap(expandGlossToken)
    .filter((s) => s.length >= 2 && !SKIP_EN.has(s.toLowerCase()));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of raw.sort((a, b) => b.length - a.length)) {
    const id = k.toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(k);
  }
  return out;
}

export type EnSeg = { text: string; hit: boolean };

export function markGlossInEnglish(en: string, keys: string[]): EnSeg[] {
  if (!en) return [];
  const phrases = keys
    .map((k) => k.trim())
    .filter((k) => k.length >= 2)
    .sort((a, b) => b.length - a.length);
  if (!phrases.length) return [{ text: en, hit: false }];
  const body = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")).join("|");
  const re = new RegExp(`\\b(?:${body})(?:['’]s)?\\b`, "gi");
  const segs: EnSeg[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(en))) {
    if (m.index > last) segs.push({ text: en.slice(last, m.index), hit: false });
    segs.push({ text: m[0] ?? "", hit: true });
    last = m.index + (m[0]?.length ?? 0);
    if (m.index === re.lastIndex) re.lastIndex += 1;
  }
  if (last < en.length) segs.push({ text: en.slice(last), hit: false });
  return segs.length ? segs : [{ text: en, hit: false }];
}

export function hasGlossInEnglish(en: string, keys: string[]): boolean {
  return markGlossInEnglish(en, keys).some((s) => s.hit);
}
