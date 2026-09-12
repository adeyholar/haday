import { TANAKH_BOOKS, booksIn, isBookId, type BookId, type SectionId } from "@/lib/tanakh-canon";

export type QueryKind =
  | "hatuf"
  | "gadol"
  | "ms"
  | "mp"
  | "fs"
  | "fp"
  | "dual"
  | "pl"
  | "classFem"
  | "classMasc"
  | "shewa"
  | "shewaOne"
  | "shewaPair"
  | "shewaVocal"
  | "shewaSilent"
  | "hateph"
  | "article"
  | "vav"
  | "wayy"
  | "v3ms"
  | "v3fs"
  | "v2ms"
  | "v2fs"
  | "v3mp"
  | "v2mp"
  | "v2fp"
  | "v1cs"
  | "v1cp"
  | "femVerb"
  | "cst"
  | "abs"
  | "noun"
  | "pron"
  | "qal"
  | "piel"
  | "pual"
  | "niphal"
  | "hiphil"
  | "hophal"
  | "hithpael"
  | "qatal"
  | "yiqtol"
  | "weqatal"
  | "infcst"
  | "infabs"
  | "ptcp"
  | "impv";

export type QueryForm = {
  w: string;
  n: number;
  t: string[];
  r: string[];
};

export type ParsedTanakhQuery = {
  kind: QueryKind;
  need: QueryKind[];
  limit: number;
  scope: "all" | SectionId | BookId;
  raw: string;
};

export const QUERY_PRESETS: Array<{ kind: QueryKind; label: string; ask: string; group: string }> = [
  { group: "Nouns", kind: "cst", label: "Construct", ask: "10 construct" },
  { group: "Nouns", kind: "abs", label: "Absolute", ask: "10 absolute nouns" },
  { group: "Nouns", kind: "pron", label: "Pronouns", ask: "10 pronouns" },
  { group: "Nouns", kind: "ms", label: "Endingless masc.", ask: "endingless masculine nouns" },
  { group: "Nouns", kind: "fs", label: "Feminine sg", ask: "feminine nouns" },
  { group: "Nouns", kind: "fp", label: "Feminine pl", ask: "feminine plural" },
  { group: "Nouns", kind: "mp", label: "Masculine pl", ask: "masculine plural" },
  { group: "Nouns", kind: "dual", label: "Dual", ask: "dual endings" },
  { group: "Nouns", kind: "pl", label: "Plural (PL)", ask: "10 PL" },
  { group: "Nouns", kind: "classFem", label: "Class feminine", ask: "BBH feminine nouns" },
  { group: "Nouns", kind: "classMasc", label: "Class masculine", ask: "BBH masculine nouns" },
  { group: "Binyan", kind: "qal", label: "Qal perfect", ask: "10 qal perfect" },
  { group: "Binyan", kind: "qal", label: "Qal imperfect", ask: "10 qal imperfect" },
  { group: "Binyan", kind: "wayy", label: "Wayyiqtol", ask: "10 wayyiqtol" },
  { group: "Binyan", kind: "piel", label: "Piel", ask: "10 piel" },
  { group: "Binyan", kind: "pual", label: "Pual", ask: "10 pual" },
  { group: "Binyan", kind: "niphal", label: "Niphal", ask: "10 niphal" },
  { group: "Binyan", kind: "hiphil", label: "Hiphil", ask: "10 hiphil" },
  { group: "Binyan", kind: "hophal", label: "Hophal", ask: "10 hophal" },
  { group: "Binyan", kind: "hithpael", label: "Hithpael", ask: "10 hithpael" },
  { group: "Binyan", kind: "qatal", label: "All perfect (qatal)", ask: "10 qatal" },
  { group: "Binyan", kind: "yiqtol", label: "All imperfect", ask: "10 yiqtol" },
  { group: "Binyan", kind: "infcst", label: "Infinitive construct", ask: "10 infinitive construct" },
  { group: "Binyan", kind: "ptcp", label: "Participle", ask: "10 participle" },
  { group: "Person", kind: "v3ms", label: "3ms", ask: "10 3ms" },
  { group: "Person", kind: "v3fs", label: "3fs", ask: "10 3fs" },
  { group: "Person", kind: "v2ms", label: "2ms", ask: "10 2ms" },
  { group: "Person", kind: "v2fs", label: "2fs", ask: "10 2fs" },
  { group: "Person", kind: "v3mp", label: "3mp", ask: "10 3mp" },
  { group: "Person", kind: "femVerb", label: "Feminine verb", ask: "10 feminine verbs" },
  { group: "Vowels", kind: "hatuf", label: "Qamets hatuf", ask: "10 qamets hatuf" },
  { group: "Vowels", kind: "gadol", label: "Qamets", ask: "10 qamets" },
  { group: "Shewa", kind: "shewaVocal", label: "Vocal shewa", ask: "10 vocal shewa" },
  { group: "Shewa", kind: "shewaSilent", label: "Silent shewa", ask: "10 silent shewa" },
  { group: "Shewa", kind: "shewaPair", label: "Two shewas", ask: "10 two shewas together" },
  { group: "Shewa", kind: "hateph", label: "Hateph", ask: "10 hateph vowels" },
  { group: "Prefixes", kind: "article", label: "Article הַ", ask: "10 definite article" },
  { group: "Prefixes", kind: "vav", label: "Conjunction וְ", ask: "10 conjunction vav" },
];

