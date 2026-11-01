/** Where a tapped Tanakh word's card sits. The chapter itself does not move. */
export type WordBox = { left: number; right: number; top: number; bottom: number };

export type WordBalloonPlace = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  side: "above" | "below" | "sheet";
  /** Horizontal centre of the tail, measured from the balloon's left edge. */
  tail: number;
};

const GAP = 10;
const EDGE = 8;
const MIN_FLOAT = 96;
const MAX_W_REM = 22;
const MAX_H_REM = 26;

export function placeWordBalloon(args: {
  word: WordBox;
  viewportWidth: number;
  ceiling: number;
  floor: number;
  rootFontPx?: number;
}): WordBalloonPlace {
  const root = args.rootFontPx && args.rootFontPx > 0 ? args.rootFontPx : 16;
  const maxW = MAX_W_REM * root;
  const width = Math.min(maxW, Math.max(0, args.viewportWidth - EDGE * 2));
  const mid = (args.word.left + args.word.right) / 2;
  const spaceBelow = args.floor - args.word.bottom - GAP;
  const spaceAbove = args.word.top - args.ceiling - GAP;

  const sheet = (): WordBalloonPlace => {
    const room = Math.max(0, args.floor - args.ceiling);
    const maxHeight = Math.min(MAX_H_REM * root, room);
    const top = args.floor - maxHeight;
    return {
      top,
      left: EDGE,
      width: Math.max(0, args.viewportWidth - EDGE * 2),
      maxHeight,
      side: "sheet",
      tail: 0,
    };
  };

  const float = (side: "above" | "below", room: number): WordBalloonPlace | null => {
    if (room < MIN_FLOAT || width < 1) return null;
    const maxHeight = Math.min(MAX_H_REM * root, room);
    const top = side === "below" ? args.word.bottom + GAP : args.word.top - GAP - maxHeight;
    const left = Math.min(Math.max(EDGE, mid - width / 2), Math.max(EDGE, args.viewportWidth - EDGE - width));
    const tail = Math.min(Math.max(18, mid - left), Math.max(18, width - 18));
    return { top, left, width, maxHeight, side, tail };
  };

  const below = float("below", spaceBelow);
  const above = float("above", spaceAbove);
  if (below && spaceBelow >= 11 * root) return below;
  if (above && spaceAbove >= spaceBelow) return above;
  if (below) return below;
  if (above) return above;
  return sheet();
}
