/** Desktop word card. A future Lexicon section scrolls inside the same box. */
export const DESKTOP_CARD_MAX_REM = 22;
export const DESKTOP_CARD_MIN_REM = 16;
export const DESKTOP_CARD_GAP_REM = 0.75;

export type CardEdges = { left: number; right: number };

export type DesktopCardPlace = {
  left: number;
  width: number;
  top: number;
  maxHeight: number;
  mode: "margin" | "overlay" | "sheet";
  side: "left" | "right";
};

export function wordFullyOffScreen(word: { top: number; bottom: number }, viewportHeight: number): boolean {
  return word.bottom <= 0 || word.top >= viewportHeight;
}

/** Bottom sheet, used when a floating card would be thinner than 16rem or the frame cannot be measured. */
export function desktopCardSheet(top: number, dockTop: number): DesktopCardPlace {
  return { left: 0, width: 0, top, maxHeight: Math.max(0, dockTop - top), mode: "sheet", side: "left" };
}

/**
 * Prefer the side margin away from the tapped word when it can hold a 22rem
 * card plus the gap. Otherwise float over the text on that far side, at least
 * 16rem wide, and stop before the word. If 16rem does not fit, use the bottom
 * sheet. The text column is not resized.
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
  const minW = DESKTOP_CARD_MIN_REM * root;
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

  const overlayRoom = away === "left" ? word.left - gap - sheet.left : sheet.right - word.right - gap;
  if (overlayRoom < minW) return desktopCardSheet(top, args.dockTop);
  const width = Math.min(maxW, overlayRoom);
  if (away === "left") return { left: sheet.left, width, top, maxHeight, mode: "overlay", side: "left" };
  return { left: sheet.right - width, width, top, maxHeight, mode: "overlay", side: "right" };
}
