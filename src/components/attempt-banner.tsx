import { GradeBanner } from "@/components/grade-banner";
import { feedbackLabel, type FeedbackKind } from "@/lib/try-again";

export function AttemptBanner({
  kind,
  className,
}: {
  kind: FeedbackKind | null;
  className?: string;
}) {
  if (!kind) return null;
  return <GradeBanner className={className} ok={kind === "strong"} label={feedbackLabel(kind)} />;
}
