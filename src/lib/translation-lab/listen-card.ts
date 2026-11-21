/**
 * Whether the Listen menu may offer /listen/lab.
 * Semester 2 sends that route back to the Grammar home, so the card stays off that menu.
 */
export function showTranslationLabListenCard(term: 1 | 2, labOn: boolean): boolean {
  return term === 1 && labOn;
}
