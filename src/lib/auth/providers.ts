/**
 * Providers the sign-in page may offer.
 *
 * Google is Better Auth's built-in provider. Whether the button is shown is
 * decided on the server (`googleSignInConfigured` in `server.ts`): both
 * GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set. There is no
 * grok-google provider and no preview client.
 *
 * TODO: X sign-in is hidden. Do not add an X button or provider here.
 */
export { GOOGLE_PROVIDER_ID, X_SIGN_IN_OFFERED } from "./google";
