import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useIibsRoom } from "@/components/iibs-door";

export const Route = createFileRoute("/iibs/vocab/")({ component: VocabHome });

function VocabHome() {
  const room = useIibsRoom();
  if (!room.ready) return <p className="text-sm text-muted">Opening this level…</p>;
  if (!room.level) return <Navigate to="/iibs" />;
  return <Navigate to="/iibs/vocab/$level" params={{ level: room.level }} />;
}
