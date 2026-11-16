import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ScriptureTabs } from "@/components/iibs-door";
import { PassageQuiz } from "@/components/passage-quiz";
import { findStudyItem } from "@/lib/tanakh-pool";
import { iibsPathItems } from "@/lib/iibs-weeks";
import { loadPassagePack } from "@/lib/reading-loop/passage";
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
        <PassageQuiz pool={pool} label={ready.label} back={back} />
      )}
    </>
  );
}
