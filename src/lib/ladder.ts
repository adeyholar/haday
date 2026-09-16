/** Station climb. Books are wells for authors — never student-facing path labels. */

export type StationId = "alef" | "names" | "verbs" | "voices" | "realm";

export type LadderActionKind = "lab" | "echo" | "drill" | "write" | "ask" | "listen" | "alphabet";

export type LabRef = { book: string; ch: number; v1?: number; v2?: number };

export type LadderAction = {
  kind: LadderActionKind;
  label: string;
  lab?: LabRef;
};

export type LadderLesson = {
  id: string;
  stationId: StationId;
  order: number;
  title: string;
  /** Open this text first. */
  lab: LabRef;
  labLabel: string;
  notice: string;
  distinction: string;
  /** Named after the student has met the text. */
  rule: string;
  hearAgain: string;
  doneWhen: string;
  actions: LadderAction[];
  /** Builder-only tags. Never render. */
  wells?: string[];
};

export type LadderStation = {
  id: StationId;
  order: number;
  name: string;
  hebrew: string;
  goal: string;
  doneWhen: string;
  themeKey: StationId;
};

export type LadderProgress = {
  unlockedLevel: number;
  currentStationId: StationId;
  currentLessonId: string;
  openedText: Record<string, boolean>;
  trained: Record<string, boolean>;
  fruitByStation: Record<string, 30 | 60 | 100 | null>;
};

export const STATIONS: LadderStation[] = [
  {
    id: "alef",
    order: 1,
    name: "Alef-bet Station",
    hebrew: "אוֹתִיּוֹת",
    goal: "Meet the letters in a real line of Scripture, then give them a name.",
    doneWhen: "You have opened the first verse, walked the Book’s alef-bet, and practiced the letters.",
    themeKey: "alef",
  },
  {
    id: "names",
    order: 2,
    name: "House of Names",
    hebrew: "שֵׁמוֹת",
    goal: "Notice who and what the text names, and how little words cling to them.",
    doneWhen: "You have seen names and the prefixed particles in the verse.",
    themeKey: "names",
  },
  {
    id: "verbs",
    order: 3,
    name: "Verb Tent",
    hebrew: "פְּעָלִים",
    goal: "See action as a picture. The simple stem first.",
    doneWhen: "You have found a verb in the verse and practiced it.",
    themeKey: "verbs",
  },
  {
    id: "voices",
    order: 4,
    name: "Many Voices Camp",
    hebrew: "בִּנְיָנִים",
    goal: "Same family of letters, a new camera angle on the action.",
    doneWhen: "You have compared two voices of the same kind of action.",
    themeKey: "voices",
  },
  {
    id: "realm",
    order: 5,
    name: "Realm of the Word",
    hebrew: "דָּבָר",
    goal: "Read and hear with understanding. This is home, not a finish line.",
    doneWhen: "You have read a chapter with your eyes and heard it with your ears.",
    themeKey: "realm",
  },
];

