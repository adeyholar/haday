import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GameMenu } from "@/components/game-menu";
import { Panel } from "@/components/panel";
import { CrownBadge } from "@/components/honor-badge";
import { bbhVocab, glossMatches, shuffle, type VocabItem } from "@/lib/vocab";
import { useStudy } from "@/lib/store";
import { AppErrorComponent } from "@/lib/error-component";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/challenge")({
  component: ChallengePage,
  errorComponent: AppErrorComponent,
});

function ChallengePage() {
  const game = useStudy((s) => s.game);
  const startUltimate = useStudy((s) => s.startUltimate);
  const saveUltimateRun = useStudy((s) => s.saveUltimateRun);
  const finishUltimate = useStudy((s) => s.finishUltimate);
  const run = game.ultimateRun;
  const pool = useMemo(() => {
    const all = bbhVocab();
    const map = new Map(all.map((item) => [item.id, item]));
    if (!run) return [] as VocabItem[];
    return run.ids.map((id) => map.get(id)).filter((x): x is VocabItem => Boolean(x));
  }, [run]);

  const [typed, setTyped] = useState("");
  const [report, setReport] = useState<{ pct: number; hits: number; total: number; misses: VocabItem[] } | null>(null);

  useEffect(() => {
    if (run) setTyped(run.answers[run.i] ?? "");
  }, [run?.i]);

  function begin() {
    const ids = shuffle(bbhVocab()).map((item) => item.id);
    setReport(null);
    setTyped("");
    startUltimate(ids);
  }

  function submitCurrent() {
    if (!run) return;
    const answers = [...run.answers];
    answers[run.i] = typed;
    const nextI = run.i + 1;
    if (nextI >= run.ids.length) {
      const map = new Map(bbhVocab().map((item) => [item.id, item]));
      const misses: VocabItem[] = [];
      let hits = 0;
      run.ids.forEach((id, idx) => {
        const item = map.get(id);
        if (!item) return;
        if (glossMatches(item, answers[idx] ?? "")) hits += 1;
        else misses.push(item);
      });
      const total = run.ids.length;
      const pct = total ? Math.round((hits / total) * 100) : 0;
      finishUltimate(pct);
      setReport({ pct, hits, total, misses });
      setTyped("");
      return;
    }
    saveUltimateRun({ ids: run.ids, answers, i: nextI });
    setTyped(run.answers[nextI] ?? "");
  }

  if (report) {
    const passed = report.pct >= 90;
    const perfect = report.pct >= 100;
    return (
      <>
        <div className="mb-4">
          <GameMenu />
        </div>
        <Panel className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Ultimate Challenge</p>
          <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">{report.pct}%</h1>
          <p className="mt-2 text-muted">
            {report.hits} / {report.total} lemmas. Graded after the last card.
          </p>
          {perfect && (
            <div className="mt-3">
              <CrownBadge />
              <p className="mt-2 text-sm font-medium text-ink">
                Crown of the Text — perfect scroll. Bonus points are on your board.
              </p>
            </div>
          )}
          {passed && !perfect && (
            <p className="mt-3 text-sm font-medium text-ink">The Full Scroll badge is yours (90%+).</p>
          )}
          {!passed && (
            <p className="mt-3 text-sm text-muted">90% unlocks The Full Scroll. 100% is the Crown of the Text.</p>
          )}
        </Panel>
        {report.misses.length > 0 && (
          <Panel>
            <h2 className="font-display text-xl font-bold text-ink">Missed</h2>
            <ul className="mt-3 divide-y divide-border">
              {report.misses.slice(0, 40).map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="he-word text-xl">{item.hebrew}</span>
                  <span className="text-sm text-muted">{item.gloss}</span>
                </li>
              ))}
            </ul>
            {report.misses.length > 40 && (
              <p className="mt-2 text-xs text-muted">{report.misses.length - 40} more not listed.</p>
            )}
          </Panel>
        )}
        <div className="mt-4 flex flex-col gap-2">
          <Button onClick={begin}>Try again</Button>
          <Link to="/" className="text-center text-sm font-semibold text-primary">
            Back home
          </Link>
        </div>
      </>
    );
  }

  if (!run) {
    const n = bbhVocab().length;
    return (
      <>
        <div className="mb-4">
          <GameMenu />
        </div>
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Optional</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Ultimate Challenge</h1>
        <p className="mt-3 max-w-prose text-muted">
          One sitting. All {n} BBH 3rd-ed. lemmas (Ch. 2–19). Hebrew on the card; type the English gloss. No marks until
          you finish.
        </p>
        <ul className="mt-4 list-disc space-y-1 ps-5 text-sm text-ink">
          <li>90% or better — badge: The Full Scroll, plus bonus points.</li>
          <li>100% — Crown of the Text, the highest honor badge, and a larger bonus.</li>
        </ul>
        {game.ultimateAttempts > 0 && (
          <p className="mt-3 text-sm text-muted">
            Best so far: {game.ultimateBest}% · {game.ultimateAttempts} attempt
            {game.ultimateAttempts === 1 ? "" : "s"}
          </p>
        )}
        <Button className="mt-5 w-full" onClick={begin}>
          Begin the scroll
        </Button>
        <p className="mt-3 text-center text-sm">
          <Link to="/" className="font-semibold text-primary">
            Not now
          </Link>
        </p>
      </Panel>
      </>
    );
  }

  const item = pool[run.i];
  if (!item) {
    return (
      <Panel>
        <p className="text-sm text-muted">This run is empty.</p>
        <Button className="mt-3" onClick={begin}>
          Start over
        </Button>
      </Panel>
    );
  }

  return (
    <>
      <div className="mb-4">
        <GameMenu />
      </div>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Ultimate Challenge</p>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-ink">From memory</h1>
          <span className="text-sm tabular-nums text-muted">
            {run.i + 1} / {run.ids.length}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">No grade until the last word. Blank is wrong.</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-[var(--motion-fast)]"
            style={{ width: `${run.ids.length ? (run.i / run.ids.length) * 100 : 0}%` }}
          />
        </div>
      </Panel>

      <div className="rounded-[var(--radius-xl)] bg-card px-5 py-10 text-center shadow-[var(--shadow-border)]">
        <p className="he-word text-5xl">{item.hebrew}</p>
      </div>

      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          submitCurrent();
        }}
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="English gloss"
          className={cn(
            "h-12 w-full rounded-[var(--radius-md)] bg-card px-4 shadow-[var(--shadow-border)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          autoCapitalize="off"
          autoCorrect="off"
          autoFocus
        />
        <Button className="mt-3 w-full" type="submit">
          {run.i + 1 >= run.ids.length ? "Finish and grade" : "Next"}
        </Button>
      </form>
    </>
  );
}
