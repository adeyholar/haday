import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/panel";
import { VoiceRecorder } from "@/components/voice-recorder";
import { getAdminStatus } from "@/lib/admin";
import { voiceCorpus, type CorpusKind } from "@/lib/voice-corpus";
import { listVoiceIndex, type VoiceIndexRow } from "@/lib/voice";

export const Route = createFileRoute("/admin/voice")({ component: VoiceBankPage });

function VoiceBankPage() {
  const corpus = useMemo(() => voiceCorpus().filter((i) => !i.id.startsWith("announce-")), []);
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<VoiceIndexRow[]>([]);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<CorpusKind | "all">("vocab");
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [picked, setPicked] = useState(corpus.find((i) => i.kind === "vocab")?.id ?? corpus[0]?.id ?? "abraham");
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
  const filtered = corpus.filter((item) => {
    if (kind !== "all" && item.kind !== kind) return false;
    if (onlyMissing && he.has(item.id)) return false;
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return (
      item.speakEn.toLowerCase().includes(needle) ||
      item.speakHe.includes(q.trim()) ||
      item.glyph.includes(q.trim()) ||
      item.id.includes(needle) ||
      item.group.toLowerCase().includes(needle)
    );
  });
  const item = corpus.find((x) => x.id === picked) ?? filtered[0] ?? corpus[0];

  function nextMissing() {
    const start = corpus.findIndex((x) => x.id === item?.id);
    const rest = [...corpus.slice(start + 1), ...corpus.slice(0, start + 1)];
    const hit = rest.find((x) => (kind === "all" || x.kind === kind) && !he.has(x.id));
    if (hit) setPicked(hit.id);
  }

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
          Closed list: letters, vowels, names, and BBH lemmas. A natural Hebrew neural voice (Hila) already speaks every
          line. Record here to replace any line with your own voice — that take always wins. Hebrew is the name; English
          is the gloss.
        </p>
        <p className="mt-2 text-sm text-muted">
          {he.size} of your Hebrew takes · {en.size} English · {corpus.length} in the module.{" "}
          <a href="/audio/neural/corpus.txt" className="font-semibold text-primary" download>
            Download the text list
          </a>
          {" · "}
          <Link to="/admin" className="font-semibold text-primary">
            Class roster
          </Link>
        </p>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </Panel>

      <Panel className="mb-4">
        <div className="flex flex-wrap gap-2">
          {(["vocab", "letter", "vowel", "all"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={
                kind === k
                  ? "rounded-[var(--radius-md)] bg-ink px-3 py-2 text-sm font-semibold text-parchment"
                  : "rounded-[var(--radius-md)] bg-surface px-3 py-2 text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
              }
            >
              {k === "all" ? "All" : k === "vocab" ? "Names & vocab" : k === "letter" ? "Letters" : "Vowels"}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-sm font-semibold text-ink">
          Search
          <input
            className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-border bg-parchment px-3 text-ink"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Abraham, אַבְרָהָם, Qamets"
          />
        </label>
        <label className="mt-3 flex min-h-11 items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
          Show items still missing your Hebrew take
        </label>
      </Panel>

      {item ? (
        <Panel className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{item.group}</p>
          <p className="he-word mt-1 text-4xl text-ink" dir="rtl" lang="he">
            {item.glyph}
          </p>
          <p className="mt-1 text-lg font-semibold text-ink">{item.speakEn}</p>
          <p className="mt-1 text-sm text-muted">
            Neural will say: {item.speakHe || "—"} / {item.speakEn}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <VoiceRecorder vocabId={item.id} part="he" hasClip={he.has(item.id)} onChange={() => void reload()} />
            <VoiceRecorder vocabId={item.id} part="en" hasClip={en.has(item.id)} onChange={() => void reload()} />
          </div>
          <Button className="mt-3 w-full" variant="outline" type="button" onClick={nextMissing}>
            Next without a Hebrew take
          </Button>
        </Panel>
      ) : null}

      <Panel>
        <h2 className="font-display text-2xl font-bold text-ink">List</h2>
        <ul className="mt-3 max-h-[28rem] space-y-1 overflow-auto">
          {filtered.slice(0, 80).map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setPicked(row.id)}
                className="flex min-h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] bg-surface px-3 text-left shadow-[var(--shadow-border)]"
              >
                <span>
                  <span className="he-word text-lg" dir="rtl" lang="he">
                    {row.glyph}
                  </span>
                  <span className="ms-2 text-sm text-muted">{row.speakEn}</span>
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
