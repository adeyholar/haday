import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, Navigate, useRouterState } from "@tanstack/react-router";
import { authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getGoogleSignInOffered } from "@/lib/auth/google-status";
import { GOOGLE_PROVIDER_ID, socialSignInErrorMessage } from "@/lib/auth/google";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand-lockup";
import { cn } from "@/lib/cn";
import { markTermHall, pathForHeard, rememberDoor, signInLanding, stashPathIntent, type HeardSource, type StudyPath } from "@/lib/path";
import { getMyPath } from "@/lib/learner-path";
import { GRAMMAR_PATH, HEARD_NEED, HEARD_PROMPT, PATH_CHOICE, PATH_CHOICE_STAYS, SCRIPTURE_PATH } from "@/lib/path-names";

export const Route = createFileRoute("/login")({ component: Login });

type Mode = "up" | "in" | "reset";

function GoToStudy() {
  const [to, setTo] = useState<"/" | "/bbh" | "/iibs" | null>(null);
  useEffect(() => {
    let cancel = false;
    getMyPath()
      .then((gate) => {
        if (cancel) return;
        const home = signInLanding(gate);
        if (home && gate.path) {
          rememberDoor(gate.path);
          if (home === "/bbh") markTermHall();
        }
        setTo(home ?? "/");
      })
      .catch(() => {
        if (!cancel) setTo("/");
      });
    return () => {
      cancel = true;
    };
  }, []);
  if (!to) {
    return (
      <main className="grid min-h-dvh place-items-center px-5">
        <p className="text-sm text-muted">Opening your study.</p>
      </main>
    );
  }
  return <Navigate to={to} replace />;
}