export const LESSONS: LadderLesson[] = [
  {
    id: "alef-bereshit",
    stationId: "alef",
    order: 1,
    title: "The first word",
    lab: { book: "Gen", ch: 1, v1: 1, v2: 1 },
    labLabel: "Open Genesis 1:1 in the Reading Lab",
    notice: "Look at the first Hebrew word. Trace each letter from right to left. Do not name a rule yet — just see the shapes.",
    distinction: "The consonants carry the word. The points ride on them.",
    rule: "Hebrew reads right to left. Each letter has a name and a sound. Learn the letter from the word, not from a chart hung on the door.",
    hearAgain: "Return to the verse and hear the first word again.",
    doneWhen: "You opened the verse and practiced the letters.",
    actions: [
      { kind: "lab", label: "Open the text", lab: { book: "Gen", ch: 1, v1: 1, v2: 1 } },
      { kind: "alphabet", label: "Practice the letters" },
      { kind: "drill", label: "Drill" },
    ],
    wells: ["alphabet", "vowels"],
  },
  {
    id: "alef-ps119",
    stationId: "alef",
    order: 2,
    title: "The Book's alef-bet",
    lab: { book: "Ps", ch: 119, v1: 1, v2: 8 },
    labLabel: "Open Psalm 119 in the Reading Lab",
    notice: "Psalm 119 lines the letters in order. Open the first stanza. Every verse in it begins with א.",
    distinction: "The Book itself walked א to ת: twenty-two stanzas, eight verses each. The chart is in the psalm.",
    rule: "Twenty-two letters, in order, from the text. Learn each letter as the head of its stanza, then give it a name.",
    hearAgain: "Return to a stanza and hear the letter that opens it.",
    doneWhen: "You opened Psalm 119 and walked the letters in the Book’s order.",
    actions: [
      { kind: "lab", label: "Open the text", lab: { book: "Ps", ch: 119, v1: 1, v2: 8 } },
      { kind: "echo", label: "Echo the first verse", lab: { book: "Ps", ch: 119, v1: 1, v2: 1 } },
      { kind: "alphabet", label: "Practice the letters" },
      { kind: "drill", label: "Drill" },
    ],
    wells: ["alphabet"],
  },
  {
    id: "alef-hear",
    stationId: "alef",
    order: 3,
    title: "Hear the first line",
    lab: { book: "Gen", ch: 1, v1: 1, v2: 1 },
    labLabel: "Hear Genesis 1:1",
    notice: "Play the recorded reading. Watch the word that lights. Faith comes by hearing.",
    distinction: "The spoken word and the written word are the same line.",
    rule: "A letter you can hear in the verse is a letter you can keep. Sound first; the school name of the letter comes after.",
    hearAgain: "Listen once more, then echo the verse on the Lab page.",
    doneWhen: "You heard the verse and tried the letters by ear.",
    actions: [
      { kind: "lab", label: "Open the text", lab: { book: "Gen", ch: 1, v1: 1, v2: 1 } },
      { kind: "echo", label: "Echo the verse", lab: { book: "Gen", ch: 1, v1: 1, v2: 1 } },
      { kind: "listen", label: "Listen on the go" },
    ],
    wells: ["alphabet"],
  },
  {
    id: "names-who",
    stationId: "names",
    order: 1,
    title: "Who the text names",
    lab: { book: "Gen", ch: 1, v1: 1, v2: 1 },
    labLabel: "Open Genesis 1:1 — find who acts",
    notice: "In the first verse, find the word that names the One who creates. Tap it. Sit with it before any label.",
    distinction: "A name stands in the text for a person, a place, or a thing.",
    rule: "What English calls a noun, Hebrew often just names. The form you meet in the verse is the form to keep.",
    hearAgain: "Read the verse again and say the name you found.",
    doneWhen: "You found a name in the verse and practiced it.",
    actions: [
      { kind: "lab", label: "Open the text", lab: { book: "Gen", ch: 1, v1: 1, v2: 1 } },
      { kind: "drill", label: "Drill" },
      { kind: "write", label: "Write" },
      { kind: "ask", label: "Ask on this verse" },
    ],
    wells: ["nouns"],
  },
  {
    id: "names-cling",
    stationId: "names",
    order: 2,
    title: "Little words that cling",
    lab: { book: "Gen", ch: 1, v1: 1, v2: 1 },
    labLabel: "Open Genesis 1:1 — the heavens and the earth",
    notice: "Look at הַשָּׁמַיִם and הָאָרֶץ. Something small is prefixed. Do not skip the verse to a chart.",
    distinction: "Hebrew often glues ‘the’ and ‘and’ onto the front of the word.",
    rule: "The article and the conjunction are prefixes. They are not separate words standing alone.",
    hearAgain: "Hear the verse and catch the prefix as it is spoken.",
    doneWhen: "You saw a prefix on a name in the verse.",
    actions: [
      { kind: "lab", label: "Open the text", lab: { book: "Gen", ch: 1, v1: 1, v2: 1 } },
      { kind: "write", label: "Write" },
      { kind: "drill", label: "Drill" },
    ],
    wells: ["article", "vav"],
  },
  {
    id: "verb-bara",
    stationId: "verbs",
    order: 1,
    title: "The first action",
    lab: { book: "Gen", ch: 1, v1: 1, v2: 1 },
    labLabel: "Open Genesis 1:1 — find the action",
    notice: "Find בָּרָא. That is the action of the verse. Watch how it sits between the time-word and the name.",
    distinction: "A verb is a picture of an act, not a pile of endings.",
    rule: "The simple stem (the plain voice) is where most action begins. Meet it in the verse before you name a paradigm.",
    hearAgain: "Hear Genesis 1:1 and catch the verb as it is read.",
    doneWhen: "You found the verb in the first verse and practiced.",
    actions: [
      { kind: "lab", label: "Open the text", lab: { book: "Gen", ch: 1, v1: 1, v2: 1 } },
      { kind: "drill", label: "Drill" },
      { kind: "ask", label: "Ask on this verse" },
    ],
    wells: ["qal"],
  },
  {
    id: "verb-said",
    stationId: "verbs",
    order: 2,
    title: "And He said",
    lab: { book: "Gen", ch: 1, v1: 3, v2: 3 },
    labLabel: "Open Genesis 1:3",
    notice: "The story moves with וַיֹּאמֶר. Hear it. See the vav on the front of the verb.",
    distinction: "A vav on a verb often carries the narrative forward, step by step.",
    rule: "When a vav leads a verb in a story, read it as the next beat — then he said, then there was.",
    hearAgain: "Echo Genesis 1:3 on the Lab page.",
    doneWhen: "You opened 1:3 and noticed the vav on the verb.",
    actions: [
      { kind: "lab", label: "Open the text", lab: { book: "Gen", ch: 1, v1: 3, v2: 3 } },
      { kind: "echo", label: "Echo the verse", lab: { book: "Gen", ch: 1, v1: 3, v2: 3 } },
      { kind: "write", label: "Write" },
    ],
    wells: ["wayyiqtol"],
  },
  {
    id: "voices-make",
    stationId: "voices",
    order: 1,
    title: "Let us make",
    lab: { book: "Gen", ch: 1, v1: 26, v2: 26 },
    labLabel: "Open Genesis 1:26",
    notice: "Find נַעֲשֶׂה. Compare it in your ear with a plain ‘he made’ you already met. Same family of letters, a different stance.",
    distinction: "The same root can stand in more than one voice — a new camera on the same action.",
    rule: "Stems (voices) are not new dictionaries. They are angles on one family of letters. Name the angle after you have seen two forms.",
    hearAgain: "Hear 1:26, then ask on the word you tapped.",
    doneWhen: "You compared two voices of making in the text.",
    actions: [
      { kind: "lab", label: "Open the text", lab: { book: "Gen", ch: 1, v1: 26, v2: 26 } },
      { kind: "ask", label: "Ask on this verse" },
      { kind: "drill", label: "Drill" },
    ],
    wells: ["niphal", "stems"],
  },
  {
    id: "voices-bless",
    stationId: "voices",
    order: 2,
    title: "He blessed",
    lab: { book: "Gen", ch: 1, v1: 22, v2: 22 },
    labLabel: "Open Genesis 1:22",
    notice: "Find וַיְבָרֶךְ. The middle of the word is busy. Sit with it before anyone names a stem.",
    distinction: "Some voices thicken the middle of the root. You can see it in the pointing.",
    rule: "A doubled middle is one of the signatures of a derived voice. Meet the signature in the verse; the school name comes last.",
    hearAgain: "Echo the blessing on the Lab page.",
    doneWhen: "You saw the thickened middle in the verse.",
    actions: [
      { kind: "lab", label: "Open the text", lab: { book: "Gen", ch: 1, v1: 22, v2: 22 } },
      { kind: "echo", label: "Echo the verse", lab: { book: "Gen", ch: 1, v1: 22, v2: 22 } },
      { kind: "write", label: "Write" },
    ],
    wells: ["piel"],
  },
  {
    id: "realm-read",
    stationId: "realm",
    order: 1,
    title: "Eyes on the Word",
    lab: { book: "Gen", ch: 1 },
    labLabel: "Open Genesis 1 in the Reading Lab",
    notice: "Read a whole chapter with your eyes. Tap a word you do not yet own. This is the Realm — not a quiz.",
    distinction: "Understanding grows by staying in the text, not by finishing a list.",
    rule: "The destination is reading with understanding. Keep the Lab open. There is no shortcut past the work.",
    hearAgain: "Read the chapter a second time, slower.",
    doneWhen: "You opened a chapter and stayed with it.",
    actions: [
      { kind: "lab", label: "Open the Lab", lab: { book: "Gen", ch: 1 } },
      { kind: "echo", label: "Echo a verse", lab: { book: "Gen", ch: 1, v1: 1, v2: 1 } },
      { kind: "ask", label: "Ask on a verse" },
    ],
    wells: ["immersion"],
  },
  {
    id: "realm-hear",
    stationId: "realm",
    order: 2,
    title: "Faith comes by hearing",
    lab: { book: "Gen", ch: 1 },
    labLabel: "Hear Genesis 1",
    notice: "Play the chapter. Do not look away from the words. Hearing and seeing belong together.",
    distinction: "Listening is not a lesser Study. It is how the Word enters when the desk is not in front of you.",
    rule: "Faith comes by hearing, and hearing by the Word. Keep both doors: Lab for the eyes, Listening for the road.",
    hearAgain: "Queue the chapter again on the go.",
    doneWhen: "You heard a chapter through.",
    actions: [
      { kind: "lab", label: "Hear it in the Lab", lab: { book: "Gen", ch: 1 } },
      { kind: "listen", label: "Listening" },
      { kind: "echo", label: "Echo a verse", lab: { book: "Gen", ch: 1, v1: 1, v2: 1 } },
    ],
    wells: ["listening"],
  },
];

