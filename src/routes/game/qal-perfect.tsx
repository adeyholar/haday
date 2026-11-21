import { createFileRoute, redirect } from "@tanstack/react-router";
import { legacyVerbTarget } from "@/lib/verb-lab/redirects";

export const Route = createFileRoute("/game/qal-perfect")({
  beforeLoad: ({ location }) => {
    const target = legacyVerbTarget(location.pathname, location.hash);
    if (target?.to === "/verb-lab") throw redirect({ to: "/verb-lab", search: target.search });
  },
});
