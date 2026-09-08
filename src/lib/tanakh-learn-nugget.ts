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
        return "Before a guttural with ḥateph, the ו takes that ḥateph’s vowel (וֶ / וֵ / וַ).";
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

  if (kind === "prep") {
    if (raw.startsWith("לָ") || raw.startsWith("בָּ") || raw.startsWith("כָּ") || raw.startsWith("בַּ") || raw.startsWith("לַ") || raw.startsWith("כַּ")) {
      return "A preposition plus the article often fuses (לַ = לְ + הַ). The noun is still definite.";
    }
    if (raw.startsWith("מֵ") || raw.startsWith("מִ")) {
      return "Prefixed מִן hides its נ as dagesh, or lengthens to tsere before a guttural. With the article the ה often stays (מֵהָאָרֶץ).";
    }
    if (raw.includes("־")) {
      return "The maqqef is spelling glue, not extra meaning. The next word is the object of the preposition.";
    }
    return "Name the relationship (place, time, company), then the object. Inseparable בְּ כְּ לְ never stand alone.";
  }

  if (kind === "adj") {
    if (raw.startsWith("הַ") || raw.startsWith("הָ") || raw.startsWith("הֶ")) {
      return "Matching articles on noun and adjective usually mean attributive — “the good king,” one phrase.";
    }
    return "Same endings as nouns. Same article as the noun = attributive. No article while the noun has one = predicate (“is good”).";
  }

  if (kind === "pron") {
    if (raw.startsWith("הֲ")) {
      return "הֲ with ḥateph-pathach asks a yes/no question. It is not the article הַ.";
    }
    return "Pronouns, demonstratives, and question words are their own lemmas. A written “I / you / this” is extra work — stress, a verbless clause, or a pointer.";
  }

  if (kind === "exist") {
    if (hit.startsWith("הנה") || hit.startsWith("הננ") || hit === "הן") {
      return "הִנֵּה is a pointer — look, here — not the article and not a verb “to see.”";
    }
    if (hit === "יש") {
      return "יֵשׁ “there is.” A particle of existence, not a conjugated verb.";
    }
    if (hit === "אין") {
      return "אֵין “there is not / none.” Pair it with יֵשׁ in the mind.";
    }
    return "Small particles (behold, there is, also, or, alone) keep the nouns in focus. Name the particle first.";
  }

  if (kind === "construct") {
    if (raw.endsWith("ֵי") || raw.endsWith("ֵי־") || hit.endsWith("י")) {
      return "Masculine plural construct often ends in ֵי — “kings of.” The last noun of the chain is still absolute.";
    }
    if (raw.endsWith("ַת") || raw.endsWith("ַת־")) {
      return "Feminine ָה often becomes ַת in construct. Look the word up as the absolute singular.";
    }
    return "An “X of Y” chain: first noun bound, last noun free. The chain is definite if the last member is (name, article, or suffix).";
  }

  if (kind === "numbers") {
    return "Cardinals count; ordinals (first, second, seventh) sit like adjectives after the noun. Three–ten often wear the opposite gender ending from the counted noun.";
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
