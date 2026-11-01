import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { joinsNext, verseLabel, wlcClusters, wlcMaqafChains, type WlcChapter, type WlcWord } from "@/lib/wlc";
import type { FollowSpot } from "@/lib/wlc-follow";
import { useFollowScroll } from "@/lib/use-follow-scroll";
import { placeDesktopCard, wordFullyOffScreen, desktopCardSheet, type DesktopCardPlace } from "@/lib/wlc-card-place";
import { WlcLexicon } from "@/components/wlc-lexicon";
import { Link } from "@tanstack/react-router";
import { MorphLines } from "@/components/morph-lines";
import { matchInPool } from "@/lib/reading-loop/known";
import { poolFor } from "@/lib/reading-loop/pool";
import { savePassagePack, type StudyScope } from "@/lib/reading-loop/passage";

/** The chapter page scrolls. On a desktop the word card floats and does not reserve a column. */
export const WLC_PAGE_SCROLL_QUERY = "(min-width: 0px)";
const WLC_SIDE_CARD_QUERY = "(min-width: 1024px)";

function pageScrolls(): boolean {
  return true;
}

function sideCard(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(WLC_SIDE_CARD_QUERY).matches
    : false;
}

export type SheetTone = "light" | "dim";
export type SheetSize = "tight" | "small" | "page" | "large";

function WordFace({
  word,
  picked,
  spoken,
  dim,
  onPick,
}: {
  word: WlcWord;
  picked: boolean;
  spoken: boolean;
  dim: boolean;
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
      className={`ms-word inline-flex min-h-11 items-center px-0.5 py-1 ${picked ? "ms-picked" : ""} ${
        spoken ? "ms-spoken" : ""
      } ${dim && !picked && !spoken ? "ms-unknown" : ""} ${joinsNext(word) ? "ms-joins" : ""}`}
    >
      <span className="he-taam ms-word-face" lang="he">
        {clusters.map((cluster, index) => (
          <span key={`${word.id}-${index}`} className={index === stressAt ? "ms-stress" : undefined}>
            {cluster.letter}
            {cluster.marks}
          </span>
        ))}
      </span>
      {qere ? (
        <span className="he-taam ms-qere ms-1" lang="he">
          ({qere.surface})
        </span>
      ) : null}
      {word.trailer ? (
        <span className="he-taam ms-trailer" lang="he">
          {word.trailer}
        </span>
      ) : null}
    </button>
  );
}

function stressLabel(word: WlcWord): string {
  const stress = word.stress;
  if (!stress) return "—";
  const place = `${stress.syll_from_end} from the end`;
  if (stress.source === "postpositive-single") return `${place}. One pashta, so the stress is final.`;
  if (stress.source === "doubled") return `${place}. Doubled accent.`;
  if (stress.source) return `${place}. ${stress.source}`;
  return place;
}

function metegLine(word: WlcWord): string {
  const rows = word.meteg ?? [];
  if (!rows.length) return "—";
  return rows
    .map((row) => (row.function === "silluq" ? "silluq, the verse pause" : `meteg on letter ${row.letter_index + 1}`))
    .join(", ");
}

function WordCard({
  word,
  loop,
  onClose,
}: {
  word: WlcWord;
  loop?: { scope: StudyScope; ref: string; back: string };
  onClose: () => void;
}) {
  const qere = word.qere ?? [];
  const lemma = loop ? matchInPool(word.surface, poolFor(loop.scope)) : undefined;
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
          <dt className="text-muted">Meteg</dt>
          <dd>{metegLine(word)}</dd>
        </div>
        <div>
          <dt className="text-muted">Stress</dt>
          <dd>{stressLabel(word)}</dd>
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
      <MorphLines code={word.morph} />
      {lemma && loop ? (
        <Link
          to="/drill"
          search={{ set: "passage", from: loop.back }}
          onClick={() =>
            savePassagePack({
              scope: loop.scope,
              ref: loop.ref,
              label: lemma.gloss,
              ids: [lemma.id],
              back: loop.back,
            })
          }
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary"
        >
          Drill this lemma
        </Link>
      ) : null}
      {word.morph_note ? <p className="mt-3 text-sm text-muted">{word.morph_note}</p> : null}
      {word.review ? (
        <p className="mt-3 text-sm text-primary">
          Signed correction. The marks in this frame are the corrected Leningrad reading.
        </p>
      ) : null}
      <WlcLexicon lemma={word.lemma} morph={word.morph} />
    </div>
  );
}

