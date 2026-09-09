import { useNavigate, useRouterState } from "@tanstack/react-router";
import { GroupSelect } from "@/components/group-select";

const OPTIONS = [
  { value: "/listen", label: "Vocabulary" },
  { value: "/listen/pet", label: "Alive Pet" },
  { value: "/listen/read", label: "Tanakh · 39 books" },
];

export function ListenMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const current = pathname.startsWith("/listen/read")
    ? "/listen/read"
    : pathname.startsWith("/listen/pet")
      ? "/listen/pet"
      : "/listen";

  return (
    <GroupSelect
      title="Listen"
      value={current}
      options={OPTIONS}
      onChange={(to) => {
        if (to === "/listen") void navigate({ to: "/listen" });
        else if (to === "/listen/pet") void navigate({ to: "/listen/pet" });
        else void navigate({ to: "/listen/read" });
      }}
    />
  );
}