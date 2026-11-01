/** A temporary Drill sitting built from one passage. It does not replace the week or the level. */

export type StudyScope = "bbh" | "iibs";

export type PassagePack = {
  scope: StudyScope;
  /** Book.chapter, such as Gen.1 or 1Sam.3. */
  ref: string;
  label: string;
  ids: string[];
  back: string;
};

const STORE_KEY = "haday-passage-drill-v1";

export function passageDrillKey(scope: StudyScope, ref: string): string {
  return `passage:${scope}:${ref}`;
}

export function isPassageDrillKey(key: string): boolean {
  return /^passage:(bbh|iibs):[A-Za-z0-9.]{1,16}$/.test(key);
}

export type PackStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function browserStore(): PackStore | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage;
}

export function savePassagePack(pack: PassagePack, store: PackStore | null = browserStore()): void {
  if (!store) return;
  const ids = pack.ids.filter((id) => typeof id === "string" && id.length > 0).slice(0, 80);
  const next: PassagePack = {
    scope: pack.scope === "iibs" ? "iibs" : "bbh",
    ref: pack.ref.slice(0, 16),
    label: pack.label.slice(0, 80),
    ids,
    back: pack.back.slice(0, 180),
  };
  store.setItem(STORE_KEY, JSON.stringify(next));
}

export function loadPassagePack(store: PackStore | null = browserStore()): PassagePack | null {
  if (!store) return null;
  const raw = store.getItem(STORE_KEY);
  if (!raw) return null;
  try {
    const row = JSON.parse(raw) as Partial<PassagePack>;
    if (row.scope !== "bbh" && row.scope !== "iibs") return null;
    if (typeof row.ref !== "string" || !/^[A-Za-z0-9.]{1,16}$/.test(row.ref)) return null;
    const ids = Array.isArray(row.ids) ? row.ids.filter((id) => typeof id === "string").slice(0, 80) : [];
    if (!ids.length) return null;
    return {
      scope: row.scope,
      ref: row.ref,
      label: typeof row.label === "string" && row.label ? row.label.slice(0, 80) : row.ref,
      ids,
      back: typeof row.back === "string" ? row.back.slice(0, 180) : "",
    };
  } catch {
    return null;
  }
}
