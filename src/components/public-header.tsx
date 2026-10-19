import { Link } from "@tanstack/react-router";
import { BrandLockup } from "@/components/brand-lockup";

/** Visitor bar. Teachings is added when the posts exist. */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-3">
        <div className="min-w-0 overflow-hidden">
          <BrandLockup linked />
        </div>
        <nav aria-label="Public" className="flex shrink-0 items-center gap-3 text-sm font-semibold">
          <Link to="/about" className="text-ink underline-offset-4 hover:underline">
            About
          </Link>
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
