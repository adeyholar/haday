import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { StudyMenu } from "@/components/study-menu";
import { GrammarPlay } from "@/components/grammar-play";
import { grammarTrack } from "@/lib/grammar-tracks";

export const Route = createFileRoute("/lessons/$track/$unit")({ component: StudyUnitPage });

function StudyUnitPage() {
  const { track: rawTrack, unit: rawUnit } = Route.useParams();
  const track = grammarTrack(rawTrack);
  const n = Number(rawUnit);
  const ok = Boolean(track) && Number.isInteger(n) && n >= 1 && track != null && n <= track.units.length;

  if (!track) return <Navigate to="/lessons" />;
  if (!ok) return <Navigate to="/lessons/$track" params={{ track: track.id }} />;

  return (
    <>
      <div className="mb-4">
        <StudyMenu />
      </div>
      {track.id === "verbs" ? (
        <p className="mb-4 text-sm">
          <Link to="/game/verbal-system" className="font-semibold text-primary">
            Verbal System
          </Link>
          <span className="text-muted"> · root, stem, and conjugation. Ten builds, nine right clears the round.</span>
          {n === 3 ? (
            <>
              {" "}
              <Link to="/game/verb-paradigm-quest" className="font-semibold text-primary">
                Verb Paradigm Quest
              </Link>
              <span className="text-muted"> · build the Qal perfect, ending and accent included. </span>
              <Link to="/game/qal-perfect" className="font-semibold text-primary">
                Qal Perfect Builder
              </Link>
              <span className="text-muted"> · all nine forms from the vowels and the ending. </span>
              <Link to="/game/qal-imperfect" className="font-semibold text-primary">
                Qal Imperfect Builder
              </Link>
              <span className="text-muted"> · ten forms, prefix and ending, until the four roots are known.</span>
            </>
          ) : null}
        </p>
      ) : null}
      <GrammarPlay key={`${track.id}-${n}-prep`} track={track} unitId={n} mode="prepare" />
    </>
  );
}
