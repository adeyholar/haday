import { useNavigate, useRouterState } from "@tanstack/react-router";
import { GroupSelect } from "@/components/group-select";
import { grammarTopicLabel } from "@/lib/grammar";
import { GRAMMAR_TRACKS } from "@/lib/grammar-tracks";

const BASE = [
  { value: "/game", match: (p: string) => p === "/game" || /^\/game\/\d+/.test(p), label: "BBH vocabulary" },
  { value: "/game/custom", match: (p: string) => p.startsWith("/game/custom"), label: "Custom mix" },
  { value: "/game/alefbet", match: (p: string) => p.startsWith("/game/alefbet"), label: "Aleph-bet mastery" },
  { value: "/game/syllables", match: (p: string) => p.startsWith("/game/syllables"), label: "Syllables" },
  { value: "/game/nouns", match: (p: string) => p.startsWith("/game/nouns"), label: "Nouns" },
  { value: "/game/article", match: (p: string) => p.startsWith("/game/article"), label: "Article & vav" },
] as const;

const GRAMMAR = GRAMMAR_TRACKS.map((t) => ({
  value: `/game/lessons/${t.id}`,
  match: (p: string) => p === `/game/lessons/${t.id}` || p.startsWith(`/game/lessons/${t.id}/`),
  label: grammarTopicLabel(t),
  track: t.id,
}));

const OPTIONS = [
  ...BASE,
  ...GRAMMAR,
  { value: "/challenge", match: (p: string) => p.startsWith("/challenge"), label: "Ultimate Challenge" },
] as const;

export function GameMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const current = OPTIONS.find((o) => o.match(pathname))?.value ?? "/game";

  return (
    <GroupSelect
      title="Game"
      value={current}
      options={OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
      onChange={(to) => {
        const g = GRAMMAR.find((x) => x.value === to);
        if (g) {
          void navigate({ to: "/game/lessons/$track", params: { track: g.track } });
          return;
        }
        if (to === "/game") void navigate({ to: "/game" });
        else if (to === "/game/custom") void navigate({ to: "/game/custom" });
        else if (to === "/game/alefbet") void navigate({ to: "/game/alefbet" });
        else if (to === "/game/syllables") void navigate({ to: "/game/syllables" });
        else if (to === "/game/nouns") void navigate({ to: "/game/nouns" });
        else if (to === "/game/article") void navigate({ to: "/game/article" });
        else if (to === "/challenge") void navigate({ to: "/challenge" });
      }}
    />
  );
}
