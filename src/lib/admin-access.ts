/** Sign-in emails that can open /admin. Also set HADAY_ADMIN_EMAILS on the host. */
export const ADMIN_EMAILS: readonly string[] = [
  "talk2pastoradeolaade@yahoo.com",
  "adeolaa@jcdisn.com",
  "adeyholar@aol.com",
];

/** Owner is an allow-list email. A display name never counts. */

export function ownerAllowList(hardcoded: readonly string[], envRaw: string): string[] {
  const fromEnv = envRaw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set([...hardcoded.map((item) => item.toLowerCase()), ...fromEnv])];
}

export function isOwnerEmail(email: string, allow: readonly string[]): boolean {
  const normalized = email.trim().toLowerCase();
  return Boolean(normalized) && allow.includes(normalized);
}

/**
 * Name is accepted and ignored. Passing "Adeola" or "Crown" must not open the owner pages.
 * An empty allow list still treats the first account as owner, so a local install with no
 * emails configured keeps one owner. That path is unused when the allow list has any email.
 */
export function grantsOwner(input: {
  email: string;
  name?: string;
  allow: readonly string[];
  userId?: string;
  firstUserId?: string | null;
}): boolean {
  void input.name;
  if (isOwnerEmail(input.email, input.allow)) return true;
  if (input.allow.length === 0 && input.userId && input.firstUserId && input.userId === input.firstUserId) {
    return true;
  }
  return false;
}
