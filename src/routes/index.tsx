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
      <Panel className="mb-4 text-center">
        <p className="text-xs font-semibold tracking-[0.08em] text-primary">Haday · HebRabbAi Mentor</p>
        <img
          src="/doors/ancient-smile.jpg"
          alt=""
          className="mx-auto mt-4 size-28 rounded-full object-cover shadow-[var(--shadow-border)] sm:size-32"
        />
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Choose your Study Path</h1>
        <p className="mt-2 font-display text-2xl font-semibold text-primary">Choose wisely.</p>
        <p className="mx-auto mt-3 max-w-prose text-muted">
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
  const className = `flex aspect-square flex-col items-center justify-center rounded-[var(--radius-xl)] p-5 text-center shadow-[var(--shadow-border)] ${
    modern ? "bg-ink text-parchment" : "bg-parchment text-ink ring-1 ring-ink/20"
  } ${open ? "" : "opacity-70"}`;
  const body = (
    <>
      <img
        src={modern ? "/doors/bbh-modern.jpg" : "/doors/iibs-ancient.jpg"}
        alt=""
        className={
          modern
            ? "size-36 rounded-[var(--radius-lg)] bg-white object-contain sm:size-44"
            : "size-36 rounded-full object-cover sm:size-44"
        }
      />
      <p className="mt-4 font-display text-4xl font-bold">{title}</p>
      <p className={`mt-2 max-w-[16rem] text-sm ${modern ? "text-parchment/80" : "text-ink/80"}`}>{open ? line : lockedLine}</p>
      {!open ? (
        <p className="mt-3 inline-flex items-center justify-center gap-1 text-sm font-semibold">
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
