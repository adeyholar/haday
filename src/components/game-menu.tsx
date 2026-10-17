import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { GroupSelect } from "@/components/group-select";
import { cn } from "@/lib/cn";

export function GameMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const current =
    pathname === "/game" || /^\/game\/\d+/.test(pathname) || pathname.startsWith("/game/custom")
      ? "/game"
        : pathname.startsWith("/game/balloons")
          ? "/game/balloons"
          : pathname.startsWith("/game/type")
            ? "/game/type"
          : pathname.startsWith("/game/road")
            ? "/game/road"
          : pathname.startsWith("/game/final-vocab")
            ? "/game/final-vocab"
          : pathname.startsWith("/game/final")
            ? "/game/final"
          : pathname.startsWith("/game/week7")
            ? "/game/week7"
          : pathname.startsWith("/self-quiz")
            ? "/self-quiz"
          : pathname.startsWith("/game/alefbet")
          ? "/game/alefbet"
          : pathname.startsWith("/game/syllables")
            ? "/game/syllables"
            : pathname.startsWith("/game/nouns")
              ? "/game/nouns"
              : pathname.startsWith("/game/article")
                ? "/game/article"
                : pathname.startsWith("/game/lessons")
                  ? "/game/lessons"
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
            { value: "/game", label: "Vocabulary" },
            { value: "/game/road", label: "Road exam · Week 7" },
            { value: "/game/final", label: "Road exam · Week 15" },
            { value: "/game/week7", label: "Week 7 mock exam" },
            { value: "/game/final-vocab", label: "Final vocab" },
            { value: "/self-quiz", label: "Self-quiz" },
            { value: "/challenge", label: "Ultimate Challenge" },
          ],
        },
        {
          label: "Letters & forms",
          options: [
            { value: "/game/alefbet", label: "Aleph-bet mastery" },
            { value: "/game/type", label: "Type the word" },
            { value: "/game/balloons", label: "Ocean letters" },
            { value: "/game/syllables", label: "Syllables" },
            { value: "/game/nouns", label: "Nouns" },
            { value: "/game/article", label: "Article & vav" },
          ],
        },
        {
          label: "Grammar",
          options: [{ value: "/game/lessons", label: "Grammar" }],
        },
      ]}
      onChange={(to) => {
        if (to === "/game/lessons") void navigate({ to: "/game/lessons" });
        else if (to === "/game") void navigate({ to: "/game" });
        else if (to === "/game/road") void navigate({ to: "/game/road" });
        else if (to === "/game/final") void navigate({ to: "/game/final" });
        else if (to === "/game/week7") void navigate({ to: "/game/week7" });
        else if (to === "/game/final-vocab") void navigate({ to: "/game/final-vocab" });
        else if (to === "/game/alefbet") void navigate({ to: "/game/alefbet" });
        else if (to === "/game/type") void navigate({ to: "/game/type" });
        else if (to === "/self-quiz") void navigate({ to: "/self-quiz", search: { shell: "game" } });
        else if (to === "/game/balloons") void navigate({ to: "/game/balloons" });
        else if (to === "/game/syllables") void navigate({ to: "/game/syllables" });
        else if (to === "/game/nouns") void navigate({ to: "/game/nouns" });
        else if (to === "/game/article") void navigate({ to: "/game/article" });
        else if (to === "/challenge") void navigate({ to: "/challenge" });
      }}
    />
  );
}

export function WordPlayChoice({ which }: { which: "path" | "mix" }) {
  return (
    <div className="mt-4 flex gap-2">
      <Link
        to="/game"
        className={cn(
          "min-h-11 flex-1 rounded-[var(--radius-md)] px-3 py-2 text-center text-sm font-semibold",
          which === "path" ? "bg-ink text-parchment" : "bg-card text-ink shadow-[var(--shadow-border)]",
        )}
      >
        Vocabulary
      </Link>
      <Link
        to="/game/custom"
        search={{ kind: "vocab" }}
        className={cn(
          "min-h-11 flex-1 rounded-[var(--radius-md)] px-3 py-2 text-center text-sm font-semibold",
          which === "mix" ? "bg-ink text-parchment" : "bg-card text-ink shadow-[var(--shadow-border)]",
        )}
      >
        Custom mix
      </Link>
    </div>
  );
}
