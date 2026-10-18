import type { IibsVocabLevel } from "@/lib/iibs-vocab";
import { isIibsWeekLevel } from "@/lib/iibs-weeks";

const ROOM = "haday-iibs-room";

const listeners = new Set<() => void>();

export function parseIibsRoom(value: string | null | undefined): IibsVocabLevel | null {
  return isIibsWeekLevel(value) ? value : null;
}

export function readIibsRoom(): IibsVocabLevel | null {
  if (typeof window === "undefined") return null;
  try {
    return parseIibsRoom(window.localStorage.getItem(ROOM));
  } catch {
    return null;
  }
}

export function enterIibsRoom(level: IibsVocabLevel) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROOM, level);
  for (const hear of listeners) hear();
}

export function leaveIibsRoom() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ROOM);
  for (const hear of listeners) hear();
}

export function subscribeIibsRoom(hear: () => void): () => void {
  listeners.add(hear);
  return () => listeners.delete(hear);
}
