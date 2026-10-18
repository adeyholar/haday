import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/panel";
import { speakCard, speechSupported, stopSpeech, unlockSpeech, type ListenItem } from "@/lib/listen";
import { loadNeuralManifest } from "@/lib/neural-voice";

const POS_KEY = "haday-listen-term2-i";
const LOOP_KEY = "haday-listen-term2-loop";

type Loop = "chapter" | "all";

function loadIndex(len: number): number {
  try {
    const n = Number(localStorage.getItem(POS_KEY) || 0);
    if (Number.isInteger(n) && n >= 0 && n < len) return n;
  } catch {
    /* ignore */
  }
  return 0;
}

function loadLoop(): Loop {
  try {
    return localStorage.getItem(LOOP_KEY) === "all" ? "all" : "chapter";
  } catch {
    return "chapter";
  }
}

export function Term2Listen({ list }: { list: ListenItem[] }) {
  const [i, setI] = useState(() => loadIndex(list.length));
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState<Loop>(loadLoop);
  const [status, setStatus] = useState("");
  const stopRef = useRef({ stop: false });
  const gen = useRef(0);
  const item = list[i];
  const range = useMemo(() => {
    if (!item) return { start: 0, end: 0 };
    let start = i;
    let end = i;
    while (start > 0 && list[start - 1]?.chapter === item.chapter) start -= 1;
    while (end + 1 < list.length && list[end + 1]?.chapter === item.chapter) end += 1;
    return { start, end };
  }, [i, item, list]);

  useEffect(() => {
    void loadNeuralManifest();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(POS_KEY, String(i));
    } catch {
      /* ignore */
    }
  }, [i]);

  useEffect(() => {
    try {
      localStorage.setItem(LOOP_KEY, loop);
    } catch {
      /* ignore */
    }
  }, [loop]);

  useEffect(() => {
    return () => {
      stopRef.current.stop = true;
      stopSpeech();
    };
  }, []);

  function halt() {
    stopRef.current.stop = true;
    gen.current += 1;
    stopSpeech();
    setPlaying(false);
    setStatus("");
  }

  function step(dir: -1 | 1) {
    halt();
    setI((n) => {
      if (loop === "chapter") {
        const span = range.end - range.start + 1;
        if (!span) return n;
        const pos = n - range.start;
        return range.start + ((pos + dir + span) % span);
      }
      if (!list.length) return 0;
      return (n + dir + list.length) % list.length;
    });
  }

  async function startAt(start: number) {
    if (!speechSupported()) {
      setStatus("This browser cannot speak. Use Safari on iPhone, or Chrome on Android, and unmute.");
      return;
    }
    stopRef.current.stop = false;
    const mine = ++gen.current;
    setPlaying(true);
    setStatus("Speaking…");
    unlockSpeech();
    let n = start;
    while (!stopRef.current.stop && gen.current === mine) {
      const card = list[n];
      if (!card) break;
      setI(n);
      await speakCard(card, 0.85, stopRef.current);
      if (stopRef.current.stop || gen.current !== mine) break;
      if (loop === "chapter") {
        let end = n;
        while (end + 1 < list.length && list[end + 1]?.chapter === card.chapter) end += 1;
        let startCh = n;
        while (startCh > 0 && list[startCh - 1]?.chapter === card.chapter) startCh -= 1;
        n = n < end ? n + 1 : startCh;
      } else {
        n = n + 1 < list.length ? n + 1 : 0;
      }
    }
    if (gen.current === mine) {
      setPlaying(false);
      setStatus("");
    }
  }

  if (!item) {
    return (
      <Panel>
        <p className="text-muted">No words in this list.</p>
      </Panel>
    );
  }

  const chapters = [...new Set(list.map((row) => row.chapter))];

  return (
    <>
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Chapter {item.chapter} · {i - range.start + 1} / {range.end - range.start + 1}
        </p>
        <p className="he-word mt-3 text-5xl" dir="rtl" lang="he">
          {item.hebrew}
        </p>
        <p className="mt-2 text-sm text-muted">{item.translit}</p>
        <p className="mt-3 text-lg text-ink">{item.gloss}</p>
        {status ? <p className="mt-2 text-sm text-muted">{status}</p> : null}
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button variant="outline" size="lg" onClick={() => step(-1)} aria-label="Previous word">
            <SkipBack className="size-5" />
          </Button>
          {playing ? (
            <Button size="lg" onClick={halt} aria-label="Pause">
              <Pause className="size-5" />
            </Button>
          ) : (
            <Button size="lg" onClick={() => void startAt(i)} aria-label="Play">
              <Play className="size-5" />
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={() => step(1)} aria-label="Next word">
            <SkipForward className="size-5" />
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant={loop === "chapter" ? "primary" : "outline"} onClick={() => setLoop("chapter")}>
            Loop chapter
          </Button>
          <Button variant={loop === "all" ? "primary" : "outline"} onClick={() => setLoop("all")}>
            Loop all
          </Button>
        </div>
      </Panel>
      <div className="mt-3 flex flex-wrap gap-2">
        {chapters.map((chapter) => (
          <button
            key={chapter}
            type="button"
            className={`min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold shadow-[var(--shadow-border)] ${
              chapter === item.chapter ? "bg-primary text-primary-foreground" : "bg-card text-ink"
            }`}
            onClick={() => {
              halt();
              const at = list.findIndex((row) => row.chapter === chapter);
              if (at >= 0) setI(at);
            }}
          >
            {chapter}
          </button>
        ))}
      </div>
    </>
  );
}
