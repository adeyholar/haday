import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useIibsRoom } from "@/components/iibs-door";

export const Route = createFileRoute("/iibs/study/")({ component: StudyHome });

function StudyHome() {
  const room = useIibsRoom();
  if (!room.ready) return <p className="text-sm text-muted">Opening this level…</p>;
  if (!room.level) return <Navigate to="/iibs" />;
  return <Navigate to="/iibs/study/$level" params={{ level: room.level }} />;
}
