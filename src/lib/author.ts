import { CLASS_SITE } from "@/lib/class-site";

export const AUTHOR = {
  name: "Adeola Adegbolagun",
  path: "/about",
  url: `${CLASS_SITE}/about`,
  id: `${CLASS_SITE}/about#adeola`,
  image: `${CLASS_SITE}/about/adeola.jpg`,
  shortBio: "Adeola Adegbolagun teaches Biblical Hebrew with HaDay HebRabbAi Mentor.",
  longBio: "The longer biography will be added here.",
  mission: "HaDay HebRabbAi Mentor is for anyone who wants to read Scripture in the language it was written in.",
  sameAs: [] as string[],
};

export const PERSON_JSON_LD = {
  "@type": "Person",
  "@id": AUTHOR.id,
  name: AUTHOR.name,
  url: AUTHOR.url,
  image: AUTHOR.image,
  description: AUTHOR.shortBio,
  ...(AUTHOR.sameAs.length ? { sameAs: AUTHOR.sameAs } : {}),
};
