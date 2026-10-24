import { Link } from "@tanstack/react-router";
import { BrandLockup } from "@/components/brand-lockup";
import { PUBLIC_NAV } from "@/lib/public-nav";

export { PUBLIC_NAV };

/** Visitor bar. Blog is the public writing. */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-3">
        <div className="min-w-0 overflow-hidden">
          <BrandLockup linked />
        </div>
        <nav aria-label="Public" className="flex shrink-0 items-center gap-3 text-sm font-semibold">
          {PUBLIC_NAV.map((item) => (
            <Link key={item.label} to={item.to} className={item.to === "/login" ? "text-primary underline-offset-4 hover:underline" : "text-ink underline-offset-4 hover:underline"}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}