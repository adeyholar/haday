import { useEffect, useState } from "react";
import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Panel } from "@/components/panel";
import { PublicFooter } from "@/components/public-footer";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { choosePath, getMyPath, type MyPath } from "@/lib/learner-path";
import { GRAMMAR_PATH, SCRIPTURE_PATH } from "@/lib/path-names";
import { clearDoor, homeForAccount, markTermHall, readPathIntent, rememberDoor, shouldShowPathChooser, stashPathIntent, type StudyPath } from "@/lib/path";
import { CLASS_SITE } from "@/lib/class-site";
import { SEO_DESCRIPTION, SEO_TITLE, SITE_JSON_LD, shareMeta } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: shareMeta(SEO_TITLE, SEO_DESCRIPTION, "/"),
    links: [{ rel: "canonical", href: `${CLASS_SITE}/` }],
  }),
  component: DoorsPage,
});

function DoorsPage() {
  const { sessionUser } = useRouteContext({ from: "__root__" });
  const { user } = useCurrentUserState();
  const signedIn = sessionUser != null || user != null;
  const [gate, setGate] = useState<MyPath | null>(null);
  const [error, setError] = useState("");
  const [visitor, setVisitor] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let lastError = "";
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const next = await getMyPath();
          if (!next.path) {
            const intent = readPathIntent();
            if (intent) {
              const chosen = await choosePath({ data: { path: intent } });
              if (chosen.ok) {
                rememberDoor(chosen.path);
                if (chosen.path === "bbh") markTermHall();
                window.location.replace(chosen.path === "iibs" ? "/iibs" : "/bbh");
                return;
              }
            }
          }
          const home = homeForAccount(next);
          if (home) {
            rememberDoor(next.path!);
            if (home === "/bbh") markTermHall();
            window.location.replace(home);
            return;
          }
          if (!cancelled) {
            clearDoor();
            setVisitor(false);
            setGate(next);
          }
          return;
        } catch (err) {
          if (cancelled) return;
          lastError = err instanceof Error ? err.message : "";
          const unauthorized = /unauthorized/i.test(lastError);
          if (unauthorized && !signedIn) {
            setVisitor(true);
            return;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 300));
        }
      }
      if (!cancelled) setError(lastError || "Could not open your study.");
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  async function choose(path: StudyPath) {
    if (busy) return;
    setBusy(true);
    setError("");
    stashPathIntent(path);
    if (visitor) {
      window.location.assign("/login");
      return;
    }
    try {
      const result = await choosePath({ data: { path } });
      if (!result.ok) {
        setError(result.error);
        setBusy(false);
        return;
      }
      rememberDoor(result.path);
      if (result.path === "bbh") markTermHall();
      window.location.assign(result.path === "iibs" ? "/iibs" : "/bbh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that choice.");
      setBusy(false);
    }
  }

  const choosing = visitor || !gate?.path;
  const canBbh = Boolean(gate?.admin || gate?.path === "bbh");
  const canIibs = Boolean(gate?.admin || gate?.path === "iibs");
  const showChooser = shouldShowPathChooser({
    signedIn,
    resolved: gate != null || (visitor && !signedIn),
    admin: Boolean(gate?.admin),
    path: gate?.path ?? null,
  });

  if (!showChooser) {
    return <p className="py-16 text-center text-sm text-muted">{error || "Opening your study."}</p>;
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }} />
      <Panel className="mb-4 text-center">
        <p className="text-xs font-semibold tracking-[0.08em] text-primary">HaDay · HebRabbAi Mentor</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Learn to Read the Bible in Hebrew
        </h1>
        <p className="mx-auto mt-3 max-w-prose text-muted">
          HaDay HebRabbAi Mentor is for anyone who wants to read Scripture in the language it was written in. Whether
          you're a student, a pastor, or simply hungry for the Word, you'll start with the letters, hear every word, and
          step by step read the Tanakh for yourself, seeing what the text says and meeting God in it.
        </p>
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink">Choose your Study Path</h2>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </Panel>
      <div className="grid gap-3 sm:grid-cols-2">
        <Door
          kind="bbh"
          title={GRAMMAR_PATH.title}
          hebrew={GRAMMAR_PATH.hebrew}
          line={GRAMMAR_PATH.line}
          choosing={choosing}
          open={choosing || canBbh}
          lockedLine={GRAMMAR_PATH.locked}
          busy={busy}
          onChoose={() => void choose("bbh")}
          href="/bbh"
          loginHref={!signedIn ? "/login?path=bbh" : undefined}
          action="Start the Grammar Path"
        />
        <Door
          kind="iibs"
          title={SCRIPTURE_PATH.title}
          hebrew={SCRIPTURE_PATH.hebrew}
          line={SCRIPTURE_PATH.line}
          choosing={choosing}
          open={choosing || canIibs}
          lockedLine={SCRIPTURE_PATH.locked}
          busy={busy}
          onChoose={() => void choose("iibs")}
          href="/iibs"
          loginHref={!signedIn ? "/login?path=iibs" : undefined}
          action="Start the Scripture Path"
        />
      </div>
      <section className="mx-auto mt-6 max-w-prose">
        <h2 className="font-display text-2xl font-semibold text-ink">From the letters to the living Word</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
          <li>Reading the Hebrew alphabet and vowel points</li>
          <li>Vocabulary, with audio for every word</li>
          <li>Grammar: forms, roots, and how words are built</li>
          <li>Reading real verses, Levels A to E, then the Reading Lab</li>
        </ul>
      </section>
      <p className="mx-auto mt-4 max-w-prose text-sm text-muted">
        One door is the class vocabulary and games. The other is a leveled reading ladder. Lessons and answer keys
        stay inside the signed-in study.{" "}
        {choosing
          ? "Pick one. It stays with this account. The other door stays locked."
          : gate?.admin
            ? "Open one study. To open the other, come back to these two squares first."
            : "Your account opens one door. The other stays locked."}
      </p>
      <p className="mx-auto mt-3 max-w-prose text-sm">
        <Link to="/how-to-memorize-biblical-hebrew-vocabulary" className="font-semibold text-primary underline-offset-4 hover:underline">
          New to Hebrew vocab? Read the method.
        </Link>
      </p>
      <PublicFooter />
    </>
  );
}

