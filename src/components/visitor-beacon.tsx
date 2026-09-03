import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { pingVisit } from "@/lib/visits";

const KEY = "haday-visitor-id";

function visitorId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return `v-${Date.now().toString(36)}`;
  }
}

function deviceKind(): string {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android/i.test(ua)) return "mobile";
  return "desktop";
}

export function VisitorBeacon() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useCurrentUserState();

  useEffect(() => {
    const id = visitorId();
    const signedIn = Boolean(user);
    const t = window.setTimeout(() => {
      void pingVisit({
        data: { visitorId: id, path: pathname || "/", signedIn, device: deviceKind() },
      }).catch(() => {});
    }, 400);
    return () => window.clearTimeout(t);
  }, [pathname, user?.id]);

  return null;
}
