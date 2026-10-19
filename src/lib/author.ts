import { CLASS_SITE } from "@/lib/class-site";

export const AUTHOR = {
  name: "Adeola Adegbolagun",
  alternateName: "Ade",
  jobTitle: "Prophetic Teacher",
  path: "/about",
  url: `${CLASS_SITE}/about`,
  id: `${CLASS_SITE}/about#adeola`,
  image: `${CLASS_SITE}/about/adeola.jpg`,
  shortBio:
    "Adeola \"Ade\" Adegbolagun is a prophetic teacher with an itinerant ministry, leads Fathers' Faith International Ministries, and created HaDay HebRabbAi Mentor to help readers meet God in the Hebrew text.",
  longBio:
    "Adeola \"Ade\" Adegbolagun built HaDay HebRabbAi Mentor to help anyone begin reading the Hebrew Bible in its original language, understand the text more deeply, and grow closer to God through it. Ade is a prophetic teacher with an itinerant ministry and leads Fathers' Faith International Ministries (FFIM), a teaching and writing ministry that equips believers to return to \"the faith which was once delivered.\" Ade is an MDiv candidate at Regent University School of Divinity and studies Biblical Hebrew to read Scripture as it was first written. Shaped by Yoruba heritage, Ade co-founded Jem-Crown Foundation, a relief ministry for widows and vulnerable families, and brings more than 22 years of experience in network security.",
  mission:
    "HaDay HebRabbAi Mentor is part of Fathers' Faith International Ministries, which exists to recover the faith once delivered to the saints. FFIM's work follows one path: teach believers how to read Scripture, show them what the text says, and release them into what God has called them to do. This app is the first step, helping you read the Hebrew Bible in its own language so its meaning, rooted in Hebraic thought, can shape your faith and your life.",
  sameAs: [] as string[],
};

export const FFIM = {
  name: "Fathers' Faith International Ministries",
  alternateName: "FFIM",
  id: `${CLASS_SITE}/about#ffim`,
};

export const PERSON_JSON_LD = {
  "@type": "Person",
  "@id": AUTHOR.id,
  name: AUTHOR.name,
  alternateName: AUTHOR.alternateName,
  jobTitle: AUTHOR.jobTitle,
  url: AUTHOR.url,
  image: AUTHOR.image,
  description: AUTHOR.shortBio,
  affiliation: [
    { "@type": "Organization", name: FFIM.name },
    { "@type": "CollegeOrUniversity", name: "Regent University School of Divinity" },
  ],
};
