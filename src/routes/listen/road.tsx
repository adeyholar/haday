import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListenMenu } from "@/components/listen-menu";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import {
  isAppleMobile,
  keepSpeechAlive,
  speakRoadCard,
  stopSpeech,
  unlockSpeech,
} from "@/lib/listen";
import { loadNeuralManifest } from "@/lib/neural-voice";
import { COURSE_WEEKS, itemsForWeek, studySetMeta } from "@/lib/vocab";
import { useStudy } from "@/lib/store";

const WEEK_KEY = "haday-road-week";

function courseWeek(n: number): number | null {
  return COURSE_WEEKS.some((w) => w.week === n) ? n : null;
}

function loadRoadWeek(fallback: number): number {
  try {
    const saved = courseWeek(Number(localStorage.getItem(WEEK_KEY)));
    if (saved) return saved;
  } catch {
    /* ignore */
  }
  return courseWeek(fallback) ?? 1;
}

function saveRoadWeek(week: number) {
  try {
    localStorage.setItem(WEEK_KEY, String(week));
  } catch {
    /* ignore */
  }
}

export const Route = createFileRoute("/listen/road")({
  validateSearch: (search: Record<string, unknown>): { week?: number } => {
    const n = Number(search.week);
    return courseWeek(n) ? { week: n } : {};
  },
  component: RoadListenPage,
});

function RoadListenPage() {
  const search = Route.useSearch();
  const studyWeek = useStudy((s) => s.week);
  const [week, setWeek] = useState(() => search.week ?? loadRoadWeek(studyWeek));
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const list = useMemo(() => itemsForWeek(week), [week]);
  const item = list[i] ?? list[0];
  const meta = studySetMeta(week);
  const stopRef = useRef({ stop: false });
  const playGen = useRef(0);
  const weekRef = useRef(week);
  const iRef = useRef(i);
  weekRef.current = week;
  iRef.current = i;

  useEffect(() => {
    void loadNeuralManifest();
  }, []);

  useEffect(() => {
    if (!search.week || search.week === weekRef.current) return;
    pickWeek(search.week, false);
  }, [search.week]);

  useEffect(() => {
    return () => {
      stopRef.current.stop = true;
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    const ms = isAppleMobile() ? 2_000 : 8_000;
    const id = window.setInterval(keepSpeechAlive, ms);
    const onVis = () => {
      if (document.visibilityState === "visible") keepSpeechAlive();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [playing]);

  useEffect(() => {
    if (!playing || !("mediaSession" in navigator) || !item) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: `${item.hebrew} · ${item.gloss}`,
      artist: "HaDay",
      album: `${meta.label} · ${meta.hint}`,
    });
    ms.playbackState = "playing";
    ms.setActionHandler("play", () => startFrom(iRef.current, true));
    ms.setActionHandler("pause", () => halt());
    ms.setActionHandler("previoustrack", () => step(-1));
    ms.setActionHandler("nexttrack", () => step(1));
    return () => {
      ms.setActionHandler("play", null);
      ms.setActionHandler("pause", null);
      ms.setActionHandler("previoustrack", null);
      ms.setActionHandler("nexttrack", null);
    };
  }, [playing, i, item, meta.label, meta.hint]);

  function halt() {
    stopRef.current.stop = true;
    playGen.current += 1;
    stopSpeech();
    setPlaying(false);
  }

  function startFrom(start: number, kick = false) {
    stopRef.current.stop = false;
    const gen = ++playGen.current;
    const words = itemsForWeek(weekRef.current);
    if (!words.length) return;
    setPlaying(true);
    if (kick) unlockSpeech();
    else stopSpeech();
    void navigator.wakeLock?.request("screen").catch(() => {});
    void (async () => {
      let at = Math.min(Math.max(0, start), words.length - 1);
      while (!stopRef.current.stop && gen === playGen.current) {
        const card = words[at];
        if (!card) break;
        setI(at);
        iRef.current = at;
        await speakRoadCard(card, stopRef.current);
        if (stopRef.current.stop || gen !== playGen.current) break;
        at = at + 1 < words.length ? at + 1 : 0;
      }
      if (gen === playGen.current) setPlaying(false);
    })();
  }

  function step(delta: number) {
    const words = itemsForWeek(weekRef.current);
    if (!words.length) return;
    const next = (iRef.current + delta + words.length) % words.length;
    setI(next);
    iRef.current = next;
    if (playing) startFrom(next, false);
  }

  function pickWeek(next: number, restart: boolean) {
    const safe = courseWeek(next) ?? 1;
    saveRoadWeek(safe);
    setWeek(safe);
    weekRef.current = safe;
    setI(0);
    iRef.current = 0;
    if (restart && playing) startFrom(0, false);
    else if (!playing) halt();
  }

  return (
    <>
      <Panel className="mb-4">
        <ListenMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">On the road</p>
        <p className="mt-3 text-muted">
          {meta.label} · {meta.hint} · {list.length} words. Hebrew, then the meaning, in the same voice as Drill. The
          week repeats until you pause. The lock screen can skip.
        </p>
      </Panel>

      <div className="rounded-[var(--radius-xl)] bg-card px-5 py-10 text-center shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {meta.label} · {list.length ? i + 1 : 0} of {list.length}
        </p>
        <p className="he-word mt-4 text-6xl">{item?.hebrew}</p>
        <p className="mt-3 font-display text-2xl font-semibold text-ink">{item?.gloss}</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button type="button" variant="outline" size="lg" className="min-h-16" onClick={() => step(-1)}>
          <SkipBack className="size-6" />
          <span className="sr-only">Previous</span>
        </Button>
        <Button type="button" size="lg" className="min-h-16" onClick={() => (playing ? halt() : startFrom(iRef.current, true))}>
          {playing ? <Pause className="size-7" /> : <Play className="size-7" />}
          <span className="ms-2">{playing ? "Pause" : "Play"}</span>
        </Button>
        <Button type="button" variant="outline" size="lg" className="min-h-16" onClick={() => step(1)}>
          <SkipForward className="size-6" />
          <span className="sr-only">Next</span>
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {COURSE_WEEKS.map((w) => (
          <button
            key={w.week}
            type="button"
            onClick={() => pickWeek(w.week, true)}
            className={cn(
              "min-h-11 rounded-[var(--radius-md)] text-sm font-semibold",
              week === w.week ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-[var(--shadow-border)]",
            )}
          >
            {w.week}
          </button>
        ))}
      </div>
    </>
  );
}
