import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { WeekSelect } from "@/components/week-select";
import { FocusToggle } from "@/components/focus-toggle";
import { GradeBanner } from "@/components/grade-banner";
import { Panel } from "@/components/panel";
import { shuffle, type VocabItem } from "@/lib/vocab";
import { pickEloDeck } from "@/lib/elo";
import { weekPlayPool } from "@/lib/tanakh-pool";
import { useStudy } from "@/lib/store";
import { playGrade } from "@/lib/sfx";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/match")({ component: MatchPage });

type Tile = { id: string; kind: "he" | "en"; label: string };
type Phase = "pair" | "pick" | "done";

function shortGloss(item: VocabItem): string {
  return item.gloss.split(/[,;]/)[0]?.trim() || item.gloss;
}

function MatchPage() {
  const week = useStudy((s) => s.week);
  const focus = useStudy((s) => s.focus);
  const rate = useStudy((s) => s.rate);
  const pool = useMemo(() => weekPlayPool(week), [week]);
  const [seed, setSeed] = useState(0);
  const [board, setBoard] = useState<VocabItem[]>([]);
  const [heTiles, setHeTiles] = useState<Tile[]>([]);
  const [enTiles, setEnTiles] = useState<Tile[]>([]);
  const [picked, setPicked] = useState<Tile | null>(null);
  const [locked, setLocked] = useState<Set<string>>(() => new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("pair");
  const [pickI, setPickI] = useState(0);
  const [pickOrder, setPickOrder] = useState<VocabItem[]>([]);
  const [pickChoices, setPickChoices] = useState<VocabItem[]>([]);
  const [pickSel, setPickSel] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  const [wrongN, setWrongN] = useState(0);

  useEffect(() => {
    const picked = pickEloDeck(pool, useStudy.getState().cards, 10);
    const seen = new Set<string>();
    const items: VocabItem[] = [];
    for (const x of picked) {
      const g = shortGloss(x);
      if (seen.has(g)) continue;
      seen.add(g);
      items.push(x);
      if (items.length >= 6) break;
    }
    setBoard(items);
    setHeTiles(shuffle(items.map((x) => ({ id: x.id, kind: "he" as const, label: x.hebrew }))));
    setEnTiles(shuffle(items.map((x) => ({ id: x.id, kind: "en" as const, label: shortGloss(x) }))));
    setPicked(null);
    setLocked(new Set());
    setWrong(null);
    setPhase("pair");
    setPickI(0);
    setPickOrder([]);
    setPickChoices([]);
    setPickSel(null);
    setRight(0);
    setWrongN(0);
  }, [pool, seed, focus]);

  const wrongIds = wrong ? wrong.split(":") : [];

  function tapTile(tile: Tile) {
    if (locked.has(tile.id) || phase !== "pair") return;
    if (wrong) return;
    if (!picked) {
      setPicked(tile);
      return;
    }
    if (picked.kind === tile.kind) {
      setPicked(tile);
      return;
    }
    if (picked.id === tile.id) {
      playGrade(true);
      rate(tile.id, "good");
      setLocked((prev) => new Set(prev).add(tile.id));
      setPicked(null);
      setRight((n) => n + 1);
      if (locked.size + 1 >= board.length) {
        const order = shuffle(board);
        setPickOrder(order);
        setPickChoices(shuffle(board));
        setPickI(0);
        setPhase("pick");
      }
      return;
    }
    playGrade(false);
    rate(picked.id, "again");
    rate(tile.id, "again");
    setWrong(`${picked.id}:${tile.id}`);
    setWrongN((n) => n + 1);
    window.setTimeout(() => {
      setWrong(null);
      setPicked(null);
    }, 650);
  }

  function tapPick(id: string) {
    if (pickSel || phase !== "pick") return;
    const item = pickOrder[pickI];
    if (!item) return;
    const ok = id === item.id;
    setPickSel(id);
    playGrade(ok);
    rate(item.id, ok ? "good" : "again");
    if (ok) setRight((n) => n + 1);
    else setWrongN((n) => n + 1);
  }

  function nextPick() {
    if (pickI + 1 >= pickOrder.length) {
      setPhase("done");
      return;
    }
    setPickI((n) => n + 1);
    setPickChoices(shuffle(board));
    setPickSel(null);
  }

  if (!pool.length) {
    return (
      <>
        <WeekSelect />
        <p className="mt-4 text-sm text-muted">Pick a study set first.</p>
      </>
    );
  }

  if (phase === "done") {
    return (
      <>
        <WeekSelect />
        <FocusToggle />
        <Panel className="mt-4 text-center">
          <p className="font-display text-4xl font-bold text-ink">
            {right} right · {wrongN} miss
          </p>
          <p className="mt-2 text-sm text-muted">You had to select both sides, then pick the lemma from the pad.</p>
          <Button className="mt-4 w-full" onClick={() => setSeed((n) => n + 1)}>
            New match board
          </Button>
        </Panel>
      </>
    );
  }

  if (phase === "pick") {
    const item = pickOrder[pickI];
    const ok = pickSel === item?.id;
    return (
      <>
        <WeekSelect />
        <FocusToggle />
        <Panel className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Select the Hebrew · {pickI + 1} / {pickOrder.length}
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-ink">{item ? shortGloss(item) : ""}</p>
          <p className="mt-1 text-sm text-muted">Tap the matching lemma. No typing — you have to pick it.</p>
        </Panel>
        <div dir="rtl" className="mt-3 grid grid-cols-2 gap-2">
          {pickChoices.map((c) => {
            const chosen = pickSel === c.id;
            const rightChoice = c.id === item?.id;
            return (
              <button
                key={c.id}
                type="button"
                disabled={Boolean(pickSel)}
                onClick={() => tapPick(c.id)}
                className={cn(
                  "min-h-16 rounded-[var(--radius-md)] px-3 py-2 shadow-[var(--shadow-border)]",
                  !pickSel && "bg-card",
                  pickSel && rightChoice && "bg-good text-white",
                  pickSel && chosen && !rightChoice && "bg-bad text-white",
                  pickSel && !chosen && !rightChoice && "bg-card text-muted",
                )}
              >
                <span className="he-word text-3xl leading-none">{c.hebrew}</span>
              </button>
            );
          })}
        </div>
        {pickSel && (
          <div className="mt-3">
            <GradeBanner ok={ok} />
            <Button className="mt-3 w-full" onClick={nextPick}>
              {pickI + 1 >= pickOrder.length ? "See score" : "Next"}
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <WeekSelect />
      <FocusToggle />
      <Panel className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Match</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink">Select the pair</h1>
        <p className="mt-2 text-sm text-muted">
          Tap a Hebrew word, then its English. Wrong pairs stay in play. Then you pick each lemma from a shuffled pad.
        </p>
        <p className="mt-2 text-sm tabular-nums text-muted">
          {locked.size} / {board.length} paired
        </p>
      </Panel>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <ul className="space-y-2" dir="rtl">
          {heTiles.map((t) => (
            <li key={`he-${t.id}`}>
              <TileBtn
                tile={t}
                on={picked?.kind === "he" && picked.id === t.id}
                locked={locked.has(t.id)}
                flash={wrongIds.includes(t.id)}
                onClick={() => tapTile(t)}
              />
            </li>
          ))}
        </ul>
        <ul className="space-y-2">
          {enTiles.map((t) => (
            <li key={`en-${t.id}`}>
              <TileBtn
                tile={t}
                on={picked?.kind === "en" && picked.id === t.id}
                locked={locked.has(t.id)}
                flash={wrongIds.includes(t.id)}
                onClick={() => tapTile(t)}
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function TileBtn({
  tile,
  on,
  locked,
  flash,
  onClick,
}: {
  tile: Tile;
  on: boolean;
  locked: boolean;
  flash: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      className={cn(
        "min-h-14 w-full rounded-[var(--radius-md)] px-3 py-2 text-left shadow-[var(--shadow-border)]",
        locked && "bg-good/15 text-ink",
        on && !locked && "bg-primary text-primary-foreground",
        flash && "bg-bad text-white",
        !on && !locked && !flash && "bg-card text-ink",
      )}
    >
      {tile.kind === "he" ? (
        <span className="he-word block text-center text-3xl leading-none">{tile.label}</span>
      ) : (
        <span className="block text-sm font-semibold">{tile.label}</span>
      )}
    </button>
  );
}