function Door({
  kind,
  title,
  hebrew,
  line,
  choosing,
  open,
  lockedLine,
  busy,
  onChoose,
  href,
  loginHref,
  action,
}: {
  kind: StudyPath;
  title: string;
  hebrew: string;
  line: string;
  choosing: boolean;
  open: boolean;
  lockedLine: string;
  busy: boolean;
  onChoose: () => void;
  href: "/bbh" | "/iibs";
  loginHref?: string;
  action: string;
}) {
  const className = `flex flex-col items-center justify-center rounded-[var(--radius-xl)] bg-card p-5 text-center text-ink shadow-[var(--shadow-border)] ring-1 ring-ink/15 ${
    open ? "" : "opacity-70"
  }`;
  const body = (
    <>
      <img
        src={kind === "bbh" ? "/doors/bbh-modern.jpg" : "/doors/iibs-ancient.jpg"}
        alt=""
        width={352}
        height={352}
        className="size-28 rounded-[var(--radius-lg)] object-cover sm:size-32"
      />
      <p className="mt-3 font-display text-3xl font-bold leading-tight">{title}</p>
      <p className="he-word text-2xl" dir="rtl" lang="he">
        {hebrew}
      </p>
      <p className="mt-2 max-w-[16rem] text-sm text-ink/80">{open ? line : lockedLine}</p>
      {open ? (
        <span className="mt-3 inline-flex min-h-11 items-center rounded-[var(--radius-md)] bg-ink px-4 text-sm font-semibold text-parchment">
          {action}
        </span>
      ) : (
        <p className="mt-3 inline-flex items-center justify-center gap-1 text-sm font-semibold">
          <Lock className="size-4" />
          Locked
        </p>
      )}
    </>
  );
  if (!open) {
    return (
      <div className={className} aria-disabled="true">
        {body}
      </div>
    );
  }
  if (loginHref) {
    return (
      <a href={loginHref} className={className}>
        {body}
      </a>
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
    <Link
      to={href}
      className={className}
      onClick={() => {
        rememberDoor(kind);
        if (kind === "bbh") markTermHall();
      }}
    >
      {body}
    </Link>
  );
}
