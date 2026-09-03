export type HebrewLetter = {
  id: string;
  letter: string;
  final?: string;
  name: string;
  sound: string;
  translit: string;
};

export const CONSONANTS: HebrewLetter[] = [
  { id: "alef", letter: "א", name: "Alef", sound: "silent / glottal stop", translit: "ʾ" },
  { id: "bet", letter: "ב", name: "Bet", sound: "b / v", translit: "b / ḇ" },
  { id: "gimel", letter: "ג", name: "Gimel", sound: "g", translit: "g" },
  { id: "dalet", letter: "ד", name: "Dalet", sound: "d", translit: "d" },
  { id: "he", letter: "ה", name: "He", sound: "h", translit: "h" },
  { id: "vav", letter: "ו", name: "Vav", sound: "v / w", translit: "w" },
  { id: "zayin", letter: "ז", name: "Zayin", sound: "z", translit: "z" },
  { id: "het", letter: "ח", name: "Het", sound: "ch (Bach)", translit: "ḥ" },
  { id: "tet", letter: "ט", name: "Tet", sound: "t", translit: "ṭ" },
  { id: "yod", letter: "י", name: "Yod", sound: "y", translit: "y" },
  { id: "kaf", letter: "כ", final: "ך", name: "Kaf", sound: "k / kh", translit: "k / ḵ" },
  { id: "lamed", letter: "ל", name: "Lamed", sound: "l", translit: "l" },
  { id: "mem", letter: "מ", final: "ם", name: "Mem", sound: "m", translit: "m" },
  { id: "nun", letter: "נ", final: "ן", name: "Nun", sound: "n", translit: "n" },
  { id: "samekh", letter: "ס", name: "Samekh", sound: "s", translit: "s" },
  { id: "ayin", letter: "ע", name: "Ayin", sound: "silent / pharyngeal", translit: "ʿ" },
  { id: "pe", letter: "פ", final: "ף", name: "Pe", sound: "p / f", translit: "p / p̄" },
  { id: "tsade", letter: "צ", final: "ץ", name: "Tsade", sound: "ts", translit: "ṣ" },
  { id: "qof", letter: "ק", name: "Qof", sound: "q / k", translit: "q" },
  { id: "resh", letter: "ר", name: "Resh", sound: "r", translit: "r" },
  { id: "shin", letter: "שׁ", name: "Shin", sound: "sh", translit: "š" },
  { id: "sin", letter: "שׂ", name: "Sin", sound: "s", translit: "ś" },
  { id: "tav", letter: "ת", name: "Tav", sound: "t", translit: "t" },
];

export const FINAL_FORMS: HebrewLetter[] = [
  { id: "kaf-final", letter: "ך", name: "Final kaf", sound: "k / kh (end of a word)", translit: "ḵ" },
  { id: "mem-final", letter: "ם", name: "Final mem", sound: "m (end of a word)", translit: "m" },
  { id: "nun-final", letter: "ן", name: "Final nun", sound: "n (end of a word)", translit: "n" },
  { id: "pe-final", letter: "ף", name: "Final pe", sound: "p / f (end of a word)", translit: "p̄" },
  { id: "tsade-final", letter: "ץ", name: "Final tsade", sound: "ts (end of a word)", translit: "ṣ" },
];

export const WRITE_LETTERS: HebrewLetter[] = [...CONSONANTS, ...FINAL_FORMS];

export type VowelKind = "long" | "short" | "reduced" | "shewa" | "he" | "waw" | "yod";
export type VowelClass = "a" | "e" | "i" | "o" | "u";

export type HebrewVowel = {
  id: string;
  mark: string;
  name: string;
  sound: string;
  translit: string;
  vowelClass: VowelClass;
  kind: VowelKind;
  note?: string;
};