export function defaultLadder(): LadderProgress {
  return {
    unlockedLevel: 1,
    currentStationId: "alef",
    currentLessonId: "alef-bereshit",
    openedText: {},
    trained: {},
    fruitByStation: {},
  };
}

export function hydrateLadder(raw: unknown): LadderProgress {
  const base = defaultLadder();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<LadderProgress>;
  const unlocked = Math.min(5, Math.max(1, Math.round(Number(r.unlockedLevel) || 1)));
  const station = stationById(String(r.currentStationId)) ?? STATIONS[0];
  const lesson = lessonById(String(r.currentLessonId)) ?? firstLesson(station.id);
  return {
    unlockedLevel: unlocked,
    currentStationId: station.id,
    currentLessonId: lesson.id,
    openedText: remapLegacyLesson(truthMap(r.openedText)),
    trained: remapLegacyLesson(truthMap(r.trained)),
    fruitByStation: fruitMap(r.fruitByStation),
  };
}

function truthMap(raw: unknown): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v) out[k] = true;
  }
  return out;
}

function remapLegacyLesson(map: Record<string, boolean>): Record<string, boolean> {
  if (map["alef-acrostic"] && !map["alef-ps119"]) map["alef-ps119"] = true;
  return map;
}

function fruitMap(raw: unknown): Record<string, 30 | 60 | 100 | null> {
  const out: Record<string, 30 | 60 | 100 | null> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === 30 || v === 60 || v === 100 || v === null) out[k] = v;
  }
  return out;
}

