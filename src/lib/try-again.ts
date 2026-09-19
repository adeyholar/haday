import { playAww, playGrade, playTryAgainCue } from "@/lib/sfx";

/** Global ladder: try-again is never a miss. */
export const CUE_TRY_AGAIN = "Try again";
export const CUE_NOT_YET = "Not yet — we'll bring it back";

export type FeedbackKind = "strong" | "retry" | "fail";

export function feedbackForWrong(wrongSoFar: number): "retry" | "fail" {
  return wrongSoFar <= 0 ? "retry" : "fail";
}

export function feedbackLabel(kind: FeedbackKind): string {
  if (kind === "strong") return "Correct";
  if (kind === "retry") return CUE_TRY_AGAIN;
  return CUE_NOT_YET;
}

/** First wrong does not count as a miss / weak. */
export function countsAsMiss(kind: FeedbackKind): boolean {
  return kind === "fail";
}

export function isStrong(kind: FeedbackKind): boolean {
  return kind === "strong";
}

export function playFeedback(kind: FeedbackKind) {
  if (kind === "strong") playGrade(true);
  else if (kind === "retry") playTryAgainCue();
  else playAww();
}
