import { useNavigate, useRouterState } from "@tanstack/react-router";
import { GroupSelect } from "@/components/group-select";

const OPTIONS = [
  { value: "/", match: (p: string) => p === "/", label: "Home" },
  { value: "/drill", match: (p: string) => p.startsWith("/drill"), label: "Drill" },
  { value: "/write", match: (p: string) => p.startsWith("/write"), label: "Write" },
  { value: "/quiz", match: (p: string) => p.startsWith("/quiz"), label: "Quiz" },
  { value: "/match", match: (p: string) => p.startsWith("/match"), label: "Match" },
  { value: "/browse", match: (p: string) => p.startsWith("/browse"), label: "Lexicon" },
  { value: "/alphabet", match: (p: string) => p.startsWith("/alphabet"), label: "Alef-bet lesson" },
  { value: "/keep", match: (p: string) => p.startsWith("/keep"), label: "Zakhor · Daily keep" },
  { value: "/guide", match: (p: string) => p.startsWith("/guide"), label: "Guide" },
] as const;

export function StudyMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const current = OPTIONS.find((o) => o.match(pathname))?.value ?? "/";

  return (
    <GroupSelect
      title="Study"
      value={current}
      options={OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
      onChange={(to) => {
        if (to === "/") void navigate({ to: "/" });
        else if (to === "/drill") void navigate({ to: "/drill" });
        else if (to === "/write") void navigate({ to: "/write", search: { mode: "write" } });
        else if (to === "/quiz") void navigate({ to: "/quiz" });
        else if (to === "/match") void navigate({ to: "/match" });
        else if (to === "/browse") void navigate({ to: "/browse" });
        else if (to === "/alphabet") void navigate({ to: "/alphabet" });
        else if (to === "/keep") void navigate({ to: "/keep" });
        else if (to === "/guide") void navigate({ to: "/guide" });
      }}
    />
  );
}
