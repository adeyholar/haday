import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GradeBanner } from "@/components/grade-banner";
import { DontKnowButton } from "@/components/dont-know-button";
import { Panel } from "@/components/panel";
import { playGrade } from "@/lib/sfx";
import { cn } from "@/lib/cn";
import {
  GRAMMAR_QUIZ_LEN,
  buildGrammarMixQuiz,
  grammarMixPool,
  type GrammarQuiz,
  type GrammarTrackId,
} from "@/lib/grammar";
import { grammarTrack } from "@/lib/grammar-tracks";
import { isGrammarUnitUnlocked } from "@/lib/game";
import { useStudy } from "@/lib/store";

type PlayQ = GrammarQuiz & { key: string; retry?: boolean };

function MixHe({ text }: { text: string }) {
  const re = /[\u0590-\u05FF]+/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(
      <span key={`he-${i++}`} className="he-word" dir="rtl" lang="he">
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

function shuffleIn<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let n = a.length - 1; n > 0; n--) {
    const j = Math.floor(Math.random() * (n + 1));
    [a[n], a[j]] = [a[j], a[n]];
  }
  return a;
}

export function GrammarMixPlay({ trackIds }: { trackIds: GrammarTrackId[] }) {
  const game = useStudy((s) => s.game);
  const tracks = trackIds.map((id) => grammarTrack(id)).filter((t): t is NonNullable<typeof t> => Boolean(t));
  const unitOk = (id: GrammarTrackId, unit: number) => isGrammarUnitUnlocked(game, id, unit);
  const poolSize = grammarMixPool(tracks, unitOk).length;

  const [items, setItems] = useState<PlayQ[]>(() =>
    buildGrammarMixQuiz(tracks, unitOk).map((item, n) => ({ ...item, key: `mix-${n}` })),
  );
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [held, setHeld] = useState<Set<string>>(() => new Set());
  const [firstTry, setFirstTry] = useState(0);
  const [firstSeen] = useState(() => items.length);
  const [done, setDone] = useState(false);

  const q = items[i];
  const unique = firstSeen || items.filter((x) => !x.retry).length;
  const pct = useMemo(() => (unique ? Math.round((held.size / unique) * 100) : 0), [held, unique]);
  const names = tracks.map((t) => t.title).join(" · ");

  function pick(choice: string) {
    if (!q || picked) return;
    const ok = choice === q.answer;
    setPicked(choice);
    if (ok) setHeld((s) => new Set(s).add(q.key.replace(/-retry$/, "")));
    if (!q.retry && ok) setFirstTry((n) => n + 1);
    playGrade(ok);
  }

  function admitNoIdea() {
    if (!q || picked) return;
    setPicked("__noidea__");
    playGrade(false);
  }

  function next() {
    if (!picked || !q) return;
    const ok = picked === q.answer;
    let nextItems = items;
    if (!ok && !q.retry) {
      const later: PlayQ = { ...q, key: `${q.key}-retry`, retry: true, choices: shuffleIn(q.choices) };
      const insertAt = Math.min(items.length, i + 2 + Math.floor(Math.random() * 3));
      nextItems = [...items.slice(0, insertAt), later, ...items.slice(insertAt)];
      setItems(nextItems);
    }
    if (i + 1 >= nextItems.length) {
      setDone(true);
      return;
    }
    setI((n) => n + 1);
    setPicked(null);
  }

  if (!items.length) {
    return (
      <Panel>
        <p className="text-muted">No grammar questions in that mix yet. Open a unit on those topics first.</p>
        <Link to="/game/custom" search={{ kind: "grammar" }} className="mt-4 inline-block text-sm font-medium text-primary">
          Back to mix
        </Link>
      </Panel>
    );
  }

  if (done) {
    return (
      <Panel className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar mix · practice</p>
        <p className="mt-2 font-display text-4xl font-bold text-ink">{pct}%</p>
        <p className="mt-2 text-sm text-muted">
          {held.size} / {unique} held
          {unique ? ` · first look ${Math.round((firstTry / unique) * 100)}%` : ""}
        </p>
        <p className="mt-2 text-sm text-muted">
          {names}. This mix does not unlock or lock a topic.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link to="/game/custom" search={{ kind: "grammar" }} className="block">
            <Button className="w-full">Change the mix</Button>
          </Link>
          <Link to="/game/lessons" className="text-sm font-semibold text-primary">
            Grammar topics
          </Link>
        </div>
      </Panel>
    );
  }

  if (!q) return null;
  const ok = picked === q.answer;
  const lastNow = i + 1 >= items.length && (ok || Boolean(q.retry));

  return (
    <>
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Grammar mix · {i + 1} / {items.length}
          {q.retry ? " · again" : ""}
          {` · ${GRAMMAR_QUIZ_LEN} of ${poolSize}`}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink">
          <MixHe text={q.q} />
        </h1>
        {q.ref ? <p className="mt-1 text-xs font-semibold text-muted">{q.ref}</p> : null}
        {q.he ? (
          <p className="he-word mt-3 text-4xl" dir="rtl" lang="he">
            {q.he}
          </p>
        ) : null}
      </Panel>
      <ul className="mt-3 space-y-2">
        {q.choices.map((c) => {
          const chosen = picked === c;
          const rightChoice = c === q.answer;
          return (
            <li key={c}>
              <button
                type="button"
                disabled={Boolean(picked)}
                onClick={() => pick(c)}
                className={cn(
                  "min-h-12 w-full rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium shadow-[var(--shadow-border)]",
                  !picked && "bg-card text-ink",
                  picked && rightChoice && "bg-good text-white",
                  picked && chosen && !rightChoice && "bg-bad text-white",
                  picked && !chosen && !rightChoice && "bg-card text-muted",
                )}
              >
                <MixHe text={c} />
              </button>
            </li>
          );
        })}
      </ul>
      {!picked && <DontKnowButton onClick={admitNoIdea} />}
      {picked && (
        <div className="mt-3">
          <GradeBanner ok={ok} />
          <p className="mt-2 text-sm text-muted">
            <MixHe text={q.why} />
          </p>
          {!ok && !q.retry ? (
            <p className="mt-1 text-sm text-muted">You will see this one again in a moment.</p>
          ) : null}
          <Button className="mt-3 w-full" onClick={next}>
            {lastNow ? "See score" : "Next"}
          </Button>
        </div>
      )}
    </>
  );
}
