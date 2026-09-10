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
  | "femVerb";

export type QueryForm = {
  w: string;
  n: number;
  t: string[];
  r: string[];
};

export type ParsedTanakhQuery = {
  kind: QueryKind;
  limit: number;
  scope: "all" | SectionId | BookId;
  raw: string;
};

export const QUERY_PRESETS: Array<{ kind: QueryKind; label: string; ask: string; group: string }> = [
  { group: "Vowels", kind: "hatuf", label: "Qamets hatuf", ask: "10 qamets qatan" },
  { group: "Vowels", kind: "gadol", label: "Qamets gadol", ask: "10 qamets gadol" },
  { group: "Shewa", kind: "shewaVocal", label: "Vocal shewa", ask: "10 vocal shewa" },
  { group: "Shewa", kind: "shewaSilent", label: "Silent shewa", ask: "10 silent shewa" },
  { group: "Shewa", kind: "shewaPair", label: "Two shewas", ask: "10 two shewas together" },
  { group: "Shewa", kind: "shewaOne", label: "One shewa", ask: "10 single shewa" },
  { group: "Shewa", kind: "hateph", label: "Hateph", ask: "10 hateph vowels" },
  { group: "Nouns", kind: "ms", label: "Endingless masc.", ask: "endingless masculine nouns" },
  { group: "Nouns", kind: "fs", label: "Feminine sg", ask: "feminine nouns" },
  { group: "Nouns", kind: "fp", label: "Feminine pl", ask: "feminine plural" },
  { group: "Nouns", kind: "mp", label: "Masculine pl", ask: "masculine plural" },
  { group: "Nouns", kind: "dual", label: "Dual", ask: "dual endings" },
  { group: "Nouns", kind: "pl", label: "Plural (PL)", ask: "10 PL" },
  { group: "Nouns", kind: "classFem", label: "Class feminine", ask: "BBH feminine nouns" },
  { group: "Nouns", kind: "classMasc", label: "Class masculine", ask: "BBH masculine nouns" },
  { group: "Verbs", kind: "v3ms", label: "3ms", ask: "10 3ms" },
  { group: "Verbs", kind: "v3fs", label: "3fs", ask: "10 3fs" },
  { group: "Verbs", kind: "v2ms", label: "2ms", ask: "10 2ms" },
  { group: "Verbs", kind: "v2fs", label: "2fs", ask: "10 2fs" },
  { group: "Verbs", kind: "v3mp", label: "3mp", ask: "10 3mp" },
  { group: "Verbs", kind: "v2mp", label: "2mp", ask: "10 2mp" },
  { group: "Verbs", kind: "femVerb", label: "Feminine verb", ask: "10 feminine verbs" },
  { group: "Verbs", kind: "wayy", label: "Wayyiqtol", ask: "10 wayyiqtol" },
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

  const kind = detectKind(t);
  return { kind, limit, scope, raw: raw.trim() };
}

