export type Lamp = "light" | "dim" | "dark";

export const LAMP_KEY = "haday.lamp";

export const LAMP_BOOT = `try{var l=localStorage.getItem("${LAMP_KEY}");if(l==="dim"||l==="dark")document.documentElement.dataset.lamp=l}catch(e){}`;

const listeners = new Set<(lamp: Lamp) => void>();

export function readLamp(): Lamp {
  if (typeof window === "undefined") return "light";
  try {
    const saved = window.localStorage.getItem(LAMP_KEY);
    if (saved === "dim" || saved === "dark" || saved === "light") return saved;
  } catch {
    /* keep the paper */
  }
  return "light";
}

export function applyLamp(lamp: Lamp) {
  if (typeof document === "undefined") return;
  if (lamp === "light") delete document.documentElement.dataset.lamp;
  else document.documentElement.dataset.lamp = lamp;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", lamp === "dark" ? "#12100e" : lamp === "dim" ? "#cfc6b6" : "#f3eee4");
  }
}

export function setLamp(lamp: Lamp) {
  try {
    window.localStorage.setItem(LAMP_KEY, lamp);
  } catch {
    /* the choice still applies for this visit */
  }
  applyLamp(lamp);
  for (const fn of listeners) fn(lamp);
}

export function subscribeLamp(fn: (lamp: Lamp) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
