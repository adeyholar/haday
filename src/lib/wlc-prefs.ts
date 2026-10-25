import { READ_RATES } from "@/lib/reading";

export const WLC_RATE_KEY = "haday.wlc.rate";
export const WLC_SIZE_KEY = "haday.wlc.size";
export const WLC_WIDTH_KEY = "haday.wlc.width";

export type WlcSheetSize = "tight" | "small" | "page" | "large";
export type WlcSheetWidth = "normal" | "wide";

/** The next real rate: 0.7, then 1, then 1.25, then back. */
export function nextReadRate(current: number): number {
  const at = READ_RATES.findIndex((row) => row.value === current);
  const next = READ_RATES[(at < 0 ? 0 : at + 1) % READ_RATES.length];
  return next?.value ?? 1;
}

/** The chip shows the number, not Slow / Recorded / Faster. */
export function readRateLabel(value: number): string {
  const match = READ_RATES.find((row) => row.value === value);
  return `${match?.value ?? 1}×`;
}

export function rateFromStorage(raw: string | null): number {
  const value = raw == null ? Number.NaN : Number(raw);
  return READ_RATES.some((row) => row.value === value) ? value : 1;
}

/** A saved size wins. A wide screen with nothing saved starts at Large. */
export function defaultSheetSize(saved: string | null, wideScreen: boolean): WlcSheetSize {
  if (saved === "tight" || saved === "small" || saved === "page" || saved === "large") return saved;
  return wideScreen ? "large" : "page";
}

export function defaultSheetWidth(saved: string | null): WlcSheetWidth {
  return saved === "wide" ? "wide" : "normal";
}

/** Wide can grow the column. Between a phone and 48rem, Normal already fills the screen. */
export function wideHasRoom(viewportWidth: number, rootFontPx = 16): boolean {
  if (viewportWidth < 640) return true;
  return viewportWidth > 48 * rootFontPx;
}

/** Scroll delta that puts the same verse top back where it was. */
export function verseAnchorScroll(beforeTop: number, afterTop: number): number {
  return afterTop - beforeTop;
}
