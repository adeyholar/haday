import { schedule } from "@/lib/paradigm/srs";
import { chartRows, coveredSquareIds, examById, type ChartRow } from "@/lib/verb-lab/registry";
import { dueTotal, firstDueId, type VerbLabProgress } from "@/lib/verb-lab/progress";
import { isNoFormSquare, pgnLabel, pgnRank, type VerbPath } from "@/lib/verb-lab/stems";
import type { ClassId } from "@/lib/verb-lab/data";
import { GAME_STAGE_PASS } from "@/lib/game";

export { GAME_STAGE_PASS };

const DISTRACTORS = ["3ms", "3fs", "2ms", "2fs", "1cs", "3mp", "3fp", "2mp", "2fp", "1cp", "ms", "fs", "mp", "fp"];

export type PracticePrompt = {
  squareId: string;
  form: string;
  pgn: string;
  person: string;
  choices: { pgn: string; label: string }[];
  standard: boolean;
};

export type ExamAnswer = { squareId: string; correct: boolean };

export function nextPracticeBox(box: number | undefined, correct: boolean): number {
  return schedule(box == null ? undefined : { box, due: 0 }, correct, 0).box;
}

export function notePractice(progress: VerbLabProgress, squareId: string, correct: boolean): VerbLabProgress {
  return {
    ...progress,
    boxes: { ...progress.boxes, [squareId]: nextPracticeBox(progress.boxes[squareId], correct) },
    continueId: squareId,
  };
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const a = next[i];
    const b = next[j];
    if (a === undefined || b === undefined) continue;
    next[i] = b;
    next[j] = a;
  }
  return next;
}

function choicePool(rows: ChartRow[], answer: string, rng: () => number): { pgn: string; label: string }[] {
  const fromSquare = [...new Set(rows.map((row) => row.pgn).filter((pgn) => pgn && pgn !== "-"))];
  const extras = DISTRACTORS.filter((pgn) => pgn !== answer && !fromSquare.includes(pgn));
  const picked = [answer, ...shuffle(fromSquare.filter((pgn) => pgn !== answer), rng), ...shuffle(extras, rng)].slice(0, 4);
  return shuffle(picked, rng).map((pgn) => ({ pgn, label: pgnLabel(pgn) }));
}

function usableRows(rows: ChartRow[]): ChartRow[] {
  return [...rows].sort((a, b) => {
    if (a.parseEligible !== b.parseEligible) return a.parseEligible ? -1 : 1;
    return pgnRank(a.pgn) - pgnRank(b.pgn);
  });
}

export function practicePrompt(classId: ClassId, squareId: string, index: number, rng: () => number): PracticePrompt | null {
  const rows = usableRows(chartRows(classId, squareId));
  if (rows.length === 0) return null;
  const row = rows[index % rows.length];
  if (!row) return null;
  return {
    squareId,
    form: row.form,
    pgn: row.pgn,
    person: pgnLabel(row.pgn),
    choices: choicePool(rows, row.pgn, rng),
    standard: Boolean(row.displayMark),
  };
}

export function drawExam(classId: ClassId, examId: string, path: VerbPath, taught: number, rng: () => number): PracticePrompt[] {
  const exam = examById(examId);
  if (!exam || classId !== "strong") return [];
  const prompts: PracticePrompt[] = [];
  for (const squareId of coveredSquareIds(exam, classId, path, taught)) {
    const rows = usableRows(chartRows(classId, squareId));
    for (const row of rows.slice(0, 4)) {
      prompts.push({
        squareId,
        form: row.form,
        pgn: row.pgn,
        person: pgnLabel(row.pgn),
        choices: choicePool(rows, row.pgn, rng),
        standard: Boolean(row.displayMark),
      });
    }
  }
  return prompts;
}

export function squarePassed(answers: readonly ExamAnswer[], squareId: string): boolean {
  const mine = answers.filter((answer) => answer.squareId === squareId);
  if (mine.length === 0) return false;
  const right = mine.filter((answer) => answer.correct).length;
  return (right / mine.length) * 100 >= GAME_STAGE_PASS;
}

export function applyExam(progress: VerbLabProgress, answers: readonly ExamAnswer[]): VerbLabProgress {
  const squares = [...new Set(answers.map((answer) => answer.squareId))].filter((id) => !isNoFormSquare(id));
  const due = { ...progress.due };
  const cleared = new Set(progress.cleared);
  for (const squareId of squares) {
    const mine = answers.filter((answer) => answer.squareId === squareId);
    const missed = mine.filter((answer) => !answer.correct).length;
    if (squarePassed(answers, squareId)) {
      cleared.add(squareId);
      delete due[squareId];
    } else if (missed > 0) {
      cleared.delete(squareId);
      due[squareId] = (due[squareId] ?? 0) + missed;
    }
  }
  return { ...progress, due, cleared: [...cleared] };
}

export function reviewTarget(progress: VerbLabProgress): { id: string | null; total: number } {
  return { id: firstDueId(progress), total: dueTotal(progress) };
}
