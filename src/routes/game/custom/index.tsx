import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameMenu } from "@/components/game-menu";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import {
  CHAPTER_META,
  GAME_STAGES,
  chapterRecord,
  grammarUnitRecord,
  lessonProgress,
  mixPlayPool,
  mixableChapters,
  mixableGrammarTracks,
  type GameStageId,
} from "@/lib/game";
import { grammarTopicLabel } from "@/lib/grammar";
import { GRAMMAR_TRACKS } from "@/lib/grammar-tracks";
import { useStudy } from "@/lib/store";

type Kind = "vocab" | "grammar";
type Search = { kind?: Kind };

export const Route = createFileRoute("/game/custom/")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    kind: s.kind === "grammar" ? "grammar" : "vocab",
  }),
  component: CustomMixPage,
});

function CustomMixPage() {
  const { kind } = Route.useSearch();
  return kind === "grammar" ? <GrammarMixPicker /> : <VocabMixPicker />;
}

function MixTabs({ kind }: { kind: Kind }) {
  return (
    <div className="mt-4 flex gap-2">
      <Link
        to="/game/custom"
        search={{ kind: "vocab" }}
        className={cn(
          "rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold shadow-[var(--shadow-border)]",
          kind === "vocab" ? "bg-ink text-parchment" : "bg-card text-ink",
        )}
      >
        Vocabulary
      </Link>
      <Link
        to="/game/custom"
        search={{ kind: "grammar" }}
        className={cn(
          "rounded-[var(--radius-md)] px-3 py-2 text-sm font-semibold shadow-[var(--shadow-border)]",
          kind === "grammar" ? "bg-ink text-parchment" : "bg-card text-ink",
        )}
      >
        Grammar
      </Link>
    </div>
  );
}

function VocabMixPicker() {
  const game = useStudy((s) => s.game);
  const open = mixableChapters(game);
  const [picked, setPicked] = useState<number[]>(open);
  const [stage, setStage] = useState<GameStageId>("recognize");
  const pool = useMemo(() => mixPlayPool(picked), [picked]);

  function toggle(n: number) {
    setPicked((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n].sort((a, b) => a - b)));
  }

  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Custom mix</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Vocabulary, one sitting</h1>
        <p className="mt-3 max-w-prose text-muted">
          Lemmas only — the class word list you need to memorize. Grammar topics have their own mix. Tick open BBH
          chapters, pick Recognize, Gloss, or Spell. Chapter 1 starts open. This mix does not unlock or lock the path.
        </p>
        <MixTabs kind="vocab" />
      </Panel>

      <Panel className="mb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-ink">Levels</h2>
          <div className="flex gap-3 text-sm font-semibold">
            <button type="button" className="text-primary" onClick={() => setPicked(open)}>
              All open
            </button>
            <button type="button" className="text-muted" onClick={() => setPicked([])}>
              None
            </button>
          </div>
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {open.map((n) => {
            const on = picked.includes(n);
            const meta = CHAPTER_META[n];
            const cleared = chapterRecord(game, n).cleared;
            return (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => toggle(n)}
                  className={cn(
                    "flex w-full items-baseline justify-between gap-2 rounded-[var(--radius-md)] px-4 py-3 text-left shadow-[var(--shadow-border)]",
                    on ? "bg-ink text-parchment" : "bg-card text-ink",
                  )}
                >
                  <span>
                    <span className="text-sm font-semibold">Ch. {n}</span>
                    <span className="ms-2 font-display text-lg font-bold">{meta?.title}</span>
                  </span>
                  <span className={cn("flex items-center gap-1 text-xs", on ? "text-parchment/70" : "text-muted")}>
                    {cleared ? <Check className="size-3.5" /> : null}
                    {on ? "In mix" : "Add"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel className="mb-3">
        <h2 className="font-display text-2xl font-bold text-ink">How to play</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GAME_STAGES.map((s) => {
            const on = stage === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setStage(s.id)}
                  className={cn(
                    "w-full rounded-[var(--radius-md)] px-4 py-3 text-left shadow-[var(--shadow-border)]",
                    on ? "bg-ink text-parchment" : "bg-card",
                  )}
                >
                  <span className="block font-semibold">{s.name}</span>
                  <span className={cn("block text-sm", on ? "text-parchment/70" : "text-muted")}>{s.prompt}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel>
        <p className="text-sm text-muted">
          {picked.length
            ? `${pool.length} lemmas from ${picked.length} level${picked.length === 1 ? "" : "s"} · ${GAME_STAGES.find((s) => s.id === stage)?.name}`
            : "Tick at least one level."}
        </p>
        {picked.length ? (
          <Link to="/game/custom/play" search={{ chapters: picked.join(","), stage }} className="mt-4 block">
            <Button className="w-full" size="lg">
              Play the mix
            </Button>
          </Link>
        ) : (
          <Button className="mt-4 w-full" size="lg" disabled>
            Play the mix
          </Button>
        )}
      </Panel>
    </>
  );
}

function GrammarMixPicker() {
  const game = useStudy((s) => s.game);
  const open = mixableGrammarTracks(game);
  const [picked, setPicked] = useState<string[]>(open);

  function toggle(id: string) {
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  const ordered = GRAMMAR_TRACKS.filter((t) => open.includes(t.id));

  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Custom mix</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Grammar, one sitting</h1>
        <p className="mt-3 max-w-prose text-muted">
          Topics only — not the BBH word list. Tick the grammar paths you want, then play a 12-question mix from the
          units already open on those paths. Practice only: this mix does not unlock or lock a topic.
        </p>
        <MixTabs kind="grammar" />
      </Panel>

      <Panel className="mb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-ink">Topics</h2>
          <div className="flex gap-3 text-sm font-semibold">
            <button type="button" className="text-primary" onClick={() => setPicked(open)}>
              All open
            </button>
            <button type="button" className="text-muted" onClick={() => setPicked([])}>
              None
            </button>
          </div>
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ordered.map((t) => {
            const on = picked.includes(t.id);
            const prog = lessonProgress(game, t.id);
            const cleared = t.units.filter((u) => grammarUnitRecord(game, t.id, u.id).cleared).length;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => toggle(t.id)}
                  className={cn(
                    "flex w-full items-baseline justify-between gap-2 rounded-[var(--radius-md)] px-4 py-3 text-left shadow-[var(--shadow-border)]",
                    on ? "bg-ink text-parchment" : "bg-card text-ink",
                  )}
                >
                  <span>
                    <span className="font-display text-lg font-bold">{grammarTopicLabel(t)}</span>
                    <span className={cn("ms-2 text-xs", on ? "text-parchment/70" : "text-muted")}>
                      {cleared}/{t.units.length} cleared · unit {prog.unlockedUnit} open
                    </span>
                  </span>
                  <span className={cn("flex items-center gap-1 text-xs", on ? "text-parchment/70" : "text-muted")}>
                    {cleared >= t.units.length ? <Check className="size-3.5" /> : null}
                    {on ? "In mix" : "Add"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel>
        <p className="text-sm text-muted">
          {picked.length
            ? `${picked.length} topic${picked.length === 1 ? "" : "s"} · quiz from open units`
            : "Tick at least one topic."}
        </p>
        {picked.length ? (
          <Link to="/game/custom/play" search={{ tracks: picked.join(",") }} className="mt-4 block">
            <Button className="w-full" size="lg">
              Play the mix
            </Button>
          </Link>
        ) : (
          <Button className="mt-4 w-full" size="lg" disabled>
            Play the mix
          </Button>
        )}
      </Panel>
    </>
  );
}
