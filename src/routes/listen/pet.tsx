import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";
import { AlivePet } from "@/components/alive-pet";
import { ListenMenu } from "@/components/listen-menu";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  listenPlaylist,
  recordedHeIds,
  speakCard,
  speakLine,
  stopSpeech,
  unlockSpeech,
} from "@/lib/listen";
import { firstNameOf, petQueue } from "@/lib/pet";
import { useStudy } from "@/lib/store";
import type { VocabItem } from "@/lib/vocab";

export const Route = createFileRoute("/listen/pet")({ component: AlivePetPage });

function AlivePetPage() {
  const { user } = useCurrentUserState();
  const cards = useStudy((s) => s.cards);
  const name = firstNameOf(user?.displayName) || "friend";
  const all = useMemo(() => listenPlaylist(), []);
  const [recorded, setRecorded] = useState<Set<string>>(new Set());
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [talking, setTalking] = useState(false);
  const stopRef = useRef({ stop: false });
  const gen = useRef(0);
  const queue = useMemo(() => petQueue(all, cards, recorded, 16), [all, cards, recorded]);
  const item = queue[i] as VocabItem | undefined;

  useEffect(() => {
    void recordedHeIds().then(setRecorded);
  }, []);

  useEffect(() => {
    return () => {
      stopRef.current.stop = true;
      stopSpeech();
    };
  }, []);

  async function playFrom(start: number) {
    unlockSpeech();
    stopRef.current.stop = true;
    stopSpeech();
    const my = ++gen.current;
    stopRef.current = { stop: false };
    setPlaying(true);
    let at = start;
    if (at === 0) {
      setTalking(true);
      await speakLine(`Shalom, ${name}.`, "en", 0.85, stopRef.current);
      setTalking(false);
    }
    while (!stopRef.current.stop && my === gen.current) {
      const next = queue[at];
      if (!next) break;
      setI(at);
      setTalking(true);
      await speakCard({ ...next, announce: undefined }, 0.8, stopRef.current);
      setTalking(false);
      if (stopRef.current.stop || my !== gen.current) break;
      at += 1;
      if (at >= queue.length) at = 0;
    }
    if (my === gen.current) setPlaying(false);
  }

  function pause() {
    stopRef.current.stop = true;
    stopSpeech();
    setPlaying(false);
    setTalking(false);
  }

  return (
    <>
      <Panel className="mb-4">
        <ListenMenu />
        <h1 className="mt-5 font-display text-3xl font-bold text-ink">Alive Pet</h1>
        <p className="mt-3 max-w-prose text-muted">
          A companion that speaks class words in the course owner’s recorded voice when a take exists. Weak lemmas you
          missed come first. Hebrew, then English.
        </p>
        {recorded.size === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No class recordings yet. The pet will use the Open Hebrew Bible clip or a computer voice until the owner
            records lemmas in the Voice bank.
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">{recorded.size} lemmas have a class Hebrew take.</p>
        )}
      </Panel>

      <Panel>
        <AlivePet talking={talking} name="HaDay" />
        <p className="mt-4 text-center text-sm text-muted">
          {item ? (
            <>
              <span className="he-word text-2xl text-ink" dir="rtl" lang="he">
                {item.hebrew}
              </span>
              <span className="mt-1 block font-semibold text-ink">{item.gloss}</span>
            </>
          ) : (
            "No words in the queue."
          )}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {playing ? (
            <Button size="lg" onClick={pause}>
              <Pause className="size-4" />
              Pause
            </Button>
          ) : (
            <Button size="lg" onClick={() => void playFrom(i)}>
              <Play className="size-4" />
              Speak with me
            </Button>
          )}
        </div>
      </Panel>
    </>
  );
}
