import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blobToB64, pickRecorderMime } from "@/lib/pet";
import { deleteVoiceClip, getVoiceClip, saveVoiceClip, type VoicePart } from "@/lib/voice";
import { invalidateVoiceCache } from "@/lib/listen";
import { cn } from "@/lib/cn";

const MAX_MS = 6000;

type Props = {
  vocabId: string;
  part: VoicePart;
  hasClip: boolean;
  onChange: (has: boolean) => void;
};

export function VoiceRecorder({ vocabId, part, hasClip, onChange }: Props) {
  const [phase, setPhase] = useState<"idle" | "rec" | "preview" | "busy">("idle");
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [ms, setMs] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const tick = useRef<number>(0);
  const mime = useRef("");

  useEffect(() => {
    return () => {
      hush();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setPhase("preview");
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
      }, 80);
    } catch {
      setError("Microphone was blocked. Allow the mic, then try again.");
    }
  }

  function stopRec() {
    window.clearInterval(tick.current);
    try {
      if (rec.current && rec.current.state === "recording") rec.current.stop();
    } catch {
      setPhase("idle");
    }
  }

  async function save() {
    if (!blobUrl) return;
    setPhase("busy");
    setError(null);
    try {
      const blob = await fetch(blobUrl).then((r) => r.blob());
      const b64 = await blobToB64(blob);
      const res = await saveVoiceClip({
        data: { vocabId, part, mime: blob.type || mime.current || "audio/webm", b64 },
      });
      if (!res.ok) {
        setError(res.error);
        setPhase("preview");
        return;
      }
      invalidateVoiceCache();
      onChange(true);
      setPhase("idle");
    } catch {
      setError("Could not save. Try a shorter take.");
      setPhase("preview");
    }
  }

  async function playSaved() {
    setError(null);
    try {
      const row = await getVoiceClip({ data: { vocabId, part } });
      if (!row) {
        setError("No recording yet.");
        return;
      }
      const audio = new Audio(`data:${row.mime};base64,${row.b64}`);
      audio.setAttribute("playsinline", "true");
      await audio.play();
    } catch {
      setError("Could not play that clip.");
    }
  }

  async function remove() {
    setPhase("busy");
    setError(null);
    try {
      const res = await deleteVoiceClip({ data: { vocabId, part } });
      if (!res.ok) {
        setError(res.error);
        setPhase("idle");
        return;
      }
      invalidateVoiceCache();
      onChange(false);
      setPhase("idle");
    } catch {
      setError("Could not delete.");
      setPhase("idle");
    }
  }

  const label = part === "he" ? "Hebrew" : "English";

  return (
    <div className="rounded-[var(--radius-md)] bg-surface p-3 shadow-[var(--shadow-border)]">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{label}</p>
      {phase === "rec" ? (
        <p className="mt-2 text-sm font-semibold text-danger">Recording {(ms / 1000).toFixed(1)}s</p>
      ) : hasClip ? (
        <p className="mt-2 text-sm text-muted">Saved. New take replaces it.</p>
      ) : (
        <p className="mt-2 text-sm text-muted">No take yet.</p>
      )}
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {phase === "rec" ? (
          <Button type="button" variant="outline" onClick={stopRec}>
            <Square className="size-4" />
            Stop
          </Button>
        ) : phase === "preview" ? (
          <>
            {blobUrl ? (
              <audio className="h-10 w-full max-w-56" src={blobUrl} controls playsInline />
            ) : null}
            <Button type="button" onClick={() => void save()}>
              Save {label}
            </Button>
            <Button type="button" variant="outline" onClick={() => setPhase("idle")}>
              Discard
            </Button>
          </>
        ) : (
          <>
            <Button type="button" onClick={() => void startRec()} disabled={phase === "busy"}>
              <Mic className="size-4" />
              Record
            </Button>
            {hasClip ? (
              <button
                type="button"
                className={cn(
                  "inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-md)] bg-card px-3 text-sm font-semibold text-ink shadow-[var(--shadow-border)]",
                )}
                onClick={() => void playSaved()}
              >
                <Volume2 className="size-4" />
                Play
              </button>
            ) : null}
            {hasClip ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-md)] px-3 text-sm font-semibold text-danger"
                onClick={() => void remove()}
              >
                <Trash2 className="size-4" />
                Delete
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
