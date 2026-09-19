import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AttemptBanner } from "@/components/attempt-banner";
import { DontKnowButton } from "@/components/dont-know-button";
import { VocabArt } from "@/components/vocab-art";
import { cn } from "@/lib/cn";
import { glossMatches, liveGloss, POS_LABEL } from "@/lib/vocab";
import {
  consonantsOf,
  etchHint,
  etchLabel,
  GUESS_MS,
  tokenFitsLemma,
  verseTapTokens,
  type EtchTask,
} from "@/lib/etch";
import { playFeedback } from "@/lib/try-again";
import { speakHebrewWord, stopSpeech, unlockSpeech } from "@/lib/listen";
import { shuffleList } from "@/lib/quiz-draw";

type Grade = "good" | "again" | "reveal";

export function EtchPlay({
  task,
  index,
  total,
  onGrade,
}: {
  task: EtchTask;
  index: number;
  total: number;
  onGrade: (rating: Grade) => void;
}) {
  const item = task.item;
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [guessFast, setGuessFast] = useState(false);
  const [choices, setChoices] = useState(task.choices);
  const shownAt = useRef(Date.now());
  const voice = useRef({ stop: false });

  useEffect(() => {
    setTyped("");
    setPicked(null);
    setTries(0);
    setGuessFast(false);
    setChoices(task.choices.length ? shuffleList(task.choices) : []);
    shownAt.current = Date.now();
    voice.current.stop = true;
    voice.current = { stop: false };
    stopSpeech();
    if (task.kind === "meet" || task.cue === "audio") {
      unlockSpeech();
      void speakHebrewWord(item, 0.85, voice.current);
    }
    return () => {
      voice.current.stop = true;
      stopSpeech();
    };
  }, [task.key, item, task.kind, task.cue, task.choices]);

  const live = liveGloss(item, typed);
  const typedOk = glossMatches(item, typed);
  const told = picked === "__noidea__";
  const graded = picked !== null;
  const ok = !told && (picked === item.id || (typedOk && (task.kind === "produce" || task.kind === "keep") && task.cue !== "en"));

  function finish(rating: Grade) {
    onGrade(rating);
  }

  function tooFast(): boolean {
    return Date.now() - shownAt.current < GUESS_MS;
  }

  function pickContrast(id: string) {
    if (picked) return;
    if (id === item.id && tooFast()) {
      setGuessFast(true);
      setChoices(shuffleList(task.choices));
      shownAt.current = Date.now();
      playFeedback("retry");
      return;
    }
    const ok = id === item.id;
    if (!ok && tries < 1) {
      setTries(1);
      playFeedback("retry");
      return;
    }
    setPicked(id);
    playFeedback(ok ? "strong" : "fail");
  }

  function pickVerse(token: string) {
    if (picked) return;
    const ok = tokenFitsLemma(token, item, task.verse?.hit);
    if (ok && tooFast()) {
      setGuessFast(true);
      playFeedback("retry");
      shownAt.current = Date.now();
      return;
    }
    if (!ok && tries < 1) {
      setTries(1);
      playFeedback("retry");
      return;
    }
    setPicked(ok ? item.id : token);
    playFeedback(ok ? "strong" : "fail");
  }

  function submitProduce() {
    if (picked) return;
    const ok = typedOk;
    if (!ok && tries < 1) {
      setTries(1);
      playFeedback("retry");
      return;
    }
    setPicked(ok ? item.id : "__miss__");
    playFeedback(ok ? "strong" : "fail");
  }

  const showArt = task.kind === "meet" || task.cue === "picture" || (graded && task.kind !== "verse");
  const hideHe = !graded && (task.cue === "en" || task.cue === "picture" || task.cue === "audio");
  const hideEn = !graded && task.kind !== "contrast" && task.kind !== "keep" && task.cue !== "en";

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        {etchLabel(task.kind)} · {index + 1} / {total}
      </p>
      <p className="mt-1 text-sm text-muted">{etchHint(task.kind, task.cue)}</p>
      {guessFast && !graded && (
        <p className="mt-2 text-center text-sm font-semibold text-danger">Too fast — name it, don’t tap the pattern.</p>
      )}
      {tries >= 1 && !graded && (
        <AttemptBanner className="mt-2" kind="retry" />
      )}

      <div className="mt-3 rounded-[var(--radius-xl)] bg-card px-5 py-8 text-center shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {POS_LABEL[item.pos]} · Ch. {item.chapter}
        </p>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <div className="min-w-0">
            {task.kind === "contrast" ? (
              <p className="font-display text-3xl font-semibold text-ink">{item.gloss.split(/[,;]/)[0]}</p>
            ) : task.cue === "consonants" && !graded ? (
              <p className="he-word text-5xl tracking-[0.2em]">{consonantsOf(item)}</p>
            ) : task.cue === "audio" && !graded ? (
              <p className="font-display text-2xl text-muted">Listen</p>
            ) : task.cue === "picture" && !graded ? (
              <p className="font-display text-xl text-muted">Name what you see</p>
            ) : task.cue === "en" && !graded ? (
              <p className="font-display text-3xl font-semibold">{item.gloss.split(/[,;]/)[0]}</p>
            ) : (
              <>
                {!hideHe && <p className="he-word text-5xl sm:text-6xl">{item.hebrew}</p>}
                {graded || !hideEn ? (
                  <p className="mt-3 font-display text-2xl font-semibold">{item.gloss}</p>
                ) : null}
              </>
            )}
            {graded && task.kind === "contrast" && (
              <p className="he-word mt-3 text-5xl">{item.hebrew}</p>
            )}
          </div>
          {showArt ? <VocabArt id={item.id} /> : null}
        </div>
        {(task.kind === "meet" || task.cue === "audio") && (
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              voice.current.stop = true;
              voice.current = { stop: false };
              unlockSpeech();
              void speakHebrewWord(item, 0.85, voice.current);
            }}
          >
            Play again
          </Button>
        )}
      </div>

      {task.kind === "meet" && (
        <Button className="mt-4 w-full" size="lg" onClick={() => finish("good")}>
          Continue
        </Button>
      )}

      {task.kind === "contrast" && (
        <ul className="mt-4 grid grid-cols-2 gap-2" dir="rtl">
          {choices.map((c) => {
            const on = picked === c.id;
            const right = c.id === item.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={graded}
                  onClick={() => pickContrast(c.id)}
                  className={cn(
                    "min-h-16 w-full rounded-[var(--radius-md)] px-3 py-2 shadow-[var(--shadow-border)]",
                    !graded && "bg-card",
                    graded && right && "bg-good text-white",
                    graded && on && !right && "bg-bad text-white",
                    graded && !on && !right && "bg-card text-muted",
                  )}
                >
                  <span className="he-word text-3xl leading-none">{c.hebrew}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {task.kind === "produce" && task.cue === "en" && (
        <ul className="mt-4 grid grid-cols-2 gap-2" dir="rtl">
          {(choices.length ? choices : contrastChoicesSafe(task)).map((c) => {
            const on = picked === c.id;
            const right = c.id === item.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={graded}
                  onClick={() => pickContrast(c.id)}
                  className={cn(
                    "min-h-16 w-full rounded-[var(--radius-md)] px-3 py-2 shadow-[var(--shadow-border)]",
                    !graded && "bg-card",
                    graded && right && "bg-good text-white",
                    graded && on && !right && "bg-bad text-white",
                    graded && !on && !right && "bg-card text-muted",
                  )}
                >
                  <span className="he-word text-3xl leading-none">{c.hebrew}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {(task.kind === "produce" || task.kind === "keep") && task.cue !== "en" && (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitProduce();
          }}
        >
          <label className="sr-only" htmlFor="etch-gloss">
            English gloss
          </label>
          <input
            id="etch-gloss"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={graded}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            placeholder="Type the English"
            className={cn(
              "min-h-14 w-full rounded-[var(--radius-md)] border-2 bg-card px-3 text-center font-display text-xl shadow-[var(--shadow-border)]",
              !graded && live === "exact" && "border-good",
              !graded && live === "off" && typed && "border-bad",
              !graded && (live === "empty" || live === "prefix") && "border-transparent",
              graded && typedOk && "border-good",
              graded && !typedOk && "border-bad",
            )}
          />
          {!graded && (
            <Button type="submit" className="mt-3 w-full" disabled={!typed.trim()}>
              Check
            </Button>
          )}
        </form>
      )}

      {task.kind === "keep" && task.cue === "en" && (
        <ul className="mt-4 grid grid-cols-2 gap-2" dir="rtl">
          {(choices.length ? choices : contrastChoicesSafe(task)).map((c) => {
            const on = picked === c.id;
            const right = c.id === item.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={graded}
                  onClick={() => pickContrast(c.id)}
                  className={cn(
                    "min-h-16 w-full rounded-[var(--radius-md)] px-3 py-2 shadow-[var(--shadow-border)]",
                    !graded && "bg-card",
                    graded && right && "bg-good text-white",
                    graded && on && !right && "bg-bad text-white",
                    graded && !on && !right && "bg-card text-muted",
                  )}
                >
                  <span className="he-word text-3xl leading-none">{c.hebrew}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {task.kind === "verse" && task.verse && (
        <div className="mt-4 rounded-[var(--radius-lg)] bg-surface px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">In the Tanakh · {task.verse.ref}</p>
          <div className="mt-2 flex flex-wrap justify-end gap-2" dir="rtl" lang="he">
            {verseTapTokens(task.verse.he).map((tok, n) => {
              const hit = tokenFitsLemma(tok, item, task.verse?.hit);
              const on = picked === (hit ? item.id : tok);
              return (
                <button
                  key={`${tok}-${n}`}
                  type="button"
                  disabled={graded}
                  onClick={() => pickVerse(tok)}
                  className={cn(
                    "he-word rounded-[var(--radius-sm)] px-2 py-1 text-2xl shadow-[var(--shadow-border)]",
                    !graded && "bg-card",
                    graded && hit && "bg-good text-white",
                    graded && on && !hit && "bg-bad text-white",
                    graded && !on && !hit && "bg-card text-muted",
                  )}
                >
                  {tok}
                </button>
              );
            })}
          </div>
          {graded && <p className="mt-2 text-sm text-muted">{task.verse.en}</p>}
        </div>
      )}

      {graded && (
        <div className="mt-4">
          <AttemptBanner kind={ok ? "strong" : "fail"} />
          {task.kind !== "meet" && (
            <p className="mt-2 text-center">
              <span className="he-word text-3xl">{item.hebrew}</span>
              <span className="mt-1 block font-display text-lg">{item.gloss}</span>
            </p>
          )}
          <Button className="mt-3 w-full" onClick={() => finish(told ? "reveal" : ok ? "good" : "again")}>
            Next
          </Button>
        </div>
      )}

      {!graded && task.kind !== "meet" && (
        <DontKnowButton
          onClick={() => {
            setPicked("__noidea__");
            playFeedback("fail");
          }}
        />
      )}
    </>
  );
}

function contrastChoicesSafe(task: EtchTask) {
  if (task.choices.length) return task.choices;
  return [task.item];
}
