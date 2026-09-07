import { foldFinals, lettersOnly } from "@/lib/hebrew";
import type { LearnKind, LearnVerse } from "@/lib/tanakh-learn-note";

function L(s: string): string {
  return foldFinals(lettersOnly(s));
}

/** Short grammar finds. Public-domain examples, no source tags on the card. */
export function learnNugget(kind: LearnKind, verse: LearnVerse): string {
  const hit = L(verse.hit);
  const raw = verse.hit;

  if (kind === "article") {
    if (hit.startsWith("ו")) {
      if (raw.startsWith("וּ")) {
        return "Before a labial (ב מ פ) or a shewa, the copula is וּ, not וְ.";
      }
      if (raw.startsWith("וִ")) {
        return "וְ plus יְ often coalesces to וִ (as in וִיהוּדָה).";
      }
      if (raw.startsWith("וֶ") || raw.startsWith("וֵ") || raw.startsWith("וַֽ") || raw.startsWith("וַ")) {
        return "Before a guttural with ḥateph, the vav takes that ḥateph’s vowel (וֶ / וֵ / וַ).";
      }
      if (raw.startsWith("וָ")) {
        return "Before the tone, especially a pair of kindred words, the copula is often וָ — as in תֹהוּ וָבֹהוּ.";
      }
      return "The copula is usually וְ (simple shewa). It does not replace the article: וְהָאָרֶץ is “and the earth.”";
    }
    if (raw.startsWith("הֶ")) {
      return "Before הָ / חָ (and some ע), the article is often הֶ (seghol) — הֶהָרִים, הֶחָכָם.";
    }
    if (raw.startsWith("הָ")) {
      return "א and ר cannot take dagesh, so the article’s pathach lengthens to qamets (הָאָרֶץ, הָאָדָם).";
    }
    if (raw.startsWith("לָ") || raw.startsWith("בָּ") || raw.startsWith("כָּ")) {
      return "A preposition plus the article often fuses (לָ = לְ + הַ). The noun is still definite.";
    }
    if (!raw.startsWith("ה")) {
      return "Hebrew has no word for “a.” A bare noun is indefinite unless it is a name, or has a suffix or the article.";
    }
    return "The ordinary article is הַ with dagesh forte in the next letter. It does not change for gender or number.";
  }

  if (kind === "noun") {
    const form = verse.hit;
    if (/ַיִם$/.test(form) || form.includes("ַיִם") || (form.endsWith("יִם") && form.includes("ַ"))) {
      return "The dual (-ַיִם) is mainly for natural pairs — eyes, hands, ears. It is not a second plural.";
    }
    if (form === "מַיִם" || form.includes("מָּיִם") || form.includes("שָּׁמַיִם") || form.includes("שָׁמַיִם") || form === "מִצְרַיִם") {
      return "מַיִם and שָׁמַיִם look dual but are frozen pair-forms; מִצְרַיִם is a place-name of the same shape. Look them up as they stand.";
    }
    if (form.includes("וֹת") || form.endsWith("ָה") || form.endsWith("ַת") || form.endsWith("ִית")) {
      return "Feminine singular often ends in ָה (older ַת in construct); feminine plural in וֹת.";
    }
    if (form.endsWith("ִים") || form.endsWith("ֵי") || form.endsWith("ֵי־")) {
      return "Masculine plural absolute ִים; construct ֵי. Gender is the ending-set, not always natural sex.";
    }
    return "Read gender and number off the ending. Masculine singular is usually endingless — that is the citation form in the lexicon.";
  }

  const rawS = verse.hit;
  if (/ּ/.test(rawS) && /[בגדכפת]/.test(lettersOnly(rawS))) {
    return "Dagesh forte doubles the letter — split through it. Dagesh lene (begadkephat after a consonant) does not double and you do not split.";
  }
  if (/ַ[אהחע]$/.test(rawS.replace(/[\u0591-\u05C7]/g, ""))) {
    return "Furtive pathach is a quick a before a final guttural — it is not its own syllable.";
  }
  return "A syllable begins with a consonant and holds one vowel. Open ends in a vowel; closed ends in a consonant. Vocal shewa is not a full syllable of its own.";
}
