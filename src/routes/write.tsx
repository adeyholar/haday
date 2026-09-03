import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { InkPad, type InkPadHandle } from "@/components/ink-pad";
import { HebrewType } from "@/components/hebrew-type";
import { VerseCard } from "@/components/verse-card";
import { WeekSelect } from "@/components/week-select";
import { FocusToggle } from "@/components/focus-toggle";
import { Panel } from "@/components/panel";
import { WRITE_LETTERS } from "@/lib/alphabet";
import { dageshCoach, isSingleLetterLemma, lettersOnly, matchHandwriting, type HandMatch } from "@/lib/hebrew";
import { checkGlyphInk } from "@/lib/check-glyph";
import { writingHint } from "@/lib/letter-models";
import { saveHandSample } from "@/lib/hand-style";
import { strokeModelCount } from "@/lib/letter-strokes";
import { queueForFocus, useStudy } from "@/lib/store";
import { itemsForWeek, POS_LABEL, shuffle, type VocabItem } from "@/lib/vocab";
import { takeWriteCheck, writeChecksLeft, WRITE_DAILY_LIMIT } from "@/lib/write-cap";
import { cn } from "@/lib/cn";
import { GradeBanner } from "@/components/grade-banner";
import { playGrade } from "@/lib/sfx";

function studyLetterId(item: VocabItem): string | undefined {
  if (item.id.startsWith("ch1-")) return item.id.slice(4);
  return WRITE_LETTERS.find((l) => l.letter === item.hebrew)?.id;
}

type WriteMode = "write" | "memorize";
type InputMethod = "pad" | "type";

export const Route = createFileRoute("/write")({
  validateSearch: (s: Record<string, unknown>): { mode: WriteMode } => ({
    mode: s.mode === "memorize" ? "memorize" : "write",
  }),
  component: WritePage,
});

type Result = {
  match: HandMatch;
  read: string;
  note?: string;
};

