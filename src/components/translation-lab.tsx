import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/panel";
import { LAB_CREDITS } from "@/lib/translation-lab/credits";
import { translationLabEnabled } from "@/lib/translation-lab/flag";
import {
  assembleTiles,
  glossVisible,
  gradeAssemble,
  gradeChunks,
  gradeSay,
  lookReadings,
  publishedEnglishVisible,
  sayChoices,
  type ChunkMark,
} from "@/lib/translation-lab/grade";
import { explainMorph } from "@/lib/morph-parse";
import {
  chunkHebrew,
  chunkWords,
  GEN_1_3,
  LAB_PARTICLES,
  verseHebrew,
  type LabChunk,
  type LabPath,
  type LabRole,
  type LabStep,
} from "@/lib/translation-lab/verse";

const ROLES: LabRole[] = ["subject", "verb", "object", "particle"];
const STEPS: LabStep[] = ["read", "chunk", "say", "assemble", "look"];

type DraftMark = { id: string; role?: LabRole; particles: string[] };

export function TranslationLabPage({ path }: { path: LabPath }) {
  if (!translationLabEnabled()) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-10" data-lab-open="0">
        <p className="text-sm text-muted">This lab is closed.</p>
      </main>
    );
  }
  return <OpenLab path={path} />;
}

function OpenLab({ path }: { path: LabPath }) {
  const verse = GEN_1_3;
  const [step, setStep] = useState<LabStep>("read");
  const [picked, setPicked] = useState<string | null>(null);
  const [englishTap, setEnglishTap] = useState<string | null>(null);
  const [marks, setMarks] = useState<Record<string, DraftMark>>({});
  const [chunkMiss, setChunkMiss] = useState<string[] | null>(null);
  const [sayAt, setSayAt] = useState(0);
  const [sayNote, setSayNote] = useState("");
  const [placed, setPlaced] = useState<string[]>([]);
  const [assembleNote, setAssembleNote] = useState("");
  const shownChunks = chunkMiss ? verse.chunks.filter((chunk) => chunkMiss.includes(chunk.id)) : verse.chunks;
  const sayChunk = verse.chunks[sayAt];
  const look = lookReadings(verse);
  const bank = assembleTiles(verse).filter((tile) => !placed.includes(tile.id));

  function setRole(chunk: LabChunk, role: LabRole) {
    setMarks((prev) => ({
      ...prev,
      [chunk.id]: { id: chunk.id, role, particles: prev[chunk.id]?.particles ?? [] },
    }));
  }

  function toggleParticle(chunk: LabChunk, particle: string) {
    setMarks((prev) => {
      const current = prev[chunk.id];
      const had = current?.particles ?? [];
      const particles = had.includes(particle) ? had.filter((item) => item !== particle) : [...had, particle];
      return { ...prev, [chunk.id]: { id: chunk.id, role: current?.role, particles } };
    });
  }

  function checkChunks() {
    const ready: ChunkMark[] = Object.values(marks).flatMap((mark) =>
      mark.role ? [{ id: mark.id, role: mark.role, particles: mark.particles }] : [],
    );
    const result = gradeChunks(ready, verse);
    if (result.ok) {
      setChunkMiss(null);
      setSayAt(0);
      setSayNote("");
      setStep("say");
      return;
    }
    setChunkMiss(result.missed);
  }

  function pickSay(choice: string) {
    if (!sayChunk) return;
    if (!gradeSay(sayChunk.id, choice, verse)) {
      setSayNote("Not this word. The same chunk comes back.");
      return;
    }
    setSayNote("");
    if (sayAt + 1 >= verse.chunks.length) {
      setPlaced([]);
      setAssembleNote("");
      setStep("assemble");
      return;
    }
    setSayAt(sayAt + 1);
  }

  function checkAssemble() {
    const order = placed.map((id) => verse.chunks.find((chunk) => chunk.id === id)?.literal ?? "");
    if (!gradeAssemble(order, verse)) {
      setAssembleNote("That is not the Hebrew order.");
      setPlaced([]);
      return;
    }
    setStep("look");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-8" data-lab-open="1">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Translation lab</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">Genesis 1:3</h1>
      <p className="mt-2 text-sm text-muted">
        {path === "bbh" ? "Grammar Path. English stays hidden until you tap." : "Scripture Path."}{" "}
        {path === "bbh" ? (
          <Link to="/listen" className="font-semibold text-primary">
            Back
          </Link>
        ) : (
          <Link to="/iibs" className="font-semibold text-primary">
            Back
          </Link>
        )}
      </p>
      <ol className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {STEPS.map((name) => (
          <li key={name} className={name === step ? "text-primary" : undefined}>
            {name}
          </li>
        ))}
      </ol>

      {step === "read" ? (
        <Panel className="mt-4">
          <p className="he-verse text-3xl leading-relaxed text-ink" dir="rtl" lang="he">
            {verseHebrew(verse)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2" dir="rtl">
            {verse.chunks.map((chunk) => (
              <button
                key={chunk.id}
                type="button"
                className="min-h-12 rounded-[var(--radius-md)] bg-surface px-3 text-2xl text-ink shadow-[var(--shadow-border)]"
                lang="he"
                onClick={() => setPicked(chunk.id)}
              >
                {chunkHebrew(chunk)}
              </button>
            ))}
          </div>
          {picked ? <ParseBlock path={path} chunkId={picked} englishTap={englishTap} onEnglish={() => setEnglishTap(picked)} /> : null}
          <Button type="button" className="mt-4" onClick={() => setStep("chunk")}>
            Mark the chunks
          </Button>
        </Panel>
      ) : null}

      {step === "chunk" ? (
        <Panel className="mt-4">
          <p className="text-sm text-muted">Mark the main role. A maqqef group is one chunk. Mark ו, אֵת, כִּי, לֹא, מִן, or בְּ when that particle is inside the chunk.</p>
          <ul className="mt-4 space-y-4">
            {shownChunks.map((chunk) => {
              const mark = marks[chunk.id];
              return (
                <li key={chunk.id}>
                  <p className="he-verse text-2xl text-ink" dir="rtl" lang="he">
                    {chunkHebrew(chunk)}
                  </p>
                  <p className="text-xs text-muted">OSHB {chunk.words.join("–")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={`min-h-11 rounded-[var(--radius-md)] px-3 text-sm font-semibold ${mark?.role === role ? "bg-primary text-primary-foreground" : "bg-surface text-ink shadow-[var(--shadow-border)]"}`}
                        onClick={() => setRole(chunk, role)}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2" dir="rtl">
                    {LAB_PARTICLES.map((particle) => {
                      const on = mark?.particles.includes(particle);
                      return (
                        <button
                          key={particle}
                          type="button"
                          lang="he"
                          className={`min-h-11 rounded-[var(--radius-md)] px-3 text-lg ${on ? "bg-primary text-primary-foreground" : "bg-surface text-ink shadow-[var(--shadow-border)]"}`}
                          onClick={() => toggleParticle(chunk, particle)}
                        >
                          {particle}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
          {chunkMiss ? <p className="mt-3 text-sm text-primary">Only the missed chunks come back.</p> : null}
          <Button type="button" className="mt-4" onClick={checkChunks}>
            Check the chunks
          </Button>
        </Panel>
      ) : null}

      {step === "say" && sayChunk ? (
        <Panel className="mt-4">
          <p className="he-verse text-3xl text-ink" dir="rtl" lang="he">
            {chunkHebrew(sayChunk)}
          </p>
          <p className="mt-2 text-sm text-muted">Pick a meaning. The literal and the smooth reading both count.</p>
          <div className="mt-3 flex flex-col gap-2">
            {sayChoices(sayChunk).map((choice) => (
              <button
                key={choice}
                type="button"
                className="min-h-12 rounded-[var(--radius-md)] bg-surface px-3 text-start text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
                onClick={() => pickSay(choice)}
              >
                {choice}
              </button>
            ))}
          </div>
          {sayNote ? <p className="mt-3 text-sm text-primary">{sayNote}</p> : null}
        </Panel>
      ) : null}

      {step === "assemble" ? (
        <Panel className="mt-4">
          <p className="text-sm text-muted">Put the tiles in Hebrew order.</p>
          <p className="mt-3 min-h-12 text-base text-ink">{placed.map((id) => verse.chunks.find((chunk) => chunk.id === id)?.literal).join(" · ") || "Tap a tile."}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {bank.map((tile) => (
              <button
                key={tile.id}
                type="button"
                className="min-h-12 rounded-[var(--radius-md)] bg-surface px-3 text-sm font-semibold text-ink shadow-[var(--shadow-border)]"
                onClick={() => setPlaced((prev) => [...prev, tile.id])}
              >
                {tile.label}
              </button>
            ))}
          </div>
          {assembleNote ? <p className="mt-3 text-sm text-primary">{assembleNote}</p> : null}
          <div className="mt-4 flex gap-2">
            <Button type="button" variant="outline" onClick={() => setPlaced((prev) => prev.slice(0, -1))}>
              Undo
            </Button>
            <Button type="button" onClick={checkAssemble}>
              Check the order
            </Button>
          </div>
        </Panel>
      ) : null}

      {step === "look" && publishedEnglishVisible(step) ? (
        <Panel className="mt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Young's Literal Translation</h2>
          <p className="mt-1 text-base text-ink">{look.ylt}</p>
          <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted">World English Bible</h2>
          <p className="mt-1 text-base text-ink">{look.web}</p>
          <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-muted">JPS 1917</h2>
          <p className="mt-1 text-base text-ink">{look.jps}</p>
          {look.note ? <p className="mt-4 text-sm text-primary">{look.note}</p> : null}
          <p className="mt-4 text-xs text-muted">{LAB_CREDITS}</p>
        </Panel>
      ) : null}
    </main>
  );
}

function ParseBlock({
  path,
  chunkId,
  englishTap,
  onEnglish,
}: {
  path: LabPath;
  chunkId: string;
  englishTap: string | null;
  onEnglish: () => void;
}) {
  const chunk = GEN_1_3.chunks.find((item) => item.id === chunkId);
  if (!chunk) return null;
  const showGloss = glossVisible(path, englishTap === chunkId);
  return (
    <div className="mt-4 text-sm text-ink">
      {chunkWords(chunk).map((word) => (
        <p key={word.id}>
          <span className="he-word text-xl" dir="rtl" lang="he">
            {word.surface.normalize("NFC")}
          </span>
          {" · "}
          {explainMorph(word.morph)}
        </p>
      ))}
      {showGloss ? <p className="mt-2">Class gloss: {chunk.literal}</p> : null}
      {path === "bbh" && !showGloss ? (
        <button type="button" className="mt-2 min-h-11 font-semibold text-primary" onClick={onEnglish}>
          Show the English for this word
        </button>
      ) : null}
    </div>
  );
}
