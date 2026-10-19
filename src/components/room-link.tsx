import { Link, useRouterState } from "@tanstack/react-router";

function roomFor(pathname: string): { to: "/hub/learn" | "/hub/practice" | "/hub/play" | "/hub/listen"; label: string } {
  if (
    pathname.startsWith("/game") ||
    pathname.startsWith("/challenge") ||
    pathname.startsWith("/study/term2/game") ||
    pathname.startsWith("/study/term2/exam")
  ) {
    return { to: "/hub/play", label: "Play" };
  }
  if (pathname.startsWith("/listen") || pathname.startsWith("/study/term2/listen")) {
    return { to: "/hub/listen", label: "Listen" };
  }
  if (
    pathname.startsWith("/drill") ||
    pathname.startsWith("/quiz") ||
    pathname.startsWith("/write") ||
    pathname.startsWith("/match") ||
    pathname.startsWith("/weak") ||
    pathname.startsWith("/cards") ||
    pathname.startsWith("/type") ||
    pathname.startsWith("/self-quiz") ||
    pathname.startsWith("/keep")
  ) {
    return { to: "/hub/practice", label: "Practice" };
  }
  return { to: "/hub/learn", label: "Learn" };
}

export function RoomLink() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const room = roomFor(pathname);
  return (
    <p className="mb-3 text-sm">
      <Link to={room.to} className="font-semibold text-primary">
        {room.label}
      </Link>
    </p>
  );
}
