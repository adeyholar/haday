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
      {track.id === "verbs" && n === 3 ? (
        <p className="mb-4 text-sm">
          <Link to="/game/verb-paradigm-quest" className="font-semibold text-primary">
            Practice this paradigm
          </Link>
          <span className="text-muted"> · build the Qal perfect, ending and accent included.</span>
        </p>
      ) : null}
      <GrammarPlay key={`${track.id}-${n}-prep`} track={track} unitId={n} mode="prepare" />
    </>
  );
}
