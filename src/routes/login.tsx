import { useState, type FormEvent } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand-lockup";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/login")({ component: Login });

type Mode = "up" | "in";

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<Mode>("up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center px-5">
        <div className="w-full max-w-sm rounded-[var(--radius-xl)] bg-card p-6 shadow-[var(--shadow-border)]">
          <BrandLockup size="hero" />
        </div>
      </main>
    );
  }

  if (user) return <Navigate to="/" />;

  async function onOauth(providerId: string) {
    setError(null);
    setBusy(true);
    try {
      await signIn(providerId, { callbackURL: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  async function onEmail(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const { error: signUpError } = await authClient.signUp.email({
          name: name.trim() || email.split("@")[0] || "Student",
          email: email.trim(),
          password,
          callbackURL: "/",
        });
        if (signUpError) throw new Error(signUpError.message || "Could not create the account.");
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: "/",
        });
        if (signInError) throw new Error(signInError.message || "Could not sign in.");
      }
      await authClient.getSession();
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)] sm:p-6">
        <BrandLockup size="hero" />
        <p className="mt-4 text-center text-sm text-muted">
          BIBL 630 · Biblical Hebrew I. Create an account so your drill, writing, and quiz work stay with you.
        </p>

        {!authEnabled ? (
          <p className="mt-6 text-sm text-muted">Sign-in is disabled.</p>
        ) : (
          <>
            <div className="mt-6 grid gap-2">
              {GROK_PROVIDERS.map((provider) => (
                <Button
                  key={provider.providerId}
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={busy}
                  onClick={() => void onOauth(provider.providerId)}
                >
                  Continue with {provider.label}
                </Button>
              ))}
            </div>

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-subtle">
              <span className="h-px flex-1 bg-border" />
              or email
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="mb-4 grid grid-cols-2 rounded-[var(--radius-md)] bg-surface p-1">
              <button
                type="button"
                className={cn(
                  "min-h-11 rounded-[var(--radius-sm)] text-sm font-medium",
                  mode === "up" ? "bg-card text-fg shadow-[var(--shadow-border)]" : "text-muted",
                )}
                onClick={() => setMode("up")}
              >
                Create account
              </button>
              <button
                type="button"
                className={cn(
                  "min-h-11 rounded-[var(--radius-sm)] text-sm font-medium",
                  mode === "in" ? "bg-card text-fg shadow-[var(--shadow-border)]" : "text-muted",
                )}
                onClick={() => setMode("in")}
              >
                Sign in
              </button>
            </div>

            <form className="grid gap-3" onSubmit={(event) => void onEmail(event)}>
              {mode === "up" && (
                <label className="grid gap-1 text-sm">
                  <span className="font-medium text-muted">Name</span>
                  <input
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11 rounded-[var(--radius-md)] border border-border bg-parchment px-3 text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
              )}
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-muted">Email</span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-[var(--radius-md)] border border-border bg-parchment px-3 text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-muted">Password</span>
                <input
                  required
                  type="password"
                  minLength={8}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-[var(--radius-md)] border border-border bg-parchment px-3 text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="mt-1 w-full" disabled={busy}>
                {busy ? "Working…" : mode === "up" ? "Create account" : "Sign in"}
              </Button>
            </form>
          </>
        )}
      </div>
      <p className="mt-5 text-center text-xs text-subtle">
        Classmates each keep their own week, streak, and weak-word list. Sign out from the header when you are done.
      </p>
    </main>
  );
}
