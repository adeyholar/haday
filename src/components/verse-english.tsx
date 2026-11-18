import type { ReactNode } from "react";
import { EnglishAsk } from "@/components/english-ask";
import { useVerseSlots } from "@/lib/verse-english";

/** Grammar Path verse English: one tap, YLT then WEB, lined up through the book slots. */
export function VerseEnglish({ verseRef, extra }: { verseRef: string; extra?: ReactNode }) {
  const slots = useVerseSlots(verseRef);
  return <EnglishAsk verseKey={verseRef} ylt={slots.ylt} web={slots.web} extra={extra} />;
}
