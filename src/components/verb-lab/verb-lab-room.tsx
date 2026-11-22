import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Panel } from "@/components/panel";
import { VerbLabChart } from "@/components/verb-lab/verb-lab-chart";
import { VerbLabExam } from "@/components/verb-lab/verb-lab-exam";
import { VerbLabPractice } from "@/components/verb-lab/verb-lab-practice";
import { VerbLabWelcome } from "@/components/verb-lab/verb-lab-welcome";
import { WEAK_CLASSES, isWeakClassId, type ClassId } from "@/lib/verb-lab/data";
import { hydrateVerbLab } from "@/lib/verb-lab/progress";
import { readLocalProgress } from "@/lib/paradigms/local";
import {
  chartRows,
  classHasChart,
  examsForSquare,
  examsForStem,
  practiceIsStrong,
  squareRecord,
  teachingCite,
} from "@/lib/verb-lab/registry";
import type { VerbLabMode, VerbLabSearch, VerbLabTab } from "@/lib/verb-lab/redirects";
import { applyExam, notePractice, reviewTarget } from "@/lib/verb-lab/session";
import {
  GRID_COLUMNS,
  alsoCalled,
  columnLabel,
  columnLevel,
  squaresInColumn,
  squareTitle,
  stemFace,
  stemGate,
  stemOrder,
  taughtLevel,
  type StemId,
  type VerbPath,
} from "@/lib/verb-lab/stems";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { useOpenTerm } from "@/lib/use-open-term";
import { useStudy } from "@/lib/store";

function levelNumber(value: string): number | null {
  const match = /^L([1-7])$/.exec(value);
  return match ? Number(match[1]) : null;
}

