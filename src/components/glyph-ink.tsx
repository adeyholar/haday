import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { InkPad, type InkPadHandle } from "@/components/ink-pad";
import { GradeBanner } from "@/components/grade-banner";
import { checkGlyphInk } from "@/lib/check-glyph";
import { playGrade } from "@/lib/sfx";
import { writeChecksLeft } from "@/lib/write-cap";
import { type HandMatch } from "@/lib/hebrew";
import { cn } from "@/lib/cn";
import { writingHint } from "@/lib/letter-models";
import { sampleCount, saveHandSample } from "@/lib/hand-style";
import { strokeModelCount } from "@/lib/letter-strokes";

type Result = { match: HandMatch; read: string; note?: string; counted?: boolean };

type Props = {
  expected: string;
  mode: "letter" | "vowel";
  ghost?: string;
  trace?: boolean;
  allowSample?: boolean;
  showModel?: boolean;
  hint?: string;
  onPass: (ok: boolean) => void;
};

export function GlyphInk({ expected, mode, ghost, trace = false, allowSample = true, showModel, hint, onPass }: Props) {
  const pad = useRef<InkPadHandle>(null);
  const [empty, setEmpty] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [tries, setTries] = useState(0);
  const [left, setLeft] = useState(writeChecksLeft);
  const [sample, setSample] = useState(allowSample && trace);
  const [handNote, setHandNote] = useState<string | null>(null);
  const [handI, setHandI] = useState(0);
  const sampleGlyph = ghost || expected;
  const modelOn = showModel ?? (allowSample && sample);
  const hands = mode === "letter" ? strokeModelCount(sampleGlyph) : 0;
  const lineHint =
    hint ??
    (mode === "letter"
      ? modelOn
        ? "Follow the moving stroke. Body between the lines. A passing copy is kept as your hand."
        : "No model. Body between the two lines. Lamed above the top; finals below the bottom; qof a little below."
      : writingHint(expected));

  const locked = result
    ? result.match === "exact" || result.match === "close" || (tries >= 2 && result.counted !== false && result.match !== "empty")
    : false;
  const ok = result ? result.match === "exact" || result.match === "close" : false;

  function clear() {
    pad.current?.clear();
    setEmpty(true);
    setResult(null);
    setTries(0);
    setHandNote(null);
  }

  async function check() {
    if (empty || busy || result) return;
    pad.current?.commit();
    const image = pad.current?.toImage();
    const strokes = pad.current?.getStrokes() ?? [];
    if (!image && !strokes.length) return;
    setBusy(true);
    const next = await checkGlyphInk(image || "data:image/png;base64,", expected, mode, strokes, {
      trace,
      height: pad.current?.getHeight() ?? 0,
    });
    setLeft(writeChecksLeft());
    if (next.counted !== false) setTries((n) => n + 1);
    setResult(next);
    playGrade(next.match === "exact" || next.match === "close");
    setBusy(false);
  }

  function saveHand() {
    const strokes = pad.current?.getStrokes() ?? [];
    const next = saveHandSample(expected, strokes, { height: pad.current?.getHeight() ?? 0, replace: true });
    if (!next.ok) {
      setHandNote(next.note || "That doesn’t match this letter.");
      return;
    }
    setHandNote(`Saved as your ${expected} (${next.n} of 5). Later writing will use it.`);
  }

  function selfGrade(pass: boolean) {
    setResult({ match: pass ? "exact" : "wrong", read: expected, counted: true });
    setTries((n) => n + 1);
    playGrade(pass);
  }

  return (
    <div>
      <div className="relative mt-3 overflow-hidden rounded-[var(--radius-xl)] bg-card shadow-[var(--shadow-border)]">
        <InkPad
          ref={pad}
          disabled={locked || busy}
          guides={mode === "letter"}
          model={mode === "letter" ? sampleGlyph : null}
          showModel={mode === "letter" && modelOn}
          modelIndex={handI}
          animate={mode === "letter" && modelOn}
          onChange={setEmpty}
          className="relative z-10 h-56 shadow-none"
        />
      </div>
      {modelOn && mode === "letter" && hands > 1 && (
        <button
          type="button"
          onClick={() => setHandI((n) => n + 1)}
          className="mt-2 min-h-11 w-full rounded-[var(--radius-md)] bg-card px-3 text-sm font-medium text-ink shadow-[var(--shadow-border)]"
        >
          Another hand · {(handI % hands) + 1} of {hands}
        </button>
      )}
      {allowSample && showModel === undefined && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setSample((v) => !v)}
            className={cn(
              "min-h-11 flex-1 rounded-[var(--radius-md)] px-3 text-sm font-medium shadow-[var(--shadow-border)]",
              sample ? "bg-ink text-parchment" : "bg-card text-ink",
            )}
          >
            {sample ? "Expected on" : "Show expected"}
          </button>
        </div>
      )}
      <p className="mt-1 text-center text-xs text-muted">
        {lineHint} {left} checks left today
      </p>
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => pad.current?.undo()} disabled={locked || busy}>
          Undo
        </Button>
        <Button type="button" variant="outline" className="flex-1" onClick={clear} disabled={busy}>
          Clear
        </Button>
      </div>
      {result && result.match !== "empty" && (
        <div className="mt-3">
          <GradeBanner ok={ok} />
          <p className="mt-2 text-center text-sm text-muted">
            {result.note
              ? result.note
              : ok
                ? `Read as ${result.read || expected}`
                : `Not that ${mode}. Target: ${expected}${result.read && result.read !== expected ? ` · that looks like ${result.read}` : ""}`}
          </p>
          {result.match === "wrong" && mode === "letter" && (
            <div className="mt-3">
              <Button type="button" variant="outline" className="w-full" onClick={saveHand}>
                Save as my handwriting
              </Button>
              <p className="mt-1 text-center text-xs text-muted">
                Keep this if it is your {expected}. Chart look-alikes still will not save. {sampleCount(expected)} of 5
                stored.
              </p>
              {handNote && <p className="mt-1 text-center text-sm text-ink">{handNote}</p>}
            </div>
          )}
        </div>
      )}
      {result && result.match === "empty" && (
        <div className="mt-3">
          <p className="text-center text-sm text-muted">{result.note}</p>
          <div className="mt-3 flex gap-2">
            <Button className="flex-1" onClick={() => selfGrade(true)}>
              Count as correct
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => selfGrade(false)}>
              I missed it
            </Button>
          </div>
        </div>
      )}
      {!result && (
        <Button className="mt-3 w-full" onClick={() => void check()} disabled={empty || busy}>
          {busy ? "Checking…" : "Check writing"}
        </Button>
      )}
      {result && !locked && (
        <Button className="mt-3 w-full" variant="outline" onClick={clear}>
          Try again
        </Button>
      )}
      {locked && (
        <Button className="mt-3 w-full" onClick={() => onPass(ok)}>
          Next
        </Button>
      )}
    </div>
  );
}
