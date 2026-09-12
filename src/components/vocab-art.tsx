import { vocabArtSrc } from "@/lib/vocab-art";
import { cn } from "@/lib/cn";

/** Side plate. Hebrew stays the hero. Missing ids render nothing. */
export function VocabArt({ id, className }: { id: string; className?: string }) {
  const src = vocabArtSrc(id);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      width={144}
      height={144}
      className={cn(
        "size-28 shrink-0 rounded-[var(--radius-md)] object-cover shadow-[var(--shadow-border)] sm:size-36",
        className,
      )}
      aria-hidden
    />
  );
}
