import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { authClient } from "@/lib/auth/client";
import { getSocialSignInOffered } from "@/lib/auth/google-status";
import { socialSignInErrorMessage } from "@/lib/auth/google";
import { X_PROVIDER_ID, accountLinkErrorMessage, canUnlinkSignIn } from "@/lib/auth/x";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account")({ component: AccountPage });

type LinkedAccount = { providerId: string; accountId: string };

function AccountPage() {
  const href = useRouterState({ select: (s) => s.location.href });
  const linkError = useMemo(() => {
    try {
      return new URL(href, "http://local.invalid").searchParams.get("error")?.trim() || "";
    } catch {
      return "";
    }
  }, [href]);
  const [xOn, setXOn] = useState(false);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    linkError ? accountLinkErrorMessage(linkError) ?? socialSignInErrorMessage(linkError) ?? "Could not link X." : null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("error_description")) return;
    url.searchParams.delete("error_description");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    let cancel = false;
    Promise.all([getSocialSignInOffered(), authClient.listAccounts()])
      .then(([status, listed]) => {
        if (cancel) return;
        setXOn(status.x === true);
        const rows = Array.isArray(listed.data) ? listed.data : [];
        setAccounts(
          rows
            .filter((row) => row && typeof row.providerId === "string")
            .map((row) => ({
              providerId: row.providerId,
              accountId: typeof row.accountId === "string" ? row.accountId : "",
            })),
        );
        setReady(true);
      })
      .catch(() => {
        if (!cancel) {
          setXOn(false);
          setReady(true);
        }
      });
    return () => {
      cancel = true;
    };
  }, []);

  const linked = accounts.some((account) => account.providerId === X_PROVIDER_ID);
  const allowUnlink = canUnlinkSignIn(accounts, X_PROVIDER_ID);

  async function linkX() {
    setError(null);
    setBusy(true);
    try {
      const { data, error: linkError } = await authClient.linkSocial({
        provider: "twitter",
        callbackURL: "/account",
        errorCallbackURL: "/account",
      });
      if (linkError) throw new Error(linkError.message || "Could not start X.");
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Could not start X.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start X.");
      setBusy(false);
    }
  }

  async function unlinkX() {
    if (!allowUnlink) return;
    setError(null);
    setBusy(true);
    try {
      const { error: unlinkError } = await authClient.unlinkAccount({ providerId: "twitter" });
      if (unlinkError) throw new Error(unlinkError.message || "Could not unlink X.");
      setAccounts((current) => current.filter((account) => account.providerId !== X_PROVIDER_ID));
      setBusy(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unlink X.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <h1 className="font-display text-3xl font-bold text-ink">Account</h1>
      <p className="mt-2 text-sm text-muted">How you sign in to HaDay.</p>
      {xOn ? (
        <section className="mt-6 rounded-[var(--radius-xl)] bg-card p-4 shadow-[var(--shadow-border)]">
          <h2 className="text-sm font-semibold text-ink">X</h2>
          {!ready ? (
            <p className="mt-2 text-sm text-muted">Checking your sign-in methods.</p>
          ) : linked ? (
            <div className="mt-3">
              <Button type="button" className="w-full" disabled={busy || !allowUnlink} onClick={() => void unlinkX()}>
                Unlink X
              </Button>
              {!allowUnlink ? (
                <p className="mt-2 text-sm text-muted">
                  X is your only way in. Add email or Google before unlinking. To add a password, use Forgot password on the sign-in page.
                </p>
              ) : null}
            </div>
          ) : (
            <Button type="button" className="mt-3 w-full" disabled={busy} onClick={() => void linkX()}>
              Link X
            </Button>
          )}
        </section>
      ) : ready ? (
        <p className="mt-6 text-sm text-muted">X sign-in is not offered on this host.</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
