import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyPath } from "@/lib/learner-path";
import { homeForAccount } from "@/lib/path";

/** Legal and Credits on every public page, plus a way back to the front door. */
export function PublicFooter() {
  return (
    <footer className="mx-auto mt-8 flex w-full max-w-2xl flex-wrap justify-center gap-x-5 gap-y-2 px-5 pb-10 text-sm text-muted">
      <Link to="/" className="font-semibold text-primary underline-offset-4 hover:underline">
        HaDay
      </Link>
      <Link to="/about" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
        About
      </Link>
      <Link to="/teachings" className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline">
        Teachings
      </Link>
      <Link to="/legal" className="font-semibold text-primary underline-offset-4 hover:underline">
        Legal
      </Link>
      <Link to="/credits" className="font-semibold text-primary underline-offset-4 hover:underline">
        Credits
      </Link>
    </footer>
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
