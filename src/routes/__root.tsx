import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { createRootRoute, HeadContent, Outlet, Scripts, isRedirect, redirect } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppShell } from "@/components/app-shell";
import { ScrollBackdrop } from "@/components/scroll-backdrop";
import { MovedSignpost } from "@/components/moved-signpost";
import { AppErrorComponent } from "@/lib/error-component";
import { isRetiredVercelHost } from "@/lib/class-site";
import { emailConfirmRedirect, freshRootSession, storeRootSession } from "@/lib/auth/confirm-hold";
import { SEO_DESCRIPTION, SEO_TITLE, shareMeta } from "@/lib/seo";
import { LAMP_BOOT, readLamp } from "@/lib/lamp";
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
    return {
      sessionUser: u ? { id: u.id, email: u.email, emailVerified: u.emailVerified } : null,
      retiredHost: false as const,
    };
  } catch (err) {
    console.error("[session]", err);
    return { sessionUser: null, retiredHost: false as const };
  }
});

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const hold = (value: Awaited<ReturnType<typeof loadRootContext>>) => {
      const target = emailConfirmRedirect(location.pathname, value.sessionUser?.emailVerified);
      if (target) throw redirect({ href: target });
      return value;
    };
    if (typeof window !== "undefined") {
      const cached = freshRootSession<Awaited<ReturnType<typeof loadRootContext>>>();
      if (cached) return hold(cached);
    }
    try {
      const value = await loadRootContext();
      if (typeof window !== "undefined") storeRootSession(value);
      return hold(value);
    } catch (err) {
      if (isRedirect(err)) throw err;
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
      { rel: "alternate", type: "application/rss+xml", title: "HaDay Teachings", href: "/blogs/rss.xml" },
      { rel: "alternate", type: "application/rss+xml", title: "Learning HebRabbAi", href: "/learning-hebrabbai/rss.xml" },
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
    <html lang="en" className="antialiased" data-lamp={readLamp() === "light" ? undefined : readLamp()} suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: LAMP_BOOT }} />
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
