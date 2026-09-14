import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { StudyMenu } from "@/components/study-menu";
import { MixHe } from "@/components/grammar-play";
import { Panel } from "@/components/panel";
import { grammarTopicLabel, grammarNeighborId } from "@/lib/grammar";
import { grammarTrack } from "@/lib/grammar-tracks";
import { grammarUnitRecord, isGrammarUnitUnlocked } from "@/lib/game";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/lessons/$track/")({ component: StudyTrackPage });

function StudyTrackPage() {
  const { track: raw } = Route.useParams();
  const track = grammarTrack(raw);
  const game = useStudy((s) => s.game);

  if (!track) return <Navigate to="/lessons" />;

  const prevId = grammarNeighborId(track.id, -1);
  const nextId = grammarNeighborId(track.id, 1);
  const prev = prevId ? grammarTrack(prevId) : undefined;
  const next = nextId ? grammarTrack(nextId) : undefined;

  return (
    <>
      <Panel className="mb-4">
        <StudyMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Prepare</p>
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
          All units open for study. Pairing is practice. The exam lives in Game.
        </p>
        <p className="mt-2 text-sm">
          <Link to="/lessons" className="font-semibold text-primary">
            All lessons
          </Link>
          <span className="text-muted"> · </span>
          <Link to="/game/lessons/$track" params={{ track: track.id }} className="font-semibold text-primary">
            Exams
          </Link>
          {prev ? (
            <>
              <span className="text-muted"> · </span>
              <Link to="/lessons/$track" params={{ track: prev.id }} className="font-semibold text-primary">
                {grammarTopicLabel(prev)}
              </Link>
            </>
          ) : null}
          {next ? (
            <>
              <span className="text-muted"> · next </span>
              <Link to="/lessons/$track" params={{ track: next.id }} className="font-semibold text-primary">
                {grammarTopicLabel(next)}
              </Link>
            </>
          ) : null}
        </p>
      </Panel>
      <ol className="grid grid-cols-1 gap-2">
        {track.units.map((u) => {
          const rec = grammarUnitRecord(game, track.id, u.id);
          const examOpen = isGrammarUnitUnlocked(game, track.id, u.id);
          return (
            <li key={u.id}>
              <Link
                to="/lessons/$track/$unit"
                params={{ track: track.id, unit: String(u.id) }}
                className="block w-full rounded-[var(--radius-lg)] bg-card p-4 text-left shadow-[var(--shadow-border)]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-2xl font-bold">{u.title}</span>
                  <span className="text-xs text-muted">
                    {rec.cleared ? `exam ${rec.best}%` : examOpen ? "exam open" : "prepare"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{u.short}</p>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}
