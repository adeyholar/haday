import { useEffect, useState } from "react";
import { LEVEL_IDS, type LevelId } from "@/lib/paradigms/types";
import { setParadigmLevel } from "@/lib/paradigms/progress";

export function ParadigmLevelControl({ userId, level }: { userId: string; level: LevelId | null }) {
  const [value, setValue] = useState<LevelId>(level ?? "L1");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (level) setValue(level);
  }, [level]);

  async function save() {
    setBusy(true);
    setNote(null);
    try {
      const result = await setParadigmLevel({ data: { userId, level: value } });
      setNote(result.ok ? value : result.error);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Could not set the level.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid justify-items-start gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted">
        Level
        <select
          className="mt-1 block min-h-11 rounded-[var(--radius-md)] bg-card px-2 text-sm text-ink"
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            if ((LEVEL_IDS as readonly string[]).includes(next)) setValue(next as LevelId);
          }}
        >
          {LEVEL_IDS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        disabled={busy}
        className="min-h-11 rounded-[var(--radius-md)] bg-card px-3 text-sm font-semibold text-primary shadow-[var(--shadow-border)] disabled:opacity-60"
        onClick={() => void save()}
      >
        {busy ? "Saving…" : "Set level"}
      </button>
      {note ? <span className="max-w-[8rem] text-xs text-muted">{note}</span> : null}
    </div>
  );
}
