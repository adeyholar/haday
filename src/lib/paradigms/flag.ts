import { ADMIN_EMAILS, isOwnerEmail } from "@/lib/admin-access";

/** Feature flag `paradigms_v1`. On only for the Chairman's sign-in emails. */
export const PARADIGMS_FLAG = "paradigms_v1";

export function paradigmsV1ForEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return isOwnerEmail(email, ADMIN_EMAILS);
}
