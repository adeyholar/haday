import { type HandMatch } from "@/lib/hebrew";
import { FINAL_DESCENDERS, PAD_BASE, PAD_TOP } from "@/lib/pad-guides";
import { letterModel, modelGlyph } from "@/lib/letter-models";
import { matchStrokeModel, rankStrokeModels, scoreInkToPaths } from "@/lib/letter-strokes";

export type InkPoint = { x: number; y: number };
export type InkStroke = InkPoint[];

type Feat = {
  n: number;
  w: number;
  h: number;
  aspect: number;
  closed: number;
  circ: number;
  path: number;
  tall: boolean;
  wide: boolean;
  square: boolean;
  small: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  leftShare: number;
  topShare: number;
  hasTopBar: boolean;
  hasBottomBar: boolean;
  descender: number;
  belowShare: number;
  ascender: number;
  hasSlash: boolean;
  hasFork: boolean;
  hasMidArm: boolean;
  hasLeftFoot: boolean;
  leftJoinsRoof: boolean;
  hasCross: boolean;
  footX: number;
  topTips: number;
  hasNose: boolean;
};

function dist(a: InkPoint, b: InkPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function segmentsCross(a1: InkPoint, a2: InkPoint, b1: InkPoint, b2: InkPoint): boolean {
  const d = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
  if (Math.abs(d) < 1e-6) return false;
  const t = ((b1.x - a1.x) * (b2.y - b1.y) - (b1.y - a1.y) * (b2.x - b1.x)) / d;
  const u = ((b1.x - a1.x) * (a2.y - a1.y) - (b1.y - a1.y) * (a2.x - a1.x)) / d;
  return t > 0.12 && t < 0.88 && u > 0.12 && u < 0.88;
}

function pathOf(s: InkStroke): number {
  let n = 0;
  for (let i = 1; i < s.length; i++) n += dist(s[i - 1], s[i]);
  return n;
}

function strokeStraight(s: InkStroke): boolean {
  if (s.length < 2) return false;
  const chord = dist(s[0], s[s.length - 1]);
  const p = pathOf(s);
  return chord > 18 && p > 0 && chord / p > 0.78;
}

function analyze(strokes: InkStroke[], height = 0): Feat | null {
  const clean = strokes.map((s) => s.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).filter((s) => s.length);
  if (!clean.length) return null;
  const pts = clean.flat();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let path = 0;
  for (const s of clean) {
    for (const p of s) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    path += pathOf(s);
  }
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  const longest = clean.reduce((a, b) => (pathOf(a) >= pathOf(b) ? a : b));
  const closed = Math.max(0, 1 - dist(longest[0], longest[longest.length - 1]) / Math.max(w, h, 1));
  let area = 0;
  for (let i = 0; i < longest.length; i++) {
    const p = longest[i];
    const q = longest[(i + 1) % longest.length];
    area += p.x * q.y - q.x * p.y;
  }
  area = Math.abs(area) / 2;
  let perim = 0;
  for (let i = 1; i < longest.length; i++) perim += dist(longest[i - 1], longest[i]);
  perim += dist(longest[longest.length - 1], longest[0]);
  const circ = perim > 0 ? Math.min(1.5, (4 * Math.PI * area) / (perim * perim)) : 0;
  const first = clean[0][0];
  const lastS = clean[clean.length - 1];
  const last = lastS[lastS.length - 1];
  let left = 0;
  let top = 0;
  let topMinX = Infinity;
  let topMaxX = -Infinity;
  let midMinX = Infinity;
  let midMaxX = -Infinity;
  const topBins = [0, 0, 0, 0, 0];
  for (const p of pts) {
    const xn = (p.x - minX) / w;
    const yn = (p.y - minY) / h;
    if (xn < 0.38) left += 1;
    if (yn < 0.4) top += 1;
    if (yn < 0.28) {
      topMinX = Math.min(topMinX, p.x);
      topMaxX = Math.max(topMaxX, p.x);
      topBins[Math.max(0, Math.min(4, Math.floor(xn * 5)))] += 1;
    }
    if (yn > 0.35 && yn < 0.75) {
      midMinX = Math.min(midMinX, p.x);
      midMaxX = Math.max(midMaxX, p.x);
    }
  }
  const topSpan = Number.isFinite(topMinX) ? topMaxX - topMinX : 0;
  const midSpan = Number.isFinite(midMinX) ? midMaxX - midMinX : 0;
  const topFill = topBins.filter((n) => n >= 2).length;
  const hasTopBar = topFill >= 3 && topSpan > w * 0.4 && topSpan > Math.max(midSpan, w * 0.18) * 1.2;
  let botMinX = Infinity;
  let botMaxX = -Infinity;
  for (const p of pts) {
    const yn = (p.y - minY) / h;
    if (yn > 0.72) {
      botMinX = Math.min(botMinX, p.x);
      botMaxX = Math.max(botMaxX, p.x);
    }
  }
  const botSpan = Number.isFinite(botMinX) ? botMaxX - botMinX : 0;
  const hasBottomBar = botSpan > w * 0.4 && botSpan > Math.max(midSpan, w * 0.18) * 1.15;
  const baseY = height > 0 ? height * PAD_BASE : maxY;
  const topLine = height > 0 ? height * PAD_TOP : minY;
  const descender = height > 0 ? Math.max(0, (maxY - baseY) / height) : 0;
  const ascender = height > 0 ? Math.max(0, (topLine - minY) / height) : 0;
  let below = 0;
  if (height > 0) {
    for (const p of pts) {
      if (p.y > baseY + 1) below += 1;
    }
  }
  const belowShare = pts.length ? below / pts.length : 0;
  let footSum = 0;
  let footN = 0;
  for (const p of pts) {
    if ((p.y - minY) / h > 0.82) {
      footSum += (p.x - minX) / w;
      footN += 1;
    }
  }
  const footX = footN ? footSum / footN : 0.5;
  const span = Math.max(w, h);
  let hasSlash = false;
  for (const s of clean) {
    if (s === longest) continue;
    if (strokeStraight(s) && pathOf(s) > span * 0.32) {
      const mid = s[Math.floor(s.length / 2)];
      const xn = (mid.x - minX) / w;
      const yn = (mid.y - minY) / h;
      // A cap sitting on the roof is not a slash. A real slash crosses the body.
      if (xn > 0.18 && xn < 0.82 && yn > 0.22 && yn < 0.8) hasSlash = true;
    }
  }
  if (clean.length === 1 && longest.length > 8) {
    const mid = longest[Math.floor(longest.length / 2)];
    const chord = dist(longest[0], longest[longest.length - 1]);
    if (chord > span * 0.45 && closed < 0.35) hasSlash = hasSlash || chord / pathOf(longest) > 0.55;
    void mid;
  }
  let topL = 0;
  let topR = 0;
  for (const p of pts) {
    const xn = (p.x - minX) / w;
    const yn = (p.y - minY) / h;
    if (yn < 0.5) {
      if (xn < 0.38) topL += 1;
      if (xn > 0.62) topR += 1;
    }
  }
  const hasFork = topL >= 4 && topR >= 4;
  let topMid = 0;
  let gapFill = 0;
  let blMin = Infinity;
  let blMax = -Infinity;
  const leftColY: number[] = [];
  for (const p of pts) {
    const xn = (p.x - minX) / w;
    const yn = (p.y - minY) / h;
    if (yn < 0.52 && xn > 0.28 && xn < 0.72) topMid += 1;
    if (xn < 0.32 && yn > 0.04 && yn < 0.18) gapFill += 1;
    if (xn < 0.34) leftColY.push(yn);
    if (yn > 0.75 && xn < 0.55) {
      blMin = Math.min(blMin, p.x);
      blMax = Math.max(blMax, p.x);
    }
  }
  const hasMidArm = topMid >= 3;
  leftColY.sort((a, b) => a - b);
  let leftGap = 0;
  for (let i = 1; i < leftColY.length; i++) {
    const a = leftColY[i - 1];
    const b = leftColY[i];
    if (a < 0.45 && b < 0.55) leftGap = Math.max(leftGap, b - a);
  }
  // Chet’s left stem meets the roof. He leaves a hole under the roof on the left —
  // even a short handwritten gap (the usual student form) must not read as chet.
  const leftJoinsRoof = gapFill >= 3 && leftGap < 0.1;
  const hasLeftFoot = Number.isFinite(blMin) && blMax - blMin > w * 0.16;
  let hasCross = false;
  if (clean.length === 2 && strokeStraight(clean[0]) && strokeStraight(clean[1])) {
    hasCross = segmentsCross(clean[0][0], clean[0][clean[0].length - 1], clean[1][0], clean[1][clean[1].length - 1]);
  }
  const tipBins = [0, 0, 0, 0, 0, 0, 0];
  for (const p of pts) {
    const xn = (p.x - minX) / w;
    const yn = (p.y - minY) / h;
    if (yn < 0.42) tipBins[Math.max(0, Math.min(6, Math.floor(xn * 7)))] += 1;
  }
  let topTips = 0;
  let inPeak = false;
  for (const n of tipBins) {
    if (n >= 2) {
      if (!inPeak) {
        topTips += 1;
        inPeak = true;
      }
    } else inPeak = false;
  }
  let hasNose = false;
  for (const s of clean) {
    if (s === longest) continue;
    const plen = pathOf(s);
    if (plen < span * 0.55 && plen > span * 0.08) {
      const mid = s[Math.floor(s.length / 2)];
      const xn = (mid.x - minX) / w;
      const yn = (mid.y - minY) / h;
      if (xn > 0.2 && xn < 0.82 && yn > 0.18 && yn < 0.82) hasNose = true;
    }
  }
  if (!hasNose) {
    let innerN = 0;
    for (const p of pts) {
      const xn = (p.x - minX) / w;
      const yn = (p.y - minY) / h;
      if (xn > 0.38 && xn < 0.7 && yn > 0.32 && yn < 0.68) innerN += 1;
    }
    if (innerN >= 6) hasNose = true;
  }
  return {
    n: clean.length,
    w,
    h,
    aspect: w / h,
    closed,
    circ,
    path,
    tall: h / w > 1.38,
    wide: w / h > 1.28,
    square: w / h > 0.55 && w / h < 1.5,
    small: Math.max(w, h) < 42 && path < 105,
    startX: (first.x - minX) / w,
    startY: (first.y - minY) / h,
    endX: (last.x - minX) / w,
    endY: (last.y - minY) / h,
    leftShare: left / pts.length,
    topShare: top / pts.length,
    hasTopBar,
    hasBottomBar,
    descender,
    belowShare,
    ascender,
    hasSlash,
    hasFork,
    hasMidArm,
    hasLeftFoot,
    leftJoinsRoof,
    hasCross,
    footX,
    topTips,
    hasNose,
  };
}

/** Side-by-side copies of a letter (a practice row) become separate blobs. */
export function clusterLetterBlobs(strokes: InkStroke[]): InkStroke[][] {
  const clean = strokes.map((s) => s.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).filter((s) => s.length);
  if (clean.length < 2) return clean.length ? [clean] : [];
  const items = clean.map((s) => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of s) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    return { s, minX, maxX, minY, maxY, mid: (minX + maxX) / 2, w: Math.max(1, maxX - minX) };
  });
  items.sort((a, b) => a.mid - b.mid);
  const widths = items.map((it) => it.w).sort((a, b) => a - b);
  const medW = widths[Math.floor(widths.length / 2)] || 1;
  const gapCut = Math.max(medW * 0.4, 16);
  const groups: (typeof items)[] = [[items[0]]];
  for (let i = 1; i < items.length; i++) {
    const prev = groups[groups.length - 1];
    const prevMax = Math.max(...prev.map((p) => p.maxX));
    if (items[i].minX - prevMax > gapCut) groups.push([items[i]]);
    else prev.push(items[i]);
  }
  if (groups.length < 2 || groups.length > 8) return [clean];
  const blobs = groups
    .map((g) => g.map((x) => x.s))
    .filter((b) => {
      const pts = b.flat();
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const p of pts) {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
      return maxX - minX > 10 && maxY - minY > 14;
    });
  return blobs.length >= 2 ? blobs : [clean];
}

