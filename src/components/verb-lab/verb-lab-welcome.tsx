import { welcomeRow } from "@/lib/verb-lab/welcome";
import { stemFace, stemPairs, type VerbPath } from "@/lib/verb-lab/stems";

function Cell({ form, count }: { form: string | null; count: number | null }) {
  if (!form) {
    return (
      <td className="px-2 py-2 text-end">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Not in the Bible</span>
      </td>
    );
  }
  return (
    <td className="px-2 py-2 text-end">
      <span className="he-word text-xl text-ink" lang="he" dir="rtl">
        {form}
      </span>
      {count != null ? <span className="mt-1 block text-xs text-muted">{count}× in the Bible</span> : null}
    </td>
  );
}

export function VerbLabWelcome({ path, onEnter }: { path: VerbPath; onEnter: () => void }) {
  const hitpael = stemFace(path, "Hitpael").en;
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Verb Lab · about the stems</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Seven stems</h1>
      </div>
      <p className="max-w-prose text-ink">
        A Hebrew verb root can be built in up to seven stems. Each stem has its own voice. Six of them come in pairs, an active stem and its passive. {hitpael} stands alone: reflexive / reciprocal.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-2 py-2 font-semibold">Stem</th>
              <th className="px-2 py-2 font-semibold">Voice</th>
              <th className="px-2 py-2 text-end font-semibold">
                <span className="he-word normal-case tracking-normal" lang="he" dir="rtl">
                  פקד
                </span>
              </th>
              <th className="px-2 py-2 text-end font-semibold">
                <span className="he-word normal-case tracking-normal" lang="he" dir="rtl">
                  שמר
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {stemPairs(path).map((group) =>
              group.map((stem, index) => {
                const row = welcomeRow(stem);
                const face = stemFace(path, stem);
                const alone = group.length === 1;
                return (
                  <tr key={stem} className={`border-b border-border ${alone ? "border-s border-dashed border-primary" : index === 0 ? "border-s-2 border-primary" : "border-s-2 border-primary"}`}>
                    <th className="px-2 py-2 text-start font-semibold text-ink" scope="row">
                      {face.en}{" "}
                      <span className="he-word font-normal" lang="he" dir="rtl">
                        {face.he}
                      </span>
                    </th>
                    <td className="px-2 py-2 text-muted">{row.voice}</td>
                    <Cell form={row.paqad} count={row.paqadCount} />
                    <Cell form={row.shamar} count={row.shamarCount} />
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">
        <span className="he-word text-ink" lang="he" dir="rtl">
          פקד
        </span>{" "}
        is found in all seven stems.{" "}
        <span className="he-word text-ink" lang="he" dir="rtl">
          שמר
        </span>{" "}
        has no Pual, Hiphil, or Hophal in the Hebrew Bible. Forms are the standard 3 masc. sg. qatal. Counts are every form of that stem. Rows follow this path.
      </p>
      <button type="button" className="min-h-11 w-fit rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground" onClick={onEnter}>
        Enter the Verb Lab
      </button>
    </div>
  );
}
