import { Link } from "@tanstack/react-router";

/** Legal and Credits on every public page. */
export function PublicFooter() {
  return (
    <footer className="mx-auto mt-8 flex w-full max-w-2xl justify-center gap-5 px-5 pb-10 text-sm text-muted">
      <Link to="/legal" className="font-semibold text-primary underline-offset-4 hover:underline">
        Legal
      </Link>
      <Link to="/credits" className="font-semibold text-primary underline-offset-4 hover:underline">
        Credits
      </Link>
    </footer>
  );
}
