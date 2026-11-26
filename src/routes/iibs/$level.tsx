import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useIibsRoom } from "@/components/iibs-door";
import { Panel } from "@/components/panel";

export const Route = createFileRoute("/iibs/$level")({ component: LevelPage });

function LevelPage() {
  const room = useIibsRoom();
  if (!room.ready) {
    return (
      <Panel>
        <p className="text-sm text-muted">Opening this level…</p>
      </Panel>
    );
  }
  return <Navigate to="/iibs" />;
}
