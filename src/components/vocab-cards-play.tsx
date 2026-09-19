import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { VerseCard } from "@/components/verse-card";
import { VocabArt } from "@/components/vocab-art";
import { speakHebrewWord, stopSpeech, unlockSpeech } from "@/lib/listen";
import { spliceLater } from "@/lib/quiz-draw";
import { POS_LABEL, type VocabItem } from "@/lib/vocab";

export function VocabCardsPlay({
  items,
  onMet,
  onAgain,
}: {
  items: VocabItem[];
  onMet?: (id: string) => void;
  onAgain?: (id: string) => void;
}) {
  const [deck, setDeck] = useState(items);
  const [i, setI] = useState(0);
  const [met, setMet] = useState(0);
  const voice = useRef({ stop: false });
  const item = deck[i];
  const done = i >= deck.length;

  useEffect(() => {
    setDeck(items);
    setI(0);
    setMet(0);
  }, [items]);

  useEffect(() => {
    if (!item) return;
    voice.current.stop = true;
    voice.current = { stop: false };
    stopSpeech();
    unlockSpeech();
    void speakHebrewWord(item, 0.85, voice.current);
    return () => {
      voice.current.stop = true;
      stopSpeech();
    };
  }, [item]);

  function hear() {
    if (!item) return;
    voice.current.stop = true;
    voice.current = { stop: false };
    unlockSpeech();
    void speakHebrewWord(item, 0.85, voice.current);
  }

  function gotIt() {
    if (!item) return;
    onMet?.(item.id);
    setMet((n) => n + 1);
    setI((n) => n + 1);
  }

  function again() {
    if (!item) return;
    onAgain?.(item.id);
    setDeck((d) => spliceLater(d, i, item));
    setI((n) => n + 1);
  }

  if (done) {
    return (
      <div className="rounded-[var(--radius-xl)] bg-card p-6 text-center shadow-[var(--shadow-border)]">
        <p className="font-display text-3xl font-bold text-ink">{met} met</p>
        <p className="mt-2 text-sm text-muted">{deck.length} cards in this sitting. Not a quiz.</p>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div>
      <p className="text-sm font-semibold text-ink">
        {i + 1} / {deck.length}
      </p>
      <div className="mt-3 rounded-[var(--radius-xl)] bg-card px-5 py-8 text-center shadow-[var(--shadow-border)]">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {POS_LABEL[item.pos]} · Ch. {item.chapter}
        </p>
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
          <div className="min-w-0">
            <p className="he-word text-5xl sm:text-6xl" lang="he" dir="rtl">
              {item.hebrew}
            </p>
            <p className="mt-3 font-display text-2xl font-semibold text-ink">{item.gloss}</p>
            <p className="mt-1 text-sm text-muted">{item.translit}</p>
          </div>
          <VocabArt id={item.id} />
        </div>
        <Button type="button" variant="outline" className="mt-4" onClick={hear}>
          Hear
        </Button>
        <VerseCard item={item} showEnglish />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={again}>
          Again
        </Button>
        <Button type="button" onClick={gotIt}>
          Got it
        </Button>
      </div>
    </div>
  );
}
