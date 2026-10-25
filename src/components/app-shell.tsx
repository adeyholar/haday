import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { useRouteContext, useRouterState } from "@tanstack/react-router";
import { BrandLockup } from "@/components/brand-lockup";
import { PublicHeader } from "@/components/public-header";
import { VisitorBeacon } from "@/components/visitor-beacon";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isPublicReadingPath } from "@/lib/seo";

const SignedInShell = lazy(() => import("./signed-in-shell").then((mod) => ({ default: mod.SignedInShell })));

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sessionUser } = useRouteContext({ from: "__root__" });
  const { user } = useCurrentUserState();
  const openReading = isPublicReadingPath(pathname);
  const isPublic =
    pathname === "/login" ||
    pathname === "/reset-password" ||
    pathname === "/confirm-email" ||
    (openReading && !user && sessionUser == null);
  const doorsForVisitor = pathname === "/" && !user && sessionUser == null;

  useEffect(() => {
    if (!user?.id) return;
    try {
      window.localStorage.setItem("haday.seen-account", "1");
    } catch {
      /* the sign-in page still opens on Create account */
    }
  }, [user?.id]);

  if (isPublic) {
    return (
      <div className="min-h-dvh text-fg">
        <VisitorBeacon />
        <PublicHeader />
        {children}
      </div>
    );
  }

  if (doorsForVisitor) {
    return (
      <div className="min-h-dvh text-fg">
        <VisitorBeacon />
        <PublicHeader />
        <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">{children}</main>
      </div>
    );
  }

  return (
    <Suspense fallback={<ShellSkeleton />}>
      <SignedInShell>{children}</SignedInShell>
    </Suspense>
  );
}

function ShellSkeleton() {
  return (
    <div className="min-h-dvh text-fg">
      <header className="sticky top-0 z-20 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <BrandLockup />
          <div className="h-8 w-8 animate-pulse rounded-full bg-surface" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-4 pt-6">
        <p className="text-xs font-semibold tracking-[0.08em] text-primary">HaDay · HebRabbAi Mentor</p>
        <div className="mt-3 h-10 w-2/3 animate-pulse rounded-[var(--radius-md)] bg-surface/80" />
      </main>
    </div>
  );
}