function WritePage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate({ from: "/write" });
  const memorize = mode === "memorize";
  const week = useStudy((s) => s.week);
  const focus = useStudy((s) => s.focus);
  const rate = useStudy((s) => s.rate);
  const pool = useMemo(() => itemsForWeek(week), [week]);
  const [round, setRound] = useState<VocabItem[]>([]);
  const pad = useRef<InkPadHandle>(null);
  const [i, setI] = useState(0);
  const [empty, setEmpty] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [left, setLeft] = useState(WRITE_DAILY_LIMIT);
  const [ready, setReady] = useState(false);
  const [recallLeft, setRecallLeft] = useState(0);
  const [inputMethod, setInputMethod] = useState<InputMethod>("type");
  const [typed, setTyped] = useState("");
  const [tries, setTries] = useState(0);
  const [lastInk, setLastInk] = useState<{ x: number; y: number }[][] | null>(null);
  const [handNote, setHandNote] = useState<string | null>(null);
  const [handI, setHandI] = useState(0);
  const ratedRef = useRef(false);

  useEffect(() => {
    setRound(shuffle(queueForFocus(pool, useStudy.getState().cards, focus, 12)));
    setI(0);
    setResult(null);
    pad.current?.clear();
    setEmpty(true);
    setTyped("");
    setTries(0);
    ratedRef.current = false;
    setReady(true);
  }, [week, focus, pool]);

  useEffect(() => {
    setLeft(writeChecksLeft());
  }, []);

  const item = round[i];

  useEffect(() => {
    if (!item) return;
    pad.current?.clear();
    setEmpty(true);
    setTyped("");
    setResult(null);
    setTries(0);
    setLastInk(null);
    setHandNote(null);
    setHandI(0);
    ratedRef.current = false;
    if (!memorize) {
      setRecallLeft(0);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setRecallLeft(reduced ? 0 : 3);
  }, [item, memorize]);

  useEffect(() => {
    if (recallLeft <= 0) return;
    const t = window.setTimeout(() => setRecallLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [recallLeft]);

  function setStudyMode(next: WriteMode) {
    void navigate({ search: { mode: next } });
  }

  function commitRate(match: HandMatch, attempt = tries) {
    if (!item || ratedRef.current) return;
    ratedRef.current = true;
    if (match === "exact") rate(item.id, attempt <= 1 ? "easy" : "good");
    else if (match === "close") rate(item.id, "good");
    else rate(item.id, "again");
  }

  function nextCard() {
    if (result) commitRate(result.match);
    setResult(null);
    pad.current?.clear();
    setEmpty(true);
    setTyped("");
    setLastInk(null);
    setHandNote(null);
    setI((n) => n + 1);
  }

  function retryOnce() {
    setResult(null);
    pad.current?.clear();
    setEmpty(true);
    setTyped("");
    setLastInk(null);
    setHandNote(null);
  }

  function restartRound() {
    setRound(shuffle(queueForFocus(pool, useStudy.getState().cards, focus, 12)));
    setI(0);
    setResult(null);
    pad.current?.clear();
    setEmpty(true);
    setTyped("");
    setTries(0);
    ratedRef.current = false;
  }

  function applyCheck(match: HandMatch, read: string, note?: string) {
    const nextTries = tries + 1;
    setTries(nextTries);
    setResult({ match, read, note });
    playGrade(match === "exact" || match === "close");
    if (match === "exact" || match === "close" || nextTries >= 2) {
      commitRate(match, nextTries);
    }
  }

  async function checkPad() {
    if (!item || empty || busy) return;
    pad.current?.commit();
    const strokes = pad.current?.getStrokes() ?? [];
    const image = pad.current?.toImage();
    if (!strokes.length && !image) return;

    setLastInk(strokes);
    setHandNote(null);

    if (isSingleLetterLemma(item.hebrew)) {
      setBusy(true);
      try {
        const next = await checkGlyphInk(image || "data:image/png;base64,", item.hebrew, "letter", strokes, {
          height: pad.current?.getHeight() ?? 0,
        });
        if (next.counted === false || next.match === "empty") {
          setResult({
            match: "empty",
            read: "",
            note: next.note || "Draw the letter larger, between the two lines. This will not count as a miss.",
          });
          return;
        }
        applyCheck(next.match, next.match === "wrong" ? next.read : next.read || item.hebrew, next.note);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!takeWriteCheck()) {
      applyCheck("wrong", "", "Daily check limit reached. Come back tomorrow, or type the word instead.");
      setLeft(0);
      return;
    }
    setLeft(writeChecksLeft());
    setBusy(true);
    try {
      const { readHandwriting } = await import("@/lib/read-handwriting");
      const res = await readHandwriting({ data: { image: image || "", expected: item.hebrew } });
      if (!res.ok) {
        setInputMethod("type");
        setResult({
          match: "empty",
          read: "",
          note: "This site checks letters on the pad. For a full word, type the Hebrew — that will be graded.",
        });
        return;
      }
      const compared = matchHandwriting(item.hebrew, res.hebrew);
      let match = compared.match;
      if (match !== "exact" && res.verdict === "exact" && compared.distance <= 2) match = "exact";
      else if (match === "wrong" && res.verdict === "close") match = "close";
      else if (match === "empty" && res.verdict === "exact") match = "close";
      applyCheck(match, res.hebrew);
    } catch {
      setInputMethod("type");
      setResult({
        match: "empty",
        read: "",
        note: "Could not read that word from ink. Type the Hebrew instead — it will be graded.",
      });
    } finally {
      setBusy(false);
    }
  }

  function checkType() {
    if (!item || !typed.trim() || busy) return;
    const compared = matchHandwriting(item.hebrew, typed);
    applyCheck(compared.match, typed);
  }

  if (!pool.length) {
    return (
      <>
        <WeekSelect />
        <p className="mt-6 text-muted">No words in this set.</p>
      </>
    );
  }

  if (!ready) {
    return (
      <>
        <WeekSelect />
        <p className="mt-8 text-sm text-muted">Preparing a writing round…</p>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <WeekSelect />
        <div className="mt-8 rounded-[var(--radius-xl)] bg-card p-8 text-center shadow-[var(--shadow-border)]">
          <h1 className="font-display text-3xl font-semibold">Pad complete</h1>
          <p className="mt-2 text-muted">You worked this writing round. Start another, or drill the weak list.</p>
          <Button className="mt-6" onClick={restartRound}>
            New round
          </Button>
        </div>
      </>
    );
  }

  const recalling = memorize && recallLeft > 0 && !result;
  const locked =
    !!result && result.match !== "empty" && (result.match === "exact" || result.match === "close" || tries >= 2);
  const canRetry = !!result && result.match !== "empty" && !locked && tries < 2;
  const letterPad = item ? isSingleLetterLemma(item.hebrew) : false;

  return (
    <>
      <Panel className="mb-4">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
          {memorize ? "Memorize + Write" : "Write it"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {memorize
            ? "Look at the Hebrew while the count runs. Then type or write it from the English. One retry if you miss."
            : letterPad
              ? "Letters are taught under Alef. Follow the moving stroke here, then practice the same letter under Alef → Write."
              : "English first. Type or scribble the Hebrew. Live check while you type. One retry on a miss."}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setStudyMode("write")}
            className={cn(
              "min-h-11 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium shadow-[var(--shadow-border)]",
              !memorize ? "bg-ink text-parchment" : "bg-parchment text-ink",
            )}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setStudyMode("memorize")}
            className={cn(
              "min-h-11 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium shadow-[var(--shadow-border)]",
              memorize ? "bg-ink text-parchment" : "bg-parchment text-ink",
            )}
          >
            Memorize + Write
          </button>
        </div>
        <div className="mt-4">
          <WeekSelect />
          <FocusToggle />
        </div>
        <p className="mt-3 text-sm font-medium tabular-nums text-ink">
          {i + 1} / {round.length} · {left} pad checks left today
        </p>
        {letterPad && (
          <p className="mt-3 text-sm text-ink">
            Learning path:{" "}
            <Link
              to="/alphabet"
              search={{ tab: "write", letter: studyLetterId(item) ?? "" }}
              className="font-semibold text-primary"
            >
              Alef → Trace {item.gloss}
            </Link>
            <span className="text-muted"> · then My hand · then test here.</span>
          </p>
        )}
      </Panel>

      <div className="mt-3 rounded-[var(--radius-xl)] bg-card px-5 py-6 text-center shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {POS_LABEL[item.pos]} · Ch. {item.chapter}
        </p>
        {recalling ? (
          <>
            <p className="he-word mt-3 text-5xl sm:text-6xl">{item.hebrew}</p>
            <p className="mt-2 text-sm text-muted">{item.translit}</p>
            <p className="mt-4 font-sans text-4xl font-bold tabular-nums text-ink">{recallLeft}</p>
            <p className="mt-1 text-sm text-muted">Look, then write from English.</p>
            <Button className="mt-5" variant="outline" onClick={() => setRecallLeft(0)}>
              I have it — write now
            </Button>
          </>
        ) : (
          <>
            <p className="mt-2 font-display text-3xl font-bold text-ink">{item.gloss}</p>
            {memorize && !result && (
              <p className="mt-2 text-sm text-muted">Write the Hebrew for this gloss.</p>
            )}
          </>
        )}
      </div>

      {!recalling && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setInputMethod("type")}
              className={cn(
                "min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-medium shadow-[var(--shadow-border)]",
                inputMethod === "type" ? "bg-ink text-parchment" : "bg-card text-ink",
              )}
            >
              Type
            </button>
            <button
              type="button"
              onClick={() => setInputMethod("pad")}
              className={cn(
                "min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-medium shadow-[var(--shadow-border)]",
                inputMethod === "pad" ? "bg-ink text-parchment" : "bg-card text-ink",
              )}
            >
              Handwrite
            </button>
          </div>

          {inputMethod === "type" ? (
            <div className="mt-4 rounded-[var(--radius-xl)] bg-card p-4 shadow-[var(--shadow-border)]">
              <HebrewType value={typed} onChange={setTyped} target={item.hebrew} alts={item.hebrewAlts} disabled={locked} hideHint={Boolean(result)} />
              <Button className="mt-3 w-full" onClick={checkType} disabled={locked || !typed.trim()}>
                Check
              </Button>
            </div>
          ) : (
            <>
              <div className="relative mt-4">
                <InkPad
                  ref={pad}
                  disabled={busy || locked}
                  guides={letterPad}
                  model={letterPad ? item.hebrew : null}
                  showModel={letterPad}
                  modelIndex={handI}
                  animate={letterPad}
                  onChange={setEmpty}
                />
                {empty && !result && !letterPad && (
                  <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">
                    Write the Hebrew here
                  </p>
                )}
              </div>
              <div className="mt-3 flex gap-2 rounded-[var(--radius-xl)] bg-card p-2 shadow-[var(--shadow-border)]">
                <Button variant="outline" className="flex-1" onClick={() => pad.current?.undo()} disabled={busy || locked}>
                  Undo
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    pad.current?.clear();
                    setEmpty(true);
                  }}
                  disabled={busy || locked}
                >
                  Clear
                </Button>
                <Button className="flex-[2]" onClick={() => void checkPad()} disabled={busy || empty || locked}>
                  {busy ? "Checking…" : "Check writing"}
                </Button>
              </div>
              {letterPad && (
                <>
                  {strokeModelCount(item.hebrew) > 1 && (
                    <button
                      type="button"
                      onClick={() => setHandI((n) => n + 1)}
                      className="mt-2 min-h-11 w-full rounded-[var(--radius-md)] bg-card px-3 text-sm font-medium text-ink shadow-[var(--shadow-border)]"
                    >
                      Another hand · {(handI % strokeModelCount(item.hebrew)) + 1} of {strokeModelCount(item.hebrew)}
                    </button>
                  )}
                  <p className="mt-2 text-center text-xs text-muted">
                    {writingHint(item.hebrew)} Follow the moving stroke. Body between the two lines. Finals drop below
                    the bottom line.
                  </p>
                </>
              )}
            </>
          )}
        </>
      )}

      {result && result.match === "empty" && (
        <p className="mt-3 rounded-[var(--radius-md)] bg-card px-4 py-3 text-sm text-muted shadow-[var(--shadow-border)]">
          {result.note}
        </p>
      )}
      {result && result.match !== "empty" && (
        <ResultPanel
          item={item}
          result={result}
          canRetry={canRetry}
          hideAnswer={canRetry}
          ink={lastInk}
          handNote={handNote}
          onSaveHand={() => {
            if (!lastInk) return;
            const next = saveHandSample(item.hebrew, lastInk, { height: pad.current?.getHeight() ?? 0, replace: true });
            setHandNote(
              next.ok
                ? `Saved as your handwriting (${next.n} of 5). Later writing will use it.`
                : next.note || "That doesn’t match this letter.",
            );
          }}
          onNext={nextCard}
          onRetry={retryOnce}
        />
      )}
    </>
  );
}

