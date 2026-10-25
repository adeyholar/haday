/** True when the line sits in the open band between the toolbar and the dock (about 25–70%). */
export function readLineInComfort(rectTop: number, rectBottom: number, viewTop: number, viewBottom: number): boolean {
  const span = viewBottom - viewTop;
  if (span <= 0) return false;
  const zoneTop = viewTop + span * 0.25;
  const zoneBot = viewTop + span * 0.7;
  return rectTop >= zoneTop && rectBottom <= zoneBot;
}

/** Follow only while the line has left that band. A hand scroll turns following off. */
export function shouldFollowScroll(following: boolean, inComfort: boolean): boolean {
  return following && !inComfort;
}

/** A paused reader does not follow a new verse. Play or Back starts it again. */
export function shouldAutoFollow(following: boolean, lineKey: string, seenKey: string): boolean {
  return following && lineKey !== "" && lineKey !== seenKey;
}

export type OwnScroll = { startedAt: number; heardAt: number };

export const OWN_SCROLL_QUIET_MS = 150;
export const OWN_SCROLL_HARD_MS = 1500;

export function armOwnScroll(now: number): OwnScroll {
  return { startedAt: now, heardAt: now };
}

export function clearOwnScroll(): OwnScroll {
  return { startedAt: 0, heardAt: 0 };
}

/** True while a scroll we started is still moving: not quiet, and under the hard limit. */
export function ownScrollLive(arm: OwnScroll, now: number, quietMs = OWN_SCROLL_QUIET_MS, hardMs = OWN_SCROLL_HARD_MS): boolean {
  if (arm.startedAt <= 0) return false;
  if (now - arm.startedAt >= hardMs) return false;
  if (now - arm.heardAt > quietMs) return false;
  return true;
}

/**
 * A scroll event while we are armed is ours. Refresh the last-heard time so a
 * long smooth scroll stays ours until the page is quiet. The hard limit is
 * from the start, so it does not keep extending.
 */
export function hearOwnScroll(
  arm: OwnScroll,
  now: number,
  quietMs = OWN_SCROLL_QUIET_MS,
  hardMs = OWN_SCROLL_HARD_MS,
): { arm: OwnScroll; ours: boolean } {
  if (!ownScrollLive(arm, now, quietMs, hardMs)) return { arm: clearOwnScroll(), ours: false };
  return { arm: { startedAt: arm.startedAt, heardAt: now }, ours: true };
}
