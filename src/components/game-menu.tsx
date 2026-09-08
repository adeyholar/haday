import { useNavigate, useRouterState } from "@tanstack/react-router";
import { GroupSelect } from "@/components/group-select";
import { grammarTopicLabel } from "@/lib/grammar";
import { GRAMMAR_TRACKS } from "@/lib/grammar-tracks";

export function GameMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const grammarValue =
    GRAMMAR_TRACKS.find(
      (t) => pathname === `/game/lessons/${t.id}` || pathname.startsWith(`/game/lessons/${t.id}/`),
    )?.id ?? (pathname.startsWith("/game/lessons") ? "hub" : null);

  const current =
    pathname === "/game" || /^\/game\/\d+/.test(pathname)
      ? "/game"
      : pathname.startsWith("/game/custom")
        ? "/game/custom"
        : pathname.startsWith("/game/alefbet")
          ? "/game/alefbet"
          : pathname.startsWith("/game/syllables")
            ? "/game/syllables"
            : pathname.startsWith("/game/nouns")
              ? "/game/nouns"
              : pathname.startsWith("/game/article")
                ? "/game/article"
                : grammarValue === "hub"
                  ? "/game/lessons"
                  : grammarValue
                    ? `/game/lessons/${grammarValue}`
                    : pathname.startsWith("/challenge")
                      ? "/challenge"
                      : "/game";

  return (
    <GroupSelect
      title="Game"
      value={current}
      groups={[
        {
          label: "Play",
          options: [
            { value: "/game", label: "BBH vocabulary" },
            { value: "/game/custom", label: "Custom mix" },
            { value: "/challenge", label: "Ultimate Challenge" },
          ],
        },
        {
          label: "Letters & forms",
          options: [
            { value: "/game/alefbet", label: "Aleph-bet mastery" },
            { value: "/game/syllables", label: "Syllables" },
            { value: "/game/nouns", label: "Nouns" },
            { value: "/game/article", label: "Article & vav" },
          ],
        },
        {
          label: "Grammar",
          options: [
            { value: "/game/lessons", label: "All topics" },
            ...GRAMMAR_TRACKS.map((t) => ({
              value: `/game/lessons/${t.id}`,
              label: grammarTopicLabel(t),
            })),
          ],
        },
      ]}
      onChange={(to) => {
        const g = GRAMMAR_TRACKS.find((t) => to === `/game/lessons/${t.id}`);
        if (g) {
          void navigate({ to: "/game/lessons/$track", params: { track: g.id } });
          return;
        }
        if (to === "/game/lessons") void navigate({ to: "/game/lessons" });
        else if (to === "/game") void navigate({ to: "/game" });
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
