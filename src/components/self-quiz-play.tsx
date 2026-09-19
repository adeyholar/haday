import { useRef, useState } from "react";
import { AttemptBanner } from "@/components/attempt-banner";
import { DontKnowButton } from "@/components/dont-know-button";
import { VocabArt } from "@/components/vocab-art";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { playFeedback } from "@/lib/try-again";
import { glossMatches, liveGloss, type VocabItem } from "@/lib/vocab";

export type SelfMark = "strong" | "ok" | "weak";

export function SelfQuizPlay({
  items,
  onMark,
  onDone,
}: {
  items: VocabItem[];
  onMark?: (id: string, mark: SelfMark) => void;
  onDone?: (weak: VocabItem[]) => void;
}) {
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [tries, setTries] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [mark, setMark] = useState<SelfMark | null>(null);
  const [log, setLog] = useState<{ id: string; mark: SelfMark }[]>([]);
  const logRef = useRef<{ id: string; mark: SelfMark }[]>([]);

  const item = items[i];
  const done = i >= items.length;
  const live = item ? liveGloss(item, typed) : "empty";

  function resetItem() {
    setTyped("");
    setTries(0);
    setRevealed(false);
    setMark(null);
  }

  function finish(nextMark: SelfMark) {
    if (!item) return;
    onMark?.(item.id, nextMark);
    const nextLog = [...logRef.current, { id: item.id, mark: nextMark }];
    logRef.current = nextLog;
    setLog(nextLog);
    setMark(nextMark);
    setRevealed(true);
    if (nextMark === "weak") playFeedback("fail");
    else playFeedback("strong");
  }

  function check() {
    if (!item || revealed) return;
    if (glossMatches(item, typed)) {
      finish(tries === 0 ? "strong" : "ok");
      return;
    }
    if (tries < 1) {
      setTries(1);
      playFeedback("retry");
      return;
    }
    finish("weak");
  }

  function next() {
    const n = i + 1;
    if (n >= items.length) {
      const weak = items.filter((w) => logRef.current.some((r) => r.id === w.id && r.mark === "weak"));
      onDone?.(weak);
      setI(n);
      return;
    }
    setI(n);
    resetItem();
  }

  if (done) {
    const strong = log.filter((r) => r.mark === "strong").length;
    const weak = log.filter((r) => r.mark === "weak");
    return (
      <div className="rounded-[var(--radius-xl)] bg-card p-6 text-center shadow-[var(--shadow-border)]">
        <p className="font-display text-3xl font-bold text-ink">
          {strong} strong · {weak.length} weak
        </p>
        <p className="mt-2 text-sm text-muted">{items.length} words in this sitting</p>
        {weak.length ? (
          <p className="he-word mt-3 text-2xl" lang="he" dir="rtl">
            {weak.map((w) => items.find((it) => it.id === w.id)?.hebrew).filter(Boolean).join(" · ")}
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">None weak this round.</p>
        )}
      </div>
    );
  }

  if (!item) return null;

  return (
    <div>
      <p className="text-sm font-semibold text-ink">
        {i + 1} / {items.length}
      </p>
      <div className="mt-3 rounded-[var(--radius-xl)] bg-card px-5 py-8 text-center shadow-[var(--shadow-border)]">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <p className="he-word text-5xl sm:text-6xl" lang="he" dir="rtl">
            {item.hebrew}
          </p>
          <VocabArt id={item.id} />
        </div>
        {revealed ? <p className="mt-3 font-display text-xl font-semibold text-ink">{item.gloss}</p> : null}
      </div>

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (revealed) next();
          else check();
        }}
      >
        <label className="sr-only" htmlFor="self-quiz-en">
          English meaning
        </label>
        <input
          id="self-quiz-en"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={revealed}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          placeholder="English meaning"
          className={cn(
            "h-12 w-full rounded-[var(--radius-md)] bg-card px-4 text-center font-display text-xl shadow-[var(--shadow-border)]",
            !revealed && live === "exact" && "ring-2 ring-good",
            !revealed && live === "off" && typed && "ring-2 ring-danger",
          )}
        />
        {tries >= 1 && !revealed ? <AttemptBanner className="mt-3" kind="retry" /> : null}
        {revealed ? <AttemptBanner className="mt-3" kind={mark === "strong" ? "strong" : mark === "weak" ? "fail" : "strong"} /> : null}
        {!revealed ? (
          <DontKnowButton
            usedTry={tries >= 1}
            onNudge={() => {
              if (tries < 1) {
                setTries(1);
                playFeedback("retry");
              }
            }}
            onClick={() => finish("weak")}
          />
        ) : null}
        <Button className="mt-3 w-full" type="submit">
          {revealed ? "Next" : tries >= 1 ? "Check retry" : "Check"}
        </Button>
      </form>
    </div>
  );
}
