import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { GradeBanner } from "@/components/grade-banner";
import { Panel } from "@/components/panel";
import { playGrade } from "@/lib/sfx";
import { cn } from "@/lib/cn";
import { findEnglishHitRange, findHitRange } from "@/lib/hebrew";
import { lemmaForSurface } from "@/lib/tanakh-pool";
import {
  NOUN_QUIZ_LEN,
  NOUN_UNIT_MAX,
  buildNounQuiz,
  nounMatchPairs,
  nounUnit,
  starsFromNounScore,
  type NounQuiz,
  type NounVerse,
} from "@/lib/nouns";
import { useStudy } from "@/lib/store";

type PlayQ = NounQuiz & { key: string; retry?: boolean };

function MixHe({ text, className }: { text: string; className?: string }) {
  const re = /[\u0590-\u05FF]+/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    nodes.push(
      <span key={`he-${i++}`} className="he-word" dir="rtl" lang="he">
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <span className={className}>{nodes}</span>;
}

function SplitWord({ split }: { split: string }) {
  const parts = split.split(" | ").filter(Boolean);
  if (parts.length < 2) {
    return (
      <span className="he-word text-lg" dir="rtl" lang="he">
        {split}
      </span>
    );
  }
  return (
    <span className="he-word inline-flex items-center justify-start gap-2 text-lg" dir="rtl" lang="he">
      {parts.flatMap((part, i) => [
        i > 0 ? (
          <span
            key={`bar-${i}`}
            className="inline-block h-[1.05em] w-0.5 shrink-0 self-center rounded-full bg-current"
            aria-hidden
          />
        ) : null,
        <span key={`p-${i}`}>{part}</span>,
      ])}
    </span>
  );
}

function VerseHit({ verse }: { verse: NounVerse }) {
  const heRange = findHitRange(verse.he, verse.hit);
  const lemma = lemmaForSurface(verse.hit);
  const enRange = findEnglishHitRange(verse.en, {
    hitEn: verse.hitEn,
    gloss: lemma?.gloss,
    alts: lemma?.alts,
  });
  return (
    <>
      <p className="he-word mt-3 text-2xl leading-relaxed" dir="rtl" lang="he">
        {heRange ? (
          <>
            {verse.he.slice(0, heRange.start)}
            <mark className="he-hit">{verse.he.slice(heRange.start, heRange.end)}</mark>
            {verse.he.slice(heRange.end)}
          </>
        ) : (
          verse.he
        )}
      </p>
      <p className="mt-2 text-sm text-muted" lang="en" dir="ltr">
        {enRange ? (
          <>
            {verse.en.slice(0, enRange.start)}
            <mark className="he-hit">{verse.en.slice(enRange.start, enRange.end)}</mark>
            {verse.en.slice(enRange.end)}
          </>
        ) : (
          verse.en
        )}
      </p>
    </>
  );
}

export function NounPlay({ unitId }: { unitId: number }) {
  const unit = nounUnit(unitId);
  const complete = useStudy((s) => s.completeNounUnit);
  const [step, setStep] = useState<"learn" | "match" | "quiz">("learn");
  const [items, setItems] = useState<PlayQ[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [held, setHeld] = useState<Set<string>>(() => new Set());
  const [firstTry, setFirstTry] = useState(0);
  const [firstSeen, setFirstSeen] = useState(0);
  const [done, setDone] = useState(false);

  const pairs = useMemo(() => (unit ? nounMatchPairs(unit) : []), [unit]);
  const [heTiles, setHeTiles] = useState(pairs);
  const [labTiles, setLabTiles] = useState(pairs);
  const [tap, setTap] = useState<{ side: "he" | "lab"; id: string } | null>(null);
  const [locked, setLocked] = useState<Set<string>>(() => new Set());
  const [missId, setMissId] = useState<string | null>(null);

  const q = items[i];
  const unique = firstSeen || items.filter((x) => !x.retry).length;
  const pct = useMemo(() => (unique ? Math.round((held.size / unique) * 100) : 0), [held, unique]);

  function shuffleIn<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let n = a.length - 1; n > 0; n--) {
      const j = Math.floor(Math.random() * (n + 1));
      [a[n], a[j]] = [a[j], a[n]];
    }
    return a;
  }

  function startMatch() {
    if (!unit) return;
    const p = nounMatchPairs(unit);
    setHeTiles(shuffleIn(p));
    setLabTiles(shuffleIn(p));
    setTap(null);
    setLocked(new Set());
    setMissId(null);
    setStep("match");
  }

  function startQuiz() {
    if (!unit) return;
    const built = buildNounQuiz(unitId).map((item, n) => ({ ...item, key: `${unitId}-${n}` }));
    setItems(built);
    setI(0);
    setPicked(null);
    setHeld(new Set());
    setFirstTry(0);
    setFirstSeen(built.length);
    setDone(false);
    setStep("quiz");
  }

  function pick(choice: string) {
    if (!q || picked) return;
    const ok = choice === q.answer;
    setPicked(choice);
    if (ok) setHeld((s) => new Set(s).add(q.key.replace(/-retry$/, "")));
    if (!q.retry) {
      if (ok) setFirstTry((n) => n + 1);
    }
    playGrade(ok);
  }

  function next() {
    if (!picked || !q) return;
    const ok = picked === q.answer;
    let nextItems = items;
    if (!ok && !q.retry) {
      const later: PlayQ = { ...q, key: `${q.key}-retry`, retry: true, choices: shuffleIn(q.choices) };
      const insertAt = Math.min(items.length, i + 2 + Math.floor(Math.random() * 3));
      nextItems = [...items.slice(0, insertAt), later, ...items.slice(insertAt)];
      setItems(nextItems);
    }
    if (i + 1 >= nextItems.length) {
      const keys = new Set(nextItems.map((x) => x.key.replace(/-retry$/, "")));
      const scorePct = Math.round((held.size / keys.size) * 100);
      const firstPct = firstSeen ? firstTry / firstSeen : 0;
      complete(unitId, {
        stars: starsFromNounScore(scorePct),
        score: scorePct,
        firstTryRate: firstPct,
      });
      setDone(true);
      return;
    }
    setI((n) => n + 1);
    setPicked(null);
  }

  function onTile(side: "he" | "lab", id: string) {
    if (locked.has(id) || missId) return;
    if (!tap) {
      setTap({ side, id });
      return;
    }
    if (tap.side === side) {
      setTap({ side, id });
      return;
    }
    if (tap.id === id) {
      playGrade(true);
      setLocked((s) => new Set(s).add(id));
      setTap(null);
      return;
    }
    playGrade(false);
    setMissId(`${tap.id}:${id}`);
    window.setTimeout(() => {
      setMissId(null);
      setTap(null);
    }, 420);
  }

  if (!unit) {
    return (
      <Panel>
        <p className="text-muted">That unit is missing.</p>
        <Link to="/game/nouns" className="mt-3 inline-block font-semibold text-primary">
          Back to nouns
        </Link>
      </Panel>
    );
  }

  if (step === "learn") {
    return (
      <>
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Unit {unit.id} · Learn
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">{unit.title}</h1>
          <p className="mt-3 max-w-prose text-ink">
            <MixHe text={unit.rule} />
          </p>
        </Panel>
        <Panel className="mt-3">
          <h2 className="font-display text-xl font-bold text-ink">Tanakh words</h2>
          <ul className="mt-3 space-y-3">
            {unit.samples.map((s) => (
              <li key={s.word} className="rounded-[var(--radius-md)] bg-surface px-3 py-3">
                <p className="he-word text-3xl text-primary" dir="rtl" lang="he">
                  {s.word}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {s.tag} · {s.gloss}
                </p>
                <p className="mt-1 text-sm text-muted">
                  <MixHe text={s.note} />
                </p>
                {s.ref ? <p className="mt-1 text-xs font-semibold text-muted">{s.ref}</p> : null}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="mt-3">
          <h2 className="font-display text-xl font-bold text-ink">In the Tanakh</h2>
          <p className="mt-1 text-sm text-muted">The hit word is marked in Hebrew and in English.</p>
          <ul className="mt-3 space-y-4">
            {unit.verses.map((v) => (
              <li key={`${v.ref}-${v.hit}`} className="rounded-[var(--radius-md)] bg-surface px-3 py-3">
                <p className="text-sm font-semibold text-muted">{v.ref}</p>
                <VerseHit verse={v} />
              </li>
            ))}
          </ul>
        </Panel>
        <Button className="mt-4 w-full" onClick={startMatch}>
          Pair the endings
        </Button>
      </>
    );
  }

  if (step === "match") {
    const doneMatch = locked.size === pairs.length && pairs.length > 0;
    return (
      <>
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Unit {unit.id} · Pair
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink">Match the word to its ending</h1>
          <p className="mt-2 text-sm text-muted">
            Tap a Hebrew form, then its tag. A miss stays on the board — try again.
          </p>
        </Panel>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ul className="space-y-2">
            {heTiles.map((t) => {
              const on = tap?.side === "he" && tap.id === t.id;
              const miss = missId?.includes(t.id);
              return (
                <li key={`he-${t.id}`}>
                  <button
                    type="button"
                    disabled={locked.has(t.id)}
                    onClick={() => onTile("he", t.id)}
                    className={cn(
                      "min-h-12 w-full rounded-[var(--radius-md)] px-2 py-2 text-center shadow-[var(--shadow-border)]",
                      locked.has(t.id) && "bg-good/20 text-muted",
                      !locked.has(t.id) && on && "bg-primary text-primary-foreground",
                      !locked.has(t.id) && !on && miss && "bg-bad text-white",
                      !locked.has(t.id) && !on && !miss && "bg-card text-ink",
                    )}
                  >
                    <span className="he-word text-xl" dir="rtl" lang="he">
                      {t.he}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <ul className="space-y-2">
            {labTiles.map((t) => {
              const on = tap?.side === "lab" && tap.id === t.id;
              const miss = missId?.includes(t.id);
              return (
                <li key={`lab-${t.id}`}>
                  <button
                    type="button"
                    disabled={locked.has(t.id)}
                    onClick={() => onTile("lab", t.id)}
                    className={cn(
                      "min-h-12 w-full rounded-[var(--radius-md)] px-2 py-2 text-start text-sm font-medium shadow-[var(--shadow-border)]",
                      locked.has(t.id) && "bg-good/20 text-muted",
                      !locked.has(t.id) && on && "bg-primary text-primary-foreground",
                      !locked.has(t.id) && !on && miss && "bg-bad text-white",
                      !locked.has(t.id) && !on && !miss && "bg-card text-ink",
                    )}
                  >
                    {t.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {doneMatch ? (
          <Button className="mt-4 w-full" onClick={startQuiz}>
            Quiz this rule · {NOUN_QUIZ_LEN} questions
          </Button>
        ) : (
          <p className="mt-3 text-center text-sm text-muted">
            {locked.size} / {pairs.length} paired
          </p>
        )}
      </>
    );
  }

  if (done) {
    const passed = pct >= 70;
    return (
      <Panel className="text-center">
        <p className="font-display text-4xl font-bold text-ink">{pct}%</p>
        <p className="mt-2 text-sm text-muted">
          {held.size} / {unique} held
          {unique ? ` · first look ${Math.round((firstTry / unique) * 100)}%` : ""}
          {" · "}
          {passed ? "Unit cleared." : "Need 70% held to unlock the next unit."}
        </p>
        <p className="mt-2 text-sm text-muted">Misses came back later. A later hit still counts as held.</p>
        <div className="mt-4 flex flex-col gap-2">
          {passed && unitId < NOUN_UNIT_MAX ? (
            <Link to="/game/nouns/$unit" params={{ unit: String(unitId + 1) }} className="block">
              <Button className="w-full">Next unit</Button>
            </Link>
          ) : null}
          <Button variant="outline" onClick={startMatch}>
            Pair and quiz again
          </Button>
          <Link to="/game/nouns" className="text-sm font-semibold text-primary">
            Noun map
          </Link>
        </div>
      </Panel>
    );
  }

  if (!q) return null;
  const ok = picked === q.answer;
  const lastNow = i + 1 >= items.length && (ok || Boolean(q.retry));

  return (
    <>
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Unit {unit.id} · Quiz · {i + 1} / {items.length}
          {q.review ? " · review" : ""}
          {q.retry ? " · again" : ""}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink">
          <MixHe text={q.q} />
        </h1>
        {q.ref ? <p className="mt-1 text-xs font-semibold text-muted">{q.ref}</p> : null}
        {q.he ? (
          <p className="he-word mt-3 text-4xl" dir="rtl" lang="he">
            {q.he}
          </p>
        ) : null}
      </Panel>
      <ul className="mt-3 space-y-2">
        {q.choices.map((c) => {
          const chosen = picked === c;
          const rightChoice = c === q.answer;
          return (
            <li key={c}>
              <button
                type="button"
                disabled={Boolean(picked)}
                onClick={() => pick(c)}
                className={cn(
                  "min-h-12 w-full rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium shadow-[var(--shadow-border)]",
                  !picked && "bg-card text-ink",
                  picked && rightChoice && "bg-good text-white",
                  picked && chosen && !rightChoice && "bg-bad text-white",
                  picked && !chosen && !rightChoice && "bg-card text-muted",
                )}
              >
                {c.includes(" | ") ? <SplitWord split={c} /> : <MixHe text={c} />}
              </button>
            </li>
          );
        })}
      </ul>
      {picked && (
        <div className="mt-3">
          <GradeBanner ok={ok} />
          <p className="mt-2 text-sm text-muted">
            <MixHe text={q.why} />
          </p>
          {!ok && !q.retry ? (
            <p className="mt-1 text-sm text-muted">You will see this one again in a moment.</p>
          ) : null}
          <Button className="mt-3 w-full" onClick={next}>
            {lastNow ? "See score" : "Next"}
          </Button>
        </div>
      )}
    </>
  );
}
