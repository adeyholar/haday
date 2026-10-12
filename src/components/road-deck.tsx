import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import { isAppleMobile, keepSpeechAlive, speakRoadCard, stopSpeech, unlockSpeech, type ListenItem } from "@/lib/listen";
import { loadNeuralManifest } from "@/lib/neural-voice";
import {
  loadRoadMusic,
  loadRoadMusicLevel,
  pauseRoadMusic,
  playRoadMusic,
  saveRoadMusic,
  saveRoadMusicLevel,
  type RoadMusicId,
  ROAD_MUSIC,
} from "@/lib/road-music";

export type RoadSet = {
  id: string;
  label: string;
  title: string;
  hint: string;
  items: ListenItem[];
};

export function RoadDeck({
  menu,
  kicker,
  blurb,
  sets,
  setId,
  onSet,
}: {
  menu?: ReactNode;
  kicker: string;
  blurb: (set: RoadSet) => string;
  sets: RoadSet[];
  setId: string;
  onSet: (id: string) => void;
}) {
  const set = sets.find((item) => item.id === setId) ?? sets[0];
  const list = set?.items ?? [];
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [music, setMusic] = useState<RoadMusicId>("off");
  const [musicLevel, setMusicLevel] = useState(25);
  const item = list[i] ?? list[0];
  const stopRef = useRef({ stop: false });
  const playGen = useRef(0);
  const iRef = useRef(i);
  const listRef = useRef(list);
  const musicRef = useRef(music);
  const levelRef = useRef(musicLevel);
  const playingRef = useRef(playing);
  const stepRef = useRef<(delta: number) => void>(() => {});
  const setIdRef = useRef(set?.id ?? "");
  iRef.current = i;
  listRef.current = list;
  musicRef.current = music;
  levelRef.current = musicLevel;
  playingRef.current = playing;

  useEffect(() => {
    void loadNeuralManifest();
  }, []);

  useEffect(() => {
    setMusic(loadRoadMusic());
    setMusicLevel(loadRoadMusicLevel());
  }, []);

  useEffect(() => {
    const signal = stopRef.current;
    return () => {
      signal.stop = true;
      stopSpeech();
      pauseRoadMusic();
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
    if (!playing || !("mediaSession" in navigator) || !item || !set) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: `${item.hebrew} · ${item.gloss}`,
      artist: "HaDay",
      album: `${set.title} · ${set.hint}`,
    });
    ms.playbackState = "playing";
    ms.setActionHandler("play", () => startFrom(iRef.current, true));
    ms.setActionHandler("pause", () => halt());
    ms.setActionHandler("previoustrack", () => stepRef.current(-1));
    ms.setActionHandler("nexttrack", () => stepRef.current(1));
    return () => {
      ms.setActionHandler("play", null);
      ms.setActionHandler("pause", null);
      ms.setActionHandler("previoustrack", null);
      ms.setActionHandler("nexttrack", null);
    };
  }, [playing, i, item, set]);

  useEffect(() => {
    if (!set || set.id === setIdRef.current) return;
    setIdRef.current = set.id;
    setI(0);
    iRef.current = 0;
    if (playingRef.current) startFrom(0, false);
  }, [set]);

  function halt() {
    stopRef.current.stop = true;
    playGen.current += 1;
    stopSpeech();
    pauseRoadMusic();
    setPlaying(false);
  }

  function startFrom(start: number, kick = false) {
    stopRef.current.stop = false;
    const gen = ++playGen.current;
    const words = listRef.current;
    if (!words.length) return;
    setPlaying(true);
    if (kick) {
      unlockSpeech();
      playRoadMusic(musicRef.current, levelRef.current);
    } else stopSpeech();
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
        const live = listRef.current;
        at = at + 1 < live.length ? at + 1 : 0;
      }
      if (gen === playGen.current) {
        pauseRoadMusic();
        setPlaying(false);
      }
    })();
  }

  function step(delta: number) {
    const words = listRef.current;
    if (!words.length) return;
    const next = (iRef.current + delta + words.length) % words.length;
    setI(next);
    iRef.current = next;
    if (playingRef.current) startFrom(next, false);
  }
  stepRef.current = step;

  function chooseMusic(next: RoadMusicId) {
    setMusic(next);
    saveRoadMusic(next);
    if (playingRef.current) playRoadMusic(next, levelRef.current);
  }

  function chooseLevel(next: number) {
    const level = saveRoadMusicLevel(next);
    setMusicLevel(level);
  }

  if (!set) return null;

  return (
    <>
      <Panel className="mb-4">
        {menu}
        <p className={`${menu ? "mt-4" : ""} text-xs font-semibold uppercase tracking-[0.16em] text-primary`}>{kicker}</p>
        <p className="mt-3 text-muted">{blurb(set)}</p>
      </Panel>

      <div className="rounded-[var(--radius-xl)] bg-card px-5 py-10 text-center shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {set.title} · {list.length ? i + 1 : 0} of {list.length}
        </p>
        <p className="he-word mt-4 text-6xl">{item?.hebrew}</p>
        {item?.alsoHebrew ? <p className="he-word mt-2 text-3xl text-muted">{item.alsoHebrew}</p> : null}
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

      <div className="mt-4 rounded-[var(--radius-xl)] bg-card px-4 py-4 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Music</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {ROAD_MUSIC.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => chooseMusic(track.id)}
              className={cn(
                "min-h-11 rounded-[var(--radius-md)] text-sm font-semibold",
                music === track.id ? "bg-primary text-primary-foreground" : "bg-parchment text-ink",
              )}
            >
              {track.label}
            </button>
          ))}
        </div>
        {music === "off" ? (
          <p className="mt-3 text-sm text-muted">Quiet. Turn on Hatikvah or Solemn for a long drive.</p>
        ) : (
          <label className="mt-3 block text-sm text-muted">
            Volume {musicLevel}
            <input
              type="range"
              min={0}
              max={100}
              value={musicLevel}
              onChange={(event) => chooseLevel(Number(event.target.value))}
              className="mt-2 w-full accent-[var(--color-primary)]"
            />
          </label>
        )}
      </div>

      <div className={cn("mt-4 grid gap-1.5", sets.length > 6 ? "grid-cols-5" : "grid-cols-3")}>
        {sets.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            onClick={() => onSet(candidate.id)}
            className={cn(
              "min-h-11 rounded-[var(--radius-md)] text-sm font-semibold",
              set.id === candidate.id ? "bg-primary text-primary-foreground" : "bg-card text-ink shadow-[var(--shadow-border)]",
            )}
          >
            {candidate.label}
          </button>
        ))}
      </div>
    </>
  );
}
