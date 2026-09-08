import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Crown, Headphones, Library, Repeat, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeekSelect } from "@/components/week-select";
import { FocusToggle } from "@/components/focus-toggle";
import { Panel } from "@/components/panel";
import { GameContinue } from "@/components/game-continue";
import { LeaderboardTeaser } from "@/components/leaderboard-teaser";
import { RewardsBar } from "@/components/rewards-bar";
import { COURSE_WEEKS, bbhVocab, itemsForWeek, studySetMeta } from "@/lib/vocab";
import { statsFor, useStudy, weakestOf } from "@/lib/store";
import { isHighWeak } from "@/lib/srs";
import { keepDoneToday, keepStats } from "@/lib/keep";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { continueLabel } from "@/lib/game";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const user = useCurrentUser();
  const week = useStudy((s) => s.week);
  const cards = useStudy((s) => s.cards);
  const streak = useStudy((s) => s.streak);
  const game = useStudy((s) => s.game);
  const setFocus = useStudy((s) => s.setFocus);
  const reset = useStudy((s) => s.reset);
  const items = itemsForWeek(week);
  const s = statsFor(items, cards);
  const all = statsFor(bbhVocab(), cards);
  const meta = studySetMeta(week);
  const pct = s.total ? Math.round((s.mastered / s.total) * 100) : 0;
  const weakList = weakestOf(items, cards, 8);
  const lastKeepDay = useStudy((s) => s.lastKeepDay);
  const keepStreak = useStudy((s) => s.keepStreak);
  const keep = keepStats(cards, game);
  const keepDone = keepDoneToday(lastKeepDay);
  const firstName = user?.displayName?.split(" ")[0];

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">HaDay · Hebraic Mentor</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          {firstName ? `${firstName}, learn the words that open the text.` : "Learn the words that open the text."}
        </h1>
        <p className="mt-3 max-w-prose text-muted">
          Game mode is a gated chapter path. Study mode is the free toolbox — drill, write, quiz, match, lex, alef.{" "}
          <Link to="/guide" className="font-semibold text-primary">
            How to use HaDay
          </Link>
          {" · "}
          <Link to="/ideas" className="font-semibold text-primary">
            Suggest a feature
          </Link>
        </p>
      </Panel>

      <div className="mb-4">
        <RewardsBar />
      </div>

      <div className="mb-4">
        <LeaderboardTeaser />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/game"
          className="rounded-[var(--radius-xl)] bg-primary p-5 text-primary-foreground shadow-[var(--shadow-border)]"
        >
          <Compass className="size-6" />
          <p className="mt-3 font-display text-3xl font-bold">Game mode</p>
          <p className="mt-1 text-sm text-primary-foreground/80">Vocabulary path, Aleph-bet, Syllables, Nouns, Article & vav, then each grammar chapter on its own (Ch. 6 Prepositions through Ch. 11 Numbers), or Ultimate. Pick from the Game menu.</p>
        </Link>
        <a
          href="#study-mode"
          className="rounded-[var(--radius-xl)] bg-card p-5 text-ink shadow-[var(--shadow-border)]"
        >
          <Library className="size-6 text-primary" />
          <p className="mt-3 font-display text-3xl font-bold">Study mode</p>
          <p className="mt-1 text-sm text-muted">Drill, write, quiz, match, lex, and alef — as they are.</p>
        </a>
      </div>

      <div className="mt-3">
        <GameContinue />
        <p className="sr-only">{continueLabel(game)}</p>
      </div>

      <Link
        to="/listen"
        className="mt-3 flex items-start gap-3 rounded-[var(--radius-xl)] bg-card p-5 text-ink shadow-[var(--shadow-border)]"
      >
        <Headphones className="mt-0.5 size-6 shrink-0 text-primary" />
        <span>
          <span className="block font-display text-2xl font-bold">Listen · hands-free</span>
          <span className="mt-1 block text-sm text-muted">
            Hebrew name, then English. Avraham, Abraham. For the car.
          </span>
        </span>
      </Link>

      <Link
        to="/listen/read"
        className="mt-3 flex items-start gap-3 rounded-[var(--radius-xl)] bg-card p-5 text-ink shadow-[var(--shadow-border)]"
      >
        <BookOpen className="mt-0.5 size-6 shrink-0 text-primary" />
        <span>
          <span className="block font-display text-2xl font-bold">Tanakh · follow along</span>
          <span className="mt-1 block text-sm text-muted">
            All 39 books. Recorded Hebrew, English on the page.
          </span>
        </span>
      </Link>

      <Link
        to="/keep"
        className="mt-3 flex items-start gap-3 rounded-[var(--radius-xl)] bg-card p-5 text-ink shadow-[var(--shadow-border)]"
      >
        <Repeat className="mt-0.5 size-6 shrink-0 text-primary" />
        <span>
          <span className="block font-display text-2xl font-bold">
            Zakhor · Daily keep
            {keepDone ? " · done today" : keep.waiting ? ` · ${keep.waiting} waiting` : ""}
          </span>
          <span className="mt-1 block text-sm text-muted">
            {keep.seen
              ? keepDone
                ? `${keepStreak}-day keep streak. A short mix of old mastered words and whatever is due — so new chapters do not bury the old ones.`
                : `Only lemmas you have already recalled, from chapters you have opened. About twelve cards. ${keep.mastered} mastered · ${keep.cooling} cooling.`
              : "After you meet some words in Game or Drill, Keep will mix the old ones back in each day."}
          </span>
        </span>
      </Link>

      <Link
        to="/challenge"
        className="mt-3 flex items-start gap-3 rounded-[var(--radius-xl)] bg-card p-5 text-ink shadow-[var(--shadow-border)]"
      >
        <Crown className="mt-0.5 size-6 shrink-0 text-primary" />
        <span>
          <span className="block font-display text-2xl font-bold">Ultimate Challenge</span>
          <span className="mt-1 block text-sm text-muted">
            Optional. Whole BBH list, one sitting, graded at the end. 90% Full Scroll · 100% Crown of the Text.
          </span>
        </span>
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Due" value={s.due} />
        <Stat label="Weak" value={(s.weak ?? 0) + (s.high ?? 0)} />
        <Stat label="Mastered" value={`${s.mastered}/${s.total}`} />
        <Stat label="Streak" value={`${streak}d`} />
      </div>

      <section className="mt-4 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar to live by</p>
        <h2 className="mt-1 font-display text-xl font-semibold text-ink">When does the rule show up?</h2>
        <p className="mt-1 text-sm text-muted">
          See each rule in a Tanakh line, then hunt the lemma and the verse, or name the rule from the highlighted
          form. Shewa and qamets you diagnose on the word itself.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link to="/rules" search={{ play: "verse" }}>
            <Button className="w-full" size="lg">
              Hunt the verse
            </Button>
          </Link>
          <Link to="/rules" search={{ play: "name" }}>
            <Button className="w-full" variant="outline" size="lg">
              Name the rule
            </Button>
          </Link>
          <Link to="/rules" search={{ play: "shewa" }}>
            <Button className="w-full" variant="outline" size="lg">
              Vocal or silent
            </Button>
          </Link>
          <Link to="/rules" search={{ play: "qamets" }}>
            <Button className="w-full" variant="outline" size="lg">
              Qamets or hatuf
            </Button>
          </Link>
        </div>
      </section>

      <div id="study-mode" className="scroll-mt-20">
      {weakList.length > 0 && (
        <section className="mt-4 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">Weak book</h2>
            <button
              type="button"
              className="text-sm font-medium text-primary"
              onClick={() => setFocus("weak")}
            >
              Focus these
            </button>
          </div>
          <p className="mt-1 text-sm text-muted">
            Told (high) sit above a miss. Drill these until they leave the book.
          </p>
          <ul className="mt-3 divide-y divide-border">
            {weakList.map((item) => {
              const c = cards[item.id];
              const high = isHighWeak(c);
              const misses = c?.misses ?? 0;
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="he-word text-xl leading-tight">{item.hebrew}</p>
                    <p className="truncate text-sm text-muted">{item.gloss}</p>
                  </div>
                  <span className={cn("shrink-0 text-xs font-semibold", high ? "text-danger" : "text-muted")}>
                    {high ? "High · told" : `${misses} miss${misses === 1 ? "" : "es"}`}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex gap-2">
            <Link to="/drill" className="flex-1">
              <Button className="w-full" size="sm" onClick={() => setFocus("weak")}>
                Drill weak book
              </Button>
            </Link>
            <Link to="/write" search={{ mode: "memorize" }} className="flex-1">
              <Button className="w-full" size="sm" variant="outline" onClick={() => setFocus("weak")}>
                Memorize
              </Button>
            </Link>
          </div>
        </section>
      )}

      <div className="mt-4 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Study toolbox</p>
        <WeekSelect />
        <FocusToggle />
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="text-muted">{meta.hint}</span>
            <span className="tabular-nums text-fg">{pct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-[var(--motion-fast)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <Link to="/keep" className="flex-1">
            <Button className="w-full" size="lg">
              Zakhor · Daily keep
            </Button>
          </Link>
          <Link to="/drill" className="flex-1">
            <Button className="w-full" variant="outline" size="lg">
              Study due cards
            </Button>
          </Link>
          <Link to="/match" className="flex-1">
            <Button className="w-full" variant="outline" size="lg">
              Match · select pairs
            </Button>
          </Link>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/write" search={{ mode: "write" }}>
              <Button className="w-full" variant="outline" size="lg">
                Write
              </Button>
            </Link>
            <Link to="/write" search={{ mode: "memorize" }}>
              <Button className="w-full" variant="outline" size="lg">
                Memorize + Write
              </Button>
            </Link>
          </div>
          <Link to="/alphabet" search={{ tab: "write", letter: "" }} className="flex-1">
            <Button className="w-full" variant="outline" size="lg">
              Learn letters · follow
            </Button>
          </Link>
          <Link to="/alphabet" search={{ tab: "exam", letter: "" }} className="flex-1">
            <Button className="w-full" variant="outline" size="lg">
              Closed-book alef
            </Button>
          </Link>
        </div>
      </div>

      <section className="mt-8">
        <Panel>
          <h2 className="font-display text-xl font-bold text-ink">Course map</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {COURSE_WEEKS.map((w) => {
            const st = statsFor(itemsForWeek(w.week), cards);
            const active = w.week === week;
            return (
              <li key={w.week}>
                <button
                  type="button"
                  onClick={() => useStudy.getState().setWeek(w.week)}
                  className={`w-full rounded-[var(--radius-lg)] p-4 text-left shadow-[var(--shadow-border)] ${
                    active ? "bg-primary text-primary-foreground" : "bg-surface"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">
                      {w.label}
                      {(w.week === 7 || w.week === 15) && (
                        <span className={`ms-2 text-xs font-medium uppercase tracking-wide ${active ? "text-primary-foreground/70" : "text-primary"}`}>
                          {w.week === 7 ? "Midterm" : "Final"}
                        </span>
                      )}
                    </span>
                    <span className={`text-xs tabular-nums ${active ? "text-primary-foreground/80" : "text-muted"}`}>
                      {st.mastered}/{st.total}
                      {(st.weak || st.high) ? ` · ${(st.weak ?? 0) + (st.high ?? 0)} weak` : ""}
                    </span>
                  </div>
                  <p className={`mt-1 text-sm ${active ? "text-primary-foreground/80" : "text-muted"}`}>{w.hint}</p>
                </button>
              </li>
            );
          })}
          </ul>
        </Panel>
      </section>

      <Panel className="mt-8">
        <p className="text-xs text-muted">
          Full lexicon {bbhVocab().length} BBH lemmas (Ch. 2–19, same as Game) · {all.mastered} mastered · {(all.weak ?? 0) + (all.high ?? 0)} weak overall.
        </p>
        <button
          type="button"
          className="mt-3 min-h-11 text-xs font-medium text-muted underline-offset-2 hover:underline"
          onClick={() => {
            if (confirm("Reset all progress on this account?")) reset();
          }}
        >
          Reset account progress
        </button>
      </Panel>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-card px-3 py-3 shadow-[var(--shadow-border)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 font-sans text-2xl font-bold tabular-nums text-ink">{value}</p>
    </div>
  );
}
