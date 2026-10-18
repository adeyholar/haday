import { useNavigate, useRouterState } from "@tanstack/react-router";
import { GroupSelect } from "@/components/group-select";
import { useStudy } from "@/lib/store";
import { isTerm2Week } from "@/lib/vocab-s2";

const OPTIONS = [
  { value: "/", match: (p: string) => p === "/", label: "Home" },
  { value: "/study", match: (p: string) => p.startsWith("/study") && !p.startsWith("/study/term2"), label: "Stations" },
  { value: "/drill", match: (p: string) => p.startsWith("/drill"), label: "Drill" },
  { value: "/weak", match: (p: string) => p.startsWith("/weak"), label: "Weak pool" },
  { value: "/cards", match: (p: string) => p.startsWith("/cards"), label: "Cards" },
  { value: "/write", match: (p: string) => p.startsWith("/write"), label: "Write" },
  { value: "/quiz", match: (p: string) => p.startsWith("/quiz"), label: "Quiz" },
  { value: "/rules", match: (p: string) => p.startsWith("/rules"), label: "Rules" },
  { value: "/match", match: (p: string) => p.startsWith("/match"), label: "Match" },
  { value: "/browse", match: (p: string) => p.startsWith("/browse"), label: "Lexicon" },
  { value: "/alphabet", match: (p: string) => p.startsWith("/alphabet"), label: "Alef-bet lesson" },
  { value: "/type", match: (p: string) => p.startsWith("/type"), label: "Type" },
  { value: "/self-quiz", match: (p: string) => p.startsWith("/self-quiz"), label: "Quiz myself" },
  { value: "/keep", match: (p: string) => p.startsWith("/keep"), label: "Zakhor · Daily keep" },
  { value: "/finder", match: (p: string) => p.startsWith("/finder"), label: "Tanakh cards" },
  { value: "/lessons", match: (p: string) => p.startsWith("/lessons"), label: "Grammar lessons" },
  { value: "/guide", match: (p: string) => p.startsWith("/guide"), label: "Guide" },
] as const;

const TERM2_OPTIONS = [
  { value: "/bbh", match: (p: string) => p === "/bbh", label: "Home" },
  { value: "/study/term2/game", match: (p: string) => p.startsWith("/study/term2/game"), label: "Game" },
  { value: "/study/term2/listen", match: (p: string) => p.startsWith("/study/term2/listen"), label: "Listen" },
  { value: "/study/term2/exam", match: (p: string) => p.startsWith("/study/term2/exam"), label: "Exam" },
  { value: "/study/term2", match: (p: string) => p.startsWith("/study/term2"), label: "Lessons" },
  { value: "/drill", match: (p: string) => p.startsWith("/drill"), label: "Drill" },
  { value: "/weak", match: (p: string) => p.startsWith("/weak"), label: "Weak pool" },
  { value: "/write", match: (p: string) => p.startsWith("/write"), label: "Write" },
  { value: "/quiz", match: (p: string) => p.startsWith("/quiz"), label: "Quiz" },
  { value: "/match", match: (p: string) => p.startsWith("/match"), label: "Match" },
  { value: "/browse", match: (p: string) => p.startsWith("/browse"), label: "Lexicon" },
] as const;

export function StudyMenu() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const week = useStudy((s) => s.week);
  const options = isTerm2Week(week) ? TERM2_OPTIONS : OPTIONS;
  const current = options.find((o) => o.match(pathname))?.value ?? options[0].value;

  return (
    <GroupSelect
      title="Study"
      value={current}
      options={options.map((o) => ({ value: o.value, label: o.label }))}
      onChange={(to) => {
        if (to === "/") void navigate({ to: "/" });
        else if (to === "/bbh") void navigate({ to: "/bbh" });
        else if (to === "/study") void navigate({ to: "/study" });
        else if (to === "/study/term2") void navigate({ to: "/study/term2" });
        else if (to === "/study/term2/game") void navigate({ to: "/study/term2/game" });
        else if (to === "/study/term2/listen") void navigate({ to: "/study/term2/listen" });
        else if (to === "/study/term2/exam") void navigate({ to: "/study/term2/exam/$chapter", params: { chapter: "20" } });
        else if (to === "/drill") void navigate({ to: "/drill" });
        else if (to === "/weak") void navigate({ to: "/weak" });
        else if (to === "/cards") void navigate({ to: "/cards" });
        else if (to === "/write") void navigate({ to: "/write", search: { mode: "write" } });
        else if (to === "/quiz") void navigate({ to: "/quiz" });
        else if (to === "/rules") void navigate({ to: "/rules" });
        else if (to === "/match") void navigate({ to: "/match" });
        else if (to === "/browse") void navigate({ to: "/browse" });
        else if (to === "/alphabet") void navigate({ to: "/alphabet" });
        else if (to === "/type") void navigate({ to: "/type" });
        else if (to === "/self-quiz") void navigate({ to: "/self-quiz" });
        else if (to === "/keep") void navigate({ to: "/keep" });
        else if (to === "/finder") void navigate({ to: "/finder" });
        else if (to === "/lessons") void navigate({ to: "/lessons" });
        else if (to === "/guide") void navigate({ to: "/guide" });
      }}
    />
  );
}