function ResultPanel({
  item,
  result,
  canRetry,
  hideAnswer,
  ink,
  handNote,
  onSaveHand,
  onNext,
  onRetry,
}: {
  item: VocabItem;
  result: Result;
  canRetry: boolean;
  hideAnswer: boolean;
  ink: { x: number; y: number }[][] | null;
  handNote: string | null;
  onSaveHand: () => void;
  onNext: () => void;
  onRetry: () => void;
}) {
  const ok = result.match === "exact" || result.match === "close";
  const label =
    result.match === "exact" ? "Correct"
    : result.match === "close" ? "Close — count it"
    : result.match === "empty" ? "Draw again"
    : "Not correct";
  const coach = hideAnswer ? null : dageshCoach(item.hebrew);

  return (
    <div className="mt-4 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
      <GradeBanner ok={ok} label={label} />
      {canRetry && !ok && (
        <p className="mt-2 text-center text-sm font-medium text-danger">One retry left</p>
      )}
      {!hideAnswer && (
        <p className="mt-1 text-sm text-muted">
          Target <span className="he-word text-lg text-fg">{item.hebrew}</span>
          {result.read && lettersOnly(result.read) !== lettersOnly(item.hebrew) ? (
            <>
              {" "}
              · that looks like <span className="he-word text-lg text-fg">{result.read}</span>
            </>
          ) : null}
        </p>
      )}
      {!hideAnswer && result.match === "wrong" && isSingleLetterLemma(item.hebrew) && (
        <p className="mt-2 text-sm text-ink">{writingHint(item.hebrew)}</p>
      )}
      {result.note && <p className="mt-2 text-sm text-muted">{result.note}</p>}
      {!ok && isSingleLetterLemma(item.hebrew) && (
        <div className="mt-3">
          {ink && (
            <>
              <Button type="button" variant="outline" className="w-full" onClick={onSaveHand}>
                Save as my handwriting
              </Button>
              <p className="mt-1 text-xs text-muted">
                Keep this if it is your {item.hebrew}. A Latin look-alike will not save.
              </p>
              {handNote && <p className="mt-1 text-sm text-ink">{handNote}</p>}
            </>
          )}
          {studyLetterId(item) && (
            <Link
              to="/alphabet"
              search={{ tab: "write", letter: studyLetterId(item) ?? "" }}
              className="mt-3 flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-primary px-3 text-sm font-semibold text-primary-foreground"
            >
              Practice {item.gloss}: trace it under Alef
            </Link>
          )}
        </div>
      )}
      {coach && (
        <p className="mt-3 rounded-[var(--radius-md)] bg-surface px-3 py-2 text-sm text-ink">
          {coach}
        </p>
      )}
      {!hideAnswer && <VerseCard item={item} />}
      {canRetry ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1" onClick={onRetry}>
            Retry once
          </Button>
          <Button className="flex-1" variant="outline" onClick={onNext}>
            Continue
          </Button>
        </div>
      ) : (
        <Button className="mt-4 w-full" onClick={onNext}>
          Next word
        </Button>
      )}
    </div>
  );
}
