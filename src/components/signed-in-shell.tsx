import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useRouteContext, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  CircleHelp,
  Compass,
  FileText,
  Headphones,
  House,
  Library,
  ListChecks,
  Medal,
  Mic,
  MoreHorizontal,
  ScrollText,
  Lightbulb,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { snapshotOf, useStudy } from "@/lib/store";
import { loadProgress, saveProgress } from "@/lib/progress";
import { loadHand, mergeHand, subscribeHand } from "@/lib/hand-style";
import { loadHandBank, saveHandBank } from "@/lib/hand-sync";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { BrandLockup } from "@/components/brand-lockup";
import { SfxToggle } from "@/components/sfx-toggle";
import { getAdminStatus } from "@/lib/admin";
import { getMyPath, type MyPath } from "@/lib/learner-path";
import { blockedDestination, currentDoor, homeForAccount, ownerDoorBlock, secondTermBlock, subscribeHall, subscribeTerm, termForAccount, termHallOpen, termRevisionNow, noteServerTerm } from "@/lib/path";
import { enterTermWeek } from "@/lib/term-week";
import { scoreboard } from "@/lib/rewards";
import { HonorBadge, CrownBadge } from "@/components/honor-badge";
import { VisitorBeacon } from "@/components/visitor-beacon";
import { NavTip } from "@/components/nav-tip";
import { isPublicReadingPath } from "@/lib/seo";
import { NavMenu, type NavItem } from "@/components/nav-menu";

type ShellTab = {
  to: "/bbh" | "/iibs" | "/iibs/learn" | "/iibs/study" | "/iibs/vocab" | "/iibs/road" | "/hub/learn" | "/hub/practice" | "/hub/play" | "/hub/listen";
  label: string;
  icon: typeof House;
  on: boolean;
};

