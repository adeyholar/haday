import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/panel";
import { ClassifyDrill } from "@/components/classify-drill";
import { drawRound, spliceLater } from "@/lib/quiz-draw";
import { DontKnowButton } from "@/components/dont-know-button";
import { cn } from "@/lib/cn";
import { findHitRange } from "@/lib/hebrew";
import {
  GRAMMAR_CASES,
  GRAMMAR_GROUPS,
  GRAMMAR_RULES,
  casesForRule,
  formatRef,
  groupTitle,
  huntHits,
  lemmaMatches,
  nameHits,
  refMatchesParts,
  ruleById,
  shuffle,
  HUNT_ROUND_LEN,
  type GrammarCase,
  type GrammarRule,
} from "@/lib/grammar-rules";

type Tab = "study" | "verse" | "name" | "shewa" | "qamets";

export const Route = createFileRoute("/rules")({
  validateSearch: (s: Record<string, unknown>): { play?: Tab } => {
    const play = s.play;
    if (play === "study" || play === "verse" || play === "name" || play === "shewa" || play === "qamets") {
      return { play };
    }
    return {};
  },
  component: RulesPage,
});

function RulesPage() {
  const { play } = Route.useSearch();
  const navigate = useNavigate({ from: "/rules" });
  const tab: Tab = play ?? "verse";

  function setTab(next: Tab) {
    void navigate({ search: { play: next } });
  }

  return (
    <>
      <Panel className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grammar to live by</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink sm:text-4xl">When the rule shows up</h1>
        <p className="mt-2 max-w-prose text-muted">
          These rules are not a chart to memorize. See them in the Tanakh — syllables, the article הַ, and the
          conjunction וְ — then hunt the lemma and the verse, or name the rule from the highlighted form.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <TabBtn active={tab === "study"} onClick={() => setTab("study")}>
            Read
          </TabBtn>
          <TabBtn active={tab === "verse"} onClick={() => setTab("verse")}>
            Hunt the verse
          </TabBtn>
          <TabBtn active={tab === "name"} onClick={() => setTab("name")}>
            Name the rule
          </TabBtn>
          <TabBtn active={tab === "shewa"} onClick={() => setTab("shewa")}>
            Shewa
          </TabBtn>
          <TabBtn active={tab === "qamets"} onClick={() => setTab("qamets")}>
            Qamets
          </TabBtn>
        </div>
      </Panel>

      {tab === "study" && <StudyList />}
      {tab === "verse" && <VerseHunt />}
      {tab === "name" && <NameHunt />}
      {tab === "shewa" && <ClassifyDrill kind="shewa" />}
      {tab === "qamets" && <ClassifyDrill kind="qamets" />}
    </>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <Button size="sm" variant={active ? "primary" : "outline"} onClick={onClick}>
      {children}
    </Button>
  );
}

