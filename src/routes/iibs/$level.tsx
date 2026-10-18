import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useIibsRoom } from "@/components/iibs-door";

export const Route = createFileRoute("/iibs/$level")({ component: LevelPage });

function LevelPage() {
  const room = useIibsRoom();
  if (!room.ready) return <p className="text-sm text-muted">Opening this level…</p>;
  return <Navigate to="/iibs" />;
}
