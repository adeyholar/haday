import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { verifyLetterInk, enrollLetterInk } = await jiti.import("/workspace/src/lib/letter-shape.ts");
const { strokeModels, rankStrokeModels } = await jiti.import("/workspace/src/lib/letter-strokes.ts");
const { staveRegion } = await jiti.import("/workspace/src/lib/letter-models.ts");

const H = 208;
const TOP = H * 0.24;
const BASE = H * 0.66;
const CY = (TOP + BASE) / 2;
const CX = 330;
const RX = 28;
const RY = 32;

function densify(path, step = 3.2) {
  const out = [];
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.round(d / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  if (path.length) out.push(path.at(-1));
  return out;
}

function oval(n = 36, jitter = 0) {
  const s = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const j = jitter ? Math.sin(i * 2.7) * jitter : 0;
    s.push({ x: CX + Math.cos(a) * (RX + j), y: CY + Math.sin(a) * (RY + j) });
  }
  return s;
}

function hexOval() {
  const pts = [];
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: CX + Math.cos(a) * RX, y: CY + Math.sin(a) * RY });
  }
  return densify(pts, 4);
}

function screenshotSamekh() {
  const loop = [];
  const corners = [
    [CX + 4, CY - RY],
    [CX + RX, CY - RY * 0.35],
    [CX + RX * 0.85, CY + RY * 0.55],
    [CX - 2, CY + RY],
    [CX - RX, CY + RY * 0.2],
    [CX - RX * 0.7, CY - RY * 0.45],
    [CX + 4, CY - RY],
  ];
  for (let i = 1; i < corners.length; i++) {
    const a = corners[i - 1], b = corners[i];
    for (let k = 0; k <= 10; k++) {
      const t = k / 10;
      loop.push({ x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t });
    }
  }
  const hook = [];
  for (let k = 0; k <= 8; k++) {
    const t = k / 8;
    hook.push({ x: CX + 4 + t * 10, y: CY - RY + t * 8 });
  }
  return [loop, hook];
}

function spiral(turns = 1.25) {
  const s = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = -Math.PI / 2 + t * Math.PI * 2 * turns;
    const r = 0.55 + t * 0.45;
    s.push({ x: CX + Math.cos(a) * RX * r, y: CY + Math.sin(a) * RY * r });
  }
  return [s];
}

function inwardHook() {
  const hook = [];
  for (let k = 0; k <= 10; k++) {
    const t = k / 10;
    hook.push({ x: CX + 6 - t * 14, y: CY - RY * 0.2 + t * (RY * 0.5) });
  }
  return [hook.concat(hexOval().slice(1))];
}

function threeArcs() {
  const a1 = [];
  const a2 = [];
  const a3 = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const a = -Math.PI / 2 + t * ((Math.PI * 2) / 3);
    a1.push({ x: CX + Math.cos(a) * RX, y: CY + Math.sin(a) * RY });
  }
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const a = -Math.PI / 2 + (Math.PI * 2) / 3 + t * ((Math.PI * 2) / 3);
    a2.push({ x: CX + Math.cos(a) * RX, y: CY + Math.sin(a) * RY });
  }
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const a = -Math.PI / 2 + (2 * Math.PI * 2) / 3 + t * ((Math.PI * 2) / 3);
    a3.push({ x: CX + Math.cos(a) * RX * 0.95, y: CY + Math.sin(a) * RY * 0.95 });
  }
  return [a1, a2, a3];
}

function smallBox() {
  const L = CX - 18, R = CX + 20, T = CY - 16, B = CY + 18;
  const s = [];
  const pts = [[L, T], [R, T], [R, B], [L, B], [L, T]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      s.push({ x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t });
    }
  }
  return [s];
}

function gapOval() {
  const s = [];
  for (let i = 2; i <= 34; i++) {
    const a = (i / 36) * Math.PI * 2 - Math.PI / 2;
    s.push({ x: CX + Math.cos(a) * RX, y: CY + Math.sin(a) * RY });
  }
  return [s];
}

function modelInk(letter, mi = 0) {
  const model = strokeModels(letter)[mi];
  const region = staveRegion(letter);
  const bandH = H * (region.bottom - region.top);
  const ox = (640 - bandH) / 2;
  const oy = H * region.top;
  return model.paths.map((path) =>
    densify(path.map((p) => ({ x: ox + (p.x / 100) * bandH, y: oy + (p.y / 100) * bandH }))),
  );
}

function dump(name, ink, L) {
  const r = verifyLetterInk(ink, L, { height: H });
  const e = enrollLetterInk(ink, L, { height: H });
  const rank = rankStrokeModels(ink).slice(0, 5).map((x) => `${x.id}:${x.score.toFixed(2)}`).join(" ");
  console.log(name, "=>", r.match, r.read || "∅", r.score.toFixed(2), "enroll", e.ok, "|", rank);
}

for (const [name, ink, L] of [
  ["clean oval", [oval()], "ס"],
  ["screenshot loop+hook", screenshotSamekh(), "ס"],
  ["spiral 1.25", spiral(1.25), "ס"],
  ["spiral 1.6", spiral(1.6), "ס"],
  ["inward hook", inwardHook(), "ס"],
  ["three arcs", threeArcs(), "ס"],
  ["small box", smallBox(), "ס"],
  ["gap oval", gapOval(), "ס"],
  ["chart tet as samekh", modelInk("ט", 0), "ס"],
  ["chart tet as tet", modelInk("ט", 0), "ט"],
  ["inward hook as tet", inwardHook(), "ט"],
  ["spiral as tet", spiral(1.25), "ט"],
]) dump(name, ink, L);