/** Grammatical feminine lemmas from the class noun list (not ending-guesses). */
export const CLASS_FEM: string[] = [
  "אדמה",
  "אחות",
  "אם",
  "ארץ",
  "אשה",
  "בת",
  "לילה",
  "נערה",
  "שנה",
  "תורה",
  "רעה",
  "ברכה",
  "חטאת",
  "מלחמה",
  "משפחה",
  "אבן",
  "ברית",
  "עלה",
  "עת",
  "אמה",
  "צדקה",
  "אמת",
  "מלאכה",
  "נקבה",
  "מצוה",
  "שבת",
  "שפה",
  "רוח",
  "נפש",
  "עיר",
  "אש",
  "חרב",
  "מאה",
  "נחלה",
  "חכמה",
];

export const CLASS_MASC: string[] = [
  "אב",
  "אדון",
  "אדם",
  "אח",
  "איש",
  "אל",
  "בן",
  "דבר",
  "יום",
  "נער",
  "גוי",
  "דרך",
  "הר",
  "כהן",
  "לב",
  "מלך",
  "נביא",
  "סוס",
  "ספר",
  "עבד",
  "עין",
  "קול",
  "ראש",
  "שם",
  "ים",
  "זהב",
  "כסף",
  "מקום",
  "משפט",
  "עם",
  "עץ",
  "יד",
  "כבוד",
  "לחם",
  "שלום",
  "בית",
];

const CONS = /[\u05D0-\u05EA]/g;
const PREFIX = /^(וַ|וָ|וְ|וֵ|וִ|וּ|וֹ)?(הַ|הָ|הֶ|בַּ|בָּ|בְּ|בַ|בָ|בְ|כַּ|כָּ|כְּ|לַ|לָ|לְ|מֵ|מִ)?(הַ|הָ|הֶ)?/;

export function lettersOf(s: string): string {
  return (s.match(CONS) ?? []).join("");
}

export function stemLetters(word: string): string {
  const nfc = word.normalize("NFC").replace(/[־–—]/g, "");
  const cut = nfc.replace(PREFIX, "");
  return lettersOf(cut || nfc);
}

