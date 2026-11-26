# Security headers

Source: `server/middleware/00.security-headers.ts`. Every response from the Azure Web App gets these.

| Header | Value now | Note |
| --- | --- | --- |
| `Content-Security-Policy` | `frame-ancestors 'none'` | Enforced. Blocks framing only. |
| `Content-Security-Policy-Report-Only` | Full policy below, plus `report-uri /api/csp-report` | Logs what the full policy would block. Blocks nothing. |
| `Permissions-Policy` | camera, geolocation, payment, usb, serial, hid, display-capture and motion sensors off. Microphone `self`. Fullscreen `self` and YouTube. | The microphone stays on because the recorder, echo and read-aloud lessons use it. |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | One year. No `preload`. |
| `X-Content-Type-Options` | `nosniff` | Unchanged. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Unchanged. |
| `X-Frame-Options` | `DENY` | Unchanged. |

## Full CSP (report-only now)

```
default-src 'self'; script-src 'self' 'unsafe-inline' https://grok.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://images.haday.app https://*.googleusercontent.com https://*.twimg.com; media-src 'self' blob: data: https://mechon-mamre.org; connect-src 'self' https://grok.com https://app-builder-deployer.grok.com https://*.r2.cloudflarestorage.com; frame-src https://www.youtube-nocookie.com; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
```

The enforcing version is the same value sent as `Content-Security-Policy`, with `report-uri` removed, and with the Report-Only header deleted.

Why `'unsafe-inline'` stays for now: TanStack Start streams inline bootstrap scripts, the page has an inline theme script, and blog video buttons carry an inline `onclick`. Moving to nonces needs router and middleware work and is a separate change.

`img-src` includes `https://*.googleusercontent.com` and `https://*.twimg.com` so the UserButton avatars in `src/lib/auth/gates.tsx` can load after Google or X sign-in.

Known harmless report: zod probes `Function("")` once per page load. Under an enforced CSP the probe throws, zod catches it and skips its JIT. `unsafe-eval` is not needed.

## `/api/csp-report`

Browsers POST violation reports here. The handler always returns 204.

- Allowed types: `application/csp-report`, `application/reports+json`, and `application/json`. Other types are ignored.
- If `Content-Length` is over 8,192 bytes, the request is rejected before any body is read.
- The body stream is also hard-capped at 8,192 bytes, so a missing or false `Content-Length` cannot fill memory. Oversized bodies are dropped, not logged.
- A simple in-memory limit allows 30 reports a minute per IP (the last hop in `X-Forwarded-For`, or `X-Real-IP`). Extra reports get a 204 with no log line.

## YouTube fullscreen

The Permissions-Policy allows fullscreen for `self` and `https://www.youtube-nocookie.com`. Blog embeds already use `allowfullscreen` and do not set `allow="fullscreen"`. A headless Chrome check (local two-origin fixture, not a live YouTube page) found that `allowfullscreen` alone is enough under this policy: `requestFullscreen()` succeeded. It failed only when the iframe had neither attribute, or when the child origin was not in the allow list. The iframe markup was left unchanged.

## Rollout

1. Merge. Azure builds and deploys from `main`.
2. Watch the app log for `[csp-report]` lines for about a week. Run the post-deploy smoke tests below.
3. Add any origin that a real page needs. Ignore the zod eval line.
4. Enforce: send the same policy as `Content-Security-Policy`, with no `report-uri`, and delete the Report-Only header.
5. Run the SEOmator security check again.

## Post-deploy smoke tests (before enforcing)

- Sign in with Google and with X, and confirm the UserButton avatar loads.
- Record a voice clip, and try echo and read-aloud (microphone).
- Play a Tanakh chapter that falls back to mechon-mamre.org audio.
- Open a blog post, play the YouTube embed, and enter fullscreen.
- Upload a blog picture (admin, R2).
- Browse the main public pages and watch the app log for `[csp-report]` (ignore the zod eval line).
- Repeat in Safari and Firefox if you can.