function StudyList() {
  return (
    <div className="grid gap-4">
      <section className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">How to keep them</p>
        <h2 className="mt-1 font-display text-xl font-semibold text-ink">Understand, then find it in the text</h2>
        <p className="mt-2 text-sm text-muted">
          BBH: these rules are not to be rigorously memorized. They should be understood and applied to
          syllabification and pronunciation. Every card below is a live Tanakh line. Hunt and Name use the same
          verses — no multiple choice.
        </p>
      </section>
      {GRAMMAR_GROUPS.map((g) => {
        const rules = GRAMMAR_RULES.filter((r) => r.group === g.id);
        return (
          <section key={g.id} className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-xl font-semibold text-ink">{g.title}</h2>
            <ul className="mt-3 grid gap-4">
              {rules.map((r) => {
                const examples = casesForRule(r.id);
                return (
                  <li key={r.id} className="border-t border-border pt-3">
                    <p className="font-medium text-ink">{r.title}</p>
                    <p className="mt-1 text-sm text-muted">{r.statement}</p>
                    {examples.length > 0 && (
                      <ul className="mt-3 grid gap-3">
                        {examples.map((c) => (
                          <li key={c.id}>
                            <TanakhLine item={c} />
                            <p className="mt-1.5 text-sm text-muted">{c.why}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function TanakhLine({ item }: { item: GrammarCase }) {
  const range = findHitRange(item.he, item.hit);
  return (
    <figure className="rounded-[var(--radius-md)] bg-surface/80 px-3 py-2.5">
      <figcaption className="flex flex-wrap items-baseline gap-x-2 text-xs font-semibold uppercase tracking-wide text-subtle">
        <span className="he-word text-base font-bold normal-case tracking-normal text-ink">{item.lemma}</span>
        <span>Tanakh · {formatRef(item)}</span>
      </figcaption>
      <p className="he-word mt-1.5 text-xl leading-relaxed" lang="he">
        {range ? (
          <>
            {item.he.slice(0, range.start)}
            <mark className="he-hit">{item.he.slice(range.start, range.end)}</mark>
            {item.he.slice(range.end)}
          </>
        ) : (
          item.he
        )}
      </p>
      <p className="mt-1 text-sm text-muted">{item.en}</p>
    </figure>
  );
}

function VerseHunt() {
  const [seed, setSeed] = useState(0);
  const deck = useMemo(() => {
    const byRule = new Map<string, GrammarCase[]>();
    for (const c of GRAMMAR_CASES) {
      const list = byRule.get(c.ruleId) ?? [];
      list.push(c);
      byRule.set(c.ruleId, list);
    }
    const picks = [...byRule.values()].map((list) => shuffle(list)[0]);
    return drawRound(picks, HUNT_ROUND_LEN, "hunt:verse", (c) => c.id);
  }, [seed]);

  return <HuntRound key={seed} mode="verse" deck={deck} onAgain={() => setSeed((n) => n + 1)} />;
}

function NameHunt() {
  const [seed, setSeed] = useState(0);
  const deck = useMemo(() => drawRound(GRAMMAR_CASES, HUNT_ROUND_LEN, "hunt:name", (c) => c.id), [seed]);
  return <HuntRound key={seed} mode="name" deck={deck} onAgain={() => setSeed((n) => n + 1)} />;
}

function HuntRound({
  mode,
  deck,
  onAgain,
}: {
  mode: "verse" | "name";
  deck: GrammarCase[];
  onAgain: () => void;
}) {
  const [i, setI] = useState(0);
  const [lemma, setLemma] = useState("");
  const [book, setBook] = useState("");
  const [chapter, setChapter] = useState("");
  const [verse, setVerse] = useState("");
  const [ruleText, setRuleText] = useState("");
  const [tries, setTries] = useState(0);
  const [hint, setHint] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [ok, setOk] = useState(false);
  const [matched, setMatched] = useState<GrammarCase | null>(null);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [items, setItems] = useState(deck);
  const [retryIds, setRetryIds] = useState<Set<string>>(() => new Set());
  const [gaveUp, setGaveUp] = useState(false);

  const item = items[i];
  const rule = item ? ruleById(item.ruleId) : undefined;
  const siblings = item ? casesForRule(item.ruleId) : [];

  function resetFields() {
    setLemma("");
    setBook("");
    setChapter("");
    setVerse("");
    setRuleText("");
    setTries(0);
    setHint("");
    setRevealed(false);
    setOk(false);
    setMatched(null);
    setGaveUp(false);
  }

  function admitNoIdea() {
    if (!item || revealed) return;
    setOk(false);
    setMatched(item);
    setRevealed(true);
    setHint("");
    setGaveUp(true);
    setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
  }

  function check() {
    if (!item || !rule) return;
    if (mode === "verse") {
      const hit = huntHits(item.ruleId, lemma, book, chapter, verse);
      if (hit) {
        setOk(true);
        setMatched(hit);
        setRevealed(true);
        setHint("");
        setScore((s) => ({ ...s, right: s.right + 1 }));
        return;
      }
      const lemmaOk = siblings.some((c) => lemmaMatches(c, lemma));
      const refOk = siblings.some((c) => refMatchesParts(c, book, chapter, verse));
      if (tries < 1) {
        setTries(1);
        if (lemmaOk && !refOk) setHint("Lemma is right. Name the book, chapter, and verse.");
        else if (refOk && !lemmaOk) setHint("The place is right. Name the lemma.");
        else setHint(`Look in ${item.book}.`);
        return;
      }
      setOk(false);
      setMatched(item);
      setRevealed(true);
      setHint("");
      setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
      return;
    }

    if (nameHits(item, ruleText)) {
      setOk(true);
      setMatched(item);
      setRevealed(true);
      setHint("");
      setScore((s) => ({ ...s, right: s.right + 1 }));
      return;
    }
    if (tries < 1) {
      setTries(1);
      setHint(`This belongs with ${groupTitle(rule.group)}.`);
      return;
    }
    setOk(false);
    setMatched(item);
    setRevealed(true);
    setHint("");
    setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
  }

  function next() {
    if (gaveUp && item && !retryIds.has(item.id)) {
      setRetryIds((s) => new Set(s).add(item.id));
      setItems((list) => spliceLater(list, i, item));
    }
    resetFields();
    setI((n) => n + 1);
  }

  if (!item || !rule) {
    const total = score.right + score.wrong;
    return (
      <div className="rounded-[var(--radius-xl)] bg-card p-8 text-center shadow-[var(--shadow-border)]">
        <h2 className="font-display text-3xl font-semibold">Round complete</h2>
        <p className="mt-2 font-display text-4xl tabular-nums">
          {score.right}
          <span className="text-xl text-muted"> / {total}</span>
        </p>
        <Button className="mt-6" onClick={onAgain}>
          New round
        </Button>
      </div>
    );
  }

  return (
    <>
      <p className="mb-3 text-sm font-medium tabular-nums text-ink">
        {i + 1} / {items.length} · {score.right} correct
      </p>

      {mode === "verse" ? (
        <div className="rounded-[var(--radius-xl)] bg-card px-5 py-6 shadow-[var(--shadow-border)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-subtle">{groupTitle(rule.group)}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">{rule.title}</h2>
          <p className="mt-2 text-muted">{rule.statement}</p>
          <p className="mt-4 text-sm font-medium text-ink">
            Name a lemma where this rule is applied, and the book, chapter, and verse. No list — recall it.
          </p>
        </div>
      ) : (
        <VersePrompt item={item} showEnglish={revealed} />
      )}

      <form
        className="mt-4 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (revealed) next();
          else check();
        }}
      >
        {mode === "verse" ? (
          <>
            <label className="grid gap-1 text-sm font-medium text-ink">
              Lemma (Hebrew or English name)
              <input
                value={lemma}
                onChange={(e) => setLemma(e.target.value)}
                disabled={revealed}
                className={fieldClass()}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="lemma"
                autoComplete="off"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="grid gap-1 text-sm font-medium text-ink">
                Book
                <input
                  value={book}
                  onChange={(e) => setBook(e.target.value)}
                  disabled={revealed}
                  className={fieldClass()}
                  placeholder="book"
                  autoCapitalize="off"
                  autoComplete="off"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-ink">
                Chapter
                <input
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  disabled={revealed}
                  className={fieldClass()}
                  inputMode="numeric"
                  placeholder="ch"
                  autoComplete="off"
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-ink">
                Verse
                <input
                  value={verse}
                  onChange={(e) => setVerse(e.target.value)}
                  disabled={revealed}
                  className={fieldClass()}
                  inputMode="numeric"
                  placeholder="vs"
                  autoComplete="off"
                />
              </label>
            </div>
          </>
        ) : (
          <label className="grid gap-1 text-sm font-medium text-ink">
            Which rule is applied to the highlighted form?
            <input
              value={ruleText}
              onChange={(e) => setRuleText(e.target.value)}
              disabled={revealed}
              className={fieldClass()}
              placeholder="Type the rule — no choices"
              autoCapitalize="off"
              autoComplete="off"
            />
          </label>
        )}

        {tries > 0 && !revealed && (
          <div className="rounded-[var(--radius-md)] bg-danger/10 px-3 py-2 text-center">
            <p className="try-flash text-xl font-bold uppercase tracking-wide text-danger">One more try</p>
            {hint && <p className="mt-1 text-sm font-medium text-ink">{hint}</p>}
          </div>
        )}

        {revealed && <AnswerPanel item={matched ?? item} rule={rule} ok={ok} mode={mode} siblings={siblings} />}
        {gaveUp && revealed && (
          <p className="text-center text-sm text-muted">Back in the pool — you will see it again.</p>
        )}
        {!revealed && <DontKnowButton onClick={admitNoIdea} />}

        <Button type="submit" size="lg" className="w-full">
          {revealed ? "Next" : "Check"}
        </Button>
      </form>
    </>
  );
}

function fieldClass() {
  return "h-12 w-full rounded-[var(--radius-md)] bg-card px-3 font-medium text-ink shadow-[var(--shadow-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
}

function VersePrompt({ item, showEnglish }: { item: GrammarCase; showEnglish: boolean }) {
  const range = findHitRange(item.he, item.hit);
  return (
    <figure className="rounded-[var(--radius-xl)] bg-card px-5 py-6 text-start shadow-[var(--shadow-border)]">
      <figcaption className="text-xs font-semibold uppercase tracking-wide text-muted">
        Tanakh · {formatRef(item)}
        {!showEnglish && (
          <span className="ms-2 font-normal normal-case tracking-normal">Hebrew first — name the rule</span>
        )}
      </figcaption>
      <p className="he-word mt-3 text-2xl leading-relaxed" lang="he">
        {range ? (
          <>
            {item.he.slice(0, range.start)}
            <mark className="he-hit">{item.he.slice(range.start, range.end)}</mark>
            {item.he.slice(range.end)}
          </>
        ) : (
          item.he
        )}
      </p>
      {showEnglish && <p className="mt-2 text-sm text-muted">{item.en}</p>}
    </figure>
  );
}

function AnswerPanel({
  item,
  rule,
  ok,
  mode,
  siblings,
}: {
  item: GrammarCase;
  rule: GrammarRule;
  ok: boolean;
  mode: "verse" | "name";
  siblings: GrammarCase[];
}) {
  return (
    <div className={cn("rounded-[var(--radius-lg)] px-4 py-3 text-start", ok ? "bg-good/15" : "bg-danger/10")}>
      <p className={cn("text-sm font-bold uppercase tracking-wide", ok ? "text-good" : "text-danger")}>
        {ok ? "Correct" : "Not yet"}
      </p>
      <p className="mt-1 font-medium text-ink">{rule.title}</p>
      <p className="mt-1 he-word text-xl">
        {item.lemma}{" "}
        <span className="font-sans text-sm font-medium text-muted">· {formatRef(item)}</span>
      </p>
      <p className="mt-2 text-sm text-muted">{item.why}</p>
      {mode === "verse" && (
        <p className="mt-2 text-sm text-ink" lang="he">
          {item.he}
        </p>
      )}
      {mode === "verse" && <p className="mt-1 text-sm text-muted">{item.en}</p>}
      {mode === "verse" && siblings.length > 1 && (
        <p className="mt-3 text-xs text-subtle">
          Also accepted:{" "}
          {siblings.map((c, idx) => (
            <span key={c.id}>
              {idx > 0 ? " · " : ""}
              <span className="he-word text-sm text-ink">{c.lemma}</span> {formatRef(c)}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
