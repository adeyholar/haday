/** NFC compare for paradigm forms. Accents stay; only canonical equivalence is folded. */
export function nfc(value: string): string {
  return value.normalize("NFC");
}

export function sameForm(a: string, b: string): boolean {
  return nfc(a) === nfc(b);
}
