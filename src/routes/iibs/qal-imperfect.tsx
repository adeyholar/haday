import { createFileRoute, redirect } from "@tanstack/react-router";
import { legacyVerbTarget } from "@/lib/verb-lab/redirects";

export const Route = createFileRoute("/iibs/qal-imperfect")({
  beforeLoad: ({ location }) => {
    const target = legacyVerbTarget(location.pathname, location.hash);
    if (target?.to === "/iibs/verb-lab") throw redirect({ to: "/iibs/verb-lab", search: target.search });
  },
});
