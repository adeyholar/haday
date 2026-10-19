/** True when the reading line sits in the middle third of the open text area. */
export function readLineInComfort(rectTop: number, rectBottom: number, viewTop: number, viewBottom: number): boolean {
  const span = viewBottom - viewTop;
  if (span <= 0) return false;
  const zoneTop = viewTop + span / 3;
  const zoneBot = viewTop + (span * 2) / 3;
  return rectTop >= zoneTop && rectBottom <= zoneBot;
}

/** Follow the reader only while the line has left that middle third. A hand scroll turns following off. */
export function shouldFollowScroll(following: boolean, inComfort: boolean): boolean {
  return following && !inComfort;
}
