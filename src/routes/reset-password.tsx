import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand-lockup";

export const Route = createFileRoute("/reset-password")({ component: ResetPassword });

function ResetPassword() {
  const href = useRouterState({ select: (s) => s.location.href });
  const { token, error: linkError } = useMemo(() => {
    try {
      const params = new URL(href, "http://local.invalid").searchParams;
      return {
        token: params.get("token")?.trim() || "",
        error: params.get("error")?.trim() || "",
      };
    } catch {
      return { token: "", error: "" };
    }
  }, [href]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const invalidLink = !token || linkError === "INVALID_TOKEN";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (resetError) {
        throw new Error(
          resetError.message ||
            "This reset link is invalid or expired. Request a new one from the sign-in page.",
        );
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the password.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)] sm:p-6">
        <BrandLockup size="hero" />
        <h1 className="mt-4 text-center font-display text-2xl font-bold text-ink">Choose a new password</h1>

        {done ? (
          <div className="mt-6 grid gap-4">
            <p className="text-sm leading-relaxed text-muted">
              Password updated. Sign in with your email and the new password. Older sessions on this account were signed out.
            </p>
            <Link
              to="/login"
              className="inline-flex h-11 min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-border)]"
            >
              Sign in
            </Link>
          </div>
        ) : invalidLink ? (
          <div className="mt-6 grid gap-4">
            <p className="text-sm leading-relaxed text-muted">
              This reset link is missing, already used, or older than an hour. Request a new one from the sign-in page.
            </p>
            <Link
              to="/login"
              className="inline-flex h-11 min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[var(--shadow-border)]"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form className="mt-6 grid gap-3" onSubmit={(event) => void onSubmit(event)}>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-muted">New password</span>
              <input
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-[var(--radius-md)] border border-border bg-parchment px-3 text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-muted">Confirm password</span>
              <input
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-11 rounded-[var(--radius-md)] border border-border bg-parchment px-3 text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="mt-1 w-full" disabled={busy}>
              {busy ? "Saving…" : "Update password"}
            </Button>
            <p className="text-center text-sm">
              <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
