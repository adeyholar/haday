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
default-src 'self'; script-src 'self' 'unsafe-inline' https://grok.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://images.haday.app; media-src 'self' blob: data: https://mechon-mamre.org; connect-src 'self' https://grok.com https://app-builder-deployer.grok.com https://*.r2.cloudflarestorage.com; frame-src https://www.youtube-nocookie.com; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
```

Why `'unsafe-inline'` stays for now: TanStack Start streams inline bootstrap scripts, the page has an inline theme script, and blog video buttons carry an inline `onclick`. Moving to nonces needs router and middleware work and is a separate change.

Known harmless report: zod probes `Function("")` once per page load. Under an enforced CSP the probe throws, zod catches it and skips its JIT. `unsafe-eval` is not needed.

## Rollout

1. Merge. Azure builds and deploys from `main`.
2. Watch the app log for `[csp-report]` lines for about a week. Open the main pages, a blog post with a video, the Listen and Reading Lab rooms, record a voice clip, and sign in with Google.
3. Add any origin that a real page needs. Ignore the zod eval line.
4. Enforce: send the same policy as `Content-Security-Policy`, with no `report-uri`, and delete the Report-Only header.
5. Run the SEOmator security check again.
