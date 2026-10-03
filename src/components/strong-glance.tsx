import { useEffect, useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { lessonById, stationById } from "@/lib/ladder";
import { lookupStrong, type StrongEntry } from "@/lib/strongs";

export function StrongGlance({ id }: { id: string }) {
  const [row, setRow] = useState<StrongEntry | null | undefined>(undefined);
  const search = useSearch({ strict: false }) as { from?: unknown };
  const from = typeof search.from === "string" ? search.from : "";
  const lesson = from ? lessonById(from) : undefined;
  const station = lesson ? stationById(lesson.stationId) : undefined;
  const greek = id.toUpperCase().startsWith("G");

  useEffect(() => {
    let cancelled = false;
    setRow(undefined);
    void lookupStrong(id).then((hit) => {
      if (!cancelled) setRow(hit);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="mt-3 rounded-[var(--radius-md)] bg-surface px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
        Strong’s {id} · {greek ? "Greek" : "Hebrew"}
      </p>
      {row === undefined ? <p className="mt-2 text-sm text-muted">Opening the lexicon…</p> : null}
      {row === null ? <p className="mt-2 text-sm text-muted">No lexicon entry for {id}.</p> : null}
      {row ? (
        <>
          <p className="he-word mt-1 text-3xl text-ink" dir={greek ? "ltr" : "rtl"} lang={greek ? "grc" : "he"}>
            {row.word}
          </p>
          {row.translit ? <p className="mt-1 text-sm text-ink">{row.translit}</p> : null}
          {row.pron ? <p className="text-sm text-muted">Pronounced {row.pron}</p> : null}
          {row.def ? <p className="mt-2 text-sm leading-relaxed text-ink">{row.def}</p> : null}
          {row.derivation ? <p className="mt-1 text-xs text-muted">{row.derivation}</p> : null}
          {row.kjv ? <p className="mt-1 text-xs text-muted">KJV: {row.kjv}</p> : null}
        </>
      ) : null}
      {lesson ? (
        <Link
          to="/study/lesson/$id"
          params={{ id: lesson.id }}
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary"
        >
          Back to lesson{station ? ` · ${station.name}` : ""}
        </Link>
      ) : null}
    </div>
  );
}
