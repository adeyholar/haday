import { vocabArtSrc } from "@/lib/vocab-art";

/** Side plate for trial nouns. Hebrew stays the hero. Missing ids render nothing. */
export function VocabArt({ id }: { id: string }) {
  const src = vocabArtSrc(id);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      width={144}
      height={144}
      className="size-28 shrink-0 rounded-[var(--radius-md)] object-cover shadow-[var(--shadow-border)] sm:size-36"
      aria-hidden
    />
  );
}
