import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { alefBetWalk, bereshitSteps } from "@/lib/alef-notice";
import { hearLetterName, hushHear } from "@/lib/letter-hear";
import { loadNeuralManifest } from "@/lib/neural-voice";
import { useStudy } from "@/lib/store";

export function AlefNoticeWalk({ lessonId }: { lessonId: string }) {
  const steps = bereshitSteps();
  const letters = alefBetWalk();
  const [wordI, setWordI] = useState(0);
  const [walkI, setWalkI] = useState(0);
  const [playing, setPlaying] = useState<"word" | "walk" | "all" | null>(null);
  const notice = useStudy((s) => s.noticeLadderWalk);
  const [wordSeen, setWordSeen] = useState(() => new Set<number>());
  const [walkSeen, setWalkSeen] = useState(() => new Set<number>());
  const voice = useRef({ stop: false });
  const word = steps[wordI];
  const walk = letters[walkI];

  useEffect(() => {
    void loadNeuralManifest();
    return () => {
      voice.current = hushHear(voice.current);
    };
  }, []);

  useEffect(() => {
    if (wordSeen.size >= steps.length && walkSeen.size >= letters.length) notice(lessonId);
  }, [wordSeen, walkSeen, steps.length, letters.length, lessonId, notice]);

  function markWord(i: number) {
    setWordI(i);
    setWordSeen((s) => new Set(s).add(i));
  }

  function markWalk(i: number) {
    setWalkI(i);
    setWalkSeen((s) => new Set(s).add(i));
  }

  function startVoice() {
    voice.current = hushHear(voice.current);
  }

  async function hearLetter(id: string, name: string) {
    await hearLetterName(id, name, voice.current);
  }

  function hearWordLetter(i = wordI) {
    const step = steps[i];
    if (!step) return;
    startVoice();
    markWord(i);
    setPlaying("word");
    void hearLetter(step.letterId, step.name).finally(() => {
      if (!voice.current.stop) setPlaying(null);
    });
  }

  function hearWalkLetter(i = walkI) {
    const letter = letters[i];
    if (!letter) return;
    startVoice();
    markWalk(i);
    setPlaying("walk");
    void hearLetter(letter.id, letter.name).finally(() => {
      if (!voice.current.stop) setPlaying(null);
    });
  }

  async function hearWalkAll() {
    startVoice();
    setPlaying("all");
    const signal = voice.current;
    for (let i = 0; i < letters.length; i++) {
      if (signal.stop) break;
      const letter = letters[i]!;
      setWalkI(i);
      setWalkSeen((s) => new Set(s).add(i));
      await hearLetter(letter.id, letter.name);
    }
    if (!signal.stop) setPlaying(null);
  }

  return (
    <div className="mt-4 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">The first word</p>
        <p className="mt-2 text-sm text-muted">
          Genesis 1:1. Six letters. Right to left. Tap a letter, then Hear. Together this word opens the Book.
        </p>
        <p className="he-word mt-3 text-center text-4xl sm:text-5xl" lang="he" dir="rtl">
          {steps.map((s, i) => (
            <button
              type="button"
              key={`${s.cons}-${i}`}
              className={cn(
                "rounded-sm bg-transparent px-0.5 py-1 shadow-none",
                i === wordI ? "he-spoken" : "text-ink",
              )}
              onClick={() => {
                hearWordLetter(i);
              }}
            >
              {s.glyph}
            </button>
          ))}
        </p>
        {word ? (
          <p className="mt-3 text-ink">
            <span className="he-word text-2xl" lang="he" dir="rtl">
              {word.glyph}
            </span>
            <span className="ms-2 font-semibold">
              {word.name} · {wordI + 1} of {steps.length}
            </span>
            <span className="mt-1 block text-sm text-muted">{word.note}</span>
          </p>
        ) : null}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={wordI === 0}
            onClick={() => {
              const n = Math.max(0, wordI - 1);
              hearWordLetter(n);
            }}
          >
            Previous
          </Button>
          <Button type="button" onClick={() => hearWordLetter()} disabled={playing === "word"}>
            <Volume2 className="size-4" />
            Hear
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={wordI >= steps.length - 1}
            onClick={() => {
              const n = Math.min(steps.length - 1, wordI + 1);
              hearWordLetter(n);
            }}
          >
            Next
          </Button>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Walk א to ת</p>
        <p className="mt-2 text-sm text-muted">Every letter, in order. Hear each name. No score.</p>
        {walk ? (
          <div className="mt-3 rounded-[var(--radius-md)] bg-surface px-4 py-5 text-center">
            <p className="he-word text-6xl" lang="he" dir="rtl">
              {walk.letter}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-ink">{walk.name}</p>
            <p className="text-sm text-muted">{walk.sound}</p>
          </div>
        ) : null}
        <ul dir="rtl" className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-8">
          {letters.map((letter, i) => (
            <li key={letter.id}>
              <button
                type="button"
                onClick={() => hearWalkLetter(i)}
                className={cn(
                  "flex size-11 w-full items-center justify-center rounded-[var(--radius-md)] he-word text-xl",
                  i === walkI ? "bg-ink text-parchment" : "bg-card shadow-[var(--shadow-border)]",
                )}
              >
                {letter.letter}
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button
            type="button"
            variant="outline"
            disabled={walkI === 0}
            onClick={() => {
              const n = Math.max(0, walkI - 1);
              hearWalkLetter(n);
            }}
          >
            Previous
          </Button>
          <Button type="button" onClick={() => hearWalkLetter()} disabled={playing === "walk"}>
            <Volume2 className="size-4" />
            Hear
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={walkI >= letters.length - 1}
            onClick={() => {
              const n = Math.min(letters.length - 1, walkI + 1);
              hearWalkLetter(n);
            }}
          >
            Next
          </Button>
          <Button type="button" variant="outline" onClick={() => void hearWalkAll()} disabled={playing === "all"}>
            Hear א to ת
          </Button>
        </div>
      </div>
    </div>
  );
}
