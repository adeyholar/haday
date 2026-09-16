import { useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { GroupSelect } from "@/components/group-select";
import { fromSearch } from "@/lib/passage";

const OPTIONS = [
  { value: "/listen", label: "Vocabulary" },
  { value: "/listen/pet", label: "Alive Pet" },
  { value: "/listen/read", label: "Tanakh · 39 books" },
];

export function ListenMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const loose = useSearch({ strict: false }) as { from?: unknown };
  const from = typeof loose.from === "string" ? loose.from : undefined;
  const carry = fromSearch(from);
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
        if (to === "/listen") void navigate({ to: "/listen", search: carry });
        else if (to === "/listen/pet") void navigate({ to: "/listen/pet", search: carry });
        else void navigate({ to: "/listen/read", search: carry });
      }}
    />
  );
}
