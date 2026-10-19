import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useRouteContext, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  Blocks,
  CircleHelp,
  CircleAlert,
  Columns3,
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
  Mic,
  MoreHorizontal,
  PawPrint,
  PenLine,
  Repeat,
  ScrollText,
  Lightbulb,
  Trophy,
  Users,
  Waves,
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
import { getMyPath, type MyPath } from "@/lib/learner-path";
import { blockedDestination, currentDoor, homeForAccount, markTermHall, ownerDoorBlock, secondTermBlock, subscribeHall, subscribeTerm, termForAccount, termHallOpen, termRevisionNow, noteServerTerm } from "@/lib/path";
import { enterTermWeek } from "@/lib/term-week";
import { readIibsRoom, subscribeIibsRoom } from "@/lib/iibs-room";
import type { IibsVocabLevel } from "@/lib/iibs-vocab";
import { scoreboard } from "@/lib/rewards";
import { HonorBadge, CrownBadge } from "@/components/honor-badge";
import { VisitorBeacon } from "@/components/visitor-beacon";
import { NavTip } from "@/components/nav-tip";
import { NavMenu, type NavItem } from "@/components/nav-menu";

const STUDY: NavItem[] = [
  { to: "/study", label: "Stations", hint: "From the alef-bet to the Word", icon: Library },
  { to: "/drill", label: "Drill", hint: "Every word, six ways", icon: Layers },
  { to: "/weak", label: "Weak pool", hint: "Every weak word, one sitting", icon: CircleAlert },
  { to: "/write", label: "Write", hint: "Type or hand-write", icon: PenLine },
  { to: "/quiz", label: "Quiz", hint: "Choice or type the gloss", icon: ListChecks },
  { to: "/rules", label: "Rules", hint: "See the rule in the text", icon: ScrollText },
  { to: "/match", label: "Match", hint: "Select pairs, then the lemma", icon: Link2 },
  { to: "/browse", label: "Lexicon", hint: "Week’s lemmas", icon: BookOpen },
  { to: "/alphabet", label: "Alef-bet lesson", hint: "See, follow, my hand", icon: Languages },
  { to: "/keep", label: "Zakhor", hint: "Daily keep", icon: Repeat },
  { to: "/finder", label: "Tanakh cards", hint: "Grammar decks and word search", icon: ScrollText },
  { to: "/guide", label: "Guide", hint: "How to use HaDay", icon: CircleHelp },
];

const GAME: NavItem[] = [
  { to: "/game/verbal-system", label: "Verbal System", hint: "Root, stem, conjugation. Ten builds, 90%", icon: Columns3 },
  { to: "/game/qal-perfect", label: "Qal Perfect Builder", hint: "Nine forms, with accent and meteg", icon: Blocks },
  { to: "/game/verb-paradigm-quest", label: "Verb Paradigm Quest", hint: "Only the root. You add the vowels", icon: PenLine },
  { to: "/game/road", label: "Road exam · Week 7", hint: "Say A B C D", icon: Mic },
  { to: "/game/final", label: "Road exam · Week 15", hint: "All the words, on the road", icon: Mic },
  { to: "/game/week7", label: "Week 7 mock exam", hint: "Grammar, then the word list", icon: ListChecks },
  { to: "/game/final-vocab", label: "Final vocab", hint: "Week 15 word list", icon: ListChecks },
  { to: "/game", label: "Vocabulary", hint: "Chapter path, or a custom mix", icon: Compass },
  { to: "/game/alefbet", label: "Aleph-bet mastery", hint: "Letter games", icon: Languages },
  { to: "/game/balloons", label: "Ocean letters", hint: "Catch the name", icon: Waves },
  { to: "/game/syllables", label: "Syllables", hint: "Open, closed, shewa", icon: Layers },
  { to: "/game/nouns", label: "Nouns", hint: "Gender and number", icon: BookOpen },
  { to: "/game/article", label: "Article & vav", hint: "The, and", icon: Layers },
  { to: "/game/lessons", label: "Grammar", hint: "Prepositions to numbers", icon: ScrollText },
  { to: "/challenge", label: "Ultimate Challenge", hint: "Whole list, one sitting", icon: Crown },
];

const TERM2_GAME: NavItem[] = [
  { to: "/study/term2/game", label: "Vocabulary", hint: "Chapter path, 90%", icon: Compass },
];

const TERM2_STUDY: NavItem[] = [
  { to: "/study/term2", label: "Lessons", hint: "Chapter by chapter", icon: Library },
  { to: "/drill", label: "Drill", hint: "This chapter’s words", icon: Layers },
  { to: "/quiz", label: "Quiz", hint: "Choice or type the gloss", icon: ListChecks },
  { to: "/write", label: "Write", hint: "Type the meaning", icon: PenLine },
  { to: "/match", label: "Match", hint: "Select pairs", icon: Link2 },
  { to: "/browse", label: "Lexicon", hint: "This chapter’s lemmas", icon: BookOpen },
  { to: "/weak", label: "Weak pool", hint: "Missed words only", icon: CircleAlert },
];

