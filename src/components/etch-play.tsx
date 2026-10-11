import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AttemptBanner } from "@/components/attempt-banner";
import { DontKnowButton } from "@/components/dont-know-button";
import { GradeBanner } from "@/components/grade-banner";
import { VocabArt } from "@/components/vocab-art";
import { VerseCard } from "@/components/verse-card";
import { cn } from "@/lib/cn";
import { glossMatches, liveGloss, POS_LABEL } from "@/lib/vocab";
import { lettersOnly, liveMatchAny } from "@/lib/hebrew";
import { HebrewType } from "@/components/hebrew-type";
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

type Grade = "good" | "again" | "reveal" | "skip";

export function EtchPlay({
  task,
  index,
  total,
  label,
  onGrade,
}: {
  task: EtchTask;
  index: number;
  total: number;
  label?: string;
  onGrade: (rating: Grade) => void;
}) {
  const item = task.item;
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [listening, setListening] = useState(false);
  const [guessFast, setGuessFast] = useState(false);
  const [choices, setChoices] = useState(task.choices);
  const shownAt = useRef(Date.now());
  const voice = useRef({ stop: false });

  useEffect(() => {
    setTyped("");
    setPicked(null);
    setTries(0);
    setGuessFast(false);
    setRevealed(false);
    setListening(false);
    setChoices(task.choices.length ? shuffleList(task.choices) : []);
    shownAt.current = Date.now();
    voice.current.stop = true;
    voice.current = { stop: false };
    stopSpeech();
    if (task.kind === "study" || task.kind === "meet" || task.cue === "audio") {
      unlockSpeech();
      void speakHebrewWord(item, 0.85, voice.current);
    }
    return () => {
      voice.current.stop = true;
      stopSpeech();
    };
  }, [task.key, item, task.kind, task.cue, task.choices]);

  const spellOk = liveMatchAny(item.hebrew, typed, item.hebrewAlts, true) === "exact";
  const glossOk = glossMatches(item, typed);
  const typedOk = task.cue === "spell" ? spellOk : glossOk;
  const live = liveGloss(item, typed);
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

  function submitVerse() {
    if (picked || !task.verse) return;
    const hit =
      liveMatchAny(item.hebrew, typed, item.hebrewAlts, true) === "exact" || tokenFitsLemma(typed, item, task.verse.hit);
    if (!hit && tries < 1) {
      setTries(1);
      playFeedback("retry");
      return;
    }
    setPicked(hit ? item.id : "__miss__");
    playFeedback(hit ? "strong" : "fail");
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

  const study = task.kind === "study" || task.kind === "meet";
  const showArt = study || task.cue === "picture" || (graded && task.kind !== "verse");
  const hideHe = !graded && !study && (task.cue === "en" || task.cue === "picture" || task.cue === "audio" || task.cue === "spell");
  const hideEn = study ? !revealed : !graded && task.kind !== "contrast" && task.kind !== "keep" && task.cue !== "en" && task.cue !== "spell";

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        {label ?? `${etchLabel(task.kind)} · ${index + 1} / ${total}`}
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
            {task.kind === "contrast" && task.cue === "audio" ? (
              <p className="font-display text-2xl text-muted">Listen</p>
            ) : task.kind === "contrast" && task.cue !== "he" ? (
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
                {study && revealed ? (
                  <div className="mt-3 space-y-1 text-center">
                    <p className="font-display text-2xl font-semibold">{[item.gloss, ...item.alts].filter(Boolean).join(" · ")}</p>
                    <p className="text-sm text-muted">{item.translit}</p>
                    <p className="text-sm text-muted">
                      {POS_LABEL[item.pos]} · chapter {item.chapter}
                      {item.freq ? ` · ${item.freq} times in the Bible` : ""}
                    </p>
                    {item.hebrewAlts?.length ? (
                      <p className="he-word text-2xl text-ink">{item.hebrewAlts.join("  ")}</p>
                    ) : null}
                  </div>
                ) : graded || !hideEn ? (
                  <p className="mt-3 font-display text-2xl font-semibold">{item.gloss}</p>
                ) : study ? (
                  <p className="mt-3 text-sm text-muted">What does it mean?</p>
                ) : null}
              </>
            )}
            {graded && task.kind === "contrast" && (
              <p className="he-word mt-3 text-5xl">{item.hebrew}</p>
            )}
          </div>
          {showArt ? <VocabArt id={item.id} /> : null}
        </div>
        {(study || task.cue === "audio") && (
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

      {study && revealed && <VerseCard item={item} showEnglish />}
      {study && revealed && task.choices.length > 1 && (
        <p className="mt-3 text-center text-sm text-muted">
          Watch the look-alikes:{" "}
          {task.choices
            .filter((choice) => choice.id !== item.id)
            .map((choice) => choice.hebrew)
            .join("  ")}
        </p>
      )}

      {study && !revealed && (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            setRevealed(true);
          }}
        >
          <label className="sr-only" htmlFor="study-guess">
            Guess the English
          </label>
          <input
            id="study-guess"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            placeholder="Type a guess, or show the meaning"
            className={cn(
              "min-h-14 w-full rounded-[var(--radius-md)] border-2 bg-card px-3 text-center font-display text-xl shadow-[var(--shadow-border)]",
              live === "exact" && "border-good",
              live === "off" && typed && "border-bad",
              (live === "empty" || live === "prefix") && "border-transparent",
            )}
          />
          <Button className="mt-3 w-full" size="lg" type="submit">
            Show meaning
          </Button>
        </form>
      )}
      {study && revealed && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" onClick={() => finish("good")}>
            I knew it
          </Button>
          <Button type="button" variant="outline" onClick={() => finish("again")}>
            Not yet
          </Button>
        </div>
      )}

      {task.kind === "contrast" && task.cue === "he" && (
        <ul className="mt-4 grid grid-cols-1 gap-2">
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
                    "min-h-14 w-full rounded-[var(--radius-md)] px-3 py-2 text-left font-display text-lg shadow-[var(--shadow-border)]",
                    !graded && "bg-card",
                    graded && right && "bg-good text-white",
                    graded && on && !right && "bg-bad text-white",
                    graded && !on && !right && "bg-card text-muted",
                  )}
                >
                  {c.gloss.split(/[,;]/)[0]}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {task.kind === "contrast" && task.cue !== "he" && (
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

      {task.kind === "produce" && task.cue === "spell" && (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            submitProduce();
          }}
        >
          <HebrewType
            value={typed}
            onChange={setTyped}
            target={item.hebrew}
            alts={item.hebrewAlts}
            disabled={graded}
            strict
            liveGrade
          />
          {!graded && (
            <Button type="submit" className="mt-3 w-full" disabled={!typed.trim()}>
              Check
            </Button>
          )}
        </form>
      )}

      {(task.kind === "produce" || task.kind === "keep") && task.cue !== "en" && task.cue !== "spell" && (
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
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Fill the line · {task.verse.ref}</p>
          <p className="he-word mt-2 text-2xl leading-relaxed" dir="rtl" lang="he">
            {graded ? task.verse.he : blankVerse(task.verse.he, item, task.verse.hit)}
          </p>
          {!graded && (
            <>
              <ul className="mt-3 grid grid-cols-2 gap-2" dir="rtl">
                {choices.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => pickContrast(c.id)}
                      className="min-h-14 w-full rounded-[var(--radius-md)] bg-card px-2 py-2 shadow-[var(--shadow-border)]"
                    >
                      <span className="he-word text-2xl">{c.hebrew}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <form
                className="mt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitVerse();
                }}
              >
                <label className="sr-only" htmlFor="verse-type">
                  Type the missing Hebrew
                </label>
                <input
                  id="verse-type"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  disabled={graded}
                  dir="rtl"
                  lang="he"
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="off"
                  placeholder="או הקלד"
                  className="he-word min-h-14 w-full rounded-[var(--radius-md)] border-2 border-transparent bg-card px-3 text-center text-2xl shadow-[var(--shadow-border)]"
                />
                <Button type="submit" variant="outline" className="mt-2 w-full" disabled={!typed.trim()}>
                  Check the typed word
                </Button>
              </form>
            </>
          )}
          {graded && <p className="mt-2 text-sm text-muted">{task.verse.en}</p>}
          {graded && (
            <Button type="button" variant="outline" className="mt-3" onClick={() => speakLine(task.verse?.he || item.hebrew)}>
              Hear the line
            </Button>
          )}
        </div>
      )}

      {task.kind === "say" && !graded && (
        <div className="mt-4 grid gap-2">
          {speechCtor() ? (
            <Button
              type="button"
              disabled={listening}
              onClick={() => {
                setListening(true);
                listenForHebrew(item, (hit) => {
                  setListening(false);
                  if (hit) {
                    setPicked(item.id);
                    playFeedback("strong");
                    return;
                  }
                  if (tries < 1) {
                    setTries(1);
                    playFeedback("retry");
                    return;
                  }
                  setPicked("__miss__");
                  playFeedback("fail");
                });
              }}
            >
              {listening ? "Listening…" : tries ? "Try saying it again" : "Say the Hebrew"}
            </Button>
          ) : (
            <p className="text-center text-sm text-muted">This phone cannot listen.</p>
          )}
          <Button type="button" variant="outline" onClick={() => finish("skip")}>
            Skip
          </Button>
        </div>
      )}

      {graded && !study && (
        <div className="mt-4">
          <GradeBanner ok={ok} label={ok ? "Correct" : "Not quite"} />
          {task.kind !== "meet" && task.kind !== "study" && (
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

      {!graded && !study && task.kind !== "say" && (
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

function blankVerse(he: string, item: EtchTask["item"], hit?: string): string {
  return verseTapTokens(he)
    .map((tok) => (tokenFitsLemma(tok, item, hit) ? "____" : tok))
    .join(" ");
}

function speechCtor(): (new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
}) | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      abort: () => void;
    };
    webkitSpeechRecognition?: new () => {
      lang: string;
      interimResults: boolean;
      onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      abort: () => void;
    };
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function listenForHebrew(item: EtchTask["item"], done: (hit: boolean) => void) {
  const Ctor = speechCtor();
  if (!Ctor) {
    done(false);
    return;
  }
  const rec = new Ctor();
  rec.lang = "he-IL";
  rec.interimResults = false;
  rec.onresult = (ev) => {
    const transcript = ev.results?.[0]?.[0]?.transcript ?? "";
    const heard = lettersOnly(transcript);
    const target = lettersOnly(item.hebrew);
    done(Boolean(heard) && (heard === target || (item.hebrewAlts ?? []).some((alt) => lettersOnly(alt) === heard)));
  };
  rec.onerror = () => done(false);
  rec.onend = () => {};
  try {
    rec.start();
  } catch {
    done(false);
  }
}

function speakLine(he: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(he);
  utter.lang = "he-IL";
  window.speechSynthesis.speak(utter);
}
