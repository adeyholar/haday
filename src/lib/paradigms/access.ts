/** Client-safe gate. The owner list never enters this module. */

export function guardParadigmAccess(enabled: boolean): void {
  if (!enabled) throw new Error("Forbidden");
}

/** Flag-off accounts receive the boolean only. Paradigm rows stay on the server. */
export function paradigmDataForClient<T>(enabled: boolean, data: T): { enabled: true; data: T } | { enabled: false } {
  if (!enabled) return { enabled: false };
  return { enabled: true, data };
}
