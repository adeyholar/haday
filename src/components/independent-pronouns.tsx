import { Link } from "@tanstack/react-router";

/** Independent pronouns and the Qal perfect suffix chart, on every module. */
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
      <Link
        to="/quiz"
        search={{ set: "suffixes" }}
        className="block rounded-[var(--radius-lg)] bg-card p-4 text-ink shadow-[var(--shadow-border)]"
      >
        <span className="block font-display text-xl font-bold">Suffix quiz</span>
        <span className="mt-1 block text-sm text-muted">Qal perfect 3ms. Person, not just “you.”</span>
      </Link>
      <Link
        to="/drill"
        search={{ set: "suffixes" }}
        className="block rounded-[var(--radius-lg)] bg-card p-4 text-ink shadow-[var(--shadow-border)]"
      >
        <span className="block font-display text-xl font-bold">Suffix drill</span>
        <span className="mt-1 block text-sm text-muted">He killed him, her, you, me, them, us.</span>
      </Link>
    </div>
  );
}