export function VerbLabRoom({ path, search }: { path: VerbPath; search: VerbLabSearch }) {
  const to = path === "scripture" ? "/iibs/verb-lab" : "/verb-lab";
  const navigate = useNavigate();
  const term = useOpenTerm();
  const user = useCurrentUser();
  const raw = useStudy((s) => s.game.verbLab);
  const saveVerbLab = useStudy((s) => s.saveVerbLab);
  const progress = hydrateVerbLab(raw);
  const [placed, setPlaced] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [also, setAlso] = useState<StemId | null>(null);
  const [openStem, setOpenStem] = useState<StemId | null>(search.stem ?? null);

  useEffect(() => {
    if (!user) return;
    const saved = readLocalProgress(user.id);
    setPlaced(saved.placed ? levelNumber(saved.level) : null);
  }, [user]);

  useEffect(() => {
    if (search.stem) setOpenStem(search.stem);
  }, [search.stem]);

  const taught = taughtLevel(path, term, placed);
  const classId: ClassId = search.weak && isWeakClassId(search.weak) ? search.weak : "strong";
  const view = search.view ?? "room";

  function go(next: VerbLabSearch) {
    void navigate({ to, search: { from: search.from, ...next } });
  }

  function save(next: ReturnType<typeof hydrateVerbLab>) {
    saveVerbLab(next);
  }

  if (!progress.welcomed || view === "welcome") {
    return (
      <VerbLabWelcome
        path={path}
        onEnter={() => {
          save({ ...progress, welcomed: true });
          const nextView = !progress.welcomed && search.view && search.view !== "welcome" ? search.view : "room";
          go({ ...search, view: nextView });
        }}
      />
    );
  }

  if (view === "exam" && search.exam) {
    const stem = search.stem ?? "Qal";
    return (
      <Panel className="grid gap-3">
        <button type="button" className="min-h-11 w-fit text-sm font-semibold text-primary" onClick={() => go({ view: "room", stem })}>
          ‹ Verb Lab
        </button>
        <VerbLabExam
          examId={search.exam}
          path={path}
          taught={taught}
          stem={stem}
          onLeave={() => go({ view: "room", stem })}
          onDone={(answers) => {
            save(applyExam(progress, answers));
            go({ view: "room", stem });
          }}
        />
      </Panel>
    );
  }

  const openSquare = search.square;
  if (view === "square" && openSquare && classHasChart(classId, openSquare)) {
    return (
      <SquarePage
        path={path}
        classId={classId}
        squareId={openSquare}
        tab={search.tab ?? "chart"}
        mode={search.mode ?? "quiz"}
        taught={taught}
        cleared={progress.cleared.includes(openSquare)}
        box={progress.boxes[openSquare]}
        onBack={() => go({ view: "room", weak: classId === "strong" ? undefined : classId, stem: squareRecord(openSquare)?.stem })}
        onTab={(tab) => go({ ...search, view: "square", tab })}
        onMode={(mode) => go({ ...search, view: "square", mode })}
        onAnswer={(correct) => save(notePractice(progress, openSquare, correct))}
      />
    );
  }

  const review = reviewTarget(progress);
  const continueId = progress.continueId && classHasChart("strong", progress.continueId) ? progress.continueId : "Qal.qatal";

  return (
    <div className="grid gap-4">
      <Panel>
        <p className="min-h-11 text-sm font-semibold text-primary">
          <HubBack path={path} from={search.from} />
        </p>
        <h1 className="font-display text-4xl font-bold text-ink">Verb Lab</h1>
        <p className="mt-1 text-sm text-muted">
          Seven stems, one room.{" "}
          <button type="button" className="font-semibold text-primary" onClick={() => go({ view: "welcome" })}>
            About the stems
          </button>
        </p>
      </Panel>
      <Panel className="grid content-start gap-4 max-lg:min-h-[calc(100dvh-12rem)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Next</p>
        {review.total > 0 && review.id ? (
          <>
            <div className="flex items-center gap-4">
              <p className="font-display text-6xl font-semibold text-primary">{review.total}</p>
              <div>
                <p className="font-semibold text-ink">forms due</p>
                <p className="text-sm text-muted">{squareTitle(path, review.id)}</p>
              </div>
            </div>
            <button
              type="button"
              className="min-h-11 w-fit rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
              onClick={() => go({ view: "square", square: review.id ?? undefined, tab: "practice", mode: "quiz" })}
            >
              Review due forms
            </button>
          </>
        ) : (
          <p className="text-sm text-muted">Nothing due. Well kept.</p>
        )}
        <div className="border-t border-border pt-3">
          <p className="text-sm text-muted">Continue where you stopped</p>
          <p className="font-semibold text-ink">{squareTitle(path, continueId)} · Practice</p>
          <button
            type="button"
            className="mt-2 min-h-11 text-sm font-semibold text-primary"
            onClick={() => go({ view: "square", square: continueId, tab: "practice", mode: "quiz" })}
          >
            Continue
          </button>
        </div>
        <p className="text-center text-xs text-muted lg:hidden">The seven stems are below</p>
      </Panel>
      <Panel className="grid gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-ink">All forms</h2>
          <p className="text-xs text-muted">{showAll ? "Showing every square" : "Showing what you have been taught"}</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Root type">
          <ClassChip
            pressed={classId === "strong"}
            title="Strong verb"
            sub={`root ${teachingCite("strong")}`}
            onClick={() => go({ view: "room" })}
          />
          {WEAK_CLASSES.map((item) => (
            <ClassChip
              key={item.id}
              pressed={classId === item.id}
              title={item.id}
              sub={`${item.subtitle} · ${teachingCite(item.id)}`}
              onClick={() => go({ view: "room", weak: item.id })}
            />
          ))}
        </div>
        {classId !== "strong" ? (
          <p className="rounded-[var(--radius-md)] border border-dashed border-primary bg-surface px-3 py-2 text-sm text-ink">
            {classId} uses the verified chart for <span className="he-word" lang="he" dir="rtl">{teachingCite(classId)}</span>. Squares with no chart are not drawn. Weak roots have no exam yet.
          </p>
        ) : null}
        <button
          type="button"
          role="switch"
          aria-checked={showAll}
          className="flex items-center gap-2 text-sm text-ink"
          onClick={() => setShowAll((value) => !value)}
        >
          <span className={`relative h-6 w-10 rounded-full ${showAll ? "bg-primary" : "bg-border"}`}>
            <span className={`absolute top-1 size-4 rounded-full bg-card ${showAll ? "start-5" : "start-1"}`} />
          </span>
          Show all
        </button>
        <p className="text-sm text-muted">Dimmed stems are coming. Your class opens them.</p>
        <div className="hidden lg:block">
          <WideGrid
            path={path}
            classId={classId}
            taught={taught}
            showAll={showAll}
            also={also}
            progress={progress}
            onAlso={setAlso}
            onOpen={(square) => go({ view: "square", square, weak: classId === "strong" ? undefined : classId, tab: "chart" })}
            onExam={(exam, stem) => go({ view: "exam", exam, stem })}
          />
        </div>
        <div className="grid gap-2 lg:hidden">
          {stemOrder(path).map((stem) => (
            <PhoneStem
              key={stem}
              path={path}
              stem={stem}
              classId={classId}
              taught={taught}
              showAll={showAll}
              open={openStem === stem}
              also={also === stem}
              progress={progress}
              onToggle={() => setOpenStem((current) => (current === stem ? null : stem))}
              onAlso={() => setAlso((current) => (current === stem ? null : stem))}
              onOpen={(square) => go({ view: "square", square, weak: classId === "strong" ? undefined : classId, tab: "chart", stem })}
              onExam={(exam) => go({ view: "exam", exam, stem })}
            />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function HubBack({ path, from }: { path: VerbPath; from: VerbLabSearch["from"] }) {
  const label = from === "learn" ? "Learn" : from === "play" ? "Play" : "Practice";
  if (path === "scripture") {
    const to = from === "learn" ? "/iibs/learn" : from === "play" ? "/iibs/vocab" : "/iibs/study";
    return <Link to={to}>‹ {label}</Link>;
  }
  const to = from === "learn" ? "/hub/learn" : from === "play" ? "/hub/play" : "/hub/practice";
  return <Link to={to}>‹ {label}</Link>;
}

function ClassChip({ pressed, title, sub, onClick }: { pressed: boolean; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-w-28 shrink-0 rounded-[var(--radius-md)] border bg-card px-3 py-2 text-start text-sm shadow-[var(--shadow-border)] ${pressed ? "border-primary text-ink" : "border-border text-muted"}`}
    >
      <span className="block font-semibold">{title}</span>
      <span className="block text-xs">{sub}</span>
    </button>
  );
}

function AlsoCalled({ path, stem, open, onToggle }: { path: VerbPath; stem: StemId; open: boolean; onToggle: () => void }) {
  const face = stemFace(path, stem);
  const others = alsoCalled(path, stem);
  return (
    <div>
      <p className="font-display text-xl font-semibold text-ink">{face.en}</p>
      <p className="he-word text-muted" lang="he" dir="rtl">
        {face.he}
      </p>
      {path === "scripture" && stem === "Qal" ? (
        <p className="text-xs text-muted">
          also called Qal <span className="he-word" lang="he" dir="rtl">קַל</span>
        </p>
      ) : null}
      <button type="button" className="mt-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted" aria-expanded={open} onClick={onToggle}>
        Also called
      </button>
      {open ? (
        <p className="mt-2 rounded-[var(--radius-md)] border border-primary bg-surface p-2 text-xs text-muted">
          Other spellings. {others.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

function SquareButton({
  path,
  classId,
  squareId,
  taught,
  box,
  cleared,
  onOpen,
}: {
  path: VerbPath;
  classId: ClassId;
  squareId: string;
  taught: boolean;
  box: number | undefined;
  cleared: boolean;
  onOpen: (id: string) => void;
}) {
  const record = squareRecord(squareId);
  if (!record || record.noForm || !classHasChart(classId, squareId)) return null;
  const level = columnLevel(record.stem, record.column, path);
  const name = columnLabel(record.column);
  const label = name.sub ? `${name.label} · ${name.sub}` : name.label;
  const head = chartRows(classId, squareId)[0]?.form;
  if (!taught) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-border p-2 text-sm text-muted" aria-disabled="true">
        <span className="block font-semibold">{label}</span>
        <span>Opens at L{level}</span>
      </div>
    );
  }
  const ready = practiceIsStrong(box) && !cleared && examsForSquare(squareId, classId).length > 0;
  const tag = cleared ? "Cleared" : ready ? "Ready for the exam" : "";
  return (
    <button type="button" onClick={() => onOpen(squareId)} className={`grid gap-1 rounded-[var(--radius-md)] border bg-card p-2 text-start text-sm ${cleared || ready ? "border-primary" : "border-border"}`}>
      {tag ? <span className={`text-[10px] font-semibold uppercase tracking-wide ${cleared ? "text-good" : "text-primary"}`}>{tag}</span> : null}
      <span className="font-semibold text-ink">{label}</span>
      {head ? (
        <span className="he-word text-lg text-ink" lang="he" dir="rtl">
          {head}
        </span>
      ) : null}
    </button>
  );
}

function ExamButtons({
  path,
  stem,
  classId,
  taught,
  onExam,
}: {
  path: VerbPath;
  stem: StemId;
  classId: ClassId;
  taught: boolean;
  onExam: (exam: string) => void;
}) {
  if (!taught || classId !== "strong") return null;
  const exams = examsForStem(stem, classId);
  if (exams.length === 0) return null;
  return (
    <div className="mt-2 flex flex-col items-start gap-1">
      {exams.map((exam) => (
        <button key={exam.id} type="button" className="text-start text-xs font-semibold text-primary underline" onClick={() => onExam(exam.id)}>
          Take the {exam.title(path)}
        </button>
      ))}
    </div>
  );
}

function WideGrid({
  path,
  classId,
  taught,
  showAll,
  also,
  progress,
  onAlso,
  onOpen,
  onExam,
}: {
  path: VerbPath;
  classId: ClassId;
  taught: number;
  showAll: boolean;
  also: StemId | null;
  progress: ReturnType<typeof hydrateVerbLab>;
  onAlso: (stem: StemId | null) => void;
  onOpen: (square: string) => void;
  onExam: (exam: string, stem: StemId) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[60rem] border-separate border-spacing-2">
        <thead>
          <tr>
            <th />
            {GRID_COLUMNS.map((column) => (
              <th key={column.id} className="text-start text-xs font-semibold text-muted">
                {column.label}
                {column.sub ? <span className="block font-normal">{column.sub}</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stemOrder(path).map((stem) => {
            const open = taught >= stemGate(path, stem);
            return (
              <tr key={stem} id={`stem-${stem}`}>
                <th className={`w-36 align-top text-start ${open ? "" : "opacity-50"}`} scope="row">
                  <AlsoCalled path={path} stem={stem} open={also === stem} onToggle={() => onAlso(also === stem ? null : stem)} />
                  {open ? (
                    <ExamButtons path={path} stem={stem} classId={classId} taught={open} onExam={(exam) => onExam(exam, stem)} />
                  ) : (
                    <span className="mt-1 inline-block rounded-full border border-current px-2 text-[10px] uppercase tracking-wide text-muted">Coming · L{stemGate(path, stem)}</span>
                  )}
                </th>
                {!open && !showAll ? (
                  <td colSpan={GRID_COLUMNS.length} className="text-sm text-muted">
                    Opens at L{stemGate(path, stem)}.
                  </td>
                ) : (
                  GRID_COLUMNS.map((column) => (
                    <td key={column.id} className="align-top">
                      <div className="grid gap-1">
                        {squaresInColumn(column.id).map((slug) => {
                          const id = `${stem}.${slug}`;
                          const record = squareRecord(id);
                          if (!record) return null;
                          const squareTaught = taught >= columnLevel(record.stem, record.column, path);
                          return (
                            <SquareButton
                              key={id}
                              path={path}
                              classId={classId}
                              squareId={id}
                              taught={open && squareTaught}
                              box={progress.boxes[id]}
                              cleared={progress.cleared.includes(id)}
                              onOpen={onOpen}
                            />
                          );
                        })}
                      </div>
                    </td>
                  ))
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PhoneStem({
  path,
  stem,
  classId,
  taught,
  showAll,
  open,
  also,
  progress,
  onToggle,
  onAlso,
  onOpen,
  onExam,
}: {
  path: VerbPath;
  stem: StemId;
  classId: ClassId;
  taught: number;
  showAll: boolean;
  open: boolean;
  also: boolean;
  progress: ReturnType<typeof hydrateVerbLab>;
  onToggle: () => void;
  onAlso: () => void;
  onOpen: (square: string) => void;
  onExam: (exam: string) => void;
}) {
  const unlocked = taught >= stemGate(path, stem);
  const canOpen = unlocked || showAll;
  return (
    <section id={`stem-${stem}`} className={`rounded-[var(--radius-lg)] border bg-card shadow-[var(--shadow-border)] ${unlocked ? "border-border" : "border-dashed border-border"}`}>
      <div className="flex items-start gap-2 p-3">
        <button type="button" className="min-h-11 px-1 text-muted" aria-expanded={canOpen ? open : undefined} aria-disabled={!canOpen} disabled={!canOpen} onClick={onToggle}>
          {canOpen ? (open ? "▾" : "▸") : "·"}
        </button>
        <div className={unlocked ? "flex-1" : "flex-1 opacity-50"}>
          <AlsoCalled path={path} stem={stem} open={also} onToggle={onAlso} />
          {unlocked ? null : <span className="mt-1 inline-block rounded-full border border-current px-2 text-[10px] uppercase tracking-wide">Coming · L{stemGate(path, stem)}</span>}
        </div>
      </div>
      {open && canOpen ? (
        <div className="grid grid-cols-2 gap-2 px-3 pb-3">
          <div className="col-span-2">
            <ExamButtons path={path} stem={stem} classId={classId} taught={unlocked} onExam={onExam} />
          </div>
          {GRID_COLUMNS.flatMap((column) => squaresInColumn(column.id)).map((slug) => {
            const id = `${stem}.${slug}`;
            const record = squareRecord(id);
            if (!record || !classHasChart(classId, id)) return null;
            const squareTaught = taught >= columnLevel(record.stem, record.column, path);
            return (
              <SquareButton
                key={id}
                path={path}
                classId={classId}
                squareId={id}
                taught={unlocked && squareTaught}
                box={progress.boxes[id]}
                cleared={progress.cleared.includes(id)}
                onOpen={onOpen}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function SquarePage({
  path,
  classId,
  squareId,
  tab,
  mode,
  taught,
  cleared,
  box,
  onBack,
  onTab,
  onMode,
  onAnswer,
}: {
  path: VerbPath;
  classId: ClassId;
  squareId: string;
  tab: VerbLabTab;
  mode: VerbLabMode;
  taught: number;
  cleared: boolean;
  box: number | undefined;
  onBack: () => void;
  onTab: (tab: VerbLabTab) => void;
  onMode: (mode: VerbLabMode) => void;
  onAnswer: (correct: boolean) => void;
}) {
  const record = squareRecord(squareId);
  const stem = record?.stem ?? "Qal";
  const face = stemFace(path, stem);
  const name = columnLabel(record?.column ?? "");
  const title = name.sub ? `${name.label} · ${name.sub}` : name.label;
  const exams = examsForSquare(squareId, classId);
  const ready = practiceIsStrong(box) && !cleared && exams.length > 0 && taught >= (record ? columnLevel(record.stem, record.column, path) : 1);
  return (
    <Panel className="grid gap-4">
      <div>
        <button type="button" className="min-h-11 text-sm font-semibold text-primary" onClick={onBack}>
          ‹ Verb Lab
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          {face.en} <span className="he-word" lang="he" dir="rtl">{face.he}</span>
        </p>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h1 className="font-display text-4xl font-bold text-ink">{title}</h1>
          {cleared ? <span className="text-xs font-semibold uppercase tracking-wide text-good">Cleared</span> : null}
          {ready ? <span className="text-xs font-semibold uppercase tracking-wide text-primary">Ready for the exam</span> : null}
        </div>
        {name.sub && record?.column !== "jussive" && !record?.column.startsWith("participle") ? <p className="text-sm text-muted">{name.sub}</p> : null}
      </div>
      <p className="text-sm text-muted">
        {exams.length ? `Covered by ${exams.map((exam) => exam.title(path)).join("; ")}. The buttons are on the ${face.en} row.` : "No graded exam covers this square yet."}
      </p>
      <div className="flex gap-1 border-b border-border" role="tablist">
        {(["chart", "practice"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={tab === item}
            className={`min-h-11 border-b-2 px-4 text-sm font-semibold ${tab === item ? "border-primary text-primary" : "border-transparent text-muted"}`}
            onClick={() => onTab(item)}
          >
            {item === "chart" ? "Chart" : "Practice"}
          </button>
        ))}
      </div>
      {tab === "chart" ? (
        <VerbLabChart classId={classId} squareId={squareId} />
      ) : (
        <VerbLabPractice key={`${classId}:${squareId}:${mode}`} classId={classId} squareId={squareId} mode={mode} onMode={onMode} onAnswer={onAnswer} />
      )}
    </Panel>
  );
}