export const VOWELS: HebrewVowel[] = [
  { id: "qamets", mark: "בָ", name: "Qamets", sound: "a as in father", translit: "ā", vowelClass: "a", kind: "long" },
  { id: "tsere", mark: "בֵ", name: "Tsere", sound: "e as in they", translit: "ē", vowelClass: "e", kind: "long" },
  { id: "holem", mark: "בֹ", name: "Holem", sound: "o as in role", translit: "ō", vowelClass: "o", kind: "long" },

  { id: "pathach", mark: "בַ", name: "Pathach", sound: "a as in bat", translit: "a", vowelClass: "a", kind: "short" },
  { id: "seghol", mark: "בֶ", name: "Seghol", sound: "e as in better", translit: "e", vowelClass: "e", kind: "short" },
  { id: "hireq", mark: "בִ", name: "Hireq", sound: "i as in bitter", translit: "i", vowelClass: "i", kind: "short" },
  { id: "qamets-hatuf", mark: "בָ", name: "Qamets Hatuf", sound: "o as in bottle", translit: "o", vowelClass: "o", kind: "short", note: "Looks like qamets; short o in a closed unaccented syllable." },
  { id: "qibbuts", mark: "בֻ", name: "Qibbuts", sound: "u as in ruler (three dots under the letter)", translit: "u", vowelClass: "u", kind: "short" },

  { id: "shewa", mark: "בְ", name: "Shewa", sound: "silent, or a quick ə (the murmur vowel)", translit: "ə", vowelClass: "e", kind: "shewa", note: "Vocal shewa is a brief murmur. Silent shewa has no sound and closes the syllable." },

  { id: "hateph-pathach", mark: "בֲ", name: "Hateph Pathach", sound: "a as in amuse", translit: "ă", vowelClass: "a", kind: "reduced" },
  { id: "hateph-seghol", mark: "בֱ", name: "Hateph Seghol", sound: "e as in metallic", translit: "ĕ", vowelClass: "e", kind: "reduced" },
  { id: "hateph-qamets", mark: "בֳ", name: "Hateph Qamets", sound: "o as in commit", translit: "ŏ", vowelClass: "o", kind: "reduced" },

  { id: "qamets-he", mark: "בָה", name: "Qamets He", sound: "a as in father", translit: "â", vowelClass: "a", kind: "he", note: "He as a vowel letter only at the end of a word." },
  { id: "tsere-he", mark: "בֵה", name: "Tsere He", sound: "e as in they", translit: "ê", vowelClass: "e", kind: "he" },
  { id: "seghol-he", mark: "בֶה", name: "Seghol He", sound: "e as in better", translit: "eh", vowelClass: "e", kind: "he" },
  { id: "holem-he", mark: "בֹה", name: "Holem He", sound: "o as in role", translit: "ô", vowelClass: "o", kind: "he" },

  { id: "holem-waw", mark: "בוֹ", name: "Holem Vav", sound: "o as in role", translit: "ô", vowelClass: "o", kind: "waw", note: "Unchangeable long o — the vav is the vowel letter." },
  { id: "shureq", mark: "בוּ", name: "Shureq", sound: "û as in ruler (dot in the vav)", translit: "û", vowelClass: "u", kind: "waw", note: "The dot in the vav is the vowel û, not dagesh forte. Unchangeable." },

  { id: "tsere-yod", mark: "בֵי", name: "Tsere Yod", sound: "e as in they", translit: "ê", vowelClass: "e", kind: "yod", note: "Unchangeable long e." },
  { id: "seghol-yod", mark: "בֶי", name: "Seghol Yod", sound: "e as in better", translit: "ê", vowelClass: "e", kind: "yod" },
  { id: "hireq-yod", mark: "בִי", name: "Hireq Yod", sound: "i as in machine", translit: "î", vowelClass: "i", kind: "yod" },
];

export const VOWEL_GROUPS: Array<{ id: VowelKind; title: string; blurb: string }> = [
  { id: "long", title: "Long vowels", blurb: "Changeable long vowels. No i-class or u-class in this row." },
  { id: "short", title: "Short vowels", blurb: "All five classes: a, e, i, o, u." },
  { id: "reduced", title: "Reduced vowels", blurb: "Hateph vowels. No i-class or u-class." },
  { id: "shewa", title: "Shewa", blurb: "Not a full vowel. Vocal shewa is a brief murmur; silent shewa has no sound." },
  { id: "he", title: "Vowel letters with he", blurb: "He is a vowel letter only at the end of a word." },
  { id: "waw", title: "Vowel letters with vav", blurb: "Unchangeable. Shureq is û — the dot in the vav, not dagesh forte." },
  { id: "yod", title: "Vowel letters with yod", blurb: "Unchangeable long vowels with yod." },
];

export type QuizKind =
  | "letter-name"
  | "letter-translit"
  | "translit-letter"
  | "letter-scribble"
  | "vowel-name"
  | "vowel-sound"
  | "vowel-translit"
  | "vowel-scribble";

export const QUIZ_KINDS: Array<{ id: QuizKind; label: string; hint: string }> = [
  { id: "letter-name", label: "Letter names", hint: "See the consonant, pick the name" },
  { id: "letter-translit", label: "Letter → translit", hint: "See the letter, pick ʾ b g …" },
  { id: "translit-letter", label: "Translit → letter", hint: "See the translit, pick the letter" },
  { id: "letter-scribble", label: "Write letter", hint: "See the name, scribble the consonant" },
  { id: "vowel-name", label: "Vowel names", hint: "See the mark, pick Qamets, Tsere…" },
  { id: "vowel-sound", label: "Vowel sounds", hint: "See the mark, pick how it sounds" },
  { id: "vowel-translit", label: "Vowel translit", hint: "See the mark, pick ā a ē …" },
  { id: "vowel-scribble", label: "Write vowel", hint: "See the name, scribble the mark on ב" },
];
