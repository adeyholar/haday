const KEY = "davar-write-cap-v1";
const DAILY_LIMIT = 40;

type Cap = { day: string; n: number };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function read(): Cap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { day: today(), n: 0 };
    const parsed = JSON.parse(raw) as Cap;
    if (parsed.day !== today()) return { day: today(), n: 0 };
    return { day: parsed.day, n: Number(parsed.n) || 0 };
  } catch {
    return { day: today(), n: 0 };
  }
}

export function writeChecksLeft(): number {
  return Math.max(0, DAILY_LIMIT - read().n);
}

export function takeWriteCheck(): boolean {
  const cap = read();
  if (cap.n >= DAILY_LIMIT) return false;
  localStorage.setItem(KEY, JSON.stringify({ day: cap.day, n: cap.n + 1 }));
  return true;
}

export const WRITE_DAILY_LIMIT = DAILY_LIMIT;
