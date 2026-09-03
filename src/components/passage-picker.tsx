import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/panel";
import {
  lastChapter,
  passageLabel,
  passageSearch,
  resolvePassage,
  versesInChapter,
  type PassageKind,
} from "@/lib/passage";
import { TANAKH_BOOKS, bookMeta, type BookId } from "@/lib/tanakh-canon";

const KINDS: { id: PassageKind; label: string }[] = [
  { id: "verses", label: "Verses" },
  { id: "chapters", label: "Chapters" },
  { id: "book", label: "Book" },
  { id: "all", label: "Tanakh" },
];

function num(raw: string, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function PassagePicker({
  defaultBook = "Gen",
  defaultChapter = 1,
}: {
  defaultBook?: BookId;
  defaultChapter?: number;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PassageKind>("verses");
  const [book, setBook] = useState<BookId>(defaultBook);
  const [chapter, setChapter] = useState(String(defaultChapter));
  const [fromCh, setFromCh] = useState("1");
  const [toCh, setToCh] = useState(String(Math.min(5, lastChapter(defaultBook))));
  const [fromV, setFromV] = useState("1");
  const [toV, setToV] = useState(String(versesInChapter(defaultBook, defaultChapter)));
  const [loop, setLoop] = useState(true);

  const chMax = lastChapter(book);
  const ch = Math.min(chMax, Math.max(1, num(chapter, 1)));
  const vMax = versesInChapter(book, ch);
  const preview = useMemo(() => {
    if (kind === "verses") {
      return resolvePassage(book, ch, { v1: num(fromV, 1), v2: num(toV, vMax), loop });
    }
    if (kind === "chapters") {
      return resolvePassage(book, num(fromCh, 1), { c1: num(fromCh, 1), c2: num(toCh, chMax), loop });
    }
    if (kind === "book") return resolvePassage(book, 1, { scope: "book", loop });
    return resolvePassage("Gen", 1, { scope: "all", loop });
  }, [kind, book, ch, fromCh, toCh, fromV, toV, vMax, chMax, loop]);

  function go(e?: FormEvent) {
    e?.preventDefault();
    const p = preview;
    void navigate({
      to: "/listen/read/$book/$ch",
      params: { book: p.book, ch: String(p.kind === "chapters" ? p.fromCh : p.chapter) },
      search: passageSearch({ ...p, loop }),
    });
  }

  function setBookId(id: BookId) {
    setBook(id);
    const max = lastChapter(id);
    const nextCh = Math.min(max, num(chapter, 1));
    setChapter(String(nextCh));
    setFromCh("1");
    setToCh(String(Math.min(5, max)));
    setFromV("1");
    setToV(String(versesInChapter(id, nextCh)));
  }

  return (
    <Panel className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-h-12 items-center justify-between gap-3 text-start"
        aria-expanded={open}
      >
        <span>
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-primary">Passage</span>
          <span className="mt-1 block font-display text-2xl font-bold text-ink">Memorize a stretch</span>
          <span className="mt-1 block text-sm text-muted">
            Verses, a run of chapters, one book, or the whole Tanakh. Open a book below to browse the canon.
          </span>
        </span>
        {open ? <ChevronUp className="size-5 shrink-0 text-muted" /> : <ChevronDown className="size-5 shrink-0 text-muted" />}
      </button>

      {open ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={`min-h-12 rounded-[var(--radius-md)] px-2 text-sm font-semibold shadow-[var(--shadow-border)] ${
                  kind === k.id ? "bg-ink text-parchment" : "bg-surface text-ink"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          <form className="mt-4 grid gap-3" onSubmit={go}>
            {kind !== "all" ? (
              <label className="grid gap-1 text-sm font-semibold text-ink">
                Book
                <select
                  className="min-h-12 rounded-[var(--radius-md)] bg-surface px-3 text-base font-semibold text-ink shadow-[var(--shadow-border)]"
                  value={book}
                  onChange={(e) => setBookId(e.target.value as BookId)}
                >
                  {TANAKH_BOOKS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.en}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {kind === "verses" ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <NumberField label="Chapter" min={1} max={chMax} value={chapter} onChange={setChapter} />
                <NumberField label="From" min={1} max={vMax} value={fromV} onChange={setFromV} />
                <NumberField label="To" min={1} max={vMax} value={toV} onChange={setToV} />
              </div>
            ) : null}

            {kind === "chapters" ? (
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="From chapter" min={1} max={chMax} value={fromCh} onChange={setFromCh} />
                <NumberField label="To chapter" min={1} max={chMax} value={toCh} onChange={setToCh} />
              </div>
            ) : null}

            <label className="flex min-h-12 items-center justify-between gap-3 rounded-[var(--radius-md)] bg-surface px-3 text-sm font-semibold text-ink shadow-[var(--shadow-border)]">
              Loop this passage
              <input
                type="checkbox"
                className="size-5 accent-primary"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
              />
            </label>

            <p className="text-sm text-muted">
              {kind === "all"
                ? "Plays every book in order, starting at Genesis 1."
                : kind === "book"
                  ? `Plays ${bookMeta(book)?.en ?? book} from chapter 1.`
                  : `Ready: ${passageLabel(preview)}${loop ? " · loops" : ""}.`}
            </p>

            <Button type="submit" size="lg" variant="ink">
              Follow this passage
            </Button>
          </form>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Quick
              label="Genesis 2:7–10"
              onClick={() => {
                void navigate({
                  to: "/listen/read/$book/$ch",
                  params: { book: "Gen", ch: "2" },
                  search: { v1: 7, v2: 10, loop: true },
                });
              }}
            />
            <Quick
              label="Genesis 1–5"
              onClick={() => {
                void navigate({
                  to: "/listen/read/$book/$ch",
                  params: { book: "Gen", ch: "1" },
                  search: { c1: 1, c2: 5, loop: true },
                });
              }}
            />
            <Quick
              label={`Whole ${bookMeta(defaultBook)?.en ?? "book"}`}
              onClick={() => {
                void navigate({
                  to: "/listen/read/$book/$ch",
                  params: { book: defaultBook, ch: "1" },
                  search: { scope: "book", loop: true },
                });
              }}
            />
            <Quick
              label="Whole Tanakh"
              onClick={() => {
                void navigate({
                  to: "/listen/read/$book/$ch",
                  params: { book: "Gen", ch: "1" },
                  search: { scope: "all" },
                });
              }}
            />
          </div>
        </>
      ) : null}
    </Panel>
  );
}

function NumberField({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-ink">
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-12 w-full min-w-0 rounded-[var(--radius-md)] bg-surface px-3 text-base font-semibold text-ink shadow-[var(--shadow-border)]"
      />
    </label>
  );
}

function Quick({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-12 rounded-[var(--radius-md)] bg-surface px-3 text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
    >
      {label}
    </button>
  );
}
