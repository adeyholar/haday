import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { GameMenu } from "@/components/game-menu";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/cn";
import { grammarTopicLabel, grammarNeighborId } from "@/lib/grammar";
import { grammarTrack } from "@/lib/grammar-tracks";
import { grammarUnitRecord, isGrammarUnitUnlocked } from "@/lib/game";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/game/lessons/$track/")({ component: GrammarTrackMapPage });

function MixHe({ text }: { text: string }) {
  const re = /[\u0590-\u05FF]+/g;
  const nodes: Array<string | { he: string; k: number }> = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push({ he: m[0], k: i++ });
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return (
    <>
      {nodes.map((n, idx) =>
        typeof n === "string" ? (
          <span key={idx}>{n}</span>
        ) : (
          <span key={n.k} className="he-word" dir="rtl" lang="he">
            {n.he}
          </span>
        ),
      )}
    </>
  );
}

function GrammarTrackMapPage() {
  const { track: raw } = Route.useParams();
  const track = grammarTrack(raw);
  const game = useStudy((s) => s.game);

  if (!track) return <Navigate to="/game/article" />;

  const prevId = grammarNeighborId(track.id, -1);
  const nextId = grammarNeighborId(track.id, 1);
  const prev = prevId ? grammarTrack(prevId) : undefined;
  const next = nextId ? grammarTrack(nextId) : undefined;

  return (
    <>
      <Panel className="mb-4">
        <GameMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Grammar topic
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">{track.title}</h1>
        <p className="mt-1 text-sm font-semibold text-primary">{track.short}</p>
        <div className="mt-3 max-w-prose space-y-3 text-ink">
          {track.intro.split(/\n\n+/).map((p) => (
            <p key={p.slice(0, 24)}>
              <MixHe text={p} />
            </p>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          Four units: learn with real verses, pair the forms, then a 12-question quiz. 90% held unlocks the next
          unit. Original notes and Masoretic examples — not a textbook reprint.
        </p>
        <p className="mt-2 text-sm">
          <Link to="/game/lessons" className="font-semibold text-primary">
            All grammar topics
          </Link>
          {prev ? (
            <>
              <span className="text-muted"> · </span>
              <Link
                to="/game/lessons/$track"
                params={{ track: prev.id }}
                className="font-semibold text-primary"
              >
                {grammarTopicLabel(prev)}
              </Link>
            </>
          ) : (
            <>
              <span className="text-muted"> · </span>
              <Link to="/game/article" className="font-semibold text-primary">
                Article & vav
              </Link>
            </>
          )}
          {next ? (
            <>
              <span className="text-muted"> · next </span>
              <Link
                to="/game/lessons/$track"
                params={{ track: next.id }}
                className="font-semibold text-primary"
              >
                {grammarTopicLabel(next)}
              </Link>
            </>
          ) : null}
        </p>
      </Panel>
      <ol className="grid grid-cols-1 gap-2">
        {track.units.map((u) => {
          const rec = grammarUnitRecord(game, track.id, u.id);
          const unlocked = isGrammarUnitUnlocked(game, track.id, u.id);
          const current = unlocked && !rec.cleared;
          const inner = (
            <>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-display text-2xl font-bold">{u.title}</span>
                {rec.cleared ? (
                  <Check className="size-4 shrink-0 text-good" />
                ) : unlocked ? (
                  <span className="text-xs text-muted">{u.short}</span>
                ) : (
                  <Lock className="size-4 shrink-0 text-muted" />
                )}
              </div>
              <p className={cn("mt-1 text-sm", current ? "text-primary-foreground/80" : "text-muted")}>{u.short}</p>
              {rec.cleared ? (
                <p className="mt-1 text-sm tracking-widest text-primary">
                  {"★".repeat(Math.min(3, rec.stars))} · best {rec.best}%
                </p>
              ) : null}
            </>
          );
          const cls = cn(
            "block w-full rounded-[var(--radius-lg)] p-4 text-left shadow-[var(--shadow-border)]",
            rec.cleared && "bg-card",
            current && "bg-primary text-primary-foreground",
            unlocked && !current && !rec.cleared && "bg-card",
            !unlocked && "bg-surface text-muted",
          );
          return (
            <li key={u.id}>
              {unlocked ? (
                <Link to="/game/lessons/$track/$unit" params={{ track: track.id, unit: String(u.id) }} className={cls}>
                  {inner}
                </Link>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
