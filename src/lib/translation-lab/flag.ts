/** Off unless the build sets VITE_TRANSLATION_LAB=true. Unset means closed. */
export function translationLabEnabled(): boolean {
  return import.meta.env.VITE_TRANSLATION_LAB === "true";
}

/** Same rule, for tests that pass the env value in. */
export function translationLabFlagOn(value: string | undefined): boolean {
  return value === "true";
}