function detectKind(t: string): QueryKind {
  if (/two shewa|two shva|two shwa|two sheva|double shewa|shewa.?pair|shewas together|two shifa/.test(t)) return "shewaPair";
  if (/vocal shewa|vocal shva|vocal shifa|mobile shewa/.test(t)) return "shewaVocal";
  if (/silent shewa|silent shva|silent shifa|quiescent shewa/.test(t)) return "shewaSilent";
  if (/single shewa|one shewa|shewa one/.test(t)) return "shewaOne";
  if (/hateph|hataf|reduced vowel/.test(t)) return "hateph";
  if (/\bshewa\b|\bshva\b|\bshwa\b|\bsheva\b|\bshifa\b|\bshva\b/.test(t)) return "shewa";
  if (/hatuf|qatan|katan|kamat katan|qamets qatan|short o|kamats katan/.test(t)) return "hatuf";
  if (/gadol|qamets gadol|kamat gadol|long a|kamats gadol/.test(t)) return "gadol";
  if (/wayyiqtol|vav consecutive|vayyiqtol/.test(t)) return "wayy";
  if (/feminine verb|fem verb/.test(t)) return "femVerb";
  if (/\b3\s*m\s*s\b|\b3ms\b|third masculine singular|three m\.?s\b/.test(t)) return "v3ms";
  if (/\b3\s*f\s*s\b|\b3fs\b|third feminine singular|three f\.?s\b/.test(t)) return "v3fs";
  if (/\b2\s*m\s*s\b|\b2ms\b|second masculine singular|two m\.?s\b/.test(t)) return "v2ms";
  if (/\b2\s*f\s*s\b|\b2fs\b|second feminine singular|two f\.?s\b/.test(t)) return "v2fs";
  if (/\b3\s*m\s*p\b|\b3mp\b|\b3\s*p\s*s\b|\b3cp\b|third (masculine )?plural|three p/.test(t)) return "v3mp";
  if (/\b2\s*m\s*p\b|\b2mp\b|\b2\s*p\s*s\b|second masculine plural|two p/.test(t) && !/f\.?p|fp/.test(t)) return "v2mp";
  if (/\b2\s*f\s*p\b|\b2fp\b|second feminine plural|two f\.?p/.test(t)) return "v2fp";
  if (/\b1\s*c\s*s\b|\b1cs\b|first (common )?singular/.test(t)) return "v1cs";
  if (/\b1\s*c\s*p\b|\b1cp\b|first (common )?plural/.test(t)) return "v1cp";
  if (/\bpl\b|plurals?\b/.test(t) && !/masculine plural|feminine plural/.test(t)) return "pl";
  if (/definite article|article הַ|article ha/.test(t)) return "article";
  if (/conjunction vav|vav conjunct|וְ/.test(t) && !/wayy/.test(t)) return "vav";
  if (/dual|ַיִם|pair of/.test(t)) return "dual";
  if (/feminine plural|fem plural|ות\b/.test(t)) return "fp";
  if (/masculine plural|masc plural/.test(t)) return "mp";
  if (/class feminine|bbh feminine|vocabulary feminine/.test(t)) return "classFem";
  if (/class masculine|bbh masculine|vocabulary masculine/.test(t)) return "classMasc";
  if (/endingless|no ending|bare masculine|masculine singular|masc sg|endless masculine/.test(t)) return "ms";
  if (/feminine|fem sg|qamets he|ָה/.test(t)) return "fs";
  if (/masculine noun/.test(t)) return "ms";
  return "hatuf";
}

export function kindLabel(kind: QueryKind): string {
  const labels: Record<QueryKind, string> = {
    hatuf: "Qamets hatuf (short o)",
    gadol: "Qamets gadol (long ā)",
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
    femVerb: "Feminine verb (3fs / 2fs / 2fp)",
  };
  return labels[kind];
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

function matchesKind(form: QueryForm, kind: QueryKind): boolean {
  const t = new Set(form.t);
  if (kind === "femVerb") return t.has("v3fs") || t.has("v2fs") || t.has("v2fp");
  if (kind === "classFem") {
    const stem = stemLetters(form.w);
    return CLASS_FEM.some((lem) => stem === lem || stem.endsWith(lem));
  }
  if (kind === "classMasc") {
    const stem = stemLetters(form.w);
    return CLASS_MASC.some((lem) => stem === lem || stem.endsWith(lem));
  }
  return t.has(kind);
}

export function runTanakhQuery(forms: QueryForm[], parsed: ParsedTanakhQuery): { items: QueryForm[]; total: number } {
  const books = booksForScope(parsed.scope);
  const hit: QueryForm[] = [];
  for (const form of forms) {
    if (!matchesKind(form, parsed.kind)) continue;
    const refs = refsInScope(form.r, books);
    if (books && refs.length === 0) continue;
    hit.push(books ? { ...form, r: refs } : form);
  }
  hit.sort((a, b) => b.n - a.n || a.w.localeCompare(b.w, "he"));
  return { items: hit.slice(0, parsed.limit), total: hit.length };
}

export function parseRef(ref: string): { book: string; ch: string; v: string } {
  const [book, ch, v] = ref.split(".");
  return { book: book ?? "", ch: ch ?? "1", v: v ?? "1" };
}

export function prettyRef(ref: string): string {
  return ref.replace(/\./g, " ");
}
