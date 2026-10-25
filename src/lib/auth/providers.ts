/**
 * Providers the sign-in page may offer.
 *
 * Google and X are Better Auth's built-in providers. Whether a button is
 * shown is decided on the server (`googleSignInConfigured` / `xSignInConfigured`
 * in `server.ts`): both client id and client secret must be set. There is no
 * broker provider and no preview client.
 */
export { GOOGLE_PROVIDER_ID } from "./google";
export { X_PROVIDER_ID } from "./x";
