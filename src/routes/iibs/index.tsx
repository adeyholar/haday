import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LevelHall, LevelRoom, useIibsRoom } from "@/components/iibs-door";
import { getMyPath, type MyPath } from "@/lib/learner-path";
import { levelUnlocked } from "@/lib/iibs-game";
import { leaveIibsRoom } from "@/lib/iibs-room";
import { useStudy } from "@/lib/store";

export const Route = createFileRoute("/iibs/")({ component: IibsHome });

function IibsHome() {
  const progress = useStudy((s) => s.game.iibs);
  const room = useIibsRoom();
  const [gate, setGate] = useState<MyPath | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getMyPath()
      .then((next) => {
        if (!cancelled) setGate(next);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not open the lessons.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const admin = Boolean(gate?.admin);

  useEffect(() => {
    if (!gate || !room.level) return;
    if (!levelUnlocked(progress, room.level, admin)) leaveIibsRoom();
  }, [admin, gate, progress, room.level]);

  if (!room.ready || !gate) return <p className="text-sm text-muted">Opening the level.</p>;
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!room.level) return <LevelHall progress={progress} admin={admin} />;
  return <LevelRoom level={room.level} progress={progress} admin={admin} />;
}
