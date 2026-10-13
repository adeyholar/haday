import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RoadDeck, type RoadSet } from "@/components/road-deck";
import { IIBS_ROAD_LEVELS, iibsRoadList, isIibsRoadId, type IibsRoadId } from "@/lib/iibs-road";

const LEVEL_KEY = "haday-iibs-road-level";

function loadLevel(): IibsRoadId {
  try {
    const saved = localStorage.getItem(LEVEL_KEY);
    if (isIibsRoadId(saved)) return saved;
  } catch {
    /* ignore */
  }
  return "A";
}

function saveLevel(id: IibsRoadId) {
  try {
    localStorage.setItem(LEVEL_KEY, id);
  } catch {
    /* ignore */
  }
}

export const Route = createFileRoute("/iibs/road")({
  component: IibsRoadPage,
});

function IibsRoadPage() {
  const [level, setLevel] = useState<IibsRoadId>(loadLevel);
  const sets = useMemo<RoadSet[]>(() => {
    const levels = IIBS_ROAD_LEVELS.map((id) => {
      const items = iibsRoadList(id);
      return { id, label: id, title: `Level ${id}`, hint: `${items.length} words`, items };
    });
    const all = iibsRoadList("all");
    return [...levels, { id: "all", label: "All", title: "Levels A–E", hint: `${all.length} words`, items: all }];
  }, []);

  return (
    <>
      <p className="mb-3 text-sm">
        <Link to="/iibs/vocab" className="font-semibold text-primary">
          Vocab Builder
        </Link>
      </p>
      <RoadDeck
        kicker="Scripture Path · audio"
        sets={sets}
        setId={level}
        onSet={(id) => {
          if (!isIibsRoadId(id)) return;
          saveLevel(id);
          setLevel(id);
        }}
        blurb={(set) =>
          `${set.title} · ${set.items.length} words, in one sitting. Hebrew, then the plural when there is one, then the meaning. Same voice as Drill. The list repeats until you pause. Leave, and this level starts again at the first word. Hatikvah or Solemn stays under the words. The volume slider sets how loud the music is.`
        }
      />
    </>
  );
}
