import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useIibsRoom } from "@/components/iibs-door";
import { Panel } from "@/components/panel";

export const Route = createFileRoute("/iibs/vocab/")({ component: VocabHome });

function VocabHome() {
  const room = useIibsRoom();
  if (!room.ready) {
    return (
      <Panel>
        <p className="text-sm text-muted">Opening this level…</p>
      </Panel>
    );
  }
  if (!room.level) return <Navigate to="/iibs" />;
  return <Navigate to="/iibs/vocab/$level" params={{ level: room.level }} />;
}
