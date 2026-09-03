import { Navigate, createFileRoute } from "@tanstack/react-router";
import { TanakhReading } from "@/components/tanakh-reading";
import { parseReadSearch, passageSearch, resolvePassage } from "@/lib/passage";
import { bookMeta, isBookId, parseChapter } from "@/lib/tanakh-canon";

export const Route = createFileRoute("/listen/read/$book/$ch")({
  validateSearch: parseReadSearch,
  component: ChapterReadPage,
});

function ChapterReadPage() {
  const { book, ch } = Route.useParams();
  const search = Route.useSearch();
  if (!isBookId(book)) return <Navigate to="/listen/read" />;
  const meta = bookMeta(book);
  if (!meta) return <Navigate to="/listen/read" />;
  const chapter = parseChapter(ch, meta.chapters);
  if (chapter == null) return <Navigate to="/listen/read/$book" params={{ book }} />;
  const passage = resolvePassage(book, chapter, search);
  if (passage.chapter !== chapter) {
    return (
      <Navigate
        to="/listen/read/$book/$ch"
        params={{ book: passage.book, ch: String(passage.chapter) }}
        search={passageSearch(passage)}
      />
    );
  }
  return (
    <TanakhReading
      key={`${book}.${chapter}.${search.v1 ?? ""}-${search.v2 ?? ""}-${search.c1 ?? ""}-${search.c2 ?? ""}-${search.scope ?? ""}`}
      book={book}
      chapter={chapter}
      search={search}
    />
  );
}
