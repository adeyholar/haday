import { useEffect, useRef, useState } from "react";
import { verseLabel, wlcClusters, type WlcChapter, type WlcWord } from "@/lib/wlc";

export type SheetTone = "light" | "dim";

function WordFace({
  word,
  picked,
  onPick,
}: {
  word: WlcWord;
  picked: boolean;
  onPick: (word: WlcWord) => void;
}) {
  const clusters = wlcClusters(word.surface);
  const stressAt = word.stress?.letter_index;
  const qere = word.qere?.[0];
  return (
    <button
      type="button"
      dir="rtl"
      aria-pressed={picked}
      onClick={() => onPick(word)}
      className={`ms-word inline-flex min-h-11 items-end px-0.5 ${picked ? "ms-picked" : ""}`}
    >
      <span className="he-taam text-[1.85rem] sm:text-4xl" lang="he">
        {clusters.map((cluster, index) => (
          <span key={`${word.id}-${index}`} className={index === stressAt ? "ms-stress" : undefined}>
            {cluster.letter}
            {cluster.marks}
          </span>
        ))}
      </span>
      {qere ? (
        <span className="he-taam ms-qere ms-1 text-lg leading-none" lang="he">
          ({qere.surface})
        </span>
      ) : null}
      {word.trailer ? (
        <span className="he-taam text-[1.85rem] sm:text-4xl" lang="he">
          {word.trailer}
        </span>
      ) : null}
    </button>
  );
}

function WordCard({ word, onClose }: { word: WlcWord; onClose: () => void }) {
  const qere = word.qere ?? [];
  const stress = word.stress;
  return (
    <div className="rounded-[var(--radius-xl)] bg-card p-4 shadow-[var(--shadow-border)]">
      <div className="flex items-start justify-between gap-3">
        <p className="he-taam text-4xl text-ink" dir="rtl" lang="he">
          {word.surface}
          {word.trailer.trim() ? word.trailer.trim() : ""}
        </p>
        <button type="button" onClick={onClose} className="min-h-11 shrink-0 font-semibold text-primary">
          Close
        </button>
      </div>
      {qere.length ? (
        <p className="mt-1 text-sm text-muted">
          Qere{" "}
          <span className="he-taam text-2xl text-primary" dir="rtl" lang="he">
            {qere.map((item) => item.surface).join(" ")}
          </span>
        </p>
      ) : null}
      {word.silluq_inferred ? (
        <p className="mt-2 text-sm text-primary">Silluq here was inferred. This verse has no sof pasuq.</p>
      ) : null}
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-muted">Consonants</dt>
          <dd className="he-taam text-xl" dir="rtl" lang="he">
            {word.consonants}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Accent</dt>
          <dd>{word.main_accent || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Stress</dt>
          <dd>{stress ? `${stress.syll_from_end} from the end` : "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Pause path</dt>
          <dd>{word.rhythm_path || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Lemma</dt>
          <dd className="he-taam text-xl" dir="rtl" lang="he">
            {word.lemma || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Morph</dt>
          <dd className="break-all">{word.morph || "—"}</dd>
        </div>
      </dl>
    </div>
  );
}

export function WlcReading({ chapter, tone }: { chapter: WlcChapter; tone: SheetTone }) {
  const [picked, setPicked] = useState<WlcWord | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const system = chapter.verses[0]?.system === "poetic" ? "Poetry" : "Prose";

  useEffect(() => {
    setPicked(null);
    frame.current?.scrollTo({ top: 0 });
  }, [chapter.book, chapter.chapter]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {picked ? (
        <div className="mb-2 max-h-[42%] shrink-0 overflow-y-auto">
          <WordCard word={picked} onClose={() => setPicked(null)} />
        </div>
      ) : null}
      <div
        ref={frame}
        tabIndex={0}
        aria-label="Chapter manuscript"
        className={`manuscript-sheet ${tone === "dim" ? "manuscript-dim" : "manuscript-light"}`}
      >
        <p className="manuscript-note">
          {system}. The line marks the stressed letter. A word in parentheses is the qere. Tap a word for the pause path.
        </p>
        <div className="space-y-4">
          {chapter.verses.map((verse) => (
            <div key={verse.ref} className="flex items-start gap-3" dir="rtl">
              <span className="ms-verse-no mt-3 w-8 shrink-0 text-sm font-semibold" dir="ltr">
                {verseLabel(verse.ref)}
              </span>
              <p className="he-verse min-w-0 flex-1">
                {verse.words
                  .filter((word) => word.kq_role !== "qere")
                  .map((word) => (
                    <WordFace key={word.id} word={word} picked={picked?.id === word.id} onPick={setPicked} />
                  ))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