export function parseTanakhQuery(raw: string): ParsedTanakhQuery {
  const t = raw.normalize("NFC").trim().toLowerCase();
  let limit = 10;
  const num = t.match(/\b(\d+)\b/);
  if (num) limit = Math.min(200, Math.max(1, Number(num[1])));
  else if (/\bten\b/.test(t)) limit = 10;
  else if (/\btwenty\b/.test(t)) limit = 20;
  else if (/\bfifty\b/.test(t)) limit = 50;

  let scope: ParsedTanakhQuery["scope"] = "all";
  if (/\btorah\b|pentateuch|חומש/.test(t)) scope = "torah";
  else if (/\bnevi'?im\b|prophets/.test(t)) scope = "neviim";
  else if (/\bketuvim\b|writings|כתובים/.test(t)) scope = "ketuvim";
  else {
    for (const b of TANAKH_BOOKS) {
      if (t.includes(b.id.toLowerCase()) || t.includes(b.en.toLowerCase())) {
        scope = b.id;
        break;
      }
    }
  }

  const detected = detectQuery(t);
  return { kind: detected.kind, need: detected.need, limit, scope, raw: raw.trim() };
}

function detectAspect(t: string): QueryKind | null {
  if (/wayyiqtol|vayyiqtol|vav consecutive/.test(t)) return "wayy";
  if (/weqatal|waw perfect|sequential perfect/.test(t)) return "weqatal";
  if (/infinitive construct/.test(t)) return "infcst";
  if (/infinitive absolute/.test(t)) return "infabs";
  if (/\bparticiple\b/.test(t)) return "ptcp";
  if (/\bimperative\b/.test(t)) return "impv";
  if (/\bimperfect\b|\byiqtol\b/.test(t)) return "yiqtol";
  if (/\bperfect\b|\bqatal\b|\bkata\b/.test(t)) return "qatal";
  return null;
}

function detectStem(t: string): QueryKind | null {
  if (/\bpiel\b|pi'el/.test(t)) return "piel";
  if (/\bpual\b|pu'al|\bpua\b/.test(t)) return "pual";
  if (/\bniphal\b|\bnifal\b/.test(t)) return "niphal";
  if (/\bhiphil\b|\bhifil\b/.test(t)) return "hiphil";
  if (/\bhophal\b|\bhofal\b/.test(t)) return "hophal";
  if (/\bhithpael\b|\bhitpael\b|hithpa'el/.test(t)) return "hithpael";
  if (/\bqal\b|\bcal\b/.test(t)) return "qal";
  return null;
}

function detectQuery(t: string): { kind: QueryKind; need: QueryKind[] } {
  const stem = detectStem(t);
  const aspect = detectAspect(t);
  if (stem && aspect && aspect !== stem) return { kind: stem, need: [aspect] };
  if (stem) return { kind: stem, need: [] };
  if (aspect) return { kind: aspect, need: [] };

  if (/two shewa|two shva|two shwa|two sheva|double shewa|shewa.?pair|shewas together|two shifa/.test(t)) return { kind: "shewaPair", need: [] };
  if (/vocal shewa|vocal shva|vocal shifa|mobile shewa/.test(t)) return { kind: "shewaVocal", need: [] };
  if (/silent shewa|silent shva|silent shifa|quiescent shewa/.test(t)) return { kind: "shewaSilent", need: [] };
  if (/single shewa|one shewa|shewa one/.test(t)) return { kind: "shewaOne", need: [] };
  if (/hateph|hataf|reduced vowel/.test(t)) return { kind: "hateph", need: [] };
  if (/\bshewa\b|\bshva\b|\bshwa\b|\bsheva\b|\bshifa\b/.test(t)) return { kind: "shewa", need: [] };
  if (/hatuf|qatan|katan|kamat katan|qamets qatan|qamat katan|qamets hatuf|qamat hatuf|short o|kamats katan/.test(t))
    return { kind: "hatuf", need: [] };
  if (/\bgadol\b|qamets gadol|qamat gadol|kamats gadol|kamat gadol/.test(t)) return { kind: "gadol", need: [] };
  if (/\bqamets\b|\bqamat\b|\bkamats\b/.test(t)) return { kind: "gadol", need: [] };
  if (/long ā|long a/.test(t)) return { kind: "gadol", need: [] };
  if (/construct case|in construct|\bconstruct\b|\bsmikhut\b|\bsmichut\b/.test(t)) return { kind: "cst", need: [] };
  if (/\babsolute\b/.test(t)) return { kind: "abs", need: [] };
  if (/\bpronoun/.test(t)) return { kind: "pron", need: [] };
  if (/feminine verb|fem verb/.test(t)) return { kind: "femVerb", need: [] };
  if (/\b3\s*m\s*s\b|\b3ms\b|third masculine singular|three m\.?s\b/.test(t)) return { kind: "v3ms", need: [] };
  if (/\b3\s*f\s*s\b|\b3fs\b|third feminine singular|three f\.?s\b/.test(t)) return { kind: "v3fs", need: [] };
  if (/\b2\s*m\s*s\b|\b2ms\b|second masculine singular|two m\.?s\b/.test(t)) return { kind: "v2ms", need: [] };
  if (/\b2\s*f\s*s\b|\b2fs\b|second feminine singular|two f\.?s\b/.test(t)) return { kind: "v2fs", need: [] };
  if (/\b3\s*m\s*p\b|\b3mp\b|\b3\s*p\s*s\b|\b3cp\b|third (masculine )?plural|three p/.test(t)) return { kind: "v3mp", need: [] };
  if (/\b2\s*m\s*p\b|\b2mp\b|\b2\s*p\s*s\b|second masculine plural|two p/.test(t) && !/f\.?p|fp/.test(t)) return { kind: "v2mp", need: [] };
  if (/\b2\s*f\s*p\b|\b2fp\b|second feminine plural|two f\.?p/.test(t)) return { kind: "v2fp", need: [] };
  if (/\b1\s*c\s*s\b|\b1cs\b|first (common )?singular/.test(t)) return { kind: "v1cs", need: [] };
  if (/\b1\s*c\s*p\b|\b1cp\b|first (common )?plural/.test(t)) return { kind: "v1cp", need: [] };
  if (/\bpl\b|plurals?\b/.test(t) && !/masculine plural|feminine plural/.test(t)) return { kind: "pl", need: [] };
  if (/definite article|article הַ|article ha/.test(t)) return { kind: "article", need: [] };
  if (/conjunction vav|vav conjunct/.test(t)) return { kind: "vav", need: [] };
  if (/dual|ַיִם|pair of/.test(t)) return { kind: "dual", need: [] };
  if (/feminine plural|fem plural/.test(t)) return { kind: "fp", need: [] };
  if (/masculine plural|masc plural/.test(t)) return { kind: "mp", need: [] };
  if (/class feminine|bbh feminine|vocabulary feminine/.test(t)) return { kind: "classFem", need: [] };
  if (/class masculine|bbh masculine|vocabulary masculine/.test(t)) return { kind: "classMasc", need: [] };
  if (/endingless|no ending|bare masculine|masculine singular|masc sg|endless masculine/.test(t)) return { kind: "ms", need: [] };
  if (/feminine|fem sg|ָה/.test(t)) return { kind: "fs", need: [] };
  if (/masculine noun/.test(t)) return { kind: "ms", need: [] };
  return { kind: "hatuf", need: [] };
}

export function kindLabel(kind: QueryKind, need: QueryKind[] = []): string {
  const labels: Record<QueryKind, string> = {
    hatuf: "Qamets hatuf (short o)",
    gadol: "Qamets (long ā)",
    ms: "Endingless (looks masculine singular)",
    mp: "Masculine plural ִים",
    fs: "Feminine singular (ָה / ת)",
    fp: "Feminine plural וֹת",
    dual: "Dual (ay + ם)",
    pl: "Plural (PL)",
    classFem: "Class feminine lemmas",
    classMasc: "Class masculine lemmas",
    shewa: "Shewa",
    shewaOne: "Single shewa",
    shewaPair: "Two shewas together",
    shewaVocal: "Vocal shewa",
    shewaSilent: "Silent shewa",
    hateph: "Hateph (reduced vowel)",
    article: "Definite article הַ",
    vav: "Conjunction וְ",
    wayy: "Wayyiqtol",
    v3ms: "3ms verb",
    v3fs: "3fs verb",
    v2ms: "2ms verb",
    v2fs: "2fs verb",
    v3mp: "3mp verb",
    v2mp: "2mp verb",
    v2fp: "2fp verb",
    v1cs: "1cs verb",
    v1cp: "1cp verb",
    femVerb: "Feminine verb",
    cst: "Construct",
    abs: "Absolute",
    noun: "Noun",
    pron: "Pronoun",
    qal: "Qal",
    piel: "Piel",
    pual: "Pual",
    niphal: "Niphal",
    hiphil: "Hiphil",
    hophal: "Hophal",
    hithpael: "Hithpael",
    qatal: "Perfect (qatal)",
    yiqtol: "Imperfect (yiqtol)",
    weqatal: "Weqatal",
    infcst: "Infinitive construct",
    infabs: "Infinitive absolute",
    ptcp: "Participle",
    impv: "Imperative",
  };
  const extra = need.map((k) => labels[k]).filter(Boolean);
  return extra.length ? `${labels[kind]} · ${extra.join(" · ")}` : labels[kind];
}

function booksForScope(scope: ParsedTanakhQuery["scope"]): Set<string> | null {
  if (scope === "all") return null;
  if (scope === "torah" || scope === "neviim" || scope === "ketuvim") {
    return new Set(booksIn(scope).map((b) => b.id));
  }
  if (isBookId(scope)) return new Set([scope]);
  return null;
}

function refsInScope(refs: string[], books: Set<string> | null): string[] {
  if (!books) return refs;
  return refs.filter((r) => books.has(r.split(".")[0] ?? ""));
}

function isNominal(t: Set<string>): boolean {
  return (t.has("noun") || t.has("adj")) && !t.has("verb") && !t.has("pron");
}

function matchesKind(form: QueryForm, kind: QueryKind): boolean {
  const t = new Set(form.t);
  if (kind === "femVerb") return t.has("femVerb") || t.has("v3fs") || t.has("v2fs") || t.has("v2fp");
  if (kind === "classFem") {
    const stem = stemLetters(form.w);
    return CLASS_FEM.some((lem) => stem === lem || stem.endsWith(lem));
  }
  if (kind === "classMasc") {
    const stem = stemLetters(form.w);
    return CLASS_MASC.some((lem) => stem === lem || stem.endsWith(lem));
  }
  if (kind === "fs" || kind === "fp" || kind === "ms" || kind === "mp") {
    return t.has(kind) && isNominal(t);
  }
  return t.has(kind);
}

export function runTanakhQuery(forms: QueryForm[], parsed: ParsedTanakhQuery): { items: QueryForm[]; total: number } {
  const books = booksForScope(parsed.scope);
  const hit: QueryForm[] = [];
  for (const form of forms) {
    if (!matchesKind(form, parsed.kind)) continue;
    if (parsed.need.some((tag) => !form.t.includes(tag))) continue;
    const refs = refsInScope(form.r, books);
    if (books && refs.length === 0) continue;
    hit.push(books ? { ...form, r: refs } : form);
  }
  hit.sort((a, b) => {
    if (parsed.kind === "hatuf") {
      const ac = a.w.includes("־") ? 1 : 0;
      const bc = b.w.includes("־") ? 1 : 0;
      if (ac !== bc) return bc - ac;
    }
    return b.n - a.n || a.w.localeCompare(b.w, "he");
  });
  return { items: hit.slice(0, parsed.limit), total: hit.length };
}

export function parseRef(ref: string): { book: string; ch: string; v: string } {
  const [book, ch, v] = ref.split(".");
  return { book: book ?? "", ch: ch ?? "1", v: v ?? "1" };
}

export function prettyRef(ref: string): string {
  return ref.replace(/\./g, " ");
}

export function hatufWhy(word: string): string | null {
  if (word.includes("־")) {
    return "Qamets hatuf (short o): this syllable is closed and unaccented. The maqqef binds it to the next word, so the stress sits there — that is how you know kol, not kāl.";
  }
  if (!word) return null;
  return "Qamets hatuf (short o): the syllable is closed (often by a silent shewa) and not the accented one.";
}

export function formKeys(form: string): string[] {
  return form
    .split("־")
    .map((part) => lettersOf(part))
    .filter(Boolean);
}

export function tokenHitsForm(token: string, form: string): boolean {
  const keys = formKeys(form);
  const tok = lettersOf(token);
  if (!tok) return false;
  if (keys.includes(tok)) return true;
  return keys.includes(lettersOf(token.replace(/^[\u05D5\u05D1\u05DB\u05DC\u05DE\u05D4]/, "")));
}

export function markFormInVerse(he: string, form: string): { word: string; hit: boolean }[] {
  return he
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({ word, hit: tokenHitsForm(word, form) }));
}
