import { useEffect, useRef, useState } from "react";
import { Heart, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import {
  BALLOON_MAX_LIVES,
  BALLOON_OCEAN_Y,
  BALLOON_START_LIVES,
  BALLOON_WAVE_COUNT,
  BALLOON_WAVES,
  balloonWave,
  gainLife,
  spawnCall,
  spokenLetterName,
  type BalloonSprite,
} from "@/lib/balloon-game";
import { speakLine } from "@/lib/listen";
import { playPop, playSplash, unlockSfx } from "@/lib/sfx";
import { useStudy } from "@/lib/store";

type Phase = "ready" | "playing" | "wave" | "over" | "win";

type World = {
  wave: number;
  lives: number;
  score: number;
  caught: number;
  combo: number;
  balloons: BalloonSprite[];
  frozen: boolean;
  lastTarget?: string;
  splashAt: number | null;
  popIds: string[];
};

function emptyWorld(wave = 1): World {
  return {
    wave,
    lives: BALLOON_START_LIVES,
    score: 0,
    caught: 0,
    combo: 0,
    balloons: [],
    frozen: false,
    splashAt: null,
    popIds: [],
  };
}

export function BalloonDrop() {
  const complete = useStudy((s) => s.completeBalloonRun);
  const best = useStudy((s) => s.game.balloons);
  const [phase, setPhase] = useState<Phase>("ready");
  const [tick, setTick] = useState(0);
  const [heard, setHeard] = useState("");
  const world = useRef<World>(emptyWorld());
  const voice = useRef({ stop: false });
  const saved = useRef(false);
  const last = useRef(0);

  const w = world.current;
  const wave = balloonWave(w.wave) ?? BALLOON_WAVES[0];

  function bump() {
    setTick((n) => n + 1);
  }

  function hush() {
    voice.current.stop = true;
    voice.current = { stop: false };
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
  }

  function callName(name: string) {
    hush();
    void speakLine(name, "en", 0.8, voice.current);
    setHeard(name);
  }

  function nextCall(avoidId?: string) {
    const current = balloonWave(world.current.wave) ?? BALLOON_WAVES[0];
    const next = spawnCall(current, w.combo, avoidId);
    w.balloons = next;
    w.frozen = true;
    w.splashAt = null;
    w.popIds = [];
    const target = next.find((b) => b.target);
    if (target) callName(spokenLetterName(target.letter));
    bump();
    window.setTimeout(() => {
      w.frozen = false;
    }, 420);
  }

  function persist(cleared: boolean) {
    if (saved.current) return;
    saved.current = true;
    complete({ wave: w.wave, score: w.score, cleared });
  }

  function dieOrContinue() {
    if (w.lives <= 0) {
      hush();
      persist(false);
      setPhase("over");
      bump();
      return;
    }
    nextCall(w.lastTarget);
  }

  function catchTarget(b: BalloonSprite) {
    playPop();
    w.score += 1;
    w.caught += 1;
    w.combo += 1;
    w.lastTarget = b.letter.id;
    w.popIds = [b.id];
    w.balloons = w.balloons.filter((x) => x.id !== b.id);
    bump();
    if (w.caught >= wave.catches) {
      hush();
      w.lives = gainLife(w.lives);
      if (w.wave >= BALLOON_WAVE_COUNT) {
        persist(true);
        setPhase("win");
      } else {
        setPhase("wave");
      }
      bump();
      return;
    }
    window.setTimeout(() => nextCall(b.letter.id), 180);
  }

  function missSplash() {
    if (w.frozen) return;
    w.frozen = true;
    playSplash();
    w.lives -= 1;
    w.combo = 0;
    w.splashAt = Date.now();
    const target = w.balloons.find((b) => b.target);
    w.lastTarget = target?.letter.id;
    w.balloons = [];
    bump();
    window.setTimeout(() => dieOrContinue(), 520);
  }

  function tapBalloon(b: BalloonSprite) {
    if (phase !== "playing" || w.frozen) return;
    if (b.target) {
      catchTarget(b);
      return;
    }
    playSplash();
    w.lives -= 1;
    w.combo = 0;
    w.balloons = w.balloons.filter((x) => x.id !== b.id);
    bump();
    if (w.lives <= 0) {
      hush();
      persist(false);
      setPhase("over");
    }
  }

  function startRun() {
    unlockSfx();
    hush();
    saved.current = false;
    world.current = emptyWorld(1);
    setHeard("");
    setPhase("playing");
    nextCall();
  }

  function startNextWave() {
    w.wave += 1;
    w.caught = 0;
    w.combo = 0;
    setPhase("playing");
    nextCall();
  }

  useEffect(() => {
    if (phase !== "playing") return;
    last.current = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const raw = (now - last.current) / 1000;
      last.current = now;
      const dt = Math.min(raw, 0.1);
      if (!w.frozen && document.visibilityState === "visible") {
        let splash = false;
        for (const b of w.balloons) {
          b.y += b.speed * dt;
          b.phase += dt * 1.6;
          if (b.target && b.y >= BALLOON_OCEAN_Y) splash = true;
        }
        w.balloons = w.balloons.filter((b) => b.target || b.y < BALLOON_OCEAN_Y + 8);
        bump();
        if (splash) {
          missSplash();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, w.wave]);

  useEffect(() => () => hush(), []);

  if (phase === "ready") {
    return (
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Ocean letters</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Catch the name</h1>
        <p className="mt-3 max-w-prose text-muted">
          Balloons drop toward the water. A voice calls a letter. Tap that Hebrew letter before it splashes. You start
          with three lives. Clear a wave — gain a life, up to six. Look-alikes show up later so you have to look twice.
        </p>
        {best.bestScore ? (
          <p className="mt-2 text-sm text-muted">
            Best {best.bestScore} catches · wave {best.bestWave}
            {best.cleared ? " · all five waves" : ""}
          </p>
        ) : null}
        <Button className="mt-4 w-full" size="lg" onClick={startRun}>
          Hear and catch
        </Button>
      </Panel>
    );
  }

  if (phase === "wave") {
    const next = balloonWave(w.wave + 1);
    return (
      <Panel className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Wave {w.wave} clear</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">+1 life</h1>
        <p className="mt-2 text-sm text-muted">
          {w.lives} lives · {w.score} catches. Next: {next?.title}. {next?.blurb}
        </p>
        <Button className="mt-4 w-full" size="lg" onClick={startNextWave}>
          Next wave
        </Button>
      </Panel>
    );
  }

  if (phase === "over" || phase === "win") {
    return (
      <Panel className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {phase === "win" ? "Five waves" : "Splashed"}
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">
          {phase === "win" ? "The letters held" : `${w.score} catches`}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Wave {w.wave} · {wave.title}. The voice said the name; the glyph had to match.
        </p>
        <Button className="mt-4 w-full" size="lg" onClick={startRun}>
          Play again
        </Button>
      </Panel>
    );
  }

  void tick;

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] bg-sky shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-ink">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Wave {w.wave} · {w.caught}/{wave.catches}
        </p>
        <div className="flex items-center gap-1" aria-label={`${w.lives} lives`}>
          {Array.from({ length: BALLOON_MAX_LIVES }, (_, i) => (
            <Heart
              key={i}
              className={cn("size-4", i < w.lives ? "fill-current text-danger" : "text-border")}
              strokeWidth={2}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 pb-2">
        <p className="text-sm font-semibold text-ink">{heard ? `“${heard}”` : "Listen…"}</p>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-md)] bg-card px-3 text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
          onClick={() => {
            const t = w.balloons.find((b) => b.target);
            if (t) callName(spokenLetterName(t.letter));
          }}
        >
          <Volume2 className="size-4" />
          Hear again
        </button>
      </div>
      <div
        className="ocean-play relative w-full touch-none select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        {w.balloons.map((b) => (
          <button
            key={b.id}
            type="button"
            aria-label={b.letter.name}
            className={cn("letter-balloon", `balloon-skin-${b.hue % 4}`)}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              transform: `translate(-50%, -50%) translateX(${Math.sin(b.phase) * b.sway}px)`,
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              tapBalloon(b);
            }}
          >
            <span className="he-word text-3xl" dir="rtl" lang="he">
              {b.letter.letter}
            </span>
          </button>
        ))}
        <div className="ocean-water" aria-hidden />
        {w.splashAt ? <div className="ocean-splash" /> : null}
      </div>
      <p className="px-3 py-2 text-center text-xs text-muted">
        {wave.title}
        {w.combo >= 4 ? " · streak: slower fall" : ""}
      </p>
    </div>
  );
}
