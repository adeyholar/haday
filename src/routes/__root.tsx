import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppShell } from "@/components/app-shell";
import { ScrollBackdrop } from "@/components/scroll-backdrop";
import { MovedSignpost } from "@/components/moved-signpost";
import { AppErrorComponent } from "@/lib/error-component";
import { isRetiredVercelHost } from "@/lib/class-site";
import { SEO_DESCRIPTION, SEO_TITLE, shareMeta } from "@/lib/seo";
import appCss from "../styles.css?url";

const loadRootContext = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    if (isRetiredVercelHost(host)) return { sessionUser: null, retiredHost: true as const };
  } catch {
    /* read the session anyway */
  }
  try {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const u = await getSessionUser();
    return { sessionUser: u ? { id: u.id, email: u.email } : null, retiredHost: false as const };
  } catch (err) {
    console.error("[session]", err);
    return { sessionUser: null, retiredHost: false as const };
  }
});

let clientRoot: { at: number; value: Awaited<ReturnType<typeof loadRootContext>> } | null = null;

export const Route = createRootRoute({
  beforeLoad: async () => {
    if (typeof window !== "undefined" && clientRoot && Date.now() - clientRoot.at < 60_000) return clientRoot.value;
    try {
      const value = await loadRootContext();
      if (typeof window !== "undefined") clientRoot = { at: Date.now(), value };
      return value;
    } catch (err) {
      console.error("[root beforeLoad]", err);
      return { sessionUser: null, retiredHost: false };
    }
  },
  errorComponent: AppErrorComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      ...shareMeta(SEO_TITLE, SEO_DESCRIPTION, "/"),
      { name: "theme-color", content: "#f3eee4" },
      { name: "application-name", content: "HaDay" },
      { name: "apple-mobile-web-app-title", content: "HaDay" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Frank+Ruhl+Libre:wght@400;500;600;700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;1,400&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const { retiredHost } = Route.useRouteContext();
  const [retired, setRetired] = useState(retiredHost);
  useEffect(() => {
    if (typeof window !== "undefined" && isRetiredVercelHost(window.location.host)) {
      setRetired(true);
    }
  }, []);

  if (retired) {
    return (
      <html lang="en" className="antialiased" suppressHydrationWarning>
        <head>
          <HeadContent />
        </head>
        <body>
          <ScrollBackdrop />
          <MovedSignpost />
          <Scripts />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <ScrollBackdrop />
        <AuthProvider>
          <AppShell>
            <Outlet />
          </AppShell>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
