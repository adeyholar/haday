import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { StudyMenu } from "@/components/study-menu";
import { Term2Listen } from "@/components/term2-listen";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { term2ListenPlaylist } from "@/lib/listen";

export const Route = createFileRoute("/study/term2/listen/")({ component: Term2ListenPage });

function Term2ListenPage() {
  const list = useMemo(() => term2ListenPlaylist(), []);
  return (
    <>
      <Panel className="mb-4">
        <StudyMenu />
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">Listen</h1>
        <p className="mt-2 text-muted">Hebrew, then the meaning. This list is Semester 2 only. It does not move your Semester 1 place.</p>
        <Link to="/study/term2/listen/road" className="mt-4 block">
          <Button className="w-full" variant="outline">
            On the road
          </Button>
        </Link>
      </Panel>
      <Term2Listen list={list} />
    </>
  );
}
