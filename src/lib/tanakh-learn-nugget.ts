import { foldFinals, lettersOnly } from "@/lib/hebrew";
import type { LearnKind, LearnVerse } from "@/lib/tanakh-learn-note";

function L(s: string): string {
  return foldFinals(lettersOnly(s));
}

/**
 * Short public-domain grammar nuggets (Gesenius–Kautzsch–Cowley; A. B. Davidson,
 * Introductory Hebrew Grammar). Summarized, not copied as a page.
 */
export function learnNugget(kind: LearnKind, verse: LearnVerse): string {
  const hit = L(verse.hit);
  const raw = verse.hit;

  if (kind === "article") {
    if (hit.startsWith("ו")) {
      if (raw.startsWith("וּ")) {
        return "Gesenius §104c · Davidson §15: before a labial (ב מ פ) or a shewa, the copula is וּ, not וְ.";
      }
      if (raw.startsWith("וִ")) {
        return "Gesenius §104d: וְ plus יְ often coalesces to וִ (as in וִיהוּדָה).";
      }
      if (raw.startsWith("וֶ") || raw.startsWith("וֵ") || raw.startsWith("וַֽ") || raw.startsWith("וַ")) {
        return "Gesenius §104b · Davidson §15: before a guttural with ḥateph, the vav takes that ḥateph’s vowel (וֶ / וֵ / וַ).";
      }
      if (raw.startsWith("וָ")) {
        return "Gesenius §104e · Davidson §15: before the tone, especially a pair of kindred words, the copula is often וָ — as in תֹהוּ וָבֹהוּ.";
      }
      return "Gesenius §104a · Davidson §15: the copula is usually וְ (simple shewa). It does not replace the article: וְהָאָרֶץ is “and the earth.”";
    }
    if (raw.startsWith("הֶ")) {
      return "Gesenius §35f · Davidson §11: before הָ / חָ (and some ע), the article is often הֶ (seghol) — הֶהָרִים, הֶחָכָם.";
    }
    if (raw.startsWith("הָ")) {
      return "Gesenius §35c · Davidson §11: א and ר cannot take dagesh, so the article’s pathach lengthens to qamets (הָאָרֶץ, הָאָדָם).";
    }
    if (raw.startsWith("לָ") || raw.startsWith("בָּ") || raw.startsWith("כָּ")) {
      return "Gesenius §35 / §102: a preposition plus the article often fuses (לָ = לְ + הַ). The noun is still definite.";
    }
    if (!raw.startsWith("ה")) {
      return "Gesenius §35a · Davidson §11: Hebrew has no word for “a.” A bare noun is indefinite unless it is a name, or has a suffix or the article.";
    }
    return "Gesenius §35a · Davidson §11: the ordinary article is הַ with dagesh forte in the next letter. It does not change for gender or number.";
  }

  if (kind === "noun") {
    const raw = verse.hit;
    if (/ַיִם$/.test(raw) || raw.includes("ַיִם") || raw.endsWith("יִם") && raw.includes("ַ")) {
      return "Gesenius §88a,e · Davidson §16: the dual (-ַיִם) is mainly for natural pairs — eyes, hands, ears. It is not a second plural.";
    }
    if (raw === "מַיִם" || raw.includes("מָּיִם") || raw.includes("שָּׁמַיִם") || raw.includes("שָׁמַיִם") || raw === "מִצְרַיִם") {
      return "Gesenius §88c · Davidson §16: מַיִם and שָׁמַיִם look dual but are frozen pair-forms; מִצְרַיִם is a place-name of the same shape. Look them up as they stand.";
    }
    if (raw.includes("וֹת") || raw.endsWith("ָה") || raw.endsWith("ַת") || raw.endsWith("ִית")) {
      return "Gesenius §87 / §95 · Davidson §16: feminine singular often ends in ָה (older ַת in construct); feminine plural in וֹת.";
    }
    if (raw.endsWith("ִים") || raw.endsWith("ֵי") || raw.endsWith("ֵי־")) {
      return "Gesenius §87d · Davidson §16: masculine plural absolute ִים; construct ֵי. Gender is the ending-set, not always natural sex.";
    }
    return "Gesenius §87–88 · Davidson §16: read gender and number off the ending. Masculine singular is usually endingless — that is the citation form in the lexicon.";
  }

  // syllables
  const rawS = verse.hit;
  if (/ּ/.test(rawS) && /[בגדכפת]/.test(lettersOnly(rawS))) {
    return "Gesenius §12–13, §26: dagesh forte doubles the letter — split through it. Dagesh lene (begadkephat after a consonant) does not double and you do not split.";
  }
  if (/ַ[אהחע]$/.test(rawS.replace(/[\u0591-\u05C7]/g, ""))) {
    return "Gesenius §22f / §26: furtive pathach is a quick a before a final guttural — it is not its own syllable.";
  }
  return "Gesenius §26a–b · Davidson §5: a syllable begins with a consonant and holds one vowel. Open ends in a vowel; closed ends in a consonant. Vocal shewa is not a full syllable of its own (§10).";
}
