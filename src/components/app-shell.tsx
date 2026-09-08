import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CircleHelp,
  Compass,
  Crown,
  FileText,
  Headphones,
  House,
  Languages,
  Layers,
  Library,
  Link2,
  ListChecks,
  Medal,
  MoreHorizontal,
  PenLine,
  Repeat,
  ScrollText,
  Lightbulb,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { snapshotOf, useStudy } from "@/lib/store";
import { loadProgress, saveProgress } from "@/lib/progress";
import { loadHand, mergeHand, subscribeHand } from "@/lib/hand-style";
import { loadHandBank, saveHandBank } from "@/lib/hand-sync";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { BrandLockup } from "@/components/brand-lockup";
import { SfxToggle } from "@/components/sfx-toggle";
import { getAdminStatus } from "@/lib/admin";
import { scoreboard } from "@/lib/rewards";
import { HonorBadge, CrownBadge } from "@/components/honor-badge";
import { VisitorBeacon } from "@/components/visitor-beacon";
import { NavTip } from "@/components/nav-tip";
import { NavMenu, type NavItem } from "@/components/nav-menu";

const STUDY: NavItem[] = [
  { to: "/drill", label: "Drill", hint: "Flip cards", icon: Layers },
  { to: "/write", label: "Write", hint: "Type or hand-write", icon: PenLine },
  { to: "/quiz", label: "Quiz", hint: "Choice or type the gloss", icon: ListChecks },
  { to: "/rules", label: "Rules", hint: "See the rule in the text", icon: ScrollText },
  { to: "/match", label: "Match", hint: "Select pairs, then the lemma", icon: Link2 },
  { to: "/browse", label: "Lexicon", hint: "Week’s lemmas", icon: BookOpen },
  { to: "/alphabet", label: "Alef-bet lesson", hint: "See, follow, my hand", icon: Languages },
  { to: "/keep", label: "Zakhor", hint: "Daily keep", icon: Repeat },
  { to: "/guide", label: "Guide", hint: "How to use HaDay", icon: CircleHelp },
];

const GAME: NavItem[] = [
  { to: "/game", label: "BBH vocabulary", hint: "Chapter path", icon: Compass },
  { to: "/game/custom", label: "Custom mix", hint: "Your levels, one sitting", icon: Repeat },
  { to: "/game/alefbet", label: "Aleph-bet mastery", hint: "Letter games", icon: Languages },
  { to: "/game/syllables", label: "Syllables", hint: "Open, closed, shewa", icon: Layers },
  { to: "/game/nouns", label: "Nouns", hint: "Gender and number", icon: BookOpen },
  { to: "/game/article", label: "Article & vav", hint: "The, and", icon: Layers },
  { to: "/game/lessons", label: "Grammar", hint: "Prepositions to numbers", icon: ScrollText },
  { to: "/challenge", label: "Ultimate Challenge", hint: "Whole list, one sitting", icon: Crown },
];

const LISTEN: NavItem[] = [
  { to: "/listen", label: "Vocabulary", hint: "Hebrew, then English", icon: Headphones },
  { to: "/listen/read", label: "Tanakh", hint: "All 39 books", icon: BookOpen },
  { to: "/listen/read", hash: "torah", label: "Torah", hint: "Genesis–Deuteronomy", icon: BookOpen },
  { to: "/listen/read", hash: "neviim", label: "Nevi'im", hint: "Joshua–Malachi", icon: BookOpen },
  { to: "/listen/read", hash: "ketuvim", label: "Ketuvim", hint: "Psalms–Chronicles", icon: BookOpen },
];

