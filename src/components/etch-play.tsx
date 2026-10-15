import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AttemptBanner } from "@/components/attempt-banner";
import { DontKnowButton } from "@/components/dont-know-button";
import { GradeBanner } from "@/components/grade-banner";
import { VocabArt } from "@/components/vocab-art";
import { VerseCard } from "@/components/verse-card";
import { cn } from "@/lib/cn";
import { glossMatches, liveGloss, POS_LABEL, studySenseLine } from "@/lib/vocab";
import { lettersOnly, guideProgress, guideTarget, liveMatchAny, normalizeHebrewFull } from "@/lib/hebrew";
import { HebrewType } from "@/components/hebrew-type";
import { hearLetterName, hushHear } from "@/lib/letter-hear";
import { speakLine as speakCoach } from "@/lib/listen";
import { coachLine, guideKeys, pieceSay } from "@/lib/show-me";
import {
  consonantsOf,
  choiceLabel,
  drillCardChoices,
  etchHint,
  etchLabel,
  tapCarriesOver,
  tokenFitsLemma,
  verseTapTokens,
  type EtchTask,
} from "@/lib/etch";
import type { VocabItem } from "@/lib/vocab";
import { playFeedback } from "@/lib/try-again";
import { speakHebrewWord, stopSpeech, unlockSpeech } from "@/lib/listen";
import { shuffleList } from "@/lib/quiz-draw";

type Grade = "good" | "again" | "reveal" | "skip";

