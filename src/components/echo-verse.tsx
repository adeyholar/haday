import { useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pickRecorderMime } from "@/lib/pet";

const MAX_MS = 20_000;

type Phase = "idle" | "model" | "ready" | "rec" | "review";

export function EchoVerse({
  src,
  start,
  end,
  onHalt,
}: {
  src: string;
  start: number;
  end: number;
  onHalt: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [ms, setMs] = useState(0);
  const modelRef = useRef<HTMLAudioElement | null>(null);
  const mineRef = useRef<HTMLAudioElement | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const tick = useRef(0);
  const mime = useRef("");
  const span = Math.max(0.8, (end || start + 4) - start);

  useEffect(() => {
    return () => hush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setOpen(false);
    setPhase("idle");
    setError(null);
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    hush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, start, end]);

  function hush() {
    window.clearInterval(tick.current);
    try {
      rec.current?.stop();
    } catch {
      /* ignore */
    }
    rec.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    const model = modelRef.current;
    if (model) {
      model.pause();
    }
    mineRef.current?.pause();
  }

  function playModel(): Promise<void> {
    onHalt();
    const el = modelRef.current;
    if (!el || !src) return Promise.resolve();
    el.src = src;
    el.currentTime = Math.max(0, start);
    const stopAt = start + span;
    return new Promise((resolve) => {
      const onTime = () => {
        if (el.currentTime >= stopAt - 0.05 || el.ended) {
          el.pause();
          el.removeEventListener("timeupdate", onTime);
          el.removeEventListener("ended", onEnded);
          resolve();
        }
      };
      const onEnded = () => {
        el.removeEventListener("timeupdate", onTime);
        el.removeEventListener("ended", onEnded);
        resolve();
      };
      el.addEventListener("timeupdate", onTime);
      el.addEventListener("ended", onEnded);
      void el.play().catch(() => resolve());
      setPhase("model");
    });
  }

  async function startEcho() {
    setError(null);
    setOpen(true);
    await playModel();
    setPhase("ready");
  }

  async function startRec() {
    setError(null);
    mime.current = pickRecorderMime();
    if (!mime.current || typeof MediaRecorder === "undefined") {
      setError("This browser cannot record. Try Safari or Chrome on the iPad.");
      return;
    }
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = mic;
      chunks.current = [];
      const recorder = new MediaRecorder(mic, { mimeType: mime.current });
      rec.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: mime.current || "audio/webm" });
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        setBlobUrl(URL.createObjectURL(blob));
        setPhase("review");
        stream.current?.getTracks().forEach((t) => t.stop());
        stream.current = null;
      };
      recorder.start();
      setMs(0);
      setPhase("rec");
      const began = Date.now();
      tick.current = window.setInterval(() => {
        const elapsed = Date.now() - began;
        setMs(elapsed);
        if (elapsed >= MAX_MS) stopRec();
      }, 200);
    } catch {
      setError("Allow the microphone to echo this verse.");
    }
  }

  function stopRec() {
    window.clearInterval(tick.current);
    try {
      rec.current?.stop();
    } catch {
      /* ignore */
    }
  }

  async function playBoth() {
    await playModel();
    const mine = mineRef.current;
    if (mine && blobUrl) {
      mine.src = blobUrl;
      void mine.play().catch(() => undefined);
    }
    setPhase("review");
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="lg" className="mt-3 w-full min-h-12" onClick={() => void startEcho()}>
        Echo this verse
      </Button>
    );
  }

  return (
    <div className="mt-3 rounded-[var(--radius-md)] bg-surface p-3 shadow-[var(--shadow-border)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Echo</p>
        <button
          type="button"
          className="min-h-11 px-2 text-sm font-semibold text-primary"
          onClick={() => {
            hush();
            setOpen(false);
            setPhase("idle");
          }}
        >
          Close
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">
        Hear the reader, then record yourself. Your ear grades it — no machine score.
      </p>
      {phase === "model" ? <p className="mt-2 text-sm font-semibold text-ink">Playing the verse…</p> : null}
      {phase === "ready" ? <p className="mt-2 text-sm font-semibold text-ink">Your turn.</p> : null}
      {phase === "rec" ? (
        <p className="mt-2 text-sm font-semibold text-danger">Recording {Math.ceil(ms / 1000)}s / {MAX_MS / 1000}s</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="lg" onClick={() => void playModel()} disabled={phase === "rec"}>
          <Volume2 className="size-4" />
          Hear verse
        </Button>
        {phase === "rec" ? (
          <Button type="button" size="lg" onClick={stopRec}>
            <Square className="size-4" />
            Stop
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={() => void startRec()} disabled={phase === "model"}>
            <Mic className="size-4" />
            Record
          </Button>
        )}
      </div>
      {blobUrl ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              const mine = mineRef.current;
              if (mine) {
                mine.src = blobUrl;
                void mine.play().catch(() => undefined);
              }
            }}
          >
            Hear me
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => void playBoth()}>
            Hear both
          </Button>
        </div>
      ) : null}
      <audio ref={modelRef} className="sr-only" playsInline />
      <audio ref={mineRef} className="sr-only" playsInline />
    </div>
  );
}
