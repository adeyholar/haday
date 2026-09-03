import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { isMuted, setMuted, subscribeMute, unlockSfx } from "@/lib/sfx";

export function SfxToggle() {
  const [muted, setMutedState] = useState(isMuted);

  useEffect(() => subscribeMute(setMutedState), []);

  return (
    <button
      type="button"
      aria-label={muted ? "Unmute answer sounds" : "Mute answer sounds"}
      aria-pressed={muted}
      onClick={() => {
        unlockSfx();
        setMuted(!muted);
      }}
      className="inline-flex size-11 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface hover:text-ink"
    >
      {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
    </button>
  );
}
