import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useParadigmAccess } from "@/components/paradigms/use-paradigm-progress";
import { loadParadigmLessonSession } from "@/components/paradigms/load-session";

type SessionProps = { lessonKey: string; children: ReactNode };

export function ParadigmLessonGate({ lessonKey, children }: { lessonKey: string; children: ReactNode }) {
  const { enabled } = useParadigmAccess();
  const [Session, setSession] = useState<ComponentType<SessionProps> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancel = false;
    loadParadigmLessonSession().then((mod) => {
      if (!cancel) setSession(() => mod.ParadigmLessonSession);
    });
    return () => {
      cancel = true;
    };
  }, [enabled]);

  if (!enabled || !Session) return children;
  return <Session lessonKey={lessonKey}>{children}</Session>;
}

export function ParadigmsLearnLink() {
  const { enabled } = useParadigmAccess();
  if (!enabled) return null;
  return (
    <Link
      to="/paradigms"
      search={{ retake: false }}
      className="mt-3 block rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-border)]"
    >
      <span className="font-display text-2xl font-bold text-ink">Paradigms</span>
      <p className="mt-1 text-sm text-muted">Strong verb, seven binyanim. On this phone. Offline once the page has loaded.</p>
    </Link>
  );
}
