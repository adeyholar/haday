import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ScriptureTabs } from "@/components/iibs-door";
import { PassageQuiz } from "@/components/passage-quiz";
import { findStudyItem } from "@/lib/tanakh-pool";
import { iibsPathItems } from "@/lib/iibs-weeks";
import { loadPassagePack } from "@/lib/reading-loop/passage";
import { openPassageSitting, passageSittingKey } from "@/lib/reading-loop/passage-quiz";
import { useStudy } from "@/lib/store";
import type { VocabItem } from "@/lib/vocab";

type DrillSearch = { from?: string };

export const Route = createFileRoute("/iibs/drill")({
  validateSearch: (search: Record<string, unknown>): DrillSearch => ({
    from: typeof search.from === "string" && search.from.startsWith("/iibs/") ? search.from : undefined,
  }),
  component: ScripturePassageDrill,
});

function itemsFor(ids: readonly string[]): VocabItem[] {
  const path = iibsPathItems();
  const items: VocabItem[] = [];
  for (const id of ids) {
    const item = findStudyItem(id) ?? path.find((row) => row.id === id);
    if (item) items.push(item);
  }
  return items;
}

function ScripturePassageDrill() {
  const { from } = Route.useSearch();
  const sittings = useStudy((s) => s.game.passageSittings);
  const iibsSittings = useMemo(
    () => Object.fromEntries(Object.entries(sittings ?? {}).filter(([key]) => key.startsWith("iibs:"))),
    [sittings],
  );
  const pack = useMemo(() => loadPassagePack(), []);
  const ready = pack?.scope === "iibs" ? pack : null;
  const saved = ready
    ? openPassageSitting(iibsSittings, passageSittingKey("iibs", ready.ref))
    : openPassageSitting(iibsSittings);
  const pool = useMemo(() => itemsFor(ready?.ids ?? saved?.ids ?? []), [ready, saved]);
  const label = ready?.label || saved?.label || "This passage";
  const back = ready?.back || saved?.back || from;
  const refName = ready?.ref || saved?.ref || "";
  const placeKey = refName ? passageSittingKey("iibs", refName) : "";
  const sitting = placeKey ? openPassageSitting(sittings, placeKey) : null;

  return (
    <>
      <ScriptureTabs active="lab" />
      {!placeKey || !pool.length ? (
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
        <PassageQuiz
          key={placeKey}
          placeKey={placeKey}
          scope="iibs"
          refName={refName}
          pool={pool}
          label={label}
          back={back}
          saved={sitting}
        />
      )}
    </>
  );
}
