import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  binyanim,
  blocksFor,
  CONJUGATION_BLOCKS,
  gridRows,
  rowKey,
  rowLabel,
  rowsInBlock,
  teachingRoot,
  type ConjugationBlock,
} from "@/lib/paradigms/catalog";
import { isHidden, OPEN_HIDE, tapCell, tapRow, toggleHideAll, type HideState } from "@/lib/paradigms/hide";
import { cellView } from "@/lib/paradigms/present";
import { verseTarget } from "@/lib/paradigms/refs";
import type { StrongCell } from "@/lib/paradigms/types";

function VerseLink({ reference }: { reference: string }) {
  const target = verseTarget(reference);
  if (!target) return <span>{reference}</span>;
  return (
    <Link
      to="/listen/read/$book/$ch"
      params={{ book: target.book, ch: target.ch }}
      search={{ v1: target.v1, v2: target.v2 }}
      className="font-semibold text-primary"
    >
      {reference}
    </Link>
  );
}

function FormFace({
  cell,
  hidden,
  onToggle,
}: {
  cell: StrongCell;
  hidden: boolean;
  onToggle: () => void;
}) {
  const [exampleOn, setExampleOn] = useState(false);
  const [asked, setAsked] = useState(false);
  const view = cellView(cell, asked);

  return (
    <div className="min-w-0">
      <button
        type="button"
        className="he-word min-h-11 min-w-[4.5rem] text-3xl text-ink"
        lang="he"
        dir="rtl"
        onClick={onToggle}
        aria-pressed={hidden}
      >
        {hidden ? "\u00b7\u00b7\u00b7" : view.main}
      </button>
      {!hidden && view.mainStandard ? <p className="text-xs text-muted">standard form</p> : null}
      {!hidden && view.also.length > 0 ? (
        <p className="mt-1 text-sm text-muted">
          also:{" "}
          {view.also.map((alt) => (
            <span key={alt.form} className="he-word text-ink" lang="he" dir="rtl">
              {alt.form}
              {alt.standard ? <span className="ms-1 text-xs text-muted">standard form</span> : null}{" "}
            </span>
          ))}
        </p>
      ) : null}
      {!hidden && view.example ? (
        <div className="mt-1">
          <button type="button" className="text-sm font-semibold text-primary" onClick={() => setExampleOn((on) => !on)}>
            Example
          </button>
          {exampleOn ? (
            <p className="mt-1 text-sm">
              <span className="he-word text-xl text-ink" lang="he" dir="rtl">
                {view.example.word}
              </span>{" "}
              <VerseLink reference={view.example.ref} />
            </p>
          ) : null}
          {exampleOn ? (
            <div className="mt-1">
              <button type="button" className="text-sm font-semibold text-primary" onClick={() => setAsked(true)}>
                Translation
              </button>
              {view.translation ? (
                <p className="text-sm text-muted">{view.translation.text ?? "YLT is not in this copy."}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {view.gloss ? <p>{view.gloss}</p> : null}
    </div>
  );
}

function BlockTabs({
  blocks,
  current,
  onPick,
}: {
  blocks: readonly ConjugationBlock[];
  current: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto" role="tablist">
      {blocks.map((block) => (
        <button
          key={block.id}
          type="button"
          role="tab"
          aria-selected={block.id === current}
          className={`min-h-11 shrink-0 rounded-[var(--radius-md)] px-3 text-sm font-semibold ${
            block.id === current ? "bg-ink text-parchment" : "text-muted"
          }`}
          onClick={() => onPick(block.id)}
        >
          {block.label}
        </button>
      ))}
    </div>
  );
}

function CardRows({
  binyan,
  block,
  hide,
  onHide,
}: {
  binyan: string;
  block: ConjugationBlock;
  hide: HideState;
  onHide: (next: HideState) => void;
}) {
  const rows = rowsInBlock(binyan, block);
  return (
    <ul className="mt-3 divide-y divide-border">
      {rows.map((cell) => {
        const key = rowKey(cell);
        const hidden = isHidden(hide, cell.id, key);
        return (
          <li key={cell.id} className="flex items-start justify-between gap-3 py-3">
            <button type="button" className="min-h-11 shrink-0 text-left text-sm font-semibold text-muted" onClick={() => onHide(tapRow(hide, key, [cell.id]))}>
              {rowLabel(cell)}
            </button>
            <FormFace cell={cell} hidden={hidden} onToggle={() => onHide(tapCell(hide, cell.id, key))} />
          </li>
        );
      })}
    </ul>
  );
}

export function ParadigmBoard() {
  const names = binyanim();
  const [cardBlock, setCardBlock] = useState<Record<string, string>>({});
  const [gridBlock, setGridBlock] = useState(CONJUGATION_BLOCKS[0]?.id ?? "qatal");
  const [hides, setHides] = useState<Record<string, HideState>>({});

  function hideFor(scope: string): HideState {
    return hides[scope] ?? OPEN_HIDE;
  }

  function setHide(scope: string, next: HideState) {
    setHides((current) => ({ ...current, [scope]: next }));
  }

  const wideBlock = CONJUGATION_BLOCKS.find((block) => block.id === gridBlock) ?? CONJUGATION_BLOCKS[0]!;
  const wideRows = gridRows(wideBlock);

  return (
    <div>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Paradigms</p>
        <h1 className="mt-1 font-display text-4xl font-bold text-ink">
          <span className="he-word" lang="he" dir="rtl">
            {teachingRoot()}
          </span>
        </h1>
        <p className="mt-2 text-sm text-muted">One binyan at a time. Swipe for the next. Tap a form to hide it.</p>
      </header>

      <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto md:hidden">
        {names.map((binyan) => {
          const blocks = blocksFor(binyan);
          const scope = `card:${binyan}`;
          const selected = blocks.find((block) => block.id === cardBlock[binyan]) ?? blocks[0];
          const hide = hideFor(scope);
          if (!selected) return null;
          return (
            <article key={binyan} className="min-w-full shrink-0 snap-center rounded-[var(--radius-xl)] bg-card p-4 shadow-[var(--shadow-border)]">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-2xl font-bold text-ink">{binyan}</h2>
                <button
                  type="button"
                  className="min-h-11 text-sm font-semibold text-primary"
                  aria-pressed={hide.all}
                  onClick={() => setHide(scope, toggleHideAll(hide))}
                >
                  {hide.all ? "Show all" : "Hide all"}
                </button>
              </div>
              <div className="mt-3">
                <BlockTabs
                  blocks={blocks}
                  current={selected.id}
                  onPick={(id) => setCardBlock((current) => ({ ...current, [binyan]: id }))}
                />
              </div>
              <CardRows binyan={binyan} block={selected} hide={hide} onHide={(next) => setHide(scope, next)} />
            </article>
          );
        })}
      </div>

      <div className="mt-4 hidden md:block">
        <div className="flex items-center justify-between gap-2">
          <BlockTabs blocks={CONJUGATION_BLOCKS} current={wideBlock.id} onPick={setGridBlock} />
          <button
            type="button"
            className="min-h-11 shrink-0 text-sm font-semibold text-primary"
            aria-pressed={hideFor("grid").all}
            onClick={() => setHide("grid", toggleHideAll(hideFor("grid")))}
          >
            {hideFor("grid").all ? "Show all" : "Hide all"}
          </button>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-2 py-2 font-semibold">PGN</th>
                {names.map((binyan) => (
                  <th key={binyan} className="px-2 py-2 font-semibold">
                    {binyan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wideRows.map((row) => (
                <tr key={row.key} className="border-b border-border align-top">
                  <th className="px-2 py-3 font-semibold text-muted" scope="row">
                    <button type="button" className="min-h-11" onClick={() => {
                      const ids = names.map((binyan) => row.byBinyan[binyan]?.id).filter((id): id is string => Boolean(id));
                      setHide("grid", tapRow(hideFor("grid"), row.key, ids));
                    }}>
                      {row.label}
                    </button>
                  </th>
                  {names.map((binyan) => {
                    const cell = row.byBinyan[binyan];
                    const hide = hideFor("grid");
                    return (
                      <td key={binyan} className="px-2 py-3">
                        {cell ? (
                          <FormFace
                            cell={cell}
                            hidden={isHidden(hide, cell.id, row.key)}
                            onToggle={() => setHide("grid", tapCell(hide, cell.id, row.key))}
                          />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