const TERM2_LISTEN: NavItem[] = [
  { to: "/study/term2/listen", label: "Vocabulary", hint: "Hebrew, then English", icon: Headphones },
  { to: "/study/term2/listen/road", label: "On the road", hint: "This chapter, while you drive", icon: Headphones },
];

function term2StudyOpen(pathname: string) {
  return (
    pathname.startsWith("/drill") ||
    pathname.startsWith("/quiz") ||
    pathname.startsWith("/write") ||
    pathname.startsWith("/match") ||
    pathname.startsWith("/browse") ||
    pathname.startsWith("/weak") ||
    pathname.startsWith("/study/term2/exam")
  );
}

const IIBS_GAME: NavItem[] = [
  { to: "/iibs/vocab", label: "Vocab Builder", hint: "This level’s thirty lessons", icon: Layers },
];

const LISTEN: NavItem[] = [
  { to: "/listen", label: "Vocabulary", hint: "Hebrew, then English", icon: Headphones },
  { to: "/listen/pet", label: "Alive Pet", hint: "Class voice, your weak words", icon: PawPrint },
  { to: "/listen/read", label: "Tanakh", hint: "All 39 books", icon: BookOpen },
  { to: "/listen/read", hash: "torah", label: "Torah", hint: "Genesis–Deuteronomy", icon: BookOpen },
  { to: "/listen/read", hash: "neviim", label: "Nevi'im", hint: "Joshua–Malachi", icon: BookOpen },
  { to: "/listen/read", hash: "ketuvim", label: "Ketuvim", hint: "Psalms–Chronicles", icon: BookOpen },
];

