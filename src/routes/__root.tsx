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
import appCss from "../styles.css?url";

const APP_NAME = "HaDay";

const fetchRetiredHost = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
    return isRetiredVercelHost(host);
  } catch {
    return false;
  }
});

const fetchSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const u = await getSessionUser();
    return u ? { id: u.id, email: u.email } : null;
  } catch (err) {
    console.error("[session]", err);
    return null;
  }
});

export const Route = createRootRoute({
  beforeLoad: async () => {
    try {
      const retiredHost = await fetchRetiredHost();
      if (retiredHost) return { sessionUser: null, retiredHost: true };
      return { sessionUser: await fetchSessionUser(), retiredHost: false };
    } catch (err) {
      console.error("[root beforeLoad]", err);
      return { sessionUser: null, retiredHost: false };
    }
  },
  errorComponent: AppErrorComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: "HaDay Hebraic Mentor — Biblical Hebrew vocabulary for first-year students." },
      { name: "theme-color", content: "#f3eee4" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
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