export function WlcReading({
  chapter,
  tone,
  size,
  showNote,
  spot,
  resumeTick = 0,
  dimIds,
  loop,
}: {
  chapter: WlcChapter;
  tone: SheetTone;
  size: SheetSize;
  showNote: boolean;
  spot: FollowSpot | null;
  resumeTick?: number;
  /** Word ids still to learn. Only applied while Dim unknowns is on. */
  dimIds?: ReadonlySet<string>;
  loop?: { scope: StudyScope; ref: string; back: string };
}) {
  const [picked, setPicked] = useState<WlcWord | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const system = chapter.verses[0]?.system === "poetic" ? "Poetry" : "Prose";
  const follow = useFollowScroll(spot ? String(spot.verse) : "");
  const { resume, showBack, targetRef } = follow;

  const card = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(0);
  const [place, setPlace] = useState<DesktopCardPlace | null>(null);

  const closeCard = (focusWord: boolean) => {
    const word = frame.current?.querySelector<HTMLElement>(".ms-picked");
    setPicked(null);
    if (focusWord) window.setTimeout(() => word?.focus({ preventScroll: true }), 0);
  };

  useEffect(() => {
    setPicked(null);
    if (pageScrolls()) window.scrollTo({ top: 0 });
  }, [chapter.book, chapter.chapter]);

  useEffect(() => {
    if (!picked) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeCard(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked]);

  // Phones and short screens: the card is a bottom sheet over the page. Keep the
  // picked word in sight above it, and leave room under the last verse.
  useEffect(() => {
    const el = card.current;
    if (!picked || !el || typeof ResizeObserver === "undefined") {
      setCardHeight(0);
      return;
    }
    const sync = () => setCardHeight(!sideCard() || place?.mode === "sheet" ? el.getBoundingClientRect().height : 0);
    sync();
    const watch = new ResizeObserver(sync);
    watch.observe(el);
    return () => watch.disconnect();
  }, [picked, place?.mode]);

  useLayoutEffect(() => {
    if (!picked) {
      setPlace(null);
      return;
    }
    const mq = window.matchMedia(WLC_SIDE_CARD_QUERY);
    let last: DesktopCardPlace | null = null;
    const measure = () => {
      if (!mq.matches) {
        if (last) {
          last = null;
          setPlace(null);
        }
        return;
      }
      const sheet = frame.current?.getBoundingClientRect();
      const word = frame.current?.querySelector(".ms-picked")?.getBoundingClientRect();
      const toolbar = document.querySelector(".wlc-toolbar")?.getBoundingClientRect();
      const dock = document.querySelector(".read-dock")?.getBoundingClientRect();
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const dockTop = dock?.top ?? window.innerHeight;
      const toolbarBottom = (toolbar?.bottom ?? 6.75 * root) + 8;
      if (word && wordFullyOffScreen(word, window.innerHeight)) {
        closeCard(false);
        return;
      }
      const next =
        !sheet || !word || sheet.width < 1 || word.width < 1
          ? desktopCardSheet(toolbarBottom, dockTop)
          : placeDesktopCard({
              sheet: { left: sheet.left, right: sheet.right },
              word: { left: word.left, right: word.right },
              viewportWidth: window.innerWidth,
              toolbarBottom,
              dockTop,
              rootFontPx: root,
            });
      if (
        last &&
        last.mode === next.mode &&
        last.side === next.side &&
        Math.abs(last.left - next.left) < 0.5 &&
        Math.abs(last.width - next.width) < 0.5 &&
        Math.abs(last.top - next.top) < 0.5 &&
        Math.abs(last.maxHeight - next.maxHeight) < 0.5
      ) {
        return;
      }
      last = next;
      setPlace(next);
    };
    measure();
    const watch = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    if (watch && frame.current) watch.observe(frame.current);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    mq.addEventListener("change", measure);
    return () => {
      watch?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      mq.removeEventListener("change", measure);
    };
  }, [picked]);

  useEffect(() => {
    if (!picked || !cardHeight) return;
    const word = frame.current?.querySelector<HTMLElement>(".ms-picked");
    if (!word) return;
    const rect = word.getBoundingClientRect();
    const room = window.innerHeight - cardHeight - 12;
    if (rect.bottom > room) window.scrollBy({ top: rect.bottom - room, behavior: "smooth" });
  }, [picked, cardHeight]);

  useEffect(() => {
    if (resumeTick) resume();
  }, [resumeTick, resume]);

  return (
    <div
      className="wlc-reading flex min-h-0 flex-1 flex-col"
      style={cardHeight ? ({ "--wlc-card-h": `${Math.ceil(cardHeight)}px` } as CSSProperties) : undefined}
    >
      {picked ? (
        <div
          ref={card}
          className="wlc-card"
          data-place={place?.mode}
          data-side={place?.side}
          style={
            place && place.mode !== "sheet"
              ? { left: place.left, width: place.width, top: place.top, maxHeight: place.maxHeight }
              : undefined
          }
        >
          <WordCard word={picked} loop={loop} onClose={() => closeCard(true)} />
        </div>
      ) : null}
      {showBack ? (
        <button type="button" className="read-back min-h-11 rounded-full bg-ink px-4 text-sm font-semibold text-parchment" onClick={resume}>
          Back to the reader
        </button>
      ) : null}
      <div
        ref={frame}
        tabIndex={0}
        aria-label="Chapter manuscript"
        className={`manuscript-sheet manuscript-${size} ${tone === "dim" ? "manuscript-dim" : "manuscript-light"}`}
      >
        {showNote ? (
          <p className="manuscript-note">
            {system}
            {chapter.dataset_version ? ` · Leningrad ${chapter.dataset_version}` : ""}. Accents and meteg stay on the word.
            A signed correction stays in this frame. The line sits under the stressed letter. A word in parentheses is the qere.
          </p>
        ) : null}
        <div className="ms-verses">
          {chapter.verses.map((verse, verseIndex) => {
            const shown = verse.words.filter((word) => word.kq_role !== "qere");
            const spokenId = spot?.verse === verseIndex && spot.word != null ? shown[spot.word]?.id : undefined;
            return (
            <div
              key={verse.ref}
              ref={(node) => {
                if (spot?.verse === verseIndex) targetRef.current = node;
              }}
              className={`read-line ms-verse flex items-start ${spot?.verse === verseIndex && spot.word == null ? "ms-spoken-verse" : ""}`}
              dir="rtl"
            >
              <span className="ms-verse-no mt-3 w-8 shrink-0 text-sm font-semibold" dir="ltr">
                {verseLabel(verse.ref)}
              </span>
              <p className="he-verse min-w-0 flex-1">
                {wlcMaqafChains(shown).map((chain) =>
                  chain.length === 1 ? (
                    <WordFace
                      key={chain[0].id}
                      word={chain[0]}
                      picked={picked?.id === chain[0].id}
                      spoken={spokenId === chain[0].id}
                      dim={Boolean(dimIds?.has(chain[0].id))}
                      onPick={setPicked}
                    />
                  ) : (
                    <span key={chain[0].id} className="ms-chain" dir="rtl">
                      {chain.map((word) => (
                        <WordFace
                          key={word.id}
                          word={word}
                          picked={picked?.id === word.id}
                          spoken={spokenId === word.id}
                          dim={Boolean(dimIds?.has(word.id))}
                          onPick={setPicked}
                        />
                      ))}
                    </span>
                  ),
                )}
              </p>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
