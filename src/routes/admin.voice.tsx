import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { VoiceRecorder } from "@/components/voice-recorder";
import { getAdminStatus } from "@/lib/admin";
import { alphabetVocab, bbhVocab, GAME_CHAPTER_TITLES } from "@/lib/vocab";
import { listVoiceIndex, type VoiceIndexRow } from "@/lib/voice";

export const Route = createFileRoute("/admin/voice")({ component: VoiceBankPage });

function VoiceBankPage() {
  const lemmas = useMemo(() => [...alphabetVocab(), ...bbhVocab()], []);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<VoiceIndexRow[]>([]);
  const [q, setQ] = useState("");
  const [chapter, setChapter] = useState(0);
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [picked, setPicked] = useState(lemmas[0]?.id ?? "abraham");
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const list = await listVoiceIndex();
    setRows(list);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getAdminStatus();
        if (cancelled) return;
        setAdmin(status.admin);
        if (!status.admin) return;
        await reload();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the voice bank.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const he = new Set(rows.filter((r) => r.part === "he").map((r) => r.vocabId));
  const en = new Set(rows.filter((r) => r.part === "en").map((r) => r.vocabId));
  const filtered = lemmas.filter((item) => {
    if (chapter && item.chapter !== chapter) return false;
    if (onlyMissing && he.has(item.id)) return false;
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return (
      item.gloss.toLowerCase().includes(needle) ||
      item.translit.toLowerCase().includes(needle) ||
      item.hebrew.includes(q.trim()) ||
      item.id.includes(needle)
    );
  });
  const item = lemmas.find((x) => x.id === picked) ?? filtered[0] ?? lemmas[0];

  if (admin === false) {
    return (
      <Panel>
        <h1 className="font-display text-3xl font-bold text-ink">Voice bank</h1>
        <p className="mt-3 text-sm text-muted">Only the course owner can record the class voice.</p>
      </Panel>
    );
  }

  if (admin === null) {
    return (
      <Panel>
        <p className="text-sm text-muted">Loading voice bank…</p>
      </Panel>
    );
  }

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · Owner</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Voice bank</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Record specific class words in your own voice. Alive Pet and Listen use these first — then Open Hebrew Bible,
          then a computer voice. Hebrew is the name; English is the gloss. Six seconds is plenty.
        </p>
        <p className="mt-2 text-sm text-muted">
          {he.size} Hebrew take{he.size === 1 ? "" : "s"} · {en.size} English ·{" "}
          <Link to="/admin" className="font-semibold text-primary">
            Class roster
          </Link>
        </p>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </Panel>

      <Panel className="mb-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm font-semibold text-ink">
            Search
            <input
              className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-border bg-parchment px-3 text-ink"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Abraham, אַבְרָהָם"
            />
          </label>
          <label className="text-sm font-semibold text-ink">
            Chapter
            <select
              className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-border bg-parchment px-3 text-ink"
              value={chapter}
              onChange={(e) => setChapter(Number(e.target.value))}
            >
              <option value={0}>All</option>
              {Array.from({ length: 19 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}. {GAME_CHAPTER_TITLES[n] ?? ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
          Show lemmas still missing a Hebrew take
        </label>
      </Panel>

      {item ? (
        <Panel className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Chapter {item.chapter} · {GAME_CHAPTER_TITLES[item.chapter] ?? ""}
          </p>
          <p className="he-word mt-1 text-4xl text-ink" dir="rtl" lang="he">
            {item.hebrew}
          </p>
          <p className="mt-1 text-lg font-semibold text-ink">{item.gloss}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <VoiceRecorder
              vocabId={item.id}
              part="he"
              hasClip={he.has(item.id)}
              onChange={() => void reload()}
            />
            <VoiceRecorder
              vocabId={item.id}
              part="en"
              hasClip={en.has(item.id)}
              onChange={() => void reload()}
            />
          </div>
        </Panel>
      ) : null}

      <Panel>
        <h2 className="font-display text-2xl font-bold text-ink">Lemmas</h2>
        <ul className="mt-3 max-h-[28rem] space-y-1 overflow-auto">
          {filtered.slice(0, 80).map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setPicked(row.id)}
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] px-3 text-left shadow-[var(--shadow-border)] bg-surface"
              >
                <span>
                  <span className="he-word text-lg" dir="rtl" lang="he">
                    {row.hebrew}
                  </span>
                  <span className="ms-2 text-sm text-muted">{row.gloss}</span>
                </span>
                <span className="text-xs text-muted">
                  {he.has(row.id) ? "He" : "—"}
                  {en.has(row.id) ? " · En" : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {filtered.length > 80 ? (
          <p className="mt-2 text-sm text-muted">Showing 80 of {filtered.length}. Narrow the search.</p>
        ) : null}
      </Panel>
    </>
  );
}