export function EtchPlay({
  task,
  pool,
  seed,
  index,
  total,
  label,
  showMeOnce = false,
  onGrade,
}: {
  task: EtchTask;
  pool: VocabItem[];
  seed: number;
  index: number;
  total: number;
  label?: string;
  showMeOnce?: boolean;
  onGrade: (rating: Grade) => void;
}) {
  const item = task.item;
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [listening, setListening] = useState(false);
  const [guessFast, setGuessFast] = useState(false);
  const [guideOn, setGuideOn] = useState(false);
  const [guideDepth, setGuideDepth] = useState(0);
  const [nod, setNod] = useState(false);
  const [shake, setShake] = useState<string | null>(null);
  const [helpedThis, setHelpedThis] = useState(false);
  const [choices, setChoices] = useState<VocabItem[]>([]);
  const board = useRef<VocabItem[]>([]);
  const boardKey = useRef("");
  const shownAt = useRef(Date.now());
  const voice = useRef({ stop: false });
  const listenGen = useRef(0);
  const ear = useRef<{ abort: () => void } | null>(null);
  const matchRef = useRef(0);
  if (boardKey.current !== task.key) {
    boardKey.current = task.key;
    const dealt = drillCardChoices(task, pool, seed);
    board.current = dealt;
    setChoices(dealt.length ? shuffleList(dealt) : []);
    setTyped("");
    setPicked(null);
    setTries(0);
    setRevealed(false);
    setListening(false);
    setGuessFast(false);
    setGuideOn(false);
    setGuideDepth(0);
    setNod(false);
    setShake(null);
    setHelpedThis(false);
    matchRef.current = 0;
    shownAt.current = Date.now();
    listenGen.current += 1;
  }

  useEffect(() => {
    voice.current.stop = true;
    voice.current = { stop: false };
    stopSpeech();
    try {
      ear.current?.abort();
    } catch {
      /* already stopped */
    }
    ear.current = null;
    if (task.kind === "study" || task.kind === "meet" || task.cue === "audio") {
      unlockSpeech();
      void speakHebrewWord(item, 0.85, voice.current);
    }
    return () => {
      voice.current.stop = true;
      stopSpeech();
      listenGen.current += 1;
      try {
        ear.current?.abort();
      } catch {
        /* already stopped */
      }
      ear.current = null;
    };
  }, [task.key, item, task.kind, task.cue]);

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
    return tapCarriesOver(shownAt.current, Date.now());
  }

  function carryOver(): boolean {
    if (!tooFast()) return false;
    setGuessFast(true);
    return true;
  }

  function pickContrast(id: string) {
    if (picked || carryOver()) return;
    const hit = id === item.id;
    if (!hit && tries < 1) {
      setTries(1);
      playFeedback("retry");
      return;
    }
    setPicked(id);
    playFeedback(hit ? "strong" : "fail");
  }

  function submitVerse() {
    if (picked || !task.verse || carryOver()) return;
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

  function submitStudy(event: { preventDefault: () => void }) {
    event.preventDefault();
    if (carryOver()) return;
    if (!typed.trim()) {
      setRevealed(true);
      return;
    }
    const hit = glossMatches(item, typed);
    setRevealed(true);
    setPicked(hit ? item.id : "__miss__");
    playFeedback(hit ? "strong" : "fail");
  }

  function submitProduce() {
    if (picked || carryOver()) return;
    const ok = typedOk;
    if (!ok && tries < 1) {
      setTries(1);
      playFeedback("retry");
      return;
    }
    setPicked(ok ? item.id : "__miss__");
    playFeedback(ok ? "strong" : "fail");
  }

  const spelling = task.kind === "produce" && task.cue === "spell";
  const hebrewChoice =
    (task.kind === "contrast" && task.cue !== "he") ||
    (task.kind === "keep" && task.cue === "en") ||
    (task.kind === "produce" && task.cue === "en");
  const verseCard = task.kind === "verse";
  const guidedKind = spelling || hebrewChoice || verseCard;
  const spellLemma = (verseCard && task.verse?.hit) || item.hebrew;
  const spellAlts =
    verseCard && task.verse?.hit && task.verse.hit !== item.hebrew
      ? [...(item.hebrewAlts ?? []), item.hebrew]
      : [...(item.hebrewAlts ?? [])];
  const hebrewOk = liveMatchAny(spellLemma, typed, spellAlts, true) === "exact";
  const built = Boolean(helpedThis && hebrewOk && !graded && guidedKind);
  const spellGuide = guidedKind ? guideTarget(typed, spellLemma, spellAlts) : "";
  const progress = spellGuide ? guideProgress(typed, spellGuide) : null;
  const stepMark = progress?.clean ? normalizeHebrewFull(typed).length : -1;

  useEffect(() => {
    if (!guideOn) return;
    if (stepMark > matchRef.current) {
      setNod(true);
      setGuideDepth(0);
      setShake(null);
    } else if (stepMark >= 0 && stepMark < matchRef.current) {
      setNod(false);
      setGuideDepth(0);
    }
    if (stepMark >= 0) matchRef.current = stepMark;
  }, [stepMark, guideOn]);

  function sayPiece(insert: string) {
    const piece = pieceSay(insert);
    voice.current = hushHear(voice.current);
    if (piece.sayId) void hearLetterName(piece.sayId, piece.name, voice.current);
    else void speakCoach(piece.say, "en", 0.85, voice.current);
  }

  function askShowMe() {
    if (graded || !guidedKind || hebrewOk || carryOver()) return;
    setHelpedThis(true);
    const now = guideProgress(typed, guideTarget(typed, spellLemma, spellAlts));
    if (!guideOn) {
      setGuideOn(true);
      setGuideDepth(0);
      return;
    }
    if (!now.clean || !now.next) return;
    if (guideDepth === 0) {
      setGuideDepth(1);
      sayPiece(now.next);
      return;
    }
    sayPiece(now.next);
  }

  function submitHebrew(event?: { preventDefault: () => void }) {
    event?.preventDefault();
    if (picked || carryOver() || built) return;
    if (hebrewOk) {
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
  }

  const coaching = guideOn && !built && !graded && guidedKind;
  const guide =
    coaching && progress
      ? {
          expected: progress.clean ? progress.next : null,
          glow: progress.clean ? guideKeys(progress.next, guideDepth) : [],
          shake,
          onMiss: (glyph: string) => setShake(glyph),
        }
      : null;

  const study = task.kind === "study" || task.kind === "meet";
  const showArt = study || task.cue === "picture" || (graded && task.kind !== "verse");
  const hideHe = !graded && !study && (task.cue === "en" || task.cue === "picture" || task.cue === "audio" || task.cue === "spell");
  const answerIsEnglish = task.kind === "contrast" && task.cue === "he";
  const hideEn = study
    ? !revealed
    : !graded && (answerIsEnglish || (task.kind !== "contrast" && task.kind !== "keep" && task.cue !== "en" && task.cue !== "spell"));

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        {label ?? `${etchLabel(task.kind)} · ${index + 1} / ${total}`}
      </p>
      <p className="mt-1 text-sm text-muted">{etchHint(task.kind, task.cue, showMeOnce)}</p>
      {guessFast && !graded && (
        <p className="mt-2 text-center text-sm font-semibold text-danger">Too fast — name it, don’t tap the pattern.</p>
      )}
      {tries >= 1 && !graded && (
        <AttemptBanner className="mt-2" kind="retry" />
      )}

      <div className="mt-3 rounded-[var(--radius-xl)] bg-card px-5 py-8 text-center shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {item.chapter > 0 ? `${POS_LABEL[item.pos]} · Ch. ${item.chapter}` : POS_LABEL[item.pos]}
        </p>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <div className="min-w-0">
            {task.kind === "contrast" && task.cue === "audio" ? (
              <p className="font-display text-2xl text-muted">Listen</p>
            ) : task.kind === "contrast" && task.cue !== "he" ? (
              <p className="font-display text-3xl font-semibold text-ink">{item.gloss.split(/[,;]/)[0]}</p>
            ) : task.cue === "consonants" && !graded ? (
              <div>
                <p className="he-word text-5xl tracking-[0.2em]">{consonantsOf(item)}</p>
                <p className="mt-2 text-sm text-muted">Vowel points are off on this card.</p>
              </div>
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
                    <p className="font-display text-2xl font-semibold">{studySenseLine(item)}</p>
                    <p className="text-sm text-muted">{item.translit}</p>
                    <p className="text-sm text-muted">
                      {POS_LABEL[item.pos]}
                      {item.chapter > 0 ? ` · chapter ${item.chapter}` : ""}
                      {item.freq ? ` · ${item.freq} times in the Bible` : ""}
                    </p>
                    {item.stems ? <p className="text-sm leading-relaxed text-muted">{item.stems}</p> : null}
                    {item.hebrewAlts?.length ? (
                      <p className="he-word text-2xl text-ink">{item.hebrewAlts.join("  ")}</p>
                    ) : null}
                  </div>
                ) : graded || !hideEn ? (
                  <div className="mt-3">
                    <p className="font-display text-2xl font-semibold">{item.gloss}</p>
                    {item.stems ? <p className="mt-2 text-sm leading-relaxed text-muted">{item.stems}</p> : null}
                  </div>
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
              stopSpeech();
              unlockSpeech();
              void speakHebrewWord(item, 0.85, voice.current);
            }}
          >
            Play again
          </Button>
        )}
      </div>

      {study && revealed && <VerseCard item={item} showEnglish />}
      {study && revealed && choices.length > 1 && (
        <p className="mt-3 text-center text-sm text-muted">
          Watch the look-alikes:{" "}
          {choices
            .filter((choice) => choice.id !== item.id)
            .map((choice) => choice.hebrew)
            .join("  ")}
        </p>
      )}

      {study && !revealed && (
        <form
          className="mt-4"
          onSubmit={submitStudy}
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
            {typed.trim() ? "Check" : "Show meaning"}
          </Button>
        </form>
      )}
      {study && revealed && !graded && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button type="button" onClick={() => finish("good")}>
            I knew it
          </Button>
          <Button type="button" variant="outline" onClick={() => finish("again")}>
            Not yet
          </Button>
        </div>
      )}
      {study && revealed && graded && (
        <div className="mt-4">
          <GradeBanner ok={picked === item.id} label={picked === item.id ? "Correct" : "Not quite"} />
          <Button className="mt-3 w-full" onClick={() => finish(picked === item.id ? "good" : "again")}>
            Next
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
                  {choiceLabel(c, choices)}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {task.kind === "contrast" && task.cue !== "he" && !guideOn && (
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

      {task.kind === "produce" && task.cue === "en" && !guideOn && (
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

      {spelling && (
        <form className="mt-4" onSubmit={submitHebrew}>
          <HebrewType
            value={typed}
            onChange={setTyped}
            target={spellLemma}
            alts={spellAlts}
            disabled={graded || built}
            strict
            liveGrade
            hideHint={guideOn}
            guide={guide}
          />
          {coaching && (
            <div className="mt-3 text-center">
              {nod && <p className="text-lg font-bold text-good">Yes.</p>}
              <p className="mt-1 text-sm font-medium text-ink">{coachLine(progress, guideDepth)}</p>
            </div>
          )}
          {!graded && !built && typed.trim() ? (
            <Button type="submit" className="mt-3 w-full">
              Check
            </Button>
          ) : null}
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
          {!graded && typed.trim() ? (
            <Button type="submit" className="mt-3 w-full">
              Check
            </Button>
          ) : null}
        </form>
      )}

      {task.kind === "keep" && task.cue === "en" && !guideOn && (
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
          {!graded && !guideOn && (
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
                {typed.trim() ? (
                  <Button type="submit" variant="outline" className="mt-2 w-full">
                    Check the typed word
                  </Button>
                ) : null}
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
                if (carryOver()) return;
                const gen = listenGen.current;
                setListening(true);
                ear.current = listenForHebrew(item, (hit) => {
                  if (gen !== listenGen.current) return;
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

      {guideOn && !spelling && (hebrewChoice || verseCard) && !graded && (
        <form className="mt-4" onSubmit={submitHebrew}>
          <HebrewType
            value={typed}
            onChange={setTyped}
            target={spellLemma}
            alts={spellAlts}
            disabled={built}
            strict
            liveGrade
            hideHint
            guide={guide}
          />
          {coaching && (
            <div className="mt-3 text-center">
              {nod && <p className="text-lg font-bold text-good">Yes.</p>}
              <p className="mt-1 text-sm font-medium text-ink">{coachLine(progress, guideDepth)}</p>
            </div>
          )}
          {!built && typed.trim() ? (
            <Button type="submit" className="mt-3 w-full">
              Check
            </Button>
          ) : null}
        </form>
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

      {built && (
        <div className="mt-3 text-center">
          <p className="text-lg font-bold text-good">You built it.</p>
          <p className="mt-1 text-sm font-medium text-ink">
            {task.back >= 1 ? "We'll bring it back next time." : "It comes back once, with no help."}
          </p>
          <Button className="mt-3 w-full" type="button" onClick={() => finish("again")}>
            Next
          </Button>
        </div>
      )}

      {!graded && !built && guidedKind && !hebrewOk && (
        <Button type="button" variant="outline" size="lg" className="mt-3 w-full text-lg font-bold" onClick={askShowMe}>
          Show me
        </Button>
      )}

      {!graded && !study && task.kind !== "say" && !guidedKind && (
        <DontKnowButton
          onClick={() => {
            if (carryOver()) return;
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

function listenForHebrew(item: EtchTask["item"], done: (hit: boolean) => void): { abort: () => void } | null {
  const Ctor = speechCtor();
  if (!Ctor) {
    done(false);
    return null;
  }
  const rec = new Ctor();
  let stopped = false;
  rec.lang = "he-IL";
  rec.interimResults = false;
  rec.onresult = (ev) => {
    if (stopped) return;
    const transcript = ev.results?.[0]?.[0]?.transcript ?? "";
    const heard = lettersOnly(transcript);
    const target = lettersOnly(item.hebrew);
    done(Boolean(heard) && (heard === target || (item.hebrewAlts ?? []).some((alt) => lettersOnly(alt) === heard)));
  };
  rec.onerror = () => {
    if (!stopped) done(false);
  };
  rec.onend = () => {};
  try {
    rec.start();
  } catch {
    done(false);
    return null;
  }
  return {
    abort() {
      stopped = true;
      try {
        rec.abort();
      } catch {
        /* already stopped */
      }
    },
  };
}

function speakLine(he: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(he);
  utter.lang = "he-IL";
  window.speechSynthesis.speak(utter);
}
