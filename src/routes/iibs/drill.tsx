import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ScriptureTabs } from "@/components/iibs-door";
import { DrillSitting } from "@/components/drill-sitting";
import { FocusToggle } from "@/components/focus-toggle";
import { passagePlaceForPool } from "@/lib/etch";
import { findStudyItem } from "@/lib/tanakh-pool";
import { iibsPathItems } from "@/lib/iibs-weeks";
import { loadPassagePack, passageDrillKey } from "@/lib/reading-loop/passage";
import { useStudy } from "@/lib/store";
import type { VocabItem } from "@/lib/vocab";

type DrillSearch = { from?: string };

export const Route = createFileRoute("/iibs/drill")({
  validateSearch: (search: Record<string, unknown>): DrillSearch => ({
    from: typeof search.from === "string" && search.from.startsWith("/iibs/") ? search.from : undefined,
  }),
  component: ScripturePassageDrill,
});

function ScripturePassageDrill() {
  const { from } = Route.useSearch();
  const pack = useMemo(() => loadPassagePack(), []);
  const ready = pack?.scope === "iibs" ? pack : null;
  const saveDrillAt = useStudy((s) => s.saveDrillAt);
  const pool = useMemo(() => {
    const ids = ready?.ids ?? [];
    const items: VocabItem[] = [];
    for (const id of ids) {
      const item = findStudyItem(id) ?? iibsPathItems().find((row) => row.id === id);
      if (item) items.push(item);
    }
    return items;
  }, [ready]);
  const back = ready?.back || from;
  const placeKey = ready ? passageDrillKey(ready.scope, ready.ref) : "";

  return (
    <>
      <ScriptureTabs active="lab" />
      {!ready || !pool.length ? (
        <p className="text-sm text-ink">
          Open a chapter and choose a lemma, or Drill unknowns. This sitting stays on the Scripture Path.
          {back ? (
            <>
              {" "}
              <a href={back} className="font-semibold text-primary">
                Back to the reading
              </a>
            </>
          ) : null}
        </p>
      ) : (
        <DrillSitting
          pool={pool}
          label={ready.label}
          readPlace={() => passagePlaceForPool(useStudy.getState().game.drillRuns?.[placeKey], pool.map((item) => item.id))}
          writePlace={(place) => saveDrillAt(placeKey, place)}
          chrome={
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Scripture Path · Reading Lab</p>
              <p className="mt-2 text-sm text-ink">
                <span className="font-semibold">{ready.label}</span>
                <span className="text-muted"> · the lemmas this passage still needs</span>
              </p>
              {back ? (
                <a href={back} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary">
                  Back to the reading
                </a>
              ) : null}
              <FocusToggle pool={pool} />
            </>
          }
        />
      )}
    </>
  );
}