export function stationById(id: string): LadderStation | undefined {
  return STATIONS.find((s) => s.id === id);
}

export function lessonById(id: string): LadderLesson | undefined {
  if (id === "alef-acrostic") return LESSONS.find((l) => l.id === "alef-ps119");
  return LESSONS.find((l) => l.id === id);
}

export function isAlefStationLesson(id: string): boolean {
  return lessonById(id)?.stationId === "alef";
}

export function lessonsFor(stationId: StationId): LadderLesson[] {
  return LESSONS.filter((l) => l.stationId === stationId).sort((a, b) => a.order - b.order);
}

export function firstLesson(stationId: StationId): LadderLesson {
  return lessonsFor(stationId)[0];
}

export function isStationId(id: string): id is StationId {
  return STATIONS.some((s) => s.id === id);
}

export function isStationUnlocked(progress: LadderProgress, stationId: StationId): boolean {
  const station = stationById(stationId);
  if (!station) return false;
  return station.order <= progress.unlockedLevel;
}

export function stationComplete(progress: LadderProgress, stationId: StationId): boolean {
  const list = lessonsFor(stationId);
  return list.length > 0 && list.every((l) => progress.trained[l.id]);
}

export function canTrain(progress: LadderProgress, lessonId: string): boolean {
  return Boolean(progress.openedText[lessonId]);
}

