import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { GlyphInk } from "@/components/glyph-ink";
import { alefAll, alefByKeys, alefLetters, alefVowels, shuffleAlef, type AlefItem } from "@/lib/alef";
import { useStudy } from "@/lib/store";

type Scope = "letters" | "vowels" | "both";

export function ClosedBook({ onPractice }: { onPractice: (tab: "write" | "drill") => void }) {
  const rate = useStudy((s) => s.rate);
  const setAlefQueue = useStudy((s) => s.setAlefQueue);
  const [scope, setScope] = useState<Scope | null>(null);
  const [i, setI] = useState(0);
  const [misses, setMisses] = useState<string[]>([]);
  const [hits, setHits] = useState(0);
  const deck = useMemo(() => {
    if (scope === "letters") return shuffleAlef(alefLetters());
    if (scope === "vowels") return shuffleAlef(alefVowels());
    if (scope === "both") return shuffleAlef(alefAll());
    return [];
  }, [scope]);

  const item = deck[i];
  const done = scope !== null && i >= deck.length;

  function start(next: Scope) {
    setScope(next);
    setI(0);
    setMisses([]);
    setHits(0);
  }

  function grade(ok: boolean, current: AlefItem) {
    rate(current.key, ok ? "easy" : "again");
    if (ok) setHits((n) => n + 1);
    else setMisses((keys) => [...keys, current.key]);
    setI((n) => n + 1);
  }

  if (!scope) {
    return (
      <div className="mt-5 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <h2 className="font-display text-2xl font-bold text-ink">Closed-book test</h2>
        <p className="mt-2 text-sm text-muted">
          No chart. You see the English name and write the letter or vowel from memory. Misses shape the next
          practice round.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button onClick={() => start("letters")}>Letters from memory</Button>
          <Button variant="outline" onClick={() => start("vowels")}>
            Vowels from memory
          </Button>
          <Button variant="outline" onClick={() => start("both")}>
            Letters + vowels
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    const missedItems = alefByKeys(misses);
    return (
      <div className="mt-5 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Closed book</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-ink">
          {hits} / {deck.length}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {missedItems.length
            ? "Practice will lead with these until they stick."
            : "Clean sheet. Next practice will mix new and review."}
        </p>
        {missedItems.length > 0 && (
          <ul className="mt-3 divide-y divide-border">
            {missedItems.map((m) => (
              <li key={m.key} className="flex items-center justify-between gap-3 py-2">
                <span className="he-word text-2xl">{m.glyph}</span>
                <span className="text-sm text-muted">
                  {m.name}
                  <span className="ms-2 text-xs uppercase tracking-wide">{m.kind}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-col gap-2">
          {missedItems.length > 0 && (
            <>
              <Button
                onClick={() => {
                  setAlefQueue(misses);
                  onPractice("write");
                }}
              >
                Practice misses on the pad
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAlefQueue(misses);
                  onPractice("drill");
                }}
              >
                Quiz the misses
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setScope(null)}>
            New test
          </Button>
        </div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="mt-5">
      <p className="text-sm tabular-nums text-muted">
        Closed book · {i + 1} / {deck.length} · {hits} correct
      </p>
      <div className="mt-3 rounded-[var(--radius-xl)] bg-card px-5 py-6 text-center shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          From memory · {item.kind === "vowel" ? "write on ב" : "write the letter"}
        </p>
        <p className="mt-2 font-display text-3xl font-bold text-ink">{item.name}</p>
        <p className="mt-1 text-sm text-muted">{item.sound}</p>
      </div>
      <GlyphInk
        key={item.key}
        expected={item.glyph}
        mode={item.kind}
        allowSample={false}
        onPass={(ok) => grade(ok, item)}
      />
    </div>
  );
}
