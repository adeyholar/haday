import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Panel } from "@/components/panel";
import { choosePath, getMyPath, type MyPath } from "@/lib/learner-path";
import { clearDoor, readPathIntent, rememberDoor, stashPathIntent, type StudyPath } from "@/lib/path";

export const Route = createFileRoute("/")({ component: DoorsPage });

function DoorsPage() {
  const [gate, setGate] = useState<MyPath | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let next = await getMyPath();
        if (!next.path) {
          const intent = readPathIntent();
          if (intent) {
            const chosen = await choosePath({ data: { path: intent } });
            if (chosen.ok) {
              rememberDoor(chosen.path);
              window.location.assign(chosen.path === "iibs" ? "/iibs" : "/bbh");
              return;
            }
          }
        }
        if (!cancelled) {
          clearDoor();
          setGate(next);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not open the doors.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function choose(path: StudyPath) {
    if (busy) return;
    setBusy(true);
    setError("");
    stashPathIntent(path);
    try {
      const result = await choosePath({ data: { path } });
      if (!result.ok) {
        setError(result.error);
        setBusy(false);
        return;
      }
      rememberDoor(result.path);
      window.location.assign(result.path === "iibs" ? "/iibs" : "/bbh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that choice.");
      setBusy(false);
    }
  }

  if (!gate && !error) {
    return (
      <Panel>
        <p className="text-sm text-muted">Opening the two studies…</p>
      </Panel>
    );
  }

  const choosing = !gate?.path;
  const canBbh = Boolean(gate?.admin || gate?.path === "bbh");
  const canIibs = Boolean(gate?.admin || gate?.path === "iibs");

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · Hebraic Mentor</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Choose a study</h1>
        <p className="mt-3 max-w-prose text-muted">
          {choosing
            ? "Pick one. It stays with this account. The other door stays locked."
            : gate?.admin
              ? "Open one study. To open the other, come back to these two squares first."
              : "Your account opens one door. The other stays locked."}
        </p>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2">
        <Door
          kind="bbh"
          title="BBH"
          line="Basics of Biblical Hebrew. Letters, vocabulary, and the class games."
          choosing={choosing}
          open={choosing || canBbh}
          lockedLine="Locked. This account is the IIBS ladder."
          busy={busy}
          onChoose={() => void choose("bbh")}
          href="/bbh"
        />
        <Door
          kind="iibs"
          title="IIBS"
          line="Levels A to E, then Hebrew Reading Lab."
          choosing={choosing}
          open={choosing || canIibs}
          lockedLine="Locked. This account is BBH."
          busy={busy}
          onChoose={() => void choose("iibs")}
          href="/iibs"
        />
      </div>
    </>
  );
}

function Door({
  kind,
  title,
  line,
  choosing,
  open,
  lockedLine,
  busy,
  onChoose,
  href,
}: {
  kind: StudyPath;
  title: string;
  line: string;
  choosing: boolean;
  open: boolean;
  lockedLine: string;
  busy: boolean;
  onChoose: () => void;
  href: "/bbh" | "/iibs";
}) {
  const modern = kind === "bbh";
  const className = `flex aspect-square flex-col items-start justify-end rounded-[var(--radius-xl)] p-5 text-left shadow-[var(--shadow-border)] ${
    modern ? "bg-ink text-parchment" : "bg-parchment text-ink ring-1 ring-ink/20"
  } ${open ? "" : "opacity-70"}`;
  const body = (
    <>
      {modern ? <ModernMark /> : <AncientMark />}
      <p className="mt-4 font-display text-4xl font-bold">{title}</p>
      <p className={`mt-2 text-sm ${modern ? "text-parchment/80" : "text-ink/80"}`}>{open ? line : lockedLine}</p>
      {!open ? (
        <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
          <Lock className="size-4" />
          Locked
        </p>
      ) : null}
    </>
  );
  if (!open) {
    return (
      <div className={className} aria-disabled="true">
        {body}
      </div>
    );
  }
  if (choosing) {
    return (
      <button type="button" className={className} disabled={busy} onClick={onChoose}>
        {body}
      </button>
    );
  }
  return (
    <Link to={href} className={className} onClick={() => rememberDoor(kind)}>
      {body}
    </Link>
  );
}

function ModernMark() {
  return (
    <svg viewBox="0 0 72 72" className="size-16" aria-hidden>
      <rect x="6" y="6" width="60" height="60" rx="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M20 18h8l12 36h-8L20 18zm22 0h8L38 54h-8l12-36z" fill="currentColor" />
    </svg>
  );
}

function AncientMark() {
  return (
    <svg viewBox="0 0 72 72" className="size-16" aria-hidden>
      <path
        d="M16 14h34c6 0 10 4 10 10v28c0 5-4 8-10 8H20c-8 0-12-2-12-8V24c0-6 3-10 8-10z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M26 22v30M26 22c10 2 16 8 16 15s-6 13-16 15" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M44 30h10M44 37h8M44 44h10" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
