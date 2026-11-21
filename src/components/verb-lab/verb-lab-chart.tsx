import { Link } from "@tanstack/react-router";
import { chartRows, columnNotes, rootNote, type ChartRow } from "@/lib/verb-lab/registry";
import { columnLabel, pgnLabel } from "@/lib/verb-lab/stems";
import type { ClassId } from "@/lib/verb-lab/data";
import { VERB_FILES } from "@/lib/verb-lab/data";
import { nfc } from "@/lib/paradigms/nfc";

function FormLine({ row, also = false }: { row: ChartRow; also?: boolean }) {
  return (
    <div className={also ? "mt-1" : undefined}>
      <span className="he-word text-2xl text-ink" lang="he" dir="rtl">
        {row.form}
      </span>
      {also ? <span className="ms-2 text-xs text-muted">also</span> : null}
      {row.displayMark ? <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-primary">{row.displayMark}</span> : null}
    </div>
  );
}

export function VerbLabChart({ classId, squareId }: { classId: ClassId; squareId: string }) {
  const rows = chartRows(classId, squareId);
  const column = squareId.slice(squareId.indexOf(".") + 1);
  const notes = columnNotes(classId, column);
  const file = VERB_FILES[classId];
  const groups = new Map<string, ChartRow[]>();
  for (const row of rows) {
    const key = row.subtype ?? "";
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  const heading = columnLabel(column);
  return (
    <div>
      <p className="text-sm text-muted">
        Root <span className="he-word text-ink" lang="he" dir="rtl">{nfc(file.root)}</span>
        {rootNote(classId) ? <span className="mt-1 block">{rootNote(classId)}</span> : null}
      </p>
      {[...groups.entries()].map(([subtype, group]) => (
        <div key={subtype || "main"} className="mt-4 overflow-x-auto">
          {subtype ? <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{subtype}</p> : null}
          <table className="w-full min-w-[36rem] text-left text-sm">
            <caption className="sr-only">
              {heading.label}
              {heading.sub ? ` ${heading.sub}` : ""}
            </caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-2 py-2 font-semibold">Person</th>
                <th className="px-2 py-2 text-end font-semibold">Form</th>
                <th className="px-2 py-2 text-end font-semibold">In the Bible</th>
                <th className="px-2 py-2 font-semibold">Where</th>
              </tr>
            </thead>
            <tbody>
              {group.map((row) => (
                <tr key={row.key} className="border-b border-border align-top">
                  <td className="px-2 py-2 text-muted">{pgnLabel(row.pgn)}</td>
                  <td className="px-2 py-2 text-end">
                    <FormLine row={row} />
                    {row.alternates.map((alt) => (
                      <FormLine key={alt.key} row={alt} also />
                    ))}
                    {row.note ? <span className="mt-1 block text-xs text-muted">{row.note}</span> : null}
                  </td>
                  <td className="px-2 py-2 text-end">
                    {row.exampleWord ? (
                      <span className="he-word text-lg text-ink" lang="he" dir="rtl">
                        {row.exampleWord}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-2 text-xs text-muted">{row.exampleRef?.replace(/ #\d+$/, "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {notes.length ? (
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {notes.map((note) => (
            <li key={note.slice(0, 24)} className="border-s-2 border-primary ps-3">
              {note}
            </li>
          ))}
        </ul>
      ) : null}
      {classId === "strong" && squareId === "Qal.qatal" ? (
        <p className="mt-4 text-sm">
          <Link to="/quiz" search={{ set: "suffixes" }} className="font-semibold text-primary">
            Pronominal suffixes
          </Link>
          <span className="text-muted"> · Qal perfect 3ms with an object suffix. </span>
          <Link to="/drill" search={{ set: "suffixes" }} className="font-semibold text-primary">
            Drill them
          </Link>
        </p>
      ) : null}
      {classId === "strong" && squareId === "Qal.yiqtol" ? (
        <p className="mt-4 text-sm">
          <Link to="/quiz" search={{ set: "yiqtol" }} className="font-semibold text-primary">
            Qal imperfect suffixes
          </Link>
          <span className="text-muted"> · the stem before a pronominal suffix. </span>
          <Link to="/drill" search={{ set: "yiqtol" }} className="font-semibold text-primary">
            Drill them
          </Link>
        </p>
      ) : null}
    </div>
  );
}