function moreItems(admin: boolean): NavItem[] {
  const items: NavItem[] = [
    { to: "/ask", label: "Ask HaDay Hebraic AI", hint: "Clarify the lesson", icon: CircleHelp },
    { to: "/ideas", label: "Suggest a feature", hint: "Class inventory", icon: Lightbulb },
    { to: "/leaderboard", label: "Leaderboard", hint: "Class standings", icon: Medal },
    { to: "/rewards", label: "Rewards", hint: "Ranks and badges", icon: Trophy },
  ];
  if (admin) items.push({ to: "/admin", label: "Class roster", hint: "Visitors and learners", icon: Users });
  items.push({ to: "/legal", label: "Privacy", hint: "How we use your data", icon: FileText });
  items.push({ to: "/guide", label: "Guide", hint: "How to use HaDay", icon: CircleHelp });
  return items;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, isPending } = useCurrentUserState();
  const isPublic = pathname === "/login" || pathname === "/reset-password" || pathname === "/legal";
  const userId = user?.id ?? null;
  const [progressReady, setProgressReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const game = useStudy((s) => s.game);
  const streak = useStudy((s) => s.streak);
  const board = scoreboard(game, streak);
  const honor = board.honor;

  useEffect(() => {
    if (isPublic || !userId) {
      setProgressReady(false);
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    let unsub: (() => void) | undefined;
    let unsubHand: (() => void) | undefined;
    let timer: number | undefined;
    let handTimer: number | undefined;

    (async () => {
      let remote: Awaited<ReturnType<typeof loadProgress>> | undefined;
      try {
        remote = await loadProgress();
      } catch {
        remote = undefined;
      }
      if (cancelled) return;

      if (remote) {
        useStudy.getState().hydrateRemote(remote, userId);
      } else if (remote === undefined) {
        await useStudy.persist.rehydrate();
        if (cancelled) return;
        if (useStudy.getState().ownerId !== userId) {
          useStudy.getState().reset();
          useStudy.setState({ ownerId: userId, cards: {}, streak: 0, lastStudyDay: 0, sessions: 0 });
        }
      } else {
        useStudy.getState().reset();
        useStudy.setState({ ownerId: userId, cards: {}, streak: 0, lastStudyDay: 0, sessions: 0 });
        void saveProgress({ data: snapshotOf(useStudy.getState()) }).catch(() => {});
      }

      if (cancelled) return;
      setProgressReady(true);

      void getAdminStatus()
        .then((s) => {
          if (!cancelled) setIsAdmin(s.admin);
        })
        .catch(() => {
          if (!cancelled) setIsAdmin(false);
        });

      unsub = useStudy.subscribe((state) => {
        if (state.ownerId !== userId) return;
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          void saveProgress({ data: snapshotOf(state) }).catch(() => {});
        }, 700);
      });

      try {
        const remoteHand = await loadHandBank();
        if (!cancelled) mergeHand(remoteHand);
      } catch {
        /* keep local samples */
      }
      if (cancelled) return;
      unsubHand = subscribeHand(() => {
        window.clearTimeout(handTimer);
        handTimer = window.setTimeout(() => {
          void saveHandBank({ data: loadHand() }).catch(() => {});
        }, 800);
      });
    })();

    return () => {
      cancelled = true;
      unsub?.();
      unsubHand?.();
      if (timer !== undefined) window.clearTimeout(timer);
      if (handTimer !== undefined) window.clearTimeout(handTimer);
    };
  }, [isPublic, userId]);

  if (isPublic) {
    return (
      <div className="min-h-dvh text-fg">
        <VisitorBeacon />
        {children}
      </div>
    );
  }

  if (isPending || (user && !progressReady)) {
    return (
      <>
        <VisitorBeacon />
        <ShellSkeleton />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <VisitorBeacon />
        <RedirectToSignIn />
      </>
    );
  }

  return (
    <div className="min-h-dvh text-fg">
      <VisitorBeacon />
      <header className="sticky top-0 z-20 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <BrandLockup linked />
          <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
            <NavMenu
              label="Game"
              icon={Compass}
              items={GAME}
              active={pathname.startsWith("/game") || pathname.startsWith("/challenge")}
            />
            <NavMenu
              label="Study"
              icon={Library}
              items={STUDY}
              active={STUDY.some((x) => (x.to === "/" ? false : pathname === x.to || pathname.startsWith(`${x.to}/`))) || pathname === "/"}
            />
            <NavMenu
              label="Listen"
              icon={Headphones}
              items={LISTEN}
              active={pathname.startsWith("/listen")}
            />
            <NavTip label="Ask HaDay Hebraic AI">
              <Link
                to="/ask"
                aria-label="Ask HaDay Hebraic AI"
                title="Ask HaDay Hebraic AI"
                className={cn(
                  "flex size-11 items-center justify-center rounded-[var(--radius-md)]",
                  pathname === "/ask" ? "text-primary" : "text-muted",
                )}
              >
                <CircleHelp className="size-5" strokeWidth={pathname === "/ask" ? 2.2 : 1.8} />
              </Link>
            </NavTip>
            <NavMenu
              label="More"
              icon={MoreHorizontal}
              items={moreItems(isAdmin)}
              active={["/guide", "/rewards", "/leaderboard", "/admin", "/ask", "/ideas", "/legal"].includes(pathname)}
            />
            <NavTip label="Answer sounds">
              <SfxToggle />
            </NavTip>
            <HonorBadge honor={honor} compact className="hidden max-w-[7.5rem] sm:inline-flex" />
            {board.crown ? <CrownBadge compact className="hidden sm:inline-flex" /> : null}
            <div className="account-chip min-w-0 shrink">
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          <li>
            <NavTip label="Home" side="top" full>
              <Link
                to="/"
                title="Home"
                className={cn(
                  "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium",
                  pathname === "/" ? "text-primary" : "text-muted",
                )}
              >
                <House className="size-5" strokeWidth={pathname === "/" ? 2.2 : 1.8} />
                Home
              </Link>
            </NavTip>
          </li>
          <li>
            <NavMenu
              label="Game"
              icon={Compass}
              items={GAME}
              active={pathname.startsWith("/game") || pathname.startsWith("/challenge")}
              drop="up"
              tipSide="top"
              layout="bar"
            />
          </li>
          <li>
            <NavMenu
              label="Study"
              icon={Library}
              items={STUDY}
              active={STUDY.some((x) => x.to !== "/" && (pathname === x.to || pathname.startsWith(`${x.to}/`)))}
              drop="up"
              tipSide="top"
              layout="bar"
            />
          </li>
          <li>
            <NavMenu
              label="Listen"
              icon={Headphones}
              items={LISTEN}
              active={pathname.startsWith("/listen")}
              drop="up"
              tipSide="top"
              layout="bar"
            />
          </li>
        </ul>
      </nav>
    </div>
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
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · Hebraic Mentor</p>
        <div className="mt-3 h-10 w-2/3 animate-pulse rounded-[var(--radius-md)] bg-surface/80" />
        <div className="mt-3 h-16 animate-pulse rounded-[var(--radius-lg)] bg-surface/80" />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-surface/80" />
          <div className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-surface/80" />
          <div className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-surface/80" />
          <div className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-surface/80" />
        </div>
      </main>
    </div>
  );
}
