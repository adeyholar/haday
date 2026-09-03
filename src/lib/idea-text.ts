export const IDEA_AREAS = ["listen", "game", "study", "reading", "ask", "app"] as const;
export type IdeaArea = (typeof IDEA_AREAS)[number];

export const IDEA_STATUSES = ["new", "planned", "building", "shipped", "hold"] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  new: "Inbox",
  planned: "Makes sense",
  building: "Building",
  shipped: "Shipped",
  hold: "Hold",
};

export const IDEA_AREA_LABEL: Record<IdeaArea, string> = {
  listen: "Listen",
  game: "Game",
  study: "Study",
  reading: "Tanakh reading",
  ask: "Ask HaDay",
  app: "App / other",
};

const MAX_TITLE = 80;
const MAX_BODY = 800;

export function parseArea(raw: string | undefined): IdeaArea {
  const v = (raw ?? "").trim().toLowerCase();
  return (IDEA_AREAS as readonly string[]).includes(v) ? (v as IdeaArea) : "app";
}

export function parseStatus(raw: string | undefined): IdeaStatus {
  const v = (raw ?? "").trim().toLowerCase();
  return (IDEA_STATUSES as readonly string[]).includes(v) ? (v as IdeaStatus) : "new";
}

export function cleanTitle(raw: string): string {
  return (raw ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_TITLE);
}

export function cleanBody(raw: string): string {
  return (raw ?? "").trim().slice(0, MAX_BODY);
}
