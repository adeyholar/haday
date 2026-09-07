import { useEffect, useState } from "react";
import { AZURE_FALLBACK, CLASS_SITE, CLASS_SITE_HOST, classSiteUrl } from "@/lib/class-site";

export function MovedSignpost() {
  const [href, setHref] = useState(CLASS_SITE);
  const [label, setLabel] = useState(CLASS_SITE_HOST);

  useEffect(() => {
    const path = window.location.pathname + window.location.search + window.location.hash;
    const next = classSiteUrl(path);
    setHref(next);
    setLabel(next.replace(/^https:\/\//, ""));
    document.title = "HaDay has moved";
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl items-center px-4 py-10">
      <div className="w-full rounded-[var(--radius-xl)] bg-card px-6 py-8 text-center shadow-[var(--shadow-border)]">
        <p className="he-word text-5xl font-bold text-primary" lang="he">
          הַדַּי
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Hebraic Mentor</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink">This address is closed.</h1>
        <p className="mx-auto mt-4 max-w-prose text-muted">
          HaDay now lives on the class site. Bookmark the link below and use it from now on. Old logins from this
          page do not carry over — create a new account there.
        </p>
        <a
          href={href}
          className="mt-6 flex min-h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 text-base font-bold text-parchment break-all"
        >
          {label}
        </a>
        <p className="mt-3 text-sm font-medium text-ink">That is the real HaDay. Tap it to continue.</p>
        <p className="mt-4 text-xs text-muted">
          If the class host is down:{" "}
          <a className="font-semibold text-primary" href={AZURE_FALLBACK}>
            haday.azurewebsites.net
          </a>
        </p>
      </div>
    </main>
  );
}
