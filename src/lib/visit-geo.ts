export function cleanCountry(raw: string | null | undefined): string {
  const c = (raw ?? "").trim().toUpperCase();
  if (c === "XX" || c === "T1" || c === "A1" || c === "A2") return "";
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return c;
}

export function countryLabel(code: string): string {
  const c = cleanCountry(code);
  if (!c) return "";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(c) ?? c;
  } catch {
    return c;
  }
}

const PRIVATE_IP =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|0\.|::1$|fc|fd|fe80:)/i;

function stripIp(raw: string): string {
  let ip = raw.trim().replace(/^\[|\]$/g, "");
  if (ip.startsWith("::ffff:")) ip = ip.slice(7);
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.replace(/:\d+$/, "");
  return ip;
}

/** First public client IP. Azure App Service puts it on x-forwarded-for. */
export function clientIpFromHeaders(h: Headers): string {
  const raw = [
    h.get("x-azure-clientip"),
    h.get("x-azure-socketip"),
    h.get("x-client-ip"),
    h.get("true-client-ip"),
    h.get("cf-connecting-ip"),
    h.get("x-real-ip"),
    ...(h.get("x-forwarded-for") ?? "").split(","),
  ];
  for (const part of raw) {
    const ip = stripIp(part ?? "");
    if (!ip || PRIVATE_IP.test(ip)) continue;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) || ip.includes(":")) return ip;
  }
  return "";
}

export function countryFromHeaders(h: Headers): string {
  return cleanCountry(
    h.get("x-vercel-ip-country") ||
      h.get("cf-ipcountry") ||
      h.get("cloudfront-viewer-country") ||
      h.get("x-country-code") ||
      h.get("x-geo-country") ||
      h.get("x-appgw-geo-country"),
  );
}
