import { useState } from "react";
import { createFileRoute, redirect, useRouteContext } from "@tanstack/react-router";
import { signOut } from "@/lib/auth/client";
import { maskEmail, safeNextPath } from "@/lib/auth/confirm-hold";
import { resendConfirmEmail } from "@/lib/auth/resend-confirm";
import { BrandLockup } from "@/components/brand-lockup";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/confirm-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: typeof search.next === "string" ? search.next : "",
  }),
  beforeLoad: ({ context, search }) => {
    if (!context.sessionUser) throw redirect({ href: "/login" });
    if (context.sessionUser.emailVerified !== false) throw redirect({ href: safeNextPath(search.next) });
  },
  component: ConfirmEmail,
});

function ConfirmEmail() {
  const { sessionUser } = useRouteContext({ from: "__root__" });
  const { next } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const masked = maskEmail(sessionUser?.email ?? "");

  async function resend() {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const result = await resendConfirmEmail({ data: { next } });
      if (!result.ok) setError(result.error);
      else if (result.sent) setNote("Another confirmation email is on the way.");
      else setNote("This email is already confirmed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the confirmation email.");
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)] sm:p-6">
        <BrandLockup size="hero" linked />
        <h1 className="mt-4 text-center font-display text-3xl font-bold text-ink">Confirm your email</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Check your inbox at <span className="font-semibold text-ink">{masked}</span> and tap the link to start learning.
        </p>
        {note ? <p className="mt-3 text-sm text-muted">{note}</p> : null}
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        <Button type="button" className="mt-4 w-full" disabled={busy} onClick={() => void resend()}>
          {busy ? "Sending…" : "Resend email"}
        </Button>
        <Button type="button" variant="outline" className="mt-2 w-full" disabled={busy} onClick={() => void signOut("/login")}>
          Sign out
        </Button>
      </div>
    </main>
  );
}
