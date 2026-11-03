import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GameMenu } from "@/components/game-menu";
import { ArticlePlay } from "@/components/article-play";
import { ARTICLE_UNIT_MAX } from "@/lib/game";

export const Route = createFileRoute("/game/article/$unit")({ component: ArticleUnitPage });

function ArticleUnitPage() {
  const { unit: raw } = Route.useParams();
  const n = Number(raw);
  const ok = Number.isInteger(n) && n >= 1 && n <= ARTICLE_UNIT_MAX;

  if (!ok) return <Navigate to="/game/article" />;

  return (
    <>
      <div className="mb-4">
        <GameMenu />
      </div>
      <ArticlePlay key={n} unitId={n} />
    </>
  );
}
