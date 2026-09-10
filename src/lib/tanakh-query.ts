import { TANAKH_BOOKS, booksIn, isBookId, type BookId, type SectionId } from "@/lib/tanakh-canon";

export type QueryTag = "hatuf" | "gadol" | "ms" | "mp" | "fs" | "fp" | "dual";

export type QueryKind = QueryTag | "classFem" | "classMasc";

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

export const QUERY_PRESETS: Array<{ kind: QueryKind; label: string; ask: string }> = [
  { kind: "hatuf", label: "Qamets hatuf", ask: "10 qamets qatan" },
  { kind: "gadol", label: "Qamets gadol", ask: "10 qamets gadol" },
  { kind: "ms", label: "Endingless masculine", ask: "endingless masculine nouns" },
  { kind: "fs", label: "Feminine singular", ask: "feminine nouns ָה" },
  { kind: "fp", label: "Feminine plural", ask: "feminine plural וֹת" },
  { kind: "mp", label: "Masculine plural", ask: "masculine plural ִים" },
  { kind: "dual", label: "Dual", ask: "dual endings" },
  { kind: "classFem", label: "Class feminine", ask: "BBH feminine nouns in the Tanakh" },
  { kind: "classMasc", label: "Class masculine", ask: "BBH masculine nouns in the Tanakh" },
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
  else if (/\bnevi'?im\b|prophets|נביא/.test(t)) scope = "neviim";
  else if (/\bketuvim\b|writings|כתובים/.test(t)) scope = "ketuvim";
  else {
    for (const b of TANAKH_BOOKS) {
      if (t.includes(b.id.toLowerCase()) || t.includes(b.en.toLowerCase())) {
        scope = b.id;
        break;
      }
    }
  }

  let kind: QueryKind = "hatuf";
  if (/hatuf|qatan|katan|kamat katan|qamets qatan|short o|kamats katan/.test(t)) kind = "hatuf";
  else if (/gadol|qamets gadol|kamat gadol|long a|kamats gadol/.test(t)) kind = "gadol";
  else if (/dual|ַיִם|pair of/.test(t)) kind = "dual";
  else if (/feminine plural|fem plural|ות\b|ot ending/.test(t)) kind = "fp";
  else if (/masculine plural|masc plural|ים\b/.test(t) && !/dual/.test(t)) kind = "mp";
  else if (/class feminine|bbh feminine|vocabulary feminine/.test(t)) kind = "classFem";
  else if (/class masculine|bbh masculine|vocabulary masculine/.test(t)) kind = "classMasc";
  else if (/endingless|no ending|bare masculine|masculine singular|masc sg|endless masculine/.test(t)) kind = "ms";
  else if (/feminine|fem sg|qamets he|ָה/.test(t)) kind = "fs";
  else if (/masculine noun/.test(t)) kind = "ms";

  return { kind, limit, scope, raw: raw.trim() };
}

export function kindLabel(kind: QueryKind): string {
  switch (kind) {
    case "hatuf":
      return "Qamets hatuf (short o)";
    case "gadol":
      return "Qamets gadol (long ā)";
    case "ms":
      return "Endingless (looks masculine singular)";
    case "mp":
      return "Masculine plural ִים";
    case "fs":
      return "Feminine singular (ָה / ת)";
    case "fp":
      return "Feminine plural וֹת";
    case "dual":
      return "Dual (ay + ם)";
    case "classFem":
      return "Class feminine lemmas in the Tanakh";
    case "classMasc":
      return "Class masculine lemmas in the Tanakh";
  }
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
  if (kind === "hatuf") return t.has("hatuf");
  if (kind === "gadol") return t.has("gadol");
  if (kind === "ms" || kind === "mp" || kind === "fs" || kind === "fp" || kind === "dual") return t.has(kind);
  const stem = stemLetters(form.w);
  if (kind === "classFem") {
    return CLASS_FEM.some((lem) => stem === lem || stem.endsWith(lem));
  }
  if (kind === "classMasc") {
    return CLASS_MASC.some((lem) => stem === lem || stem.endsWith(lem));
  }
  return false;
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