function moreItems(admin: boolean, iibsSide: boolean): NavItem[] {
  const items: NavItem[] = [
    { to: "/ask", label: "Ask HaDay Hebraic AI", hint: "Clarify the lesson", icon: CircleHelp },
    { to: "/ideas", label: "Suggest a feature", hint: "Class inventory", icon: Lightbulb },
  ];
  if (!iibsSide) {
    items.push({ to: "/leaderboard", label: "Leaderboard", hint: "Class standings", icon: Medal });
    items.push({ to: "/rewards", label: "Rewards", hint: "Ranks and badges", icon: Trophy });
  }
  if (admin) {
    items.push({ to: "/admin", label: "Class roster", hint: "Visitors and learners", icon: Users });
    items.push({ to: "/admin/use", label: "What the class uses", hint: "Visits and practice", icon: BarChart3 });
    if (!iibsSide) items.push({ to: "/admin/voice", label: "Voice bank", hint: "Record class words", icon: Mic });
  }
  items.push({ to: "/legal", label: "Privacy", hint: "How we use your data", icon: FileText });
  items.push({ to: "/credits", label: "Credits", hint: "Audio, text, open works", icon: ScrollText });
  if (!iibsSide) items.push({ to: "/guide", label: "Guide", hint: "How to use HaDay", icon: CircleHelp });
  return items;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { sessionUser } = useRouteContext({ from: "__root__" });
  const { user, isPending } = useCurrentUserState();
  const openReading =
    pathname === "/legal" ||
    pathname === "/credits" ||
    pathname === "/how-to-memorize-biblical-hebrew-vocabulary";
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
  const [iibsRoom, setIibsRoom] = useState<IibsVocabLevel | null>(null);
  const [iibsReady, setIibsReady] = useState(false);
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
    setIibsRoom(readIibsRoom());
    setIibsReady(true);
    return subscribeIibsRoom(() => setIibsRoom(readIibsRoom()));
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
  if (pathname === "/" && studentHome) {
    if (studentHome === "/bbh") markTermHall();
    return <Navigate to={studentHome} replace />;
  }
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
  const inSecondStudy = term === 2 && !choosingTerm && !onIibs;
  const choosingLevel = iibsOnly && iibsReady && !iibsRoom;

  return (
    <div className="min-h-dvh text-fg">
      <VisitorBeacon />
      <header className="sticky top-0 z-20 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <BrandLockup linked to={studentHome ?? "/"} />
          <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
            {iibsOnly ? (
            <>
            {choosingLevel ? null : (
            <>
            <NavMenu
              label="Game"
              icon={Compass}
              items={IIBS_GAME}
              active={pathname.startsWith("/iibs/vocab")}
            />
            <NavTip label="Study">
              <Link
                to="/iibs/study"
                aria-label="Study"
                title="Study"
                className={cn(
                  "flex size-11 items-center justify-center rounded-[var(--radius-md)]",
                  pathname.startsWith("/iibs/study") ? "text-primary" : "text-muted",
                )}
              >
                <ListChecks className="size-5" strokeWidth={pathname.startsWith("/iibs/study") ? 2.2 : 1.8} />
              </Link>
            </NavTip>
            <NavTip label="Audio">
              <Link
                to="/iibs/road"
                aria-label="Audio"
                title="Audio"
                className={cn(
                  "flex size-11 items-center justify-center rounded-[var(--radius-md)]",
                  pathname.startsWith("/iibs/road") ? "text-primary" : "text-muted",
                )}
              >
                <Headphones className="size-5" strokeWidth={pathname.startsWith("/iibs/road") ? 2.2 : 1.8} />
              </Link>
            </NavTip>
            </>
            )}
            <NavTip label="Reading Lab">
              <Link
                to="/iibs/wlc"
                aria-label="Reading Lab"
                title="Reading Lab · Leningrad Tanakh"
                className={cn(
                  "flex size-11 items-center justify-center rounded-[var(--radius-md)]",
                  pathname.startsWith("/iibs/wlc") ? "text-primary" : "text-muted",
                )}
              >
                <ScrollText className="size-5" strokeWidth={pathname.startsWith("/iibs/wlc") ? 2.2 : 1.8} />
              </Link>
            </NavTip>
            </>
            ) : secondRoom ? null : (
            <NavMenu
              label="Game"
              icon={Compass}
              items={GAME}
              active={pathname.startsWith("/game") || pathname.startsWith("/challenge")}
            />
            )}
            {inSecondStudy ? (
            <>
            <NavMenu
              label="Game"
              icon={Compass}
              items={TERM2_GAME}
              active={pathname.startsWith("/study/term2/game")}
            />
            <NavMenu
              label="Study"
              icon={ListChecks}
              items={TERM2_STUDY}
              active={term2StudyOpen(pathname) || (pathname.startsWith("/study/term2") && !pathname.startsWith("/study/term2/game") && !pathname.startsWith("/study/term2/listen"))}
            />
            <NavMenu
              label="Listen"
              icon={Headphones}
              items={TERM2_LISTEN}
              active={pathname.startsWith("/study/term2/listen")}
            />
            </>
            ) : iibsOnly || secondRoom ? null : (
            <NavMenu
              label="Study"
              icon={Library}
              items={STUDY}
              active={
                STUDY.some((x) => (x.to === "/" ? false : pathname === x.to || pathname.startsWith(`${x.to}/`))) ||
                pathname.startsWith("/study")
              }
            />
            )}
            {iibsOnly || secondRoom ? null : (
            <NavMenu
              label="Listen"
              icon={Headphones}
              items={LISTEN}
              active={pathname.startsWith("/listen")}
            />
            )}
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
              items={moreItems(isAdmin, iibsOnly || secondRoom)}
              active={["/guide", "/rewards", "/leaderboard", "/admin", "/admin/use", "/admin/voice", "/admin/query", "/finder", "/ask", "/ideas", "/legal", "/credits"].includes(pathname) || pathname.startsWith("/admin") || pathname.startsWith("/finder")}
            />
            <NavTip label="Answer sounds">
              <SfxToggle />
            </NavTip>
            {secondRoom ? null : (
            <HonorBadge honor={honor} compact className="hidden max-w-[7.5rem] sm:inline-flex" />
            )}
            {secondRoom || !board.crown ? null : <CrownBadge compact className="hidden sm:inline-flex" />}
            <div className="account-chip min-w-0 shrink">
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        <ul className={cn("mx-auto grid max-w-3xl", choosingLevel ? "grid-cols-2" : secondRoom ? "grid-cols-1" : iibsOnly ? "grid-cols-6" : inSecondStudy ? "grid-cols-5" : "grid-cols-4")}>
          <li>
            <NavTip label="Home" side="top" full>
              <Link
                to={studentHome ?? "/"}
                title="Home"
                className={cn(
                  "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium",
                  pathname === "/" || pathname === studentHome ? "text-primary" : "text-muted",
                )}
              >
                <House className="size-5" strokeWidth={pathname === "/" || pathname === studentHome ? 2.2 : 1.8} />
                Home
              </Link>
            </NavTip>
          </li>
          {inSecondStudy ? (
            <>
              <li>
                <NavTip label="Lessons" side="top" full>
                  <Link
                    to="/study/term2"
                    title="Lessons"
                    className={cn(
                      "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium",
                      pathname.startsWith("/study/term2") &&
                      !pathname.startsWith("/study/term2/game") &&
                      !pathname.startsWith("/study/term2/listen") &&
                      !pathname.startsWith("/study/term2/exam")
                        ? "text-primary"
                        : "text-muted",
                    )}
                  >
                    <Library className="size-5" strokeWidth={pathname.startsWith("/study/term2") && !pathname.startsWith("/study/term2/game") && !pathname.startsWith("/study/term2/listen") && !pathname.startsWith("/study/term2/exam") ? 2.2 : 1.8} />
                    Lessons
                  </Link>
                </NavTip>
              </li>
              <li>
                <NavMenu
                  label="Study"
                  icon={ListChecks}
                  items={TERM2_STUDY}
                  active={term2StudyOpen(pathname)}
                  drop="up"
                  tipSide="top"
                  layout="bar"
                />
              </li>
              <li>
                <NavMenu
                  label="Listen"
                  icon={Headphones}
                  items={TERM2_LISTEN}
                  active={pathname.startsWith("/study/term2/listen")}
                  drop="up"
                  tipSide="top"
                  layout="bar"
                />
              </li>
              <li>
                <NavMenu
                  label="Game"
                  icon={Compass}
                  items={TERM2_GAME}
                  active={pathname.startsWith("/study/term2/game")}
                  drop="up"
                  tipSide="top"
                  layout="bar"
                />
              </li>
            </>
          ) : iibsOnly && !choosingLevel ? (
            <>
              <li>
                <NavTip label="Lessons" side="top" full>
                  <Link
                    to="/iibs"
                    title="Lessons"
                    className={cn(
                      "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium",
                      pathname === "/iibs" ||
                      (pathname.startsWith("/iibs/") &&
                        !pathname.startsWith("/iibs/vocab") &&
                        !pathname.startsWith("/iibs/road") &&
                        !pathname.startsWith("/iibs/study") &&
                        !pathname.startsWith("/iibs/wlc"))
                        ? "text-primary"
                        : "text-muted",
                    )}
                  >
                    <Library className="size-5" strokeWidth={pathname === "/iibs" || (pathname.startsWith("/iibs/") && !pathname.startsWith("/iibs/vocab") && !pathname.startsWith("/iibs/road") && !pathname.startsWith("/iibs/study") && !pathname.startsWith("/iibs/wlc")) ? 2.2 : 1.8} />
                    Lessons
                  </Link>
                </NavTip>
              </li>
              <li>
                <NavTip label="Study" side="top" full>
                  <Link
                    to="/iibs/study"
                    title="Study"
                    className={cn(
                      "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium",
                      pathname.startsWith("/iibs/study") ? "text-primary" : "text-muted",
                    )}
                  >
                    <ListChecks className="size-5" strokeWidth={pathname.startsWith("/iibs/study") ? 2.2 : 1.8} />
                    Study
                  </Link>
                </NavTip>
              </li>
              <li>
                <NavTip label="Audio" side="top" full>
                  <Link
                    to="/iibs/road"
                    title="Audio"
                    className={cn(
                      "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium",
                      pathname.startsWith("/iibs/road") ? "text-primary" : "text-muted",
                    )}
                  >
                    <Headphones className="size-5" strokeWidth={pathname.startsWith("/iibs/road") ? 2.2 : 1.8} />
                    Audio
                  </Link>
                </NavTip>
              </li>
              <li>
                <NavMenu
                  label="Game"
                  icon={Compass}
                  items={IIBS_GAME}
                  active={pathname.startsWith("/iibs/vocab")}
                  drop="up"
                  tipSide="top"
                  layout="bar"
                />
              </li>
              <li>
                <NavTip label="Reading Lab" side="top" full>
                  <Link
                    to="/iibs/wlc"
                    title="Reading Lab"
                    className={cn(
                      "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium",
                      pathname.startsWith("/iibs/wlc") ? "text-primary" : "text-muted",
                    )}
                  >
                    <ScrollText className="size-5" strokeWidth={pathname.startsWith("/iibs/wlc") ? 2.2 : 1.8} />
                    <span className="leading-tight">Reading Lab</span>
                  </Link>
                </NavTip>
              </li>
            </>
          ) : choosingLevel ? (
            <li>
              <NavTip label="Reading Lab" side="top" full>
                <Link
                  to="/iibs/wlc"
                  title="Reading Lab"
                  className={cn(
                    "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs font-medium",
                    pathname.startsWith("/iibs/wlc") ? "text-primary" : "text-muted",
                  )}
                >
                  <ScrollText className="size-5" strokeWidth={pathname.startsWith("/iibs/wlc") ? 2.2 : 1.8} />
                  Reading Lab
                </Link>
              </NavTip>
            </li>
          ) : secondRoom ? null : (
            <>
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
            </>
          )}
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