/** Best single copy when the pad has a row of the same letter. */
export function primaryLetterInk(strokes: InkStroke[], expected?: string): InkStroke[] {
  const blobs = clusterLetterBlobs(strokes);
  if (blobs.length < 2) return strokes;
  if (!expected) return blobs[Math.floor(blobs.length / 2)];
  let best = blobs[0];
  let bestSc = -1;
  for (const b of blobs) {
    const sc = matchStrokeModel(b, expected)?.score ?? 0;
    if (sc > bestSc) {
      bestSc = sc;
      best = b;
    }
  }
  return best;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function baseLetter(expected: string): string {
  return modelGlyph(expected);
}

function gateLetter(want: string, f: Feat, lined: boolean): { ok: boolean; as: string; stave?: boolean } {
  const model = letterModel(want);
  const dropped = f.descender >= 0.045 || f.belowShare >= 0.12;
  const bitLow = f.descender >= 0.01 || f.belowShare >= 0.025;
  const rose = f.ascender >= 0.04;
  const centerStem = f.footX > 0.36 && f.footX < 0.64 && !f.hasBottomBar && !f.hasLeftFoot;

  if (roundLoop(f) && want !== "ס" && want !== "ם" && want !== "ט" && want !== "ק") return { ok: false, as: "ס" };
  if (f.small && want !== "י" && f.path < 70) return { ok: false, as: "י" };
  if (want === "ס" && f.hasSlash) return { ok: false, as: "" };
  if (want === "ס" && f.n > 4) return { ok: false, as: "" };
  if (want === "ס" && f.n === 1 && f.closed < 0.28 && f.circ < 0.18 && !f.hasTopBar) return { ok: false, as: "" };
  if (want === "ס" && f.hasNose && f.n >= 2 && f.closed < 0.4 && !f.hasTopBar) return { ok: false, as: "ט" };
  if (want === "ם" && f.closed < 0.45) return { ok: false, as: "" };
  if (want === "י" && (dropped || f.path > 140 || f.h > 48)) return { ok: false, as: "ו" };
  if (want === "ו" && (f.descender >= 0.12 || f.belowShare >= 0.22)) return { ok: false, as: "ן" };
  if (want === "ו" && f.small) return { ok: false, as: "י" };
  if (want === "ו" && f.hasTopBar && f.footX < 0.62) return { ok: false, as: "ז" };
  if (want === "ו" && f.hasFork && !f.hasTopBar && f.aspect > 0.62) return { ok: false, as: "ע" };
  if (want === "ז" && (dropped || (!f.hasTopBar && f.topShare < 0.18))) return { ok: false, as: dropped ? "ן" : "ו" };
  if (want === "ע" && roundLoop(f)) return { ok: false, as: "ס" };
  if (want === "ע" && stick(f)) return { ok: false, as: "ו" };
  if (want === "ע" && f.topTips >= 3) return { ok: false, as: "ש" };
  if (want === "ע" && f.hasTopBar && !f.hasFork) return { ok: false, as: "ז" };
  if (want === "ע" && f.hasNose && f.closed > 0.4) return { ok: false, as: "ט" };
  if (want === "צ" && (f.hasCross || !f.hasFork)) return { ok: false, as: f.hasCross ? "א" : "" };
  if (want === "צ" && centerStem && f.n >= 2) return { ok: false, as: "ע" };
  if (want === "ץ" && f.hasCross) return { ok: false, as: "א" };
  if (want === "ץ" && (!f.hasFork || (!dropped && !f.tall))) return { ok: false, as: f.hasFork ? "צ" : "" };
  if (want === "א" && (roundLoop(f) || stick(f))) return { ok: false, as: "" };
  if (want === "ב" && (f.closed > 0.62 || roundLoop(f))) return { ok: false, as: "ם" };
  if (want === "ק" && f.footX < 0.42) return { ok: false, as: "" };
  if (want === "ק" && stick(f) && !f.hasTopBar && f.n === 1) return { ok: false, as: "ן" };
  if (want === "ק" && f.aspect < 0.36 && f.n === 1) return { ok: false, as: "ן" };
  if (want === "פ" && !f.hasNose) return { ok: false, as: "כ" };
  if (want === "ט" && roundLoop(f) && f.n === 1 && !f.hasNose) return { ok: false, as: "ס" };
  if (want === "ט" && f.hasFork && f.n === 1 && f.closed < 0.4 && !f.hasSlash && !f.hasNose) return { ok: false, as: "ע" };
  if (want === "ט" && f.n === 1 && !f.hasNose && !f.hasSlash) return { ok: false, as: f.hasFork ? "ע" : "" };
  if (want === "ט" && !f.hasNose && f.closed > 0.42 && !f.hasSlash) return { ok: false, as: "ס" };
  if (want === "מ" && roundLoop(f)) return { ok: false, as: "ס" };
  if (want === "מ" && f.n === 1 && f.hasFork && !f.hasBottomBar) return { ok: false, as: "ע" };
  if (want === "מ" && f.n === 1 && f.startX > 0.68 && f.endX > 0.68) return { ok: false, as: "" };
  if (want === "מ" && f.hasNose && f.closed > 0.4) return { ok: false, as: "ט" };
  if (want === "ם" && f.circ > 0.86) return { ok: false, as: "ס" };
  if (want === "ש") {
    if (roundLoop(f) || stick(f)) return { ok: false, as: roundLoop(f) ? "ס" : "ו" };
    if (f.hasTopBar && !f.hasBottomBar) return { ok: false, as: f.leftJoinsRoof || f.n >= 2 ? "ח" : "ז" };
    if (f.topTips < 3 && !(f.hasFork && f.hasMidArm && !f.hasTopBar)) return { ok: false, as: f.hasFork ? "ע" : "" };
  }
  if (want === "ת" && !f.hasLeftFoot) return { ok: false, as: f.leftJoinsRoof ? "ח" : "ה" };
  if ((want === "ה" || want === "ח") && f.hasLeftFoot) return { ok: false, as: "ת" };
  if (want === "ח" && !f.leftJoinsRoof) return { ok: false, as: "ה" };
  if (want === "ה" && f.leftJoinsRoof) return { ok: false, as: "ח" };

  const tBar = f.hasTopBar && !f.hasBottomBar && f.closed < 0.35 && f.circ < 0.28;
  if (tBar && (want === "כ" || want === "ב" || want === "פ" || want === "ס" || want === "ם" || want === "מ")) {
    return { ok: false, as: f.leftShare < 0.3 ? "ד" : "ז" };
  }
  if (want === "כ" && !f.hasBottomBar && (stick(f) || f.tall)) return { ok: false, as: "ו" };

  if (lined && model) {
    if (model.band === "descender" && !dropped) return { ok: false, as: want, stave: true };
    if (model.band === "hang" && !bitLow) return { ok: false, as: want === "ק" ? "ר" : want, stave: true };
    if (model.band === "ascender" && !rose) return { ok: false, as: want, stave: true };
    if (model.band === "body" && dropped && f.descender > 0.09 && FINAL_DESCENDERS.has(want === "כ" ? "ך" : want === "נ" ? "ן" : want === "פ" ? "ף" : want === "צ" ? "ץ" : "")) {
      const asFinal = want === "כ" ? "ך" : want === "נ" ? "ן" : want === "פ" ? "ף" : want === "צ" ? "ץ" : "";
      if (asFinal) return { ok: false, as: asFinal, stave: true };
    }
    if (model.band === "body" && dropped && f.descender > 0.12 && want !== "ק" && want !== "ו") {
      if (want === "ר" || want === "ד") return { ok: false, as: "ק", stave: true };
      return { ok: false, as: "ן", stave: true };
    }
    if (model.band === "small" && (dropped || (rose && f.h > 80))) return { ok: false, as: "ו", stave: true };
    if (want === "ם" && dropped && f.descender > 0.08) return { ok: false, as: "", stave: true };
  }
  return { ok: true, as: want };
}

function roundLoop(f: Feat): boolean {
  return f.circ > 0.34 && f.closed > 0.5 && f.square && !f.hasSlash && f.n <= 2;
}
function boxLoop(f: Feat): boolean {
  return f.closed > 0.45 && f.square && f.circ < 0.8;
}
function stick(f: Feat): boolean {
  return f.tall && f.n <= 2 && f.closed < 0.34 && f.circ < 0.28 && !f.hasFork;
}

type Scorer = (f: Feat) => number;

const SCORES: Record<string, Scorer> = {
  א: (f) => (f.path > 40 && !roundLoop(f) && !stick(f) ? 0.4 : 0.1) + (f.n >= 2 ? 0.2 : 0.1) + (f.hasSlash || f.hasFork ? 0.15 : 0) + (roundLoop(f) || stick(f) ? -0.5 : 0.1),
  ה: (f) =>
    (f.path > 40 && !roundLoop(f) && !stick(f) && !f.hasFork ? 0.45 : 0.1) +
    (f.hasTopBar || f.topShare > 0.22 ? 0.25 : 0.1) +
    (f.n >= 1 ? 0.15 : 0) +
    (roundLoop(f) || stick(f) || f.hasFork ? -0.45 : 0.1),
  ח: (f) =>
    (f.path > 40 && !roundLoop(f) && !stick(f) ? 0.4 : 0.1) +
    (f.hasTopBar || f.square ? 0.25 : 0.1) +
    (f.n >= 1 ? 0.15 : 0) +
    (roundLoop(f) || stick(f) || f.hasFork ? -0.4 : 0.1),
  ת: (f) =>
    (f.path > 40 && !roundLoop(f) && !stick(f) ? 0.35 : 0.1) +
    (f.hasTopBar || f.square || f.wide ? 0.2 : 0) +
    (f.n >= 1 ? 0.15 : 0) +
    (roundLoop(f) || stick(f) || f.hasFork ? -0.4 : 0.1),
  ע: (f) =>
    (f.hasFork ? 0.35 : f.closed < 0.48 && !f.hasTopBar && !stick(f) ? 0.22 : 0) +
    (f.n >= 1 ? 0.15 : 0) +
    (f.closed < 0.55 ? 0.12 : 0) +
    (stick(f) || roundLoop(f) || f.hasTopBar ? -0.4 : 0.1),
  ב: (f) =>
    (f.closed < 0.55 ? 0.25 : -0.2) +
    (f.leftShare < 0.42 ? 0.3 : 0) +
    (f.n <= 2 ? 0.2 : 0) +
    (roundLoop(f) || stick(f) ? -0.45 : 0.1),
  ג: (f) => (f.n <= 2 ? 0.25 : 0) + (f.closed < 0.5 ? 0.25 : 0) + (f.endY > 0.5 ? 0.2 : 0) + (roundLoop(f) ? -0.5 : 0.1),
  ד: (f) => (f.wide || f.square ? 0.2 : 0) + (f.topShare > 0.28 ? 0.25 : 0) + (f.closed < 0.55 ? 0.2 : 0) + (roundLoop(f) || stick(f) ? -0.4 : 0.1),
  ו: (f) => (stick(f) && !f.hasTopBar ? 0.55 : f.tall && !f.hasTopBar ? 0.3 : 0) + (f.n === 1 ? 0.2 : 0) + (f.small ? -0.25 : 0.1) + (roundLoop(f) || f.hasTopBar ? -0.45 : 0.1),
  ז: (f) =>
    (f.hasTopBar ? 0.5 : f.topShare > 0.22 ? 0.2 : 0) +
    (f.n <= 2 ? 0.2 : 0) +
    (f.closed < 0.5 ? 0.15 : 0) +
    (roundLoop(f) ? -0.45 : 0.1) +
    (stick(f) && !f.hasTopBar ? -0.35 : 0.05),
  ן: (f) =>
    (stick(f) && !f.hasTopBar && !f.hasFork ? 0.4 : f.tall && f.n === 1 && !f.hasTopBar && !f.hasFork ? 0.2 : 0) +
    (f.descender > 0.04 || f.belowShare > 0.1 ? 0.25 : 0) +
    (f.hasFork ? -0.55 : 0.1) +
    (f.n === 1 ? 0.1 : 0) +
    (roundLoop(f) || f.small || f.hasTopBar ? -0.5 : 0.1),
  ט: (f) =>
    (f.hasNose ? 0.5 : f.closed > 0.35 ? 0.15 : 0.1) +
    (f.square || (f.aspect > 0.5 && f.aspect < 1.45) ? 0.12 : 0) +
    (f.n <= 3 ? 0.12 : f.n <= 6 ? 0.05 : -0.12) +
    (stick(f) || (roundLoop(f) && !f.hasNose) ? -0.45 : 0.1),
  י: (f) => (f.small ? 0.6 : 0) + (f.n === 1 ? 0.2 : 0) + (f.path < 120 ? 0.15 : -0.2) + (f.tall && !f.small ? -0.4 : 0) + (roundLoop(f) ? -0.5 : 0.05),
  כ: (f) =>
    (f.hasBottomBar ? 0.3 : -0.3) +
    (f.closed < 0.55 ? 0.15 : -0.15) +
    (f.n <= 2 ? 0.1 : 0) +
    (f.circ > 0.18 && f.circ < 0.65 ? 0.15 : 0) +
    (f.hasTopBar && !f.hasBottomBar ? -0.55 : 0.1) +
    (f.tall ? -0.35 : 0.1) +
    (roundLoop(f) || stick(f) ? -0.45 : 0.05),
  ך: (f) => (f.tall ? 0.35 : 0) + (f.descender > 0.04 || f.belowShare > 0.1 ? 0.4 : -0.35) + (f.n <= 2 ? 0.1 : 0) + (roundLoop(f) || f.small ? -0.45 : 0.1),
  ל: (f) => (f.tall ? 0.4 : 0) + (f.startY < 0.3 || f.topShare < 0.35 ? 0.2 : 0) + (f.n <= 2 ? 0.15 : 0) + (roundLoop(f) ? -0.45 : 0.1) + (f.descender > 0.1 ? -0.25 : 0),
  מ: (f) => (f.n <= 3 ? 0.2 : 0) + (f.closed < 0.72 ? 0.25 : -0.2) + (f.square ? 0.2 : 0) + (roundLoop(f) || stick(f) ? -0.4 : 0.1),
  ם: (f) => (boxLoop(f) || (f.closed > 0.5 && f.square) ? 0.55 : f.closed > 0.35 ? 0.25 : 0) + (f.square ? 0.2 : 0) + (f.circ > 0.8 ? -0.3 : 0.1) + (stick(f) ? -0.5 : 0.1),
  נ: (f) => (f.n <= 2 ? 0.25 : 0) + (f.closed < 0.5 ? 0.25 : 0) + (!f.small && !f.tall ? 0.15 : 0) + (roundLoop(f) || (f.tall && f.n === 1) ? -0.4 : 0.1),
  ס: (f) =>
    ((roundLoop(f) || (f.closed > 0.35 && f.circ > 0.16) || (f.hasTopBar && f.closed > 0.28)) && !f.hasSlash ? 0.65 : f.closed > 0.3 ? 0.25 : 0) +
    (f.n <= 2 ? 0.15 : f.n <= 4 && !f.hasSlash ? 0.08 : -0.35) +
    (f.square ? 0.1 : 0) +
    (f.hasTopBar ? 0.12 : 0) +
    (f.hasSlash || f.closed < 0.28 ? -0.55 : 0.1) +
    (f.hasNose && f.n >= 2 && !f.hasTopBar ? -0.25 : 0),
  פ: (f) => (f.closed < 0.6 ? 0.25 : -0.1) + (f.n <= 2 ? 0.2 : 0) + (f.tall ? -0.3 : 0.1) + (roundLoop(f) || stick(f) ? -0.4 : 0.15),
  ף: (f) => (f.tall ? 0.3 : 0) + (f.descender > 0.04 || f.belowShare > 0.1 ? 0.4 : -0.35) + (f.n <= 2 ? 0.1 : 0) + (f.wide || roundLoop(f) || f.small ? -0.35 : 0.1),
  צ: (f) => (f.hasFork ? 0.4 : 0.1) + (f.n <= 3 ? 0.15 : 0) + (f.closed < 0.55 ? 0.15 : 0) + (f.tall ? -0.2 : 0.1) + (roundLoop(f) || stick(f) ? -0.4 : 0.1),
  ץ: (f) =>
    (f.hasFork ? 0.55 : 0) +
    (f.tall || f.descender > 0.03 ? 0.25 : 0.1) +
    (f.descender > 0.04 || f.belowShare > 0.1 ? 0.15 : 0) +
    (f.hasFork ? 0.1 : -0.4) +
    (roundLoop(f) || f.small || !f.hasFork ? -0.2 : 0.1),
  ק: (f) =>
    (f.tall || f.endY > 0.7 ? 0.2 : 0) +
    (f.descender > 0.012 || f.belowShare > 0.03 ? 0.3 : -0.2) +
    (f.n <= 2 ? 0.1 : 0) +
    (f.footX > 0.5 ? 0.25 : -0.5) +
    (roundLoop(f) ? -0.2 : 0.1),
  ר: (f) => (f.n === 1 ? 0.25 : 0.1) + (f.closed < 0.5 ? 0.25 : 0) + (f.startY < 0.4 || f.topShare > 0.28 ? 0.2 : 0) + (roundLoop(f) || stick(f) ? -0.4 : 0.1),
  ש: (f) =>
    (f.topTips >= 3 ? 0.4 : f.hasMidArm ? 0.12 : 0) +
    (f.wide || f.square ? 0.15 : 0) +
    (f.closed < 0.55 ? 0.1 : 0) +
    (f.n >= 1 ? 0.1 : 0) +
    (roundLoop(f) || stick(f) || f.hasTopBar || f.topTips < 3 ? -0.45 : 0.1),
};

function scoreOf(id: string, f: Feat): number {
  const fn = SCORES[id];
  return fn ? clamp01(fn(f)) : 0;
}

const NEAR: string[][] = [
  ["ז", "ו", "ן", "ך"],
  ["ו", "ן", "י"],
  ["ב", "כ", "פ"],
  ["ד", "ר", "ז"],
  ["ק", "ר", "ד"],
  ["ה", "ח", "ת"],
  ["מ", "ם", "ס", "ט"],
  ["צ", "ץ"],
];

function isNear(a: string, b: string): boolean {
  return NEAR.some((g) => g.includes(a) && g.includes(b));
}

function qofMissNote(f: Feat, gate: { ok: boolean; as: string; stave?: boolean }): string | undefined {
  if (f.footX < 0.42) {
    return "That looks like a Latin P. Qof’s leg is on the right, like resh, hanging a little below the line.";
  }
  if (!gate.ok && gate.as === "ר") {
    return "Drop the right leg a little below the bottom line — like resh, just longer.";
  }
  return undefined;
}

function vavMissNote(f: Feat, gate: { ok: boolean; as: string; stave?: boolean }): string | undefined {
  if (gate.as === "ן" || f.descender >= 0.12 || f.belowShare >= 0.22) {
    return "Vav sits between the two lines — a short inverted L. A long stem below the line is final nun.";
  }
  if (gate.as === "ז") return "Vav’s hook is tiny, on the right stem. A wide roof bar is zayin.";
  return undefined;
}

function ayinMissNote(f: Feat, rivalId: string): string | undefined {
  if (roundLoop(f)) return "Ayin is open at the top — two arms like a Y, not a closed oval.";
  if (stick(f)) return "Two arms meeting like a Y, as on the chart. Not a single stem.";
  if (rivalId === "צ" || rivalId === "ץ") {
    return "That looks more like tsade. Ayin is just the Y — no extra right foot, and it stays on the line.";
  }
  return undefined;
}

function shinMissNote(f: Feat, rivalId: string): string | undefined {
  if (f.topTips < 3 || rivalId === "ע" || rivalId === "צ") {
    return "Shin has three arms, like a W. Two arms is ayin.";
  }
  if (stick(f) || roundLoop(f) || f.hasTopBar) {
    return "Three arms, like a W, as on the chart. Open at the top.";
  }
  return undefined;
}

function yodMissNote(f: Feat): string | undefined {
  if (f.h > 48 || f.path > 140) return "Yod is the tiny mark in the upper body. A full-height stem is vav.";
  return undefined;
}

function samekhMissNote(f: Feat, rivalId: string): string | undefined {
  if (rivalId === "ט") return "Samekh is closed, with a small cap that overhangs left. The inner hook is tet.";
  if (f.hasSlash) return "No slash through the body. A small cap on top is part of samekh.";
  return undefined;
}

function tetMissNote(f: Feat, rivalId: string): string | undefined {
  if (rivalId === "א") return "Tet is a rounded U with a small inner hook. Not an X.";
  if (rivalId === "ס") return "Tet stays open at the top, with a hook inside. A closed body is samekh.";
  if (rivalId === "ע") return "Tet needs the small inner hook. Two empty arms is ayin.";
  void f;
  return undefined;
}

/** Save this ink as the student’s hand only if it is not a known imposter. */
export function enrollLetterInk(
  strokes: InkStroke[],
  expected: string,
  opts?: { height?: number },
): { ok: boolean; note?: string } {
  const ink = primaryLetterInk(strokes, expected);
  const want = baseLetter(expected);
  const f = analyze(ink, opts?.height ?? 0);
  if (!f || !want) return { ok: false, note: "Draw the letter larger, between the two lines." };
  if (f.path < (want === "י" ? 7 : 16)) return { ok: false, note: "Draw the letter larger, between the two lines." };
  const lined = (opts?.height ?? 0) > 40;
  const gate = gateLetter(want, f, lined);
  const ranked = rankStrokeModels(ink);
  const shape = ranked.find((r) => r.id === want);
  const rival = ranked[0];
  const tBar = f.hasTopBar && !f.hasBottomBar && f.closed < 0.35 && f.circ < 0.28;
  if (want === "ק" && f.footX < 0.42) {
    return { ok: false, note: qofMissNote(f, gate) ?? "That looks like a Latin P. Qof’s leg is on the right." };
  }
  if (tBar && (want === "כ" || want === "ב" || want === "פ" || want === "ס" || want === "ם" || want === "מ")) {
    return { ok: false, note: "That looks like a Latin T. This letter needs an open back and a floor." };
  }
  if (!gate.ok) {
    const named = gate.as && gate.as !== want ? ` That looks more like ${gate.as}.` : "";
    return {
      ok: false,
      note:
        (want === "ק" ? qofMissNote(f, gate) : undefined) ||
        (want === "ו" ? vavMissNote(f, gate) : undefined) ||
        (want === "ע" ? ayinMissNote(f, gate.as) : undefined) ||
        (want === "ש" ? shinMissNote(f, gate.as) : undefined) ||
        (want === "י" ? yodMissNote(f) : undefined) ||
        (want === "ט" ? tetMissNote(f, gate.as) : undefined) ||
        `Use the chart form for this letter.${named}`,
    };
  }
  if (rival && rival.id !== want && !isNear(want, rival.id) && rival.score >= 0.72 && rival.score >= (shape?.score ?? 0) + 0.18) {
    return { ok: false, note: `That looks more like ${rival.id}. Use the chart form.` };
  }
  return { ok: true };
}

/** Every alef-bet letter (and finals) is scored. Trace mode verifies the shown letter, not the whole alphabet. */
export function verifyLetterInk(
  strokes: InkStroke[],
  expected: string,
  opts?: { trace?: boolean; height?: number; samples?: InkStroke[][]; bar?: number; noSplit?: boolean },
): { match: HandMatch; read: string; score: number; note?: string } {
  if (!opts?.noSplit) {
    const blobs = clusterLetterBlobs(strokes);
    if (blobs.length >= 2 && blobs.length <= 8) {
      const inner = { ...opts, noSplit: true };
      const rs = blobs.map((b) => verifyLetterInk(b, expected, inner));
      const good = rs.filter((r) => r.match === "exact" || r.match === "close");
      if (good.length >= Math.ceil(blobs.length * 0.5)) {
        good.sort((a, b) => b.score - a.score);
        return good[0];
      }
    }
  }

  const want = baseLetter(expected);
  const f = analyze(strokes, opts?.height ?? 0);
  if (!f || !want) return { match: "empty", read: "", score: 0 };
  if (f.path < (want === "י" ? 7 : 16)) return { match: "empty", read: "", score: 0 };

  const lined = (opts?.height ?? 0) > 40;
  const gate = gateLetter(want, f, lined);
  const ranked = rankStrokeModels(strokes);
  const shape = ranked.find((r) => r.id === want) ?? matchStrokeModel(strokes, want);
  const rival = ranked[0];
  const qofNote = want === "ק" ? qofMissNote(f, gate) : undefined;
  const vavNote = want === "ו" ? vavMissNote(f, gate) : undefined;
  const ayinNote = want === "ע" ? ayinMissNote(f, rival && rival.id !== want ? rival.id : "") : undefined;
  const shinNote = want === "ש" ? shinMissNote(f, rival && rival.id !== want ? rival.id : "") : undefined;
  const yodNote = want === "י" ? yodMissNote(f) : undefined;
  const samekhNote = want === "ס" ? samekhMissNote(f, rival && rival.id !== want ? rival.id : gate.as) : undefined;
  const tetNote = want === "ט" ? tetMissNote(f, rival && rival.id !== want ? rival.id : gate.as) : undefined;
  const note = qofNote ?? vavNote ?? ayinNote ?? shinNote ?? yodNote ?? samekhNote ?? tetNote;
  const tBar = f.hasTopBar && !f.hasBottomBar && f.closed < 0.35 && f.circ < 0.28;
  if (want === "ק" && f.footX < 0.42) {
    return { match: "wrong", read: "", score: shape?.score ?? 0, note };
  }
  if (tBar && (want === "כ" || want === "ב" || want === "פ" || want === "ס" || want === "ם" || want === "מ")) {
    return { match: "wrong", read: f.leftShare < 0.3 ? "ד" : "ז", score: shape?.score ?? 0 };
  }

  let proto = shape?.score ?? 0;
  for (const sample of opts?.samples ?? []) {
    const sc = scoreInkToPaths(strokes, sample);
    if (sc.score > proto) proto = sc.score;
  }

  if (!gate.ok) {
    return { match: "wrong", read: gate.as === want ? "" : gate.as, score: shape?.score ?? 0.12, note };
  }

  if (opts?.samples?.length && proto >= (opts?.bar ?? 0.64)) {
    return { match: proto >= Math.max(0.8, (opts?.bar ?? 0.64) + 0.12) ? "exact" : "close", read: want, score: proto };
  }

  const hangTwins = want === "ק" ? new Set(["ד", "ר", "ן", "ך", "ו", "ה", "נ", "ף"]) : null;
  const ayinTwins =
    want === "ע" && !roundLoop(f) && !stick(f) ? new Set(["ס", "ם", "כ", "נ", "ג"]) : null;
  const shinTwins =
    want === "ש" && !roundLoop(f) && !stick(f) && f.topTips >= 3 ? new Set(["מ", "ט", "ס", "ם", "א", "ת", "ח"]) : null;
  const descTwins =
    want === "ך" || want === "ן" || want === "ף" ? new Set(["ד", "ר", "ו", "ה", "נ", "י", "ח"]) : null;
  const yodTwins = want === "י" ? new Set(["ד", "ר", "ו", "ן", "ך"]) : null;
  const heTwins = want === "ה" && !f.leftJoinsRoof ? new Set(["ח", "ת", "ד", "ר"]) : null;
  const samekhTwins =
    want === "ס" && !f.hasSlash && (f.closed > 0.28 || f.hasTopBar || f.n >= 2 || f.circ > 0.16)
      ? new Set(["ט", "ם", "מ", "ע", "כ", "ת", "ה", "ח", "ד", "ז"])
      : null;
  const tetTwins =
    want === "ט" && (f.hasNose || f.n >= 2)
      ? new Set(["א", "ע", "ס", "ם", "מ", "צ", "ש"])
      : null;

  if (rival && rival.id !== want && rival.score >= 0.52 && rival.score >= (shape?.score ?? 0) + 0.07) {
    if (
      hangTwins?.has(rival.id) ||
      ayinTwins?.has(rival.id) ||
      shinTwins?.has(rival.id) ||
      descTwins?.has(rival.id) ||
      yodTwins?.has(rival.id) ||
      heTwins?.has(rival.id) ||
      samekhTwins?.has(rival.id) ||
      tetTwins?.has(rival.id)
    ) {
      /* stretch-fill twins */
    } else if (isNear(want, rival.id) && (shape?.score ?? 0) >= 0.55 && (shape?.extra ?? 0) >= 0.55) {
      return { match: "close", read: want, score: shape?.score ?? rival.score };
    } else {
      return { match: "wrong", read: rival.id, score: shape?.score ?? 0, note };
    }
  }

  if (want === "י" && shape && shape.score >= 0.5 && f.descender < 0.04 && f.h < 48) {
    if (shape.score >= 0.82 && shape.cover >= 0.72) return { match: "exact", read: want, score: shape.score };
    return { match: "close", read: want, score: shape.score };
  }

  if (want === "ע" && shape && shape.score >= 0.5 && !roundLoop(f) && !stick(f) && !f.hasTopBar) {
    const lead = shape.score + 0.04 >= (rival?.score ?? 0) || !rival || rival.id === want || Boolean(ayinTwins?.has(rival.id));
    if (lead) {
      if (shape.score >= 0.82 && shape.cover >= 0.72 && shape.extra >= 0.7) return { match: "exact", read: want, score: shape.score };
      return { match: "close", read: want, score: shape.score };
    }
  }

  if (want === "ש" && shape && shape.score >= 0.55 && !roundLoop(f) && !stick(f) && (f.topTips >= 3 || (f.hasFork && f.hasMidArm && !f.hasTopBar))) {
    const lead = shape.score + 0.04 >= (rival?.score ?? 0) || !rival || rival.id === want || Boolean(shinTwins?.has(rival.id));
    if (lead) {
      if (shape.score >= 0.82 && shape.cover >= 0.72 && shape.extra >= 0.7) return { match: "exact", read: want, score: shape.score };
      return { match: "close", read: want, score: shape.score };
    }
  }

  if (want === "ס" && shape && shape.score >= 0.5 && !f.hasSlash && (f.closed > 0.28 || f.hasTopBar || f.n >= 2 || f.circ > 0.16)) {
    const lead = shape.score + 0.04 >= (rival?.score ?? 0) || !rival || rival.id === want || Boolean(samekhTwins?.has(rival.id));
    if (lead) {
      if (shape.score >= 0.82 && shape.cover >= 0.72 && shape.extra >= 0.7) return { match: "exact", read: want, score: shape.score };
      return { match: "close", read: want, score: shape.score };
    }
  }

  if (want === "ט" && shape && shape.score >= 0.48 && (f.hasNose || f.n >= 2) && !roundLoop(f)) {
    const lead = shape.score + 0.04 >= (rival?.score ?? 0) || !rival || rival.id === want || Boolean(tetTwins?.has(rival.id));
    if (lead) {
      if (shape.score >= 0.82 && shape.cover >= 0.72 && shape.extra >= 0.7) return { match: "exact", read: want, score: shape.score };
      return { match: "close", read: want, score: shape.score };
    }
  }

  if (shape && shape.score >= 0.7 && shape.cover >= 0.6 && shape.extra >= 0.58) {
    if (shape.score >= 0.82 && shape.cover >= 0.72 && shape.extra >= 0.7) return { match: "exact", read: want, score: shape.score };
    return { match: "close", read: want, score: shape.score };
  }

  if (shape && shape.score < 0.42) return { match: "wrong", read: rival && rival.id !== want ? rival.id : "", score: shape.score, note };

  let bestId = "";
  let best = -1;
  for (const id of Object.keys(SCORES)) {
    const s = scoreOf(id, f);
    if (s > best) {
      best = s;
      bestId = id;
    }
  }
  const mine = scoreOf(want, f);

  if (opts?.trace) {
    if (mine >= 0.5 && mine + 0.02 >= best) return { match: "exact", read: want, score: mine };
    if (mine >= 0.34) return { match: "close", read: want, score: mine };
    if (best >= 0.62 && best > mine + 0.2 && !isNear(want, bestId)) return { match: "wrong", read: bestId, score: mine, note };
    return { match: "wrong", read: bestId && best > mine ? bestId : "", score: mine, note };
  }

  if (mine >= 0.58 && mine + 0.02 >= best) return { match: "exact", read: want, score: mine };
  if (mine >= 0.48 && (mine + 0.08 >= best || isNear(want, bestId))) return { match: "close", read: want, score: mine };
  if (isNear(want, bestId) && mine >= 0.42 && best - mine < 0.16) return { match: "close", read: want, score: mine };
  if (best >= 0.5 && best > mine + 0.1 && !isNear(want, bestId)) return { match: "wrong", read: bestId, score: mine, note };
  if (mine >= 0.46) return { match: "close", read: want, score: mine };
  return { match: "wrong", read: bestId && best > mine ? bestId : "", score: mine, note };
}
