/** Desktop word card. A future Lexicon section scrolls inside the same box. */
export const DESKTOP_CARD_MAX_REM = 22;
export const DESKTOP_CARD_GAP_REM = 0.75;

export type CardEdges = { left: number; right: number };

export type DesktopCardPlace = {
  left: number;
  width: number;
  top: number;
  maxHeight: number;
  mode: "margin" | "overlay";
  side: "left" | "right";
};

/**
 * Prefer the side margin away from the tapped word when it can hold a 22rem
 * card plus the gap. Otherwise float over the text on that far side, and stop
 * before the word so the card never covers it. The text column is not resized.
 */
export function placeDesktopCard(args: {
  sheet: CardEdges;
  word: CardEdges;
  viewportWidth: number;
  toolbarBottom: number;
  dockTop: number;
  rootFontPx?: number;
}): DesktopCardPlace {
  const root = args.rootFontPx && args.rootFontPx > 0 ? args.rootFontPx : 16;
  const gap = DESKTOP_CARD_GAP_REM * root;
  const maxW = DESKTOP_CARD_MAX_REM * root;
  const { sheet, word } = args;
  const leftRoom = sheet.left;
  const rightRoom = args.viewportWidth - sheet.right;
  const wordMid = (word.left + word.right) / 2;
  const sheetMid = (sheet.left + sheet.right) / 2;
  const away: "left" | "right" = wordMid >= sheetMid ? "left" : "right";
  const top = args.toolbarBottom;
  const maxHeight = Math.max(0, args.dockTop - top);

  const inMargin = (side: "left" | "right"): DesktopCardPlace | null => {
    const room = side === "left" ? leftRoom : rightRoom;
    if (room < maxW + gap) return null;
    const left = side === "left" ? sheet.left - gap - maxW : sheet.right + gap;
    return { left, width: maxW, top, maxHeight, mode: "margin", side };
  };

  const beside = inMargin(away) ?? inMargin(away === "left" ? "right" : "left");
  if (beside) return beside;

  if (away === "left") {
    const width = Math.min(maxW, Math.max(0, word.left - gap - sheet.left));
    return { left: sheet.left, width, top, maxHeight, mode: "overlay", side: "left" };
  }
  const width = Math.min(maxW, Math.max(0, sheet.right - word.right - gap));
  return { left: sheet.right - width, width, top, maxHeight, mode: "overlay", side: "right" };
}
