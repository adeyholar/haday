import { createFileRoute, Link } from "@tanstack/react-router";
import { StudyMenu } from "@/components/study-menu";
import { Panel } from "@/components/panel";
import { grammarTopicLabel } from "@/lib/grammar";
import { GRAMMAR_TRACKS } from "@/lib/grammar-tracks";

export const Route = createFileRoute("/lessons/")({ component: StudyLessonsHubPage });

function StudyLessonsHubPage() {
  return (
    <>
      <Panel className="mb-4">
        <StudyMenu />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Prepare</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink">Grammar lessons</h1>
        <p className="mt-3 max-w-prose text-muted">
          Study first: notes, Tanakh verses, pairing practice. Every unit is open here. When you are ready, sit the
          closed-book exam in Game — 90% held opens the next exam.
        </p>
        <p className="mt-2 text-sm">
          <Link to="/game/lessons" className="font-semibold text-primary">
            Game · exams
          </Link>
        </p>
      </Panel>
      <ol className="grid grid-cols-1 gap-2">
        {GRAMMAR_TRACKS.map((t) => (
          <li key={t.id}>
            <Link
              to="/lessons/$track"
              params={{ track: t.id }}
              className="block w-full rounded-[var(--radius-lg)] bg-card p-4 text-left shadow-[var(--shadow-border)]"
              aria-label={grammarTopicLabel(t)}
            >
              <span className="font-display text-2xl font-bold">{t.title}</span>
              <p className="mt-1 text-sm text-muted">{t.blurb}</p>
              <p className="mt-1 text-sm text-muted">{t.units.length} units to prepare</p>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
