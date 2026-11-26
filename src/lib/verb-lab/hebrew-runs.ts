export type HebrewRun = { hebrew: boolean; text: string };

/** Letters, points, and cantillation. A maqaf stays inside the run it joins. */
const HEBREW = /[\u0590-\u05FF\uFB1D-\uFB4F]+(?:\u05BE[\u0590-\u05FF\uFB1D-\uFB4F]+)*/g;

/** Split an English line so each Hebrew run can be isolated. */
export function hebrewRuns(text: string): HebrewRun[] {
  const runs: HebrewRun[] = [];
  let last = 0;
  for (const match of text.matchAll(HEBREW)) {
    const index = match.index ?? 0;
    if (index > last) runs.push({ hebrew: false, text: text.slice(last, index) });
    if (match[0]) runs.push({ hebrew: true, text: match[0] });
    last = index + match[0].length;
  }
  if (last < text.length) runs.push({ hebrew: false, text: text.slice(last) });
  return runs;
}