function shellTabs(room: "scripture" | "grammar" | "home-only", pathname: string): ShellTab[] {
  if (room === "home-only") return [{ to: "/bbh", label: "Home", icon: House, on: pathname === "/bbh" }];
  if (room === "scripture") {
    const inRoom =
      pathname === "/iibs" ||
      (pathname.startsWith("/iibs/") &&
        !pathname.startsWith("/iibs/learn") &&
        !pathname.startsWith("/iibs/study") &&
        !pathname.startsWith("/iibs/vocab") &&
        !pathname.startsWith("/iibs/road") &&
        !pathname.startsWith("/iibs/wlc"));
    return [
      { to: "/iibs", label: "Home", icon: House, on: inRoom },
      { to: "/iibs/learn", label: "Learn", icon: Library, on: pathname.startsWith("/iibs/learn") || pathname.startsWith("/iibs/wlc") },
      { to: "/iibs/study", label: "Practice", icon: ListChecks, on: pathname.startsWith("/iibs/study") },
      { to: "/iibs/vocab", label: "Play", icon: Compass, on: pathname.startsWith("/iibs/vocab") },
      { to: "/iibs/road", label: "Listen", icon: Headphones, on: pathname.startsWith("/iibs/road") },
    ];
  }
  const practice = ["/hub/practice", "/drill", "/quiz", "/write", "/match", "/weak", "/cards", "/type", "/self-quiz", "/keep"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return [
    { to: "/bbh", label: "Home", icon: House, on: pathname === "/bbh" },
    {
      to: "/hub/learn",
      label: "Learn",
      icon: Library,
      on:
        pathname.startsWith("/hub/learn") ||
        pathname.startsWith("/rules") ||
        pathname.startsWith("/alphabet") ||
        pathname.startsWith("/browse") ||
        pathname.startsWith("/finder") ||
        pathname.startsWith("/lessons") ||
        (pathname.startsWith("/study") &&
          !pathname.startsWith("/study/term2/game") &&
          !pathname.startsWith("/study/term2/listen") &&
          !pathname.startsWith("/study/term2/exam")),
    },
    { to: "/hub/practice", label: "Practice", icon: ListChecks, on: practice },
    {
      to: "/hub/play",
      label: "Play",
      icon: Compass,
      on:
        pathname.startsWith("/hub/play") ||
        pathname.startsWith("/game") ||
        pathname.startsWith("/challenge") ||
        pathname.startsWith("/study/term2/game") ||
        pathname.startsWith("/study/term2/exam"),
    },
    {
      to: "/hub/listen",
      label: "Listen",
      icon: Headphones,
      on: pathname.startsWith("/hub/listen") || pathname.startsWith("/listen") || pathname.startsWith("/study/term2/listen"),
    },
  ];
}

function moreItems(admin: boolean, iibsSide: boolean): NavItem[] {
  const items: NavItem[] = [
    { to: "/ideas", label: "Suggest a feature", hint: "Class inventory", icon: Lightbulb },
  ];
  if (!iibsSide) {
    items.push({ to: "/leaderboard", label: "Leaderboard", hint: "Class standings", icon: Medal });
    items.push({ to: "/rewards", label: "Rewards", hint: "Ranks and badges", icon: Trophy });
  }
  if (admin) {
    items.push({ to: "/admin/blogs", label: "Blogs desk", hint: "Write a public post", icon: BookOpen });
    items.push({ to: "/admin", label: "Class roster", hint: "Visitors and learners", icon: Users });
    items.push({ to: "/admin/use", label: "What the class uses", hint: "Visits and practice", icon: BarChart3 });
    if (!iibsSide) items.push({ to: "/admin/voice", label: "Voice bank", hint: "Record class words", icon: Mic });
  }
  items.push({ to: "/", label: "Home page", hint: "The front door", icon: House });
  items.push({ to: "/how-to-memorize-biblical-hebrew-vocabulary", label: "Vocabulary method", hint: "How to learn the words", icon: Library });
  items.push({ to: "/blogs", label: "Teachings", hint: "Scripture writing", icon: BookOpen });
  items.push({ to: "/learning-hebrabbai", label: "Learning HebRabbAi", hint: "Guides for the app", icon: BookOpen });
  items.push({ to: "/about", label: "About", hint: "The teacher", icon: User });
  items.push({ to: "/legal", label: "Privacy", hint: "How we use your data", icon: FileText });
  items.push({ to: "/credits", label: "Credits", hint: "Audio, text, open works", icon: ScrollText });
  if (!iibsSide) items.push({ to: "/guide", label: "Guide", hint: "How to use HaDay", icon: CircleHelp });
  return items;
}

export function SignedInShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sessionUser } = useRouteContext({ from: "__root__" });
  const { user, isPending } = useCurrentUserState();
  const openReading = isPublicReadingPath(pathname);
  const isPublic =
    pathname === "/login" ||
    pathname === "/reset-password" ||
    (openReading && !user && sessionUser == null);
  const doorsForVisitor = pathname === "/" && !user && sessionUser == null;
  const userId = user?.id ?? null;
  const [progressReady, setProgressReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pathGate, setPathGate] = useState<MyPath | null>(null);
  const [doorReady, setDoorReady] = useState(false);
  const [hall, setHall] = useState(false);
  const [hideBars, setHideBars] = useState(false);
  const game = useStudy((s) => s.game);
  const streak = useStudy((s) => s.streak);
  const board = scoreboard(game, streak);
  const honor = board.honor;

  useEffect(() => {
    if (isPublic || !userId) {
      setProgressReady(false);
      setIsAdmin(false);
      setPathGate(null);
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

      const seenTerm = termRevisionNow();
      void getMyPath()
        .then((gate) => {
          if (cancelled) return;
          const term = noteServerTerm(termForAccount(gate), seenTerm);
          setPathGate({ ...gate, term });
        })
        .catch(() => {
          if (!cancelled) setPathGate({ path: "bbh", cleared: null, admin: false, term: 1 });
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

  useEffect(() => {
    setDoorReady(true);
  }, []);

  useEffect(() => {
    setHall(termHallOpen());
  }, [pathname]);

  useEffect(() => subscribeHall(() => setHall(termHallOpen())), []);

  useEffect(() => {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const landscape = window.matchMedia("(orientation: landscape) and (max-height: 500px)").matches;
      if (!landscape) {
        setHideBars(false);
        last = y;
        return;
      }
      setHideBars(y > last && y > 48);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => subscribeTerm((term) => {
    setPathGate((gate) => (gate ? { ...gate, term } : gate));
  }), []);

  useEffect(() => {
    if (!pathGate) return;
    if (pathname.startsWith("/iibs")) return;
    if (hall) return;
    enterTermWeek(termForAccount(pathGate));
  }, [pathGate, hall, pathname]);

  if (isPublic) {
    return (
      <div className="min-h-dvh text-fg">
        <VisitorBeacon />
        {children}
      </div>
    );
  }

  if (doorsForVisitor) {
    return (
      <div className="min-h-dvh text-fg">
        <VisitorBeacon />
        <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">{children}</main>
      </div>
    );
  }

  if (isPending || (user && (!progressReady || !pathGate)) || (user && pathGate?.admin && !doorReady)) {
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

  const onIibs = pathname === "/iibs" || pathname.startsWith("/iibs/");
  const iibsOnly = onIibs || (pathGate?.path === "iibs" && !pathGate.admin);
  const studentHome = pathGate ? homeForAccount(pathGate) : null;
  const blocked =
    pathGate?.admin && doorReady
      ? ownerDoorBlock(pathname, currentDoor())
      : pathGate && !pathGate.admin
        ? blockedDestination(pathname, pathGate)
        : null;
  if (blocked) return <Navigate to={blocked} />;
  const term = pathGate ? termForAccount(pathGate) : 1;
  const choosingTerm = hall && !onIibs;
  const termHome = secondTermBlock(pathname, term, choosingTerm);
  if (termHome) return <Navigate to={termHome} replace />;
  const secondRoom = (term === 2 || choosingTerm) && !onIibs;
  const tabRoom = choosingTerm ? "home-only" : iibsOnly ? "scripture" : "grammar";

  return (
    <div className="min-h-dvh text-fg">
      <VisitorBeacon />
      <header className={`sticky top-0 z-20 border-b border-border bg-card transition-transform ${hideBars ? "shell-hide-top" : ""}`}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-3 pt-[env(safe-area-inset-top)]">
          <BrandLockup linked to={studentHome ?? "/"} />
          <div className="flex min-w-0 items-center gap-0.5">
            <Link
              to="/ask"
              aria-label="Ask HaDay"
              title="Ask HaDay"
              className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <CircleHelp className="size-5" />
            </Link>
            <NavTip label="Answer sounds">
              <SfxToggle />
            </NavTip>
            <NavMenu
              label="More"
              icon={MoreHorizontal}
              items={moreItems(isAdmin, iibsOnly || secondRoom)}
              active={["/guide", "/rewards", "/leaderboard", "/admin", "/admin/use", "/admin/voice", "/admin/query", "/ideas", "/legal", "/credits"].includes(pathname) || pathname.startsWith("/admin")}
            />
            {secondRoom ? null : <HonorBadge honor={honor} compact className="hidden max-w-[7.5rem] sm:inline-flex" />}
            {secondRoom || !board.crown ? null : <CrownBadge compact className="hidden sm:inline-flex" />}
            <div className="account-chip min-w-0 shrink">
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-[calc(var(--nav-h)+0.75rem)] pt-6">{children}</main>

      <nav className={`fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] transition-transform ${hideBars ? "shell-hide-bottom" : ""}`}>
        <ul className={`mx-auto grid max-w-3xl ${tabRoom === "home-only" ? "grid-cols-1" : "grid-cols-5"}`}>
          {shellTabs(tabRoom, pathname).map((tab) => (
            <li key={tab.label}>
              <Link
                to={tab.to}
                className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium ${tab.on ? "text-primary" : "text-muted"}`}
              >
                <tab.icon className="size-5" strokeWidth={tab.on ? 2.2 : 1.8} />
                {tab.label}
              </Link>
            </li>
          ))}
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
        <p className="text-xs font-semibold tracking-[0.08em] text-primary">HaDay · HebRabbAi Mentor</p>
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
