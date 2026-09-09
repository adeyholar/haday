import { useEffect, useRef, useState } from "react";
import { Heart, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import {
  BALLOON_MAX_LIVES,
  BALLOON_OCEAN_Y,
  BALLOON_START_LIVES,
  balloonWave,
  balloonWaves,
  bumpWeak,
  gainLife,
  spawnCall,
  spokenLetterName,
  type BalloonPack,
  type BalloonSprite,
} from "@/lib/balloon-game";
import { playNeuralVoice, speakLine, stopSpeech } from "@/lib/listen";
import { loadNeuralManifest } from "@/lib/neural-voice";
import { playPop, playSplash, unlockSfx } from "@/lib/sfx";
import { useStudy } from "@/lib/store";

type Phase = "ready" | "playing" | "wave" | "over" | "win";

type World = {
  pack: BalloonPack;
  wave: number;
  lives: number;
  score: number;
  caught: number;
  combo: number;
  balloons: BalloonSprite[];
  frozen: boolean;
  lastTarget?: string;
  splashAt: number | null;
  weak: Record<string, number>;
  intro: boolean;
  blind: boolean;
  duo: boolean;
};

function emptyWorld(opts: {
  pack: BalloonPack;
  blind: boolean;
  duo: boolean;
  weak: Record<string, number>;
}): World {
  return {
    pack: opts.pack,
    wave: 1,
    lives: BALLOON_START_LIVES,
    score: 0,
    caught: 0,
    combo: 0,
    balloons: [],
    frozen: false,
    splashAt: null,
    weak: { ...opts.weak },
    intro: true,
    blind: opts.blind || opts.duo,
    duo: opts.duo,
  };
}

export function BalloonDrop() {
  const complete = useStudy((s) => s.completeBalloonRun);
  const best = useStudy((s) => s.game.balloons);
  const [phase, setPhase] = useState<Phase>("ready");
  const [tick, setTick] = useState(0);
  const [heard, setHeard] = useState("");
  const [pack, setPack] = useState<BalloonPack>("letters");
  const [blind, setBlind] = useState(false);
  const [duo, setDuo] = useState(false);
  const world = useRef<World>(emptyWorld({ pack: "letters", blind: false, duo: false, weak: {} }));
  const voice = useRef({ stop: false });
  const saved = useRef(false);
  const last = useRef(0);

  const w = world.current;
  const waves = balloonWaves(w.pack);
  const wave = balloonWave(w.pack, w.wave) ?? waves[0];
  const hideName = w.blind || w.duo;

  function bump() {
    setTick((n) => n + 1);
  }

  function hush() {
    voice.current.stop = true;
    voice.current = { stop: false };
    stopSpeech();
  }

  function callName(id: string, name: string, slow = false) {
    hush();
    setHeard(name);
    void (async () => {
      const ok = await playNeuralVoice(id, "en", slow ? 0.7 : 0.85, voice.current);
      if (!ok && !voice.current.stop) await speakLine(name, "en", slow ? 0.62 : 0.8, voice.current);
    })();
  }

  function nextCall(avoidId?: string) {
    const w = world.current;
    const current = balloonWave(w.pack, w.wave) ?? balloonWaves(w.pack)[0];
    const intro = w.intro;
    const next = spawnCall({
      wave: current,
      combo: w.combo,
      avoidId,
      weak: w.weak,
      hint: intro,
    });
    w.balloons = next;
    w.frozen = true;
    w.splashAt = null;
    const target = next.find((b) => b.target);
    if (target) callName(target.item.id, spokenLetterName(target.item), intro);
    bump();
    window.setTimeout(
      () => {
        if (intro) {
          for (const b of w.balloons) b.hint = false;
          w.intro = false;
        }
        w.frozen = false;
        bump();
      },
      intro ? 1600 : 420,
    );
  }

  function persist(cleared: boolean) {
    const w = world.current;
    if (saved.current) return;
    saved.current = true;
    complete({
      wave: w.wave,
      score: w.score,
      cleared,
      pack: w.pack,
      weak: w.weak,
    });
  }

  function dieOrContinue() {
    const w = world.current;
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
    const w = world.current;
    playPop();
    w.score += 1;
    w.caught += 1;
    w.combo += 1;
    w.lastTarget = b.item.id;
    w.weak = bumpWeak(w.weak, b.item.id, -1);
    w.balloons = w.balloons.filter((x) => x.id !== b.id);
    bump();
    const need = (balloonWave(w.pack, w.wave) ?? wave).catches;
    if (w.caught >= need) {
      hush();
      w.lives = gainLife(w.lives);
      if (w.wave >= balloonWaves(w.pack).length) {
        persist(true);
        setPhase("win");
      } else {
        setPhase("wave");
      }
      bump();
      return;
    }
    window.setTimeout(() => nextCall(b.item.id), 180);
  }

  function missSplash() {
    const w = world.current;
    if (w.frozen) return;
    w.frozen = true;
    playSplash();
    w.lives -= 1;
    w.combo = 0;
    w.splashAt = Date.now();
    const target = w.balloons.find((b) => b.target);
    w.lastTarget = target?.item.id;
    if (target) w.weak = bumpWeak(w.weak, target.item.id, 2);
    w.balloons = [];
    bump();
    window.setTimeout(() => dieOrContinue(), 520);
  }

  function tapBalloon(b: BalloonSprite) {
    const w = world.current;
    if (phase !== "playing" || w.frozen) return;
    if (b.target) {
      catchTarget(b);
      return;
    }
    playSplash();
    w.lives -= 1;
    w.combo = 0;
    const target = w.balloons.find((x) => x.target);
    w.weak = bumpWeak(w.weak, b.item.id, 1);
    if (target) w.weak = bumpWeak(w.weak, target.item.id, 2);
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
    void loadNeuralManifest();
    hush();
    saved.current = false;
    world.current = emptyWorld({
      pack,
      blind: duo ? true : blind,
      duo,
      weak: best.weak ?? {},
    });
    setHeard("");
    setPhase("playing");
    nextCall();
  }

  function startNextWave() {
    const w = world.current;
    w.wave += 1;
    w.caught = 0;
    w.combo = 0;
    w.intro = true;
    setPhase("playing");
    nextCall();
  }

  useEffect(() => {
    if (phase !== "playing") return;
    last.current = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const w = world.current;
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
        if (splash) missSplash();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, w.wave]);

  useEffect(() => () => hush(), []);

  if (phase === "ready") {
    const letterBest = best.bestScore;
    const vowelBest = best.vowelBest;
    return (
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Ocean letters</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Catch the name</h1>
        <p className="mt-3 max-w-prose text-muted">
          Balloons drop toward the water. A voice calls the name. Tap that glyph before it splashes. Three lives; clear
          a wave and gain one, up to six. The first call of each wave is slow and highlighted — then the real drop.
        </p>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-ink">What to catch</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Choice on={pack === "letters"} onClick={() => setPack("letters")} label="Letters" hint="Alef to Tav" />
            <Choice on={pack === "vowels"} onClick={() => setPack("vowels")} label="Vowels" hint="Qamets vs Pathach" />
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-ink">Who plays</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Choice on={!duo} onClick={() => setDuo(false)} label="Solo" hint="You hear and tap" />
            <Choice on={duo} onClick={() => setDuo(true)} label="Two players" hint="One hears, one taps" />
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-ink">The name on screen</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Choice
              on={!blind && !duo}
              onClick={() => {
                setBlind(false);
                setDuo(false);
              }}
              label="Show it"
              hint="Help if the voice is quiet"
            />
            <Choice
              on={blind || duo}
              onClick={() => setBlind(true)}
              label="Listen only"
              hint={duo ? "Two-player hides the name" : "Blind round — ear only"}
            />
          </div>
        </fieldset>

        {(letterBest || vowelBest) ? (
          <p className="mt-3 text-sm text-muted">
            {letterBest ? `Letters best ${letterBest}${best.cleared ? " · five waves" : ""}` : null}
            {letterBest && vowelBest ? " · " : null}
            {vowelBest ? `Vowels best ${vowelBest}${best.vowelCleared ? " · five waves" : ""}` : null}
          </p>
        ) : null}

        <Button className="mt-4 w-full" size="lg" onClick={startRun}>
          Hear and catch
        </Button>
      </Panel>
    );
  }

  if (phase === "wave") {
    const next = balloonWave(w.pack, w.wave + 1);
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
          {phase === "win" ? (w.pack === "vowels" ? "The vowels held" : "The letters held") : `${w.score} catches`}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {w.pack === "vowels" ? "Vowels" : "Letters"} · wave {w.wave} · {wave.title}. Missed marks will come back next
          run.
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
          {w.pack === "vowels" ? "Vowels" : "Letters"} · wave {w.wave} · {w.caught}/{wave.catches}
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
        <p className="text-sm font-semibold text-ink">
          {w.duo ? "Caller hears · catcher taps" : hideName ? "Listen…" : heard ? `“${heard}”` : "Listen…"}
        </p>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-md)] bg-card px-3 text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
          onClick={() => {
            const t = w.balloons.find((b) => b.target);
            if (t) callName(t.item.id, spokenLetterName(t.item), w.intro);
          }}
        >
          <Volume2 className="size-4" />
          Hear again
        </button>
      </div>
      <div className="ocean-play relative w-full touch-none select-none" onContextMenu={(e) => e.preventDefault()}>
        {w.balloons.map((b) => (
          <button
            key={b.id}
            type="button"
            aria-label={hideName ? "balloon" : b.item.name}
            className={cn("letter-balloon", `balloon-skin-${b.hue % 4}`, b.hint && "balloon-hint")}
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
            <span className={cn("he-word", b.item.kind === "vowel" ? "text-2xl" : "text-3xl")} dir="rtl" lang="he">
              {b.item.glyph}
            </span>
          </button>
        ))}
        <div className="ocean-water" aria-hidden />
        {w.splashAt ? <div className="ocean-splash" /> : null}
        {w.intro && w.frozen ? (
          <p className="pointer-events-none absolute inset-x-0 top-2 text-center text-xs font-semibold text-ink">
            This is the one — then it drops
          </p>
        ) : null}
      </div>
      <p className="px-3 py-2 text-center text-xs text-muted">
        {wave.title}
        {w.combo >= 4 ? " · streak: slower fall" : ""}
        {Object.keys(w.weak).length ? " · weak marks in the sky" : ""}
      </p>
    </div>
  );
}

function Choice({
  on,
  onClick,
  label,
  hint,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-md)] px-3 py-3 text-left shadow-[var(--shadow-border)]",
        on ? "bg-ink text-parchment" : "bg-card text-ink",
      )}
    >
      <span className="block font-semibold">{label}</span>
      <span className={cn("block text-xs", on ? "text-parchment/70" : "text-muted")}>{hint}</span>
    </button>
  );
}
