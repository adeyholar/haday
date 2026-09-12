import { markGlossInEnglish } from "@/lib/word-card";

export function EnglishVerse({
  en,
  keys,
  className = "mt-4 max-w-full text-base leading-relaxed break-words text-ink",
}: {
  en: string;
  keys: string[];
  className?: string;
}) {
  const segs = markGlossInEnglish(en, keys);
  return (
    <p className={className}>
      {segs.map((seg, i) =>
        seg.hit ? (
          <mark key={`${seg.text}-${i}`} className="en-hit">
            {seg.text}
          </mark>
        ) : (
          <span key={`${seg.text}-${i}`}>{seg.text}</span>
        ),
      )}
    </p>
  );
}
