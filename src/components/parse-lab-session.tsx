import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ScriptureTabs } from "@/components/iibs-door";
import { StudyMenu } from "@/components/study-menu";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { fetchStrongTags } from "@/lib/strongs";
import { lookupStrong } from "@/lib/strongs";
import { TANAKH_BOOKS, bookMeta, type BookId } from "@/lib/tanakh-canon";
import { fetchTanakhBook } from "@/lib/tanakh-canon";
import { versesInChapter } from "@/lib/passage";
import {
  PARSE_VERSE_CAP,
  buildPassage,
  choicesFor,
  clampParseSpan,
  featureOf,
  gradeFind,
  gradeLine,
  hintText,
  loadMisses,
  rememberMisses,
  type ParseLabSearch,
  type ParseMode,
  type ParsePassage,
  type ParseTask,
  type StoredMiss,
} from "@/lib/parse-lab";

type Door = "grammar" | "scripture";
type Phase = "choose" | "read" | "find" | "parse" | "review" | "translate";
type Lock = "ok" | "miss";

function routeFor(door: Door): "/parse-lab" | "/iibs/parse-lab" {
  return door === "scripture" ? "/iibs/parse-lab" : "/parse-lab";
}

async function loadPassage(book: BookId, chapter: number, from: number, count: number): Promise<ParsePassage> {
  const span = clampParseSpan(book, chapter, from, count);
  const [dump, strong] = await Promise.all([fetchTanakhBook(book), fetchStrongTags(book)]);
  const rows = (dump.chapters[String(chapter)] ?? [])
    .filter((row) => row.v >= span.from && row.v <= span.to)
    .map((row) => ({
      verse: row.v,
      he: row.he,
      en: row.en,
      words: row.words,
      tags: strong[String(chapter)]?.[String(row.v)] ?? [],
    }));
  return buildPassage(book, chapter, rows);
}

