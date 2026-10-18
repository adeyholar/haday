import { Link, createFileRoute } from "@tanstack/react-router";
import { ScriptureTabs } from "@/components/iibs-door";
import { SECTIONS, booksIn } from "@/lib/tanakh-canon";

export const Route = createFileRoute("/iibs/wlc/")({
  component: WlcLibrary,
});

function WlcLibrary() {
  return (
    <>
      <ScriptureTabs active="lab" />
      <section className="mb-4 rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Scripture Path</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">Reading Lab</h1>
        <p className="mt-3 max-w-prose text-muted">
          Leningrad Tanakh. The accents, the stress, and the pause stay on the word. Tap a word to see them. Thirty-nine books.
        </p>
      </section>
      {SECTIONS.map((section) => (
        <section key={section.id} className="mb-6">
          <h2 className="font-display text-2xl font-bold text-ink">
            {section.en}{" "}
            <span className="he-word text-xl text-muted" dir="rtl" lang="he">
              {section.he}
            </span>
          </h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {booksIn(section.id).map((book) => (
              <Link
                key={book.id}
                to="/iibs/wlc/$book/$ch"
                params={{ book: book.id, ch: "1" }}
                className="flex min-h-14 items-center justify-between rounded-[var(--radius-xl)] bg-card px-4 text-ink shadow-[var(--shadow-border)]"
              >
                <span className="font-semibold">{book.en}</span>
                <span className="he-word text-xl" dir="rtl" lang="he">
                  {book.he}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
