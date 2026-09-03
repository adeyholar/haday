import { createJiti } from "jiti";
const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { verifyLetterInk } = await jiti.import("/workspace/src/lib/letter-shape.ts");
const { strokeModels } = await jiti.import("/workspace/src/lib/letter-strokes.ts");
const { staveRegion } = await jiti.import("/workspace/src/lib/letter-models.ts");

const H = 208;
const W = 640;
const TOP = H * 0.24;
const BASE = H * 0.66;
const LETTERS = "אבגדהוזחטיכךלמםנןסעפףצץקרשת";

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
  if (path.length) out.push(path[path.length - 1]);
  return out;
}

function modelInk(letter, mi) {
  const model = strokeModels(letter)[mi];
  const region = staveRegion(letter);
  const bandH = H * (region.bottom - region.top);
  const side = bandH; // 0–100 box is square; letter aspect lives inside it
  const ox = (W - side) / 2;
  const oy = H * region.top;
  return model.paths.map((path) =>
    densify(path.map((p) => ({ x: ox + (p.x / 100) * side, y: oy + (p.y / 100) * side }))),
  );
}

function line(x1, y1, x2, y2, n = 24) {
  const s = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    s.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
  }
  return s;
}
function curve(pts, n = 12) {
  const s = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    for (let k = 0; k < n; k++) {
      const t = k / n;
      s.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  s.push(pts[pts.length - 1]);
  return s;
}
function oval(cx, cy, rx, ry, n = 36) {
  const s = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    s.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
  }
  return s;
}

const ok = (r) => r.match === "exact" || r.match === "close";
const failSelf = [];
const crossHits = []; // A's ink counted as B (false positive when grading as B? wait)
// Cross: take letter A's model, grade as letter B.
// False POSITIVE for B = B accepts A's ink
// False NEGATIVE for A = A rejects A's own ink (already in failSelf)

console.log("=== SELF (chart models on stave) ===");
for (const L of LETTERS) {
  const models = strokeModels(L);
  for (let i = 0; i < models.length; i++) {
    const r = verifyLetterInk(modelInk(L, i), L, { height: H });
    const mark = ok(r) ? "PASS" : "FAIL";
    if (!ok(r)) failSelf.push({ L, i, r });
    console.log(`${mark}  ${L} model ${i}  match=${r.match} read=${r.read || "∅"} score=${r.score.toFixed(2)}${r.note ? "  " + r.note : ""}`);
  }
}

console.log("\n=== CROSS: letter A's chart[0] graded as B (only surprises) ===");
console.log("  (show: B accepts A's ink = false positive for B, OR A ink fails as A already listed)");
for (const A of LETTERS) {
  const ink = modelInk(A, 0);
  for (const B of LETTERS) {
    if (A === B) continue;
    const r = verifyLetterInk(ink, B, { height: H });
    if (ok(r)) {
      crossHits.push({ A, B, r });
      console.log(`FP  ${B} accepted ${A}'s chart  match=${r.match} read=${r.read} score=${r.score.toFixed(2)}`);
    }
  }
}

// Latin / generic imposters
function latinT() { return [line(150, TOP + 10, 250, TOP + 10), line(200, TOP + 10, 200, BASE - 4)]; }
function latinP(below = 2) {
  const stemX = 175, r = 32;
  const stem = line(stemX, TOP + 6, stemX, BASE + below, 28);
  const bowl = [];
  for (let i = 0; i <= 22; i++) {
    const t = i / 22;
    const ang = -Math.PI / 2 + Math.PI * t;
    bowl.push({ x: stemX + Math.cos(ang) * r * 1.15 + r * 0.15, y: TOP + 6 + r + Math.sin(ang) * r });
  }
  bowl.push({ x: stemX, y: TOP + 6 + r * 2 });
  return [stem, bowl];
}
function latinX() {
  return [line(180, TOP + 8, 300, BASE - 4), line(300, TOP + 8, 180, BASE - 4)];
}
function latinC() {
  return [curve([{x:280,y:TOP+10},{x:180,y:TOP+18},{x:170,y:(TOP+BASE)/2},{x:180,y:BASE-10},{x:280,y:BASE-4}], 14)];
}
function latinO() {
  return [oval(240, (TOP+BASE)/2, 55, 38)];
}
function latinI() { return [line(240, TOP + 8, 240, BASE - 4)]; }
function latinU() {
  return [curve([{x:190,y:TOP+8},{x:195,y:BASE-8},{x:240,y:BASE},{x:285,y:BASE-8},{x:290,y:TOP+8}], 16)];
}
function latinW() {
  return [curve([{x:160,y:TOP+8},{x:190,y:BASE-4},{x:220,y:TOP+30},{x:250,y:BASE-4},{x:280,y:TOP+8}], 14)];
}
function latinY() {
  return [line(200, TOP+8, 240, (TOP+BASE)/2), line(280, TOP+8, 240, (TOP+BASE)/2), line(240, (TOP+BASE)/2, 240, BASE-4)];
}
function tinyTick() { return [line(220, TOP+8, 235, TOP+22)]; }
function longHang() { return [line(240, TOP+8, 240, BASE + 50)]; }

const imposters = {
  "Latin T": latinT(),
  "Latin P": latinP(2),
  "Latin P hanging": latinP(40),
  "Latin X": latinX(),
  "Latin C": latinC(),
  "Latin O": latinO(),
  "Latin I": latinI(),
  "Latin U": latinU(),
  "Latin W": latinW(),
  "Latin Y": latinY(),
  "tiny tick": tinyTick(),
  "long hang stem": longHang(),
};

console.log("\n=== LATIN / GENERIC IMPOSTERS (only if a letter ACCEPTS them) ===");
const impHits = [];
for (const [name, ink] of Object.entries(imposters)) {
  for (const L of LETTERS) {
    const r = verifyLetterInk(ink, L, { height: H });
    if (ok(r)) {
      impHits.push({ name, L, r });
      console.log(`FP  ${L} accepted ${name}  match=${r.match} read=${r.read} score=${r.score.toFixed(2)}`);
    }
  }
}

console.log("\n======== SUMMARY ========");
console.log("self-fails", failSelf.length);
console.log("cross FPs (B accepted A's chart)", crossHits.length);
console.log("imposter FPs", impHits.length);
if (failSelf.length) {
  console.log("\nSELF FAILS:");
  for (const x of failSelf) console.log(" ", x.L, "m"+x.i, x.r.match, "read="+x.r.read, "score="+x.r.score.toFixed(2), x.r.note||"");
}
