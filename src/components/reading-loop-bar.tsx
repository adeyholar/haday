import { Link } from "@tanstack/react-router";
import type { KnownReport } from "@/lib/reading-loop/known";
import { savePassagePack, type StudyScope } from "@/lib/reading-loop/passage";
import type { ReadSession } from "@/lib/reading-loop/session";

export function ReadingLoopBar({
  scope,
  report,
  session,
  dim,
  onDim,
  refLabel,
  back,
}: {
  scope: StudyScope;
  report: KnownReport;
  session: ReadSession;
  dim: boolean;
  onDim: (on: boolean) => void;
  refLabel: string;
  back: string;
}) {
  const goalMet = session.today >= session.goal;
  return (
    <section className="mb-3 rounded-[var(--radius-lg)] bg-card px-3 py-3 shadow-[var(--shadow-border)]" aria-label="Reading practice">
      <p className="text-sm text-ink">
        {report.found ? (
          <>
            You know <span className="font-semibold">{report.pct}%</span> of the class lemmas in this chapter
            <span className="text-muted">
              {" "}
              · {report.known} of {report.found}
            </span>
          </>
        ) : (
          <span className="text-muted">No class lemmas from this path in the chapter yet.</span>
        )}
      </p>
      <p className="mt-1 text-sm text-muted">
        Verses today: <span className="font-semibold text-ink">{session.today}</span> of {session.goal}
        {goalMet ? " · goal met" : ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={dim}
          onClick={() => onDim(!dim)}
          className={`min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold ${dim ? "bg-ink text-parchment" : "bg-surface text-ink"}`}
        >
          {dim ? "Unknowns dimmed" : "Dim unknowns"}
        </button>
        {report.unknown.length ? (
          <Link
            to="/drill"
            search={{ set: "passage", from: back }}
            onClick={() =>
              savePassagePack({
                scope,
                ref: refLabel,
                label: refLabel,
                ids: report.unknown.map((item) => item.id),
                back,
              })
            }
            className="inline-flex min-h-11 items-center rounded-[var(--radius-md)] bg-primary px-3 text-sm font-semibold text-primary-foreground"
          >
            Drill unknowns · {report.unknown.length}
          </Link>
        ) : report.found ? (
          <p className="inline-flex min-h-11 items-center text-sm text-muted">Every class lemma here is mastered.</p>
        ) : null}
      </div>
    </section>
  );
}
