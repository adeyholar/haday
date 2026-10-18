import { useMemo } from "react";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { RoadDeck, type RoadSet } from "@/components/road-deck";
import { useIibsRoom } from "@/components/iibs-door";
import { iibsRoadList } from "@/lib/iibs-road";

export const Route = createFileRoute("/iibs/road")({
  component: IibsRoadPage,
});

function IibsRoadPage() {
  const room = useIibsRoom();
  const sets = useMemo<RoadSet[]>(() => {
    if (!room.level) return [];
    const items = iibsRoadList(room.level);
    return [{ id: room.level, label: room.level, title: `Level ${room.level}`, hint: `${items.length} words`, items }];
  }, [room.level]);

  if (!room.ready) return <p className="text-sm text-muted">Opening this level…</p>;
  if (!room.level) return <Navigate to="/iibs" />;

  const set = sets[0];
  if (!set) return <Navigate to="/iibs" />;

  return (
    <>
      <p className="mb-3 text-sm">
        <Link to="/iibs" className="font-semibold text-primary">
          This level
        </Link>
      </p>
      <RoadDeck
        kicker="Scripture Path · audio"
        sets={sets}
        setId={room.level}
        onSet={() => {}}
        blurb={(current) =>
          `${current.title} · ${current.items.length} words. Hebrew, then the plural when there is one, then the meaning. This level repeats. Other levels stay outside.`
        }
      />
    </>
  );
}