export function ParseLabSession({ door, search }: { door: Door; search: ParseLabSearch }) {
  const navigate = useNavigate();
  const to = routeFor(door);
  const [phase, setPhase] = useState<Phase>(search.one ? "parse" : search.book ? "read" : "choose");
  const [book, setBook] = useState<BookId>(search.book ?? "Gen");
  const [chapter, setChapter] = useState(search.ch ?? 1);
  const [verse, setVerse] = useState(search.v ?? 1);
  const [count, setCount] = useState(Math.min(PARSE_VERSE_CAP, search.n ?? PARSE_VERSE_CAP));
  const [mode, setMode] = useState<ParseMode>(search.mode ?? "guided");
  const [passage, setPassage] = useState<ParsePassage | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [at, setAt] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [locks, setLocks] = useState<Record<string, Lock>>({});
  const [hints, setHints] = useState(0);
  const [hint, setHint] = useState("");
  const [lemmas, setLemmas] = useState<{ id: string; he: string }[]>([]);
  const [lemmaSettled, setLemmaSettled] = useState(false);
  const [tapped, setTapped] = useState<string[]>([]);
  const [tapNote, setTapNote] = useState("");
  const [misses, setMisses] = useState<StoredMiss[]>([]);
  const [saved, setSaved] = useState<StoredMiss[]>(() => loadMisses());
  const [english, setEnglish] = useState("");
  const [showEn, setShowEn] = useState(false);
  const [oneWord, setOneWord] = useState(Boolean(search.one));

  const chapterMax = bookMeta(book)?.chapters ?? 1;
  const verseMax = versesInChapter(book, Math.min(chapter, chapterMax));

  useEffect(() => {
    if (!search.book) return;
    let cancelled = false;
    setBusy(true);
    setErr("");
    void loadPassage(search.book, search.ch ?? 1, search.v ?? 1, search.n ?? PARSE_VERSE_CAP)
      .then((next) => {
        if (cancelled) return;
        setPassage(next);
        setBook(next.book);
        setChapter(next.chapter);
        setVerse(next.from);
        setCount(next.to - next.from + 1);
        if (search.one) {
          const index = next.tasks.findIndex((task) => task.verse === (search.v ?? next.from) && task.index === (search.at ?? 0));
          if (index >= 0) {
            setAt(index);
            setPhase("parse");
            setOneWord(true);
          } else {
            setOneWord(false);
            setPhase("read");
          }
        }
      })
      .catch(() => {
        if (!cancelled) setErr("That passage did not open.");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search.book, search.ch, search.v, search.n, search.at, search.one]);

  useEffect(() => {
    if (phase !== "choose") return;
    let cancelled = false;
    setBusy(true);
    void loadPassage(book, chapter, verse, count)
      .then((next) => {
        if (!cancelled) setPassage(next);
      })
      .catch(() => {
        if (!cancelled) setPassage(null);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [phase, book, chapter, verse, count]);

  const task = phase === "parse" ? passage?.tasks[at] : undefined;
  const active = task ?? null;

  useEffect(() => {
    if (!active || !passage) return;
    let cancelled = false;
    setLemmas([]);
    setLemmaSettled(false);
    const ids = [active.lemmaId, ...passage.tasks.map((item) => item.lemmaId).filter((id) => id && id !== active.lemmaId)].filter(Boolean).slice(0, 4);
    void Promise.all(ids.map(async (id) => ({ id, entry: await lookupStrong(id) }))).then((rows) => {
      if (cancelled) return;
      setLemmas(rows.flatMap((row) => (row.entry?.word ? [{ id: row.id, he: row.entry.word }] : [])));
      setLemmaSettled(true);
    });
    return () => {
      cancelled = true;
    };
  }, [active?.key]);

  function resetWord() {
    setPicks({});
    setLocks({});
    setHints(0);
    setHint("");
  }

  function begin() {
    void navigate({
      to,
      search: { book, ch: chapter, v: verse, n: count, mode },
    });
    setOneWord(false);
    setPhase("read");
    setAt(0);
    resetWord();
    setMisses([]);
    setEnglish("");
    setShowEn(false);
  }

  function addMiss(row: StoredMiss) {
    setMisses((prev) => {
      const key = `${row.feature}|${row.ref}|${row.surface}`;
      if (prev.some((item) => `${item.feature}|${item.ref}|${item.surface}` === key)) return prev;
      return [...prev, row];
    });
  }

  function revealRest(current: ParseTask) {
    const next: Record<string, Lock> = {};
    for (const row of current.lines) {
      if (row.id === "lemma" && lemmaMissing) continue;
      if (locks[row.id] === "ok") next[row.id] = "ok";
      else {
        next[row.id] = "miss";
        if (locks[row.id] !== "miss") addMiss({ feature: featureOf(row), ref: current.ref, surface: current.surface });
      }
    }
    setLocks(next);
    setHints(3);
  }

  function askHint() {
    if (!active || hints >= 3) return;
    const level = hints + 1;
    setHints(level);
    setHint(hintText(active, level));
    if (level >= 3) revealRest(active);
  }

  function markWord() {
    if (!active) return;
    const next = { ...locks };
    for (const row of active.lines) {
      if (row.id === "lemma" && lemmaSettled && !lemmas.some((item) => item.id === active.lemmaId)) continue;
      const picked = picks[row.id] ?? "";
      if (!picked) return;
      if (gradeLine(row, picked)) next[row.id] = "ok";
      else {
        next[row.id] = "miss";
        addMiss({ feature: featureOf(row), ref: active.ref, surface: active.surface });
      }
    }
    setLocks(next);
  }

  function finishWord() {
    if (!passage) return;
    const last = oneWord ? at : passage.tasks.length - 1;
    if (at >= last) {
      const stored = rememberMisses(misses);
      setSaved(stored);
      setPhase("review");
      return;
    }
    setAt(at + 1);
    resetWord();
  }

  function onTap(key: string) {
    if (!passage) return;
    const token = passage.verses.flatMap((verseRow) => verseRow.tokens).find((item) => item.key === key);
    if (!token) return;
    if (token.role === "name") {
      setTapNote("That is a name. Names are not parsed.");
      return;
    }
    if (token.role === "other") {
      setTapNote("Not a noun or verb.");
      return;
    }
    setTapNote("");
    setTapped((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  }

  function doneFinding() {
    if (!passage) return;
    const tokens = passage.verses.flatMap((verseRow) => verseRow.tokens);
    const grade = gradeFind(tokens, tapped);
    for (const missed of grade.missed) {
      addMiss({
        feature: missed.role === "verb" ? "verb not found" : "noun not found",
        ref: missed.ref,
        surface: missed.surface,
      });
    }
    setAt(0);
    resetWord();
    setPhase("parse");
  }

  const lemmaMissing = Boolean(active && lemmaSettled && !lemmas.some((item) => item.id === active.lemmaId));
  const readyToMark = Boolean(
    active && active.lines.every((row) => locks[row.id] || (row.id === "lemma" && lemmaMissing) || picks[row.id]),
  );
  const wordDone = Boolean(
    active && active.lines.every((row) => locks[row.id] || (row.id === "lemma" && lemmaMissing)),
  );
  const nounCount = passage?.tasks.filter((item) => item.role === "noun").length ?? 0;
  const verbCount = passage?.tasks.filter((item) => item.role === "verb").length ?? 0;

  return (
    <>
      {door === "scripture" ? <ScriptureTabs active="parse" /> : <StudyMenu />}
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {door === "scripture" ? "Scripture Path" : "Grammar Path"}
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Parsing Lab</h1>
        <p className="mt-3 max-w-prose text-sm text-muted">
          Choose up to five verses. Parse the nouns and verbs in place, then say what the passage means. The reading
          itself still shows the gloss.
        </p>
      </Panel>

      {passage && passage.tasks.length === 0 && phase !== "choose" ? (
        <p className="mt-4 text-sm text-muted">This passage has no tagged nouns or verbs.</p>
      ) : null}

      {phase === "choose" ? (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Passage</p>
          <label className="mt-3 block text-sm font-semibold text-ink">
            Book
            <select
              className="mt-1 h-12 w-full rounded-[var(--radius-md)] border border-border bg-parchment px-3"
              value={book}
              onChange={(event) => {
                const next = event.target.value as BookId;
                setBook(next);
                setChapter(1);
                setVerse(1);
              }}
            >
              {TANAKH_BOOKS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.en}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-sm font-semibold text-ink">
              Chapter
              <input
                inputMode="numeric"
                className="mt-1 h-12 w-full rounded-[var(--radius-md)] border border-border bg-parchment px-3"
                value={chapter}
                onChange={(event) => setChapter(Math.min(chapterMax, Math.max(1, Number(event.target.value) || 1)))}
              />
            </label>
            <label className="text-sm font-semibold text-ink">
              Starting verse
              <input
                inputMode="numeric"
                className="mt-1 h-12 w-full rounded-[var(--radius-md)] border border-border bg-parchment px-3"
                value={verse}
                onChange={(event) => setVerse(Math.min(verseMax, Math.max(1, Number(event.target.value) || 1)))}
              />
            </label>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">How many verses</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className={cn(
                  "min-h-11 rounded-[var(--radius-md)] px-4 text-sm font-semibold",
                  count === n ? "bg-ink text-parchment" : "bg-surface text-ink",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Mode</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("guided")}
              className={cn("min-h-14 rounded-[var(--radius-md)] px-3 text-sm font-semibold", mode === "guided" ? "bg-ink text-parchment" : "bg-surface text-ink")}
            >
              Guided
              <span className="mt-1 block text-xs font-normal opacity-80">The lab marks each noun and verb.</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("independent")}
              className={cn(
                "min-h-14 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
                mode === "independent" ? "bg-ink text-parchment" : "bg-surface text-ink",
              )}
            >
              Independent
              <span className="mt-1 block text-xs font-normal opacity-80">You find the nouns and verbs first.</span>
            </button>
          </div>
          <p className="mt-4 text-sm text-ink">{busy ? "Counting nouns and verbs…" : (passage?.label ?? "Choose a passage.")}</p>
          {passage ? (
            <p className="mt-1 text-sm text-muted">
              {nounCount} nouns · {verbCount} verbs{passage.names ? ` · ${passage.names} names, not parsed` : ""}
              {passage.aramaic ? " · Aramaic in this passage" : ""}
            </p>
          ) : null}
          <Button type="button" className="mt-4 h-12 w-full" disabled={!passage || passage.tasks.length === 0} onClick={begin}>
            Begin
          </Button>
          {saved.length ? (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Missed features</p>
              <ul className="mt-2 space-y-1 text-sm text-ink">
                {saved.slice(0, 8).map((row) => (
                  <li key={`${row.feature}-${row.ref}-${row.surface}`}>
                    {row.feature} · <span className="he-word" dir="rtl" lang="he">{row.surface}</span> · {row.ref}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">Saved from earlier passages. This is not a deck of loose words.</p>
            </div>
          ) : null}
        </Panel>
      ) : null}

      {passage && phase !== "choose" ? (
        <div className="rounded-[var(--radius-xl)] bg-card px-4 py-5 shadow-[var(--shadow-border)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{passage.label}</p>
          {passage.names ? <p className="mt-1 text-xs text-muted">Dotted words are names. They are not parsed.</p> : null}
          <div className="mt-3 space-y-3" dir="rtl" lang="he">
            {passage.verses.map((verseRow) => (
              <p key={verseRow.verse} className="he-verse he-word text-2xl leading-relaxed text-ink">
                <span className="me-2 text-sm text-muted" dir="ltr">
                  {verseRow.verse}
                </span>
                {verseRow.tokens.map((token) => {
                  const on = active?.key === token.key || (phase === "find" && tapped.includes(token.key));
                  return (
                    <button
                      key={token.key}
                      type="button"
                      disabled={phase !== "find"}
                      onClick={() => onTap(token.key)}
                      className={cn(
                        "mx-0.5 inline rounded px-0.5",
                        on && "he-spoken",
                        token.role === "name" && "underline decoration-dotted underline-offset-4",
                        phase === "find" && "min-h-11",
                      )}
                    >
                      {token.surface}
                    </button>
                  );
                })}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {phase === "read" && passage ? (
        <div className="mt-4">
          <p className="text-sm text-muted">Read the Hebrew. The parse and the English stay hidden until you ask.</p>
          <Button
            type="button"
            className="mt-3 h-12 w-full"
            onClick={() => {
              setAt(0);
              resetWord();
              setPhase(mode === "independent" ? "find" : "parse");
            }}
          >
            Start parsing
          </Button>
          <button
            type="button"
            className="mt-3 min-h-11 text-sm font-semibold text-primary"
            onClick={() => {
              setPhase("choose");
              setOneWord(false);
              void navigate({ to });
            }}
          >
            Change passage
          </button>
        </div>
      ) : null}

      {phase === "find" && passage ? (
        <Panel className="mt-4">
          <p className="font-semibold text-ink">Tap every common noun and every verb.</p>
          <p className="mt-1 text-sm text-muted">{tapNote || `${tapped.length} selected.`}</p>
          <Button type="button" className="mt-4 h-12 w-full" onClick={doneFinding}>
            Done finding
          </Button>
        </Panel>
      ) : null}

      {phase === "parse" && active ? (
        <Panel className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {active.role === "verb" ? "Verb" : "Noun"} {oneWord ? "" : `${at + 1} of ${passage?.tasks.length ?? 0}`}
            {active.aramaic ? " · Aramaic" : ""}
          </p>
          <p className="he-word mt-2 text-4xl text-ink" dir="rtl" lang="he">
            {active.surface}
          </p>
          <p className="mt-1 text-sm text-muted">{active.ref}</p>
          <div className="mt-4 space-y-4">
            {active.lines.filter((row) => !(row.id === "lemma" && lemmaMissing)).map((row) => {
              const lock = locks[row.id];
              const options =
                row.id === "lemma"
                  ? lemmas.map((item) => ({ value: item.id, label: item.he, hebrew: true }))
                  : choicesFor(active, row).map((value) => ({ value, label: value, hebrew: false }));
              if (row.id === "lemma" && lemmas.length === 0 && !lock) {
                return (
                  <p key={row.id} className="text-sm text-muted">
                    Dictionary form is still loading.
                  </p>
                );
              }
              return (
                <div key={row.id}>
                  <p className="text-sm font-semibold text-ink">{row.label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        disabled={Boolean(lock)}
                        onClick={() => setPicks((prev) => ({ ...prev, [row.id]: option.value }))}
                        className={cn(
                          "min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold",
                          option.hebrew && "he-word text-xl",
                          lock && option.value === row.answer && "bg-primary text-primary-foreground",
                          lock && picks[row.id] === option.value && option.value !== row.answer && "bg-surface text-muted line-through",
                          !lock && picks[row.id] === option.value && "bg-ink text-parchment",
                          !lock && picks[row.id] !== option.value && "bg-surface text-ink",
                        )}
                        dir={option.hebrew ? "rtl" : undefined}
                        lang={option.hebrew ? "he" : undefined}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {lock === "ok" ? <p className="mt-1 text-xs text-primary">Right.</p> : null}
                  {lock === "miss" ? (
                    <p className="mt-1 text-xs text-muted">
                      The text has {row.id === "lemma" ? (lemmas.find((item) => item.id === row.answer)?.he ?? "a different dictionary form") : row.answer}.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          {hint ? <p className="mt-4 text-sm text-ink">{hint}</p> : null}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" disabled={hints >= 3 || wordDone} onClick={askHint}>
              Hint {Math.min(hints + 1, 3)} of 3
            </Button>
            {wordDone ? (
              <Button type="button" onClick={finishWord}>
                {oneWord || at + 1 >= (passage?.tasks.length ?? 1) ? "Review" : "Next word"}
              </Button>
            ) : (
              <Button type="button" disabled={!readyToMark} onClick={markWord}>
                Mark this word
              </Button>
            )}
          </div>
        </Panel>
      ) : null}

      {phase === "review" ? (
        <Panel className="mt-4">
          <h2 className="font-display text-2xl font-bold text-ink">Missed features</h2>
          {misses.length ? (
            <ul className="mt-3 space-y-2 text-sm text-ink">
              {misses.map((row) => (
                <li key={`${row.feature}-${row.ref}-${row.surface}`}>
                  {row.feature} · <span className="he-word text-xl" dir="rtl" lang="he">{row.surface}</span> · {row.ref}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No missed lines in this passage.</p>
          )}
          <p className="mt-3 text-xs text-muted">Saved for the next time you open the lab. Not a deck of loose words.</p>
          <Button type="button" className="mt-4 h-12 w-full" onClick={() => setPhase("translate")}>
            Say what it means
          </Button>
        </Panel>
      ) : null}

      {phase === "translate" && passage ? (
        <Panel className="mt-4">
          <h2 className="font-display text-2xl font-bold text-ink">In English</h2>
          <p className="mt-2 text-sm text-muted">Write a short English of the passage. It is not scored.</p>
          <textarea
            className="mt-3 min-h-28 w-full rounded-[var(--radius-md)] border border-border bg-parchment px-3 py-2 text-ink"
            value={english}
            onChange={(event) => setEnglish(event.target.value)}
            placeholder="In the beginning…"
          />
          <Button type="button" className="mt-3 h-12 w-full" onClick={() => setShowEn(true)}>
            Show the English
          </Button>
          {showEn ? (
            <div className="mt-4 space-y-2 text-sm text-ink">
              {passage.verses.map((verseRow) => (
                <p key={verseRow.verse}>
                  <span className="text-muted">{verseRow.verse} </span>
                  {verseRow.en}
                </p>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex flex-col gap-2">
            {oneWord ? (
              <Button
                type="button"
                onClick={() =>
                  void navigate({
                    to,
                    search: { book: passage.book, ch: passage.chapter, v: passage.from, n: PARSE_VERSE_CAP, mode: "guided" },
                  })
                }
              >
                Parse this passage
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() =>
                  void navigate({
                    to,
                    search: { book: passage.book, ch: passage.chapter, v: passage.to + 1, n: PARSE_VERSE_CAP, mode },
                  })
                }
              >
                Next five verses
              </Button>
            )}
            <Link to={to} className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-primary">
              Choose another passage
            </Link>
          </div>
        </Panel>
      ) : null}
    </>
  );
}
