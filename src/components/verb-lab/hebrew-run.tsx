import type { ReactNode } from "react";
import { hebrewRuns } from "@/lib/verb-lab/hebrew-runs";

/** English prose with Hebrew runs set apart, so the points are not pulled into the Latin line. */
export function HebrewRun({ text }: { text: string }): ReactNode {
  const runs = hebrewRuns(text);
  if (runs.length === 0) return text;
  return (
    <>
      {runs.map((run, index) =>
        run.hebrew ? (
          <span key={index} className="he-word font-normal" lang="he" dir="rtl">
            {run.text}
          </span>
        ) : (
          <span key={index}>{run.text}</span>
        ),
      )}
    </>
  );
}
