/** Whether the cached paradigms_v1 boolean belongs to this signed-in account. */
export function accessCacheFor(previousUserId: string | null, userId: string | null): { reuse: boolean; userId: string } {
  const next = userId ?? "";
  const prev = previousUserId ?? "";
  return { reuse: prev === next && next !== "", userId: next };
}