function Login() {
  const { user, isPending } = useCurrentUserState();
  const href = useRouterState({ select: (s) => s.location.href });
  const linkError = useMemo(() => {
    try {
      return new URL(href, "http://local.invalid").searchParams.get("error")?.trim() || "";
    } catch {
      return "";
    }
  }, [href]);
  const [mode, setMode] = useState<Mode>("up");
  useEffect(() => {
    try {
      const path = new URLSearchParams(window.location.search).get("path");
      if (path === "bbh" || path === "iibs") stashPathIntent(path);
      if (window.localStorage.getItem("haday.seen-account") === "1") setMode("in");
    } catch {
      /* keep Create account */
    }
  }, []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [heard, setHeard] = useState<HeardSource | "">("");
  const [pathChoice, setPathChoice] = useState<StudyPath | "">("");
  const [confirmed, setConfirmed] = useState(false);
  const suggested: StudyPath | "" = heard === "college" ? "bbh" : heard === "iibs" ? "iibs" : "";
  const placed: StudyPath | null =
    heard === "other"
      ? pathForHeard(heard, pathChoice)
      : confirmed && (pathChoice === "bbh" || pathChoice === "iibs")
        ? pathChoice
        : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(linkError ? verifyErrorMessage(linkError) : null);
  const [resetSent, setResetSent] = useState(false);
  const [awaitingVerify, setAwaitingVerify] = useState(false);
  const [resent, setResent] = useState(false);
  const [googleOffered, setGoogleOffered] = useState(false);
  useEffect(() => {
    let cancel = false;
    getGoogleSignInOffered()
      .then((result) => {
        if (!cancel) setGoogleOffered(result.offered === true);
      })
      .catch(() => {
        if (!cancel) setGoogleOffered(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center px-5">
        <div className="w-full max-w-sm rounded-[var(--radius-xl)] bg-card p-6 shadow-[var(--shadow-border)]">
          <BrandLockup size="hero" linked />
        </div>
      </main>
    );
  }

  if (user) return <GoToStudy />;

  async function onGoogle() {
    setError(null);
    if (mode === "up") {
      if (!placed) {
        setError(heard === "other" ? PATH_CHOICE : HEARD_NEED);
        return;
      }
      stashPathIntent(placed);
    }
    setBusy(true);
    try {
      await signIn(GOOGLE_PROVIDER_ID, { callbackURL: "/login", errorCallbackURL: "/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  async function onForgot(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error: resetError } = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: "/reset-password",
      });
      if (resetError) throw new Error(resetError.message || "Could not start a password reset.");
      setResetSent(true);
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start a password reset.");
      setBusy(false);
    }
  }

  async function resendVerify() {
    setError(null);
    setBusy(true);
    setResent(false);
    try {
      const { error: sendError } = await authClient.sendVerificationEmail({
        email: email.trim(),
        callbackURL: "/login",
      });
      if (sendError) throw new Error(sendError.message || "Could not send the confirmation email.");
      setResent(true);
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the confirmation email.");
      setBusy(false);
    }
  }

  async function onEmail(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        if (!agreed) {
          throw new Error("Read Privacy and disclaimer, then tick the box.");
        }
        if (!placed) {
          throw new Error(heard === "other" ? PATH_CHOICE : HEARD_NEED);
        }
        stashPathIntent(placed);
        const { error: signUpError } = await authClient.signUp.email({
          name: name.trim() || email.split("@")[0] || "Student",
          email: email.trim(),
          password,
          callbackURL: "/login",
        });
        if (signUpError) {
          throw new Error(
            signUpError.message ||
              "Could not create the account. The class database may not be connected on Azure yet.",
          );
        }
        setAwaitingVerify(true);
        setBusy(false);
        return;
      }
      const { error: signInError } = await authClient.signIn.email({
        email: email.trim(),
        password,
        callbackURL: "/",
      });
      if (signInError) {
        const code = (signInError as { code?: string }).code ?? "";
        const message = signInError.message || "Could not sign in.";
        if (code === "EMAIL_NOT_VERIFIED" || /not verified/i.test(message)) {
          setAwaitingVerify(true);
          setBusy(false);
          return;
        }
        throw new Error(message);
      }
      await authClient.getSession();
      const gate = await getMyPath();
      const home = signInLanding(gate);
      if (home && gate.path) {
        rememberDoor(gate.path);
        if (home === "/bbh") markTermHall();
      }
      window.location.assign(home ?? "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <div className="rounded-[var(--radius-xl)] bg-card p-5 shadow-[var(--shadow-border)] sm:p-6">
        <BrandLockup size="hero" linked />
        <p className="mt-4 text-center text-sm text-muted">
          {PATH_CHOICE_STAYS}
        </p>

        {!authEnabled ? (
          <p className="mt-6 text-sm text-muted">Sign-in is disabled.</p>
        ) : awaitingVerify ? (
          <div className="mt-6 grid gap-3">
            <p className="text-sm leading-relaxed text-muted">
              Check the inbox for <span className="font-semibold text-ink">{email.trim() || "that address"}</span>.
              Open the confirmation link in the next 24 hours to finish the account. Check spam too.
            </p>
            {resent ? (
              <p className="text-sm text-muted">Another confirmation email is on the way.</p>
            ) : null}
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="button" className="w-full" disabled={busy || !email.trim()} onClick={() => void resendVerify()}>
              {busy ? "Sending…" : "Send the email again"}
            </Button>
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => {
                setAwaitingVerify(false);
                setError(null);
                setResent(false);
                setMode("in");
              }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 rounded-[var(--radius-md)] bg-surface p-1">
              <button
                type="button"
                className={cn(
                  "min-h-11 rounded-[var(--radius-sm)] text-sm font-medium",
                  mode === "up" ? "bg-card text-fg shadow-[var(--shadow-border)]" : "text-muted",
                )}
                onClick={() => {
                  setMode("up");
                  setResetSent(false);
                  setError(null);
                }}
              >
                Create account
              </button>
              <button
                type="button"
                className={cn(
                  "min-h-11 rounded-[var(--radius-sm)] text-sm font-medium",
                  mode === "in" || mode === "reset"
                    ? "bg-card text-fg shadow-[var(--shadow-border)]"
                    : "text-muted",
                )}
                onClick={() => {
                  setMode("in");
                  setResetSent(false);
                  setError(null);
                }}
              >
                Sign in
              </button>
            </div>

            {mode === "up" && (
              <fieldset className="mt-4 grid gap-2">
                <legend className="mb-1 text-sm font-medium text-muted">{HEARD_PROMPT}</legend>
                {(
                  [
                    ["college", "College or school", "Opens the Grammar Path. You confirm it next."],
                    ["iibs", "An online Bible school", "Opens the Scripture Path. You confirm it next."],
                    ["other", "Internet or a friend", "Choose the course."],
                  ] as const
                ).map(([id, label, note]) => (
                  <button
                    key={id}
                    type="button"
                    className={cn(
                      "min-h-14 rounded-[var(--radius-md)] px-3 py-2 text-left shadow-[var(--shadow-border)]",
                      heard === id ? "bg-ink text-parchment" : "bg-card text-ink",
                    )}
                    onClick={() => {
                      setHeard(id);
                      setConfirmed(false);
                      setPathChoice(id === "college" ? "bbh" : id === "iibs" ? "iibs" : "");
                      setError(null);
                    }}
                  >
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className={cn("mt-0.5 block text-xs", heard === id ? "text-parchment/80" : "text-muted")}>
                      {note}
                    </span>
                  </button>
                ))}
              </fieldset>
            )}

            {mode === "up" && suggested && (
              <div className="mt-3 rounded-[var(--radius-md)] bg-surface p-3">
                <p className="text-sm text-ink">
                  You'll study on the {pathChoice === "iibs" ? SCRIPTURE_PATH.title : GRAMMAR_PATH.title}.
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    className={cn(
                      "min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-semibold",
                      confirmed && pathChoice === suggested ? "bg-ink text-parchment" : "bg-card text-ink shadow-[var(--shadow-border)]",
                    )}
                    onClick={() => setConfirmed(true)}
                  >
                    Continue on this path
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "min-h-11 rounded-[var(--radius-sm)] px-3 text-sm font-semibold",
                      confirmed && pathChoice !== suggested
                        ? "bg-ink text-parchment"
                        : "bg-card text-ink shadow-[var(--shadow-border)]",
                    )}
                    onClick={() => {
                      setPathChoice(pathChoice === "bbh" ? "iibs" : "bbh");
                      setConfirmed(true);
                      setError(null);
                    }}
                  >
                    Choose the other path
                  </button>
                </div>
              </div>
            )}
            {mode === "up" && heard === "other" && (
              <fieldset className="mt-3 grid grid-cols-2 gap-2">
                <legend className="col-span-2 mb-1 text-sm font-medium text-muted">Course</legend>
                <button
                  type="button"
                  className={cn(
                    "min-h-16 rounded-[var(--radius-md)] px-3 text-left text-sm font-semibold shadow-[var(--shadow-border)]",
                    pathChoice === "bbh" ? "bg-ink text-parchment" : "bg-card text-ink",
                  )}
                  onClick={() => setPathChoice("bbh")}
                >
                  {GRAMMAR_PATH.title}
                  <span className={cn("he-word mt-1 block text-lg font-normal", pathChoice === "bbh" ? "text-parchment" : "text-ink")} dir="rtl" lang="he">
                    {GRAMMAR_PATH.hebrew}
                  </span>
                </button>
                <button
                  type="button"
                  className={cn(
                    "min-h-16 rounded-[var(--radius-md)] px-3 text-left text-sm font-semibold shadow-[var(--shadow-border)]",
                    pathChoice === "iibs" ? "bg-parchment text-ink ring-1 ring-ink/30" : "bg-card text-ink",
                  )}
                  onClick={() => setPathChoice("iibs")}
                >
                  {SCRIPTURE_PATH.title}
                  <span className="he-word mt-1 block text-lg font-normal" dir="rtl" lang="he">
                    {SCRIPTURE_PATH.hebrew}
                  </span>
                </button>
              </fieldset>
            )}

            {mode !== "reset" && googleOffered && (
            <div className="mt-4 grid gap-2">
              <GoogleSignInButton busy={busy} onClick={() => void onGoogle()} />
              {mode === "up" && !placed ? (
                <p className="text-sm text-muted">Answer the question above to use Google.</p>
              ) : null}
            </div>
            )}

            {mode !== "reset" && googleOffered && (
            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-subtle">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>
            )}

            {mode === "reset" ? (
              resetSent ? (
                <div className="grid gap-3">
                  <p className="text-sm leading-relaxed text-muted">
                    If that address has a HaDay account, a reset email is on the way. Check inbox and
                    spam. The link expires in one hour.
                  </p>
                  <p className="text-sm leading-relaxed text-muted">
                    Nothing arrives? Ask the course owner. They can email a reset from the class roster.
                  </p>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => {
                      setMode("in");
                      setResetSent(false);
                    }}
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <form className="grid gap-3" onSubmit={(event) => void onForgot(event)}>
                  <p className="text-sm leading-relaxed text-muted">
                    Enter the email you used to create the account. We will email a reset link if it matches a classmate.
                  </p>
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
                  {error && <p className="text-sm text-danger">{error}</p>}
                  <Button type="submit" className="mt-1 w-full" disabled={busy}>
                    {busy ? "Sending…" : "Send reset link"}
                  </Button>
                  <button
                    type="button"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => {
                      setMode("in");
                      setError(null);
                    }}
                  >
                    Back to sign in
                  </button>
                </form>
              )
            ) : (
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
              {mode === "up" && (
                <label className="flex items-start gap-2 text-sm leading-snug text-muted">
                  <input
                    required
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 size-4 shrink-0 rounded border-border"
                  />
                  <span>
                    I am 13 or older. I have read the{" "}
                    <Link to="/legal" className="font-semibold text-primary underline-offset-4 hover:underline">
                      Privacy policy and disclaimer
                    </Link>
                    . HaDay does not sell my data.
                  </span>
                </label>
              )}
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="mt-1 w-full" disabled={busy || (mode === "up" && (!agreed || !placed))}>
                {busy ? "Working…" : mode === "up" ? "Create account" : "Sign in"}
              </Button>
              {mode === "in" && (
                <button
                  type="button"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    setMode("reset");
                    setError(null);
                    setResetSent(false);
                  }}
                >
                  Forgot password?
                </button>
              )}
            </form>
            )}
          </>
        )}
      </div>
      <p className="mt-5 text-center text-xs text-subtle">
        Classmates each keep their own week, streak, and weak-word list. Sign out from the header when you are done.
      </p>
      <p className="mt-2 text-center text-xs text-subtle">
        <Link to="/legal" className="underline-offset-4 hover:underline">
          Privacy and disclaimer
        </Link>
        {" · "}
        <Link to="/credits" className="underline-offset-4 hover:underline">
          Credits
        </Link>
        {" · "}We do not sell your information.
      </p>
    </main>
  );
}

function verifyErrorMessage(code: string): string {
  const linked = socialSignInErrorMessage(code);
  if (linked) return linked;
  const upper = code.toUpperCase();
  if (upper.includes("EXPIRED") || upper.includes("TOKEN")) {
    return "That confirmation link is missing or expired. Sign in and we will send a new one.";
  }
  return "Could not confirm that email. Request a new confirmation from sign in.";
}
