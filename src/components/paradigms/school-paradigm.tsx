import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  rowLabel,
  schoolMark,
  schoolNotes,
  schoolPages,
  schoolShownForms,
  schoolTable,
  scriptureExamples,
  type SchoolCell,
} from "@/lib/paradigms/school-view";
import { osisTarget } from "@/lib/paradigms/refs";

export type ParadigmView = "school" | "scripture";

export function SchoolParadigm() {
  const [pageIndex, setPageIndex] = useState(0);
  const [view, setView] = useState<ParadigmView>("school");
  const pages = schoolPages();
  const page = pages[pageIndex];
  if (!page) return null;
  const table = schoolTable(page.page);
  const notes = schoolNotes(page.page);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Paradigms</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">{page.title}</h1>
      <p className="mt-1 text-sm text-muted">
        Page {page.page} of {pages.length}
      </p>
      <div className="mt-3 flex gap-2" role="group" aria-label="Paradigm view">
        <button type="button" className={chip(view === "school")} aria-pressed={view === "school"} onClick={() => setView("school")}>
          School
        </button>
        <button type="button" className={chip(view === "scripture")} aria-pressed={view === "scripture"} onClick={() => setView("scripture")}>
          Scripture
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" className="min-h-11 text-sm font-semibold text-primary" disabled={pageIndex === 0} onClick={() => setPageIndex((n) => Math.max(0, n - 1))}>
          Previous page
        </button>
        <button type="button" className="min-h-11 text-sm font-semibold text-primary" disabled={pageIndex >= pages.length - 1} onClick={() => setPageIndex((n) => Math.min(pages.length - 1, n + 1))}>
          Next page
        </button>
      </div>
      <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto">
        <article className="min-w-full snap-center">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="px-2 py-2">Row</th>
                  {table.binyanim.map((binyan) => (
                    <th key={binyan} className="px-2 py-2">{binyan}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.key} className="border-b border-border align-top">
                    <th className="px-2 py-2 text-xs font-semibold text-muted" scope="row">{row.label}</th>
                    {table.binyanim.map((binyan) => {
                      const place = row.byBinyan[binyan];
                      if (place?.kind === "covered") return null;
                      return (
                        <td key={binyan} className="px-2 py-2 align-top" rowSpan={place?.kind === "span" ? place.rowSpan : undefined}>
                          {place ? <SchoolStack cells={place.cells} view={view} span={place.kind === "span"} /> : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {notes.length ? (
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {notes.map((note) => (
                <li key={`${note.marker}-${note.text.slice(0, 12)}`}>
                  {note.marker} {note.text}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      </div>
    </div>
  );
}

function chip(on: boolean): string {
  return `min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold ${on ? "bg-ink text-parchment" : "bg-card text-muted"}`;
}

function SchoolStack({ cells, view, span = false }: { cells: SchoolCell[]; view: ParadigmView; span?: boolean }) {
  if (view === "scripture") return <SpanScripture cells={cells} labeled={span} />;
  const shown = span ? cells.slice(0, 1) : cells;
  return (
    <div>
      {shown.map((cell) => (
        <SchoolFace key={cell.id} cell={cell} />
      ))}
    </div>
  );
}

export function SpanScripture({ cells, labeled }: { cells: SchoolCell[]; labeled: boolean }) {
  return (
    <div className="space-y-2">
      {cells.map((cell) => (
        <div key={cell.id}>
          {labeled ? <p className="text-xs font-semibold text-muted">{rowLabel(cell)}</p> : null}
          <ScriptureFace id={cell.id} />
        </div>
      ))}
    </div>
  );
}

function SchoolFace({ cell }: { cell: SchoolCell }) {
  const mark = schoolMark(cell);
  if (cell.status === "shaded-like-strong") {
    return <p className="rounded bg-neutral-200 px-2 py-2 text-xs text-neutral-700">like strong</p>;
  }
  if (cell.status === "blank") return <p className="min-h-11" />;
  if (cell.status === "footnote-box-area") return <p className="text-xs text-muted">{mark || "**"}</p>;
  return (
    <div>
      {schoolShownForms(cell).map((form) => (
        <p key={`${cell.id}-${form}`} className="flex items-baseline justify-end gap-2">
          <span className="he-word text-lg text-ink" lang="he" dir="rtl">{form}</span>
          {mark ? <span className="text-xs text-muted">{mark}</span> : null}
        </p>
      ))}
    </div>
  );
}

function ScriptureFace({ id }: { id: string }) {
  const examples = scriptureExamples(id);
  if (!examples.length) return <p className="text-xs text-muted">no example found in WLC</p>;
  return (
    <ul className="space-y-1">
      {examples.map((example) => {
        const target = osisTarget(example.osis, example.wordIndex);
        return (
          <li key={`${example.osis}-${example.wordIndex}`}>
            <p className="he-word text-lg text-ink" lang="he" dir="rtl">{example.word}</p>
            {target ? (
              <Link
                to="/listen/read/$book/$ch"
                params={{ book: target.book, ch: target.ch }}
                search={{ v1: target.v1, v2: target.v2, w: target.w }}
                className="text-sm font-semibold text-primary"
              >
                {example.ref}
              </Link>
            ) : (
              <span className="text-sm">{example.ref}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