export function visitLadder(progress: LadderProgress, stationId: StationId, lessonId: string): LadderProgress {
  if (!isStationUnlocked(progress, stationId)) return progress;
  const lesson = lessonById(lessonId);
  if (!lesson || lesson.stationId !== stationId) return { ...progress, currentStationId: stationId };
  return { ...progress, currentStationId: stationId, currentLessonId: lessonId };
}

export function openLadderText(progress: LadderProgress, lessonId: string): LadderProgress {
  const lesson = lessonById(lessonId);
  if (!lesson) return progress;
  if (!isStationUnlocked(progress, lesson.stationId)) return progress;
  return {
    ...progress,
    currentStationId: lesson.stationId,
    currentLessonId: lessonId,
    openedText: { ...progress.openedText, [lessonId]: true },
  };
}

export function trainLadderLesson(progress: LadderProgress, lessonId: string): LadderProgress {
  const lesson = lessonById(lessonId);
  if (!lesson) return progress;
  if (!isStationUnlocked(progress, lesson.stationId)) return progress;
  if (!progress.openedText[lessonId]) return progress;
  const next: LadderProgress = {
    ...progress,
    currentStationId: lesson.stationId,
    currentLessonId: lessonId,
    trained: { ...progress.trained, [lessonId]: true },
  };
  const station = stationById(lesson.stationId);
  if (station && stationComplete(next, lesson.stationId) && station.order >= next.unlockedLevel && station.order < 5) {
    next.unlockedLevel = station.order + 1;
  }
  return next;
}

export function continueTarget(progress: LadderProgress): { stationId: StationId; lessonId: string } {
  const current = lessonById(progress.currentLessonId);
  if (current && isStationUnlocked(progress, current.stationId) && !progress.trained[current.id]) {
    return { stationId: current.stationId, lessonId: current.id };
  }
  for (const station of STATIONS) {
    if (!isStationUnlocked(progress, station.id)) continue;
    for (const lesson of lessonsFor(station.id)) {
      if (!progress.trained[lesson.id]) return { stationId: station.id, lessonId: lesson.id };
    }
  }
  const realm = firstLesson("realm");
  return { stationId: "realm", lessonId: realm.id };
}

export function continueLabel(progress: LadderProgress): string {
  const t = continueTarget(progress);
  const station = stationById(t.stationId);
  const lesson = lessonById(t.lessonId);
  if (!station || !lesson) return "Continue where you left off";
  return `Continue · ${station.name} · ${lesson.title}`;
}

export const BRAND_BLOCK = /BBH|Pratico|Van Pelt|K\s*&\s*J|Ross|Futato|Gesenius|Davidson|Basics of Biblical Hebrew/i;

export function labSearch(lab: LabRef, from?: string): { v1?: number; v2?: number; from?: string } {
  const out: { v1?: number; v2?: number; from?: string } = {};
  if (lab.v1 != null) out.v1 = lab.v1;
  if (lab.v2 != null) out.v2 = lab.v2;
  if (from) out.from = from;
  return out;
}
