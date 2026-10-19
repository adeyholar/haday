import { CLASS_SITE } from "@/lib/class-site";
import { FFIM, PERSON_JSON_LD } from "@/lib/author";

export const METHOD_PATH = "/how-to-memorize-biblical-hebrew-vocabulary";
export const METHOD_URL = `${CLASS_SITE}${METHOD_PATH}`;
export const METHOD_TITLE = "How to Memorize Biblical Hebrew Vocabulary | HaDay";
export const METHOD_DESCRIPTION =
  "Learn the most frequent words first, hear each word before its meaning, and read real verses early. A simple method for Hebrew students.";
export const METHOD_H1 = "How to Memorize Biblical Hebrew Vocabulary: A Method That Sticks";
export const METHOD_DATE = "2026-10-17";

export const METHOD_STEPS = [
  {
    name: "Start with the most frequent words",
    text: "Learn the words that appear again and again before you chase rare ones. Class chapters and a frequency list can both be used.",
  },
  {
    name: "Hear the word before you see the meaning",
    text: "Listen to the Hebrew first. Then recall the meaning. Do not read the English and then hunt for the Hebrew.",
  },
  {
    name: "Learn the root, not only one form",
    text: "Many words share three letters. When you know the root, a new form is a relative, not a stranger.",
  },
  {
    name: "Review a little every day",
    text: "A short daily review holds a word better than one long session the night before a quiz.",
  },
  {
    name: "Read the word in a real verse early",
    text: "As soon as a small set is familiar, meet those words in a real line of the Tanakh. Do not wait for a finished vocabulary.",
  },
] as const;

export const METHOD_FAQS = [
  {
    q: "Can I read this guide without an account?",
    a: "Yes. This page is free to read. The lessons, games, and answer checks stay behind sign-in.",
  },
  {
    q: "Does this replace the textbook?",
    a: "No. The Grammar Path follows the class vocabulary in Basics of Biblical Hebrew. The guide is the method. The book is still the course.",
  },
  {
    q: "Should I use a frequency list or the chapter list?",
    a: "Use the chapter list for class, and a frequency list when the goal is reading the Bible. You do not have to pick only one.",
  },
  {
    q: "Is hearing the word enough?",
    a: "No. Hearing is the first step. You still write the word, say the meaning, and meet it in a verse.",
  },
  {
    q: "When should I start reading real Hebrew?",
    a: "Early. A short graded passage is better than waiting until every rare word feels safe.",
  },
] as const;

export const METHOD_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${CLASS_SITE}/` },
        { "@type": "ListItem", position: 2, name: "Guide", item: METHOD_URL },
      ],
    },
    {
      "@type": "Article",
      headline: METHOD_H1,
      description: METHOD_DESCRIPTION,
      datePublished: METHOD_DATE,
      dateModified: "2026-10-19",
      image: `${CLASS_SITE}/og.jpg`,
      author: PERSON_JSON_LD,
      publisher: {
        "@type": "Organization",
        "@id": FFIM.id,
        name: FFIM.name,
        logo: { "@type": "ImageObject", url: `${CLASS_SITE}/og.jpg` },
      },
      mainEntityOfPage: METHOD_URL,
    },
    {
      "@type": "HowTo",
      name: "How to memorize Biblical Hebrew vocabulary",
      step: METHOD_STEPS.map((step, index) => ({
        "@type": "HowToStep",
        position: index + 1,
        name: step.name,
        text: step.text,
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: METHOD_FAQS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
} as const;
