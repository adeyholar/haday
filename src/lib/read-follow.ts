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

/** A scroll the reader just started is not the student dragging the scrollbar. */
export function scrollWasOurs(armedAt: number, now: number, windowMs = 900): boolean {
  return armedAt > 0 && now - armedAt < windowMs;
}
