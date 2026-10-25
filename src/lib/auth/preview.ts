/**
 * Hosts allowed when Better Auth derives the origin from the request
 * (local dev and the sandbox live preview). This is not an OAuth client.
 *
 * Deployed hosts never fall back to a preview or sandbox client id.
 * Google sign-in uses GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET only.
 */
export const PREVIEW_ALLOWED_HOSTS = ["*.grok-sandbox.com"] as const;
