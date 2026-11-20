import { Link } from "@tanstack/react-router";

/** The same independent-pronoun quiz and drill, on every module. */
export function IndependentPronounLinks() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <Link
        to="/quiz"
        search={{ set: "pronouns" }}
        className="block rounded-[var(--radius-lg)] bg-card p-4 text-ink shadow-[var(--shadow-border)]"
      >
        <span className="block font-display text-xl font-bold">Pronoun quiz</span>
        <span className="mt-1 block text-sm text-muted">Independent pronouns. Person, not just “you.”</span>
      </Link>
      <Link
        to="/drill"
        search={{ set: "pronouns" }}
        className="block rounded-[var(--radius-lg)] bg-card p-4 text-ink shadow-[var(--shadow-border)]"
      >
        <span className="block font-display text-xl font-bold">Pronoun drill</span>
        <span className="mt-1 block text-sm text-muted">The same eleven forms, every way.</span>
      </Link>
    </div>
  );
}
