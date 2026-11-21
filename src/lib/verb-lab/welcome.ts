import type { StemId } from "@/lib/verb-lab/stems";

export type WelcomeRow = {
  stem: StemId;
  voice: string;
  paqad: string | null;
  shamar: string | null;
  paqadCount: number | null;
  shamarCount: number | null;
};

/**
 * 3ms qatal of פקד and שמר, the two roots on the seven-stems page.
 * שמר has no Pual, Hiphil, or Hophal in the Hebrew Bible.
 * Counts are every form of that stem in OSHB, as reviewed with the mock-up.
 */
export const WELCOME_ROWS: readonly WelcomeRow[] = [
  { stem: "Qal", voice: "active", paqad: "פָּקַד", shamar: "שָׁמַר", paqadCount: 235, shamarCount: 427 },
  { stem: "Niphal", voice: "passive (often reflexive)", paqad: "נִפְקַד", shamar: "נִשְׁמַר", paqadCount: 21, shamarCount: 37 },
  { stem: "Piel", voice: "active", paqad: "פִּקֵּד", shamar: "שִׁמֵּר", paqadCount: 1, shamarCount: 1 },
  { stem: "Pual", voice: "passive", paqad: "פֻּקַּד", shamar: null, paqadCount: 2, shamarCount: null },
  { stem: "Hiphil", voice: "active", paqad: "הִפְקִיד", shamar: null, paqadCount: 29, shamarCount: null },
  { stem: "Hophal", voice: "passive", paqad: "הָפְקַד", shamar: null, paqadCount: 7, shamarCount: null },
  { stem: "Hitpael", voice: "reflexive / reciprocal", paqad: "הִתְפַּקֵּד", shamar: "הִשְׁתַּמֵּר", paqadCount: 4, shamarCount: 3 },
];

export function welcomeRow(stem: StemId): WelcomeRow {
  const row = WELCOME_ROWS.find((item) => item.stem === stem);
  if (!row) throw new Error(`Missing welcome row for ${stem}`);
  return row;
}
