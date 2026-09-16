import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { LadderActionLink } from "@/components/ladder-action";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { hearLetterName, hushHear } from "@/lib/letter-hear";
import { PSALM_119_STANZAS } from "@/lib/psalm-119-acrostic";
import { loadNeuralManifest } from "@/lib/neural-voice";

export function PsalmAcrosticWalk({ lessonId }: { lessonId: string }) {
  const stanzas = PSALM_119_STANZAS;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState<"one" | "all" | null>(null);
  const voice = useRef({ stop: false });
  const stanza = stanzas[i];

  useEffect(() => {
    void loadNeuralManifest();
    return () => {
      voice.current = hushHear(voice.current);
    };
  }, []);

  function startVoice() {
    voice.current = hushHear(voice.current);
  }

  function hearOne(n = i) {
    const row = stanzas[n];
    if (!row) return;
    startVoice();
    setI(n);
    setPlaying("one");
    void hearLetterName(row.letterId, row.name, voice.current).finally(() => {
      if (!voice.current.stop) setPlaying(null);
    });
  }

  async function hearAll() {
    startVoice();
    setPlaying("all");
    const signal = voice.current;
    for (let n = 0; n < stanzas.length; n++) {
      if (signal.stop) break;
      const row = stanzas[n]!;
      setI(n);
      await hearLetterName(row.letterId, row.name, signal);
    }
    if (!signal.stop) setPlaying(null);
  }

  if (!stanza) return null;

  return (
    <div className="mt-4 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Psalm 119 · 22 stanzas</p>
      <p className="text-sm text-muted">
        Eight verses for each letter, א to ת. The Book lined them. Hear the letter, then open that stanza.
      </p>
      <div className="rounded-[var(--radius-md)] bg-surface px-4 py-5 text-center">
        <p className="he-word text-6xl" lang="he" dir="rtl">
          {stanza.letter}
        </p>
        <p className="mt-2 font-display text-2xl font-bold text-ink">{stanza.name}</p>
        <p className="text-sm text-muted">
          Verses {stanza.v1}–{stanza.v2} · {i + 1} of {stanzas.length}
        </p>
      </div>
      <p className="he-word text-center text-3xl" lang="he" dir="rtl">
        {stanza.head}
      </p>
      <p className="he-word text-center text-lg text-ink" lang="he" dir="rtl">
        {stanza.he}
      </p>
      <p className="text-center text-sm text-muted">{stanza.en}</p>
      <p className="text-ink">{stanza.note}</p>
      <ul dir="rtl" className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
        {stanzas.map((row, n) => (
          <li key={row.letterId}>
            <button
              type="button"
              onClick={() => hearOne(n)}
              className={cn(
                "flex size-11 w-full items-center justify-center rounded-[var(--radius-md)] he-word text-xl",
                n === i ? "bg-ink text-parchment" : "bg-card shadow-[var(--shadow-border)]",
              )}
            >
              {row.letter}
            </button>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button type="button" variant="outline" disabled={i === 0} onClick={() => hearOne(Math.max(0, i - 1))}>
          Previous
        </Button>
        <Button type="button" onClick={() => hearOne()} disabled={playing === "one"}>
          <Volume2 className="size-4" />
          Hear
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={i >= stanzas.length - 1}
          onClick={() => hearOne(Math.min(stanzas.length - 1, i + 1))}
        >
          Next
        </Button>
        <Button type="button" variant="outline" onClick={() => void hearAll()} disabled={playing === "all"}>
          Hear א to ת
        </Button>
      </div>
      <LadderActionLink
        action={{
          kind: "lab",
          label: `Open verses ${stanza.v1}–${stanza.v2}`,
          lab: { book: "Ps", ch: 119, v1: stanza.v1, v2: stanza.v2 },
        }}
        lessonId={lessonId}
      />
    </div>
  );
}
