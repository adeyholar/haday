import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyPath } from "@/lib/learner-path";
import { homeForAccount } from "@/lib/path";
import { CONTACT_EMAIL } from "@/lib/class-site";

/** Legal and Credits on every public page, plus a way back to the front door. */
export function PublicFooter() {
  return (
    <footer className="mt-8 w-full pb-8">
      <nav aria-label="Site" className="flex flex-wrap items-center justify-center gap-x-5 rounded-[var(--radius-xl)] bg-card/90 px-4 shadow-[var(--shadow-border)]">
        <Link to="/" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
          HaDay
        </Link>
        <Link to="/about" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
          About
        </Link>
        <Link to="/blogs" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
          Blogs
        </Link>
        <Link to="/legal" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
          Legal
        </Link>
        <Link to="/credits" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
          Credits
        </Link>
        <Link to="/about" hash="contact" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
          Contact
        </Link>
      </nav>
    </footer>
  );
}

/** The public address. The mailto link is added in the browser so the page source has no mailto. */
export function ContactLink({ className }: { className?: string }) {
  const [href, setHref] = useState<string | undefined>();
  useEffect(() => {
    const [user, domain] = CONTACT_EMAIL.split("@");
    if (user && domain) setHref(`mailto:${user}@${domain}`);
  }, []);
  return (
    <a
      href={href}
      className={
        className ?? "inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
      }
    >
      {CONTACT_EMAIL}
    </a>
  );
}

/** Top of a public page. A signed-in student returns to their study, not a dead end. */
export function PublicReturn() {
  const { user } = useCurrentUserState();
  const [to, setTo] = useState<"/" | "/bbh" | "/iibs">("/");

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    getMyPath()
      .then((gate) => {
        if (cancel) return;
        const home = homeForAccount(gate);
        if (home) setTo(home);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [user]);

  return (
    <p className="mb-6">
      <Link to={to} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
        {user ? "Back to your study" : "Back to HaDay"}
      </Link>
    </p>
  );
}
