import { BookMarked, Crown, Flame, Flag, Footprints, Hash, Languages, Medal, Mountain, Repeat, Scissors, Scroll, Star, Trophy, Waves, type LucideIcon } from "lucide-react";
import type { BadgeId } from "@/lib/rewards";

export const BADGE_ICONS: Record<BadgeId, LucideIcon> = {
  "first-win": Flag,
  "win-3": Trophy,
  "win-7": Trophy,
  "first-chapter": Medal,
  "rung-5": Footprints,
  "rung-11": Flag,
  summit: Mountain,
  "streak-3": Flame,
  "streak-7": Flame,
  "streak-14": Flame,
  perfect: Star,
  "ultimate-90": Scroll,
  "ultimate-100": Crown,
  zakhor: Repeat,
  "zakhor-7": Repeat,
  "alefbet-line": Languages,
  "alefbet-master": Languages,
  "syllables-open": Scissors,
  "syllables-master": Scissors,
  "nouns-open": BookMarked,
  "nouns-master": BookMarked,
  "article-open": Hash,
  "article-master": Hash,
  "lessons-open": Scroll,
  "lessons-master": Scroll,
  "balloons-open": Waves,
  "balloons-clear": Waves,
};

export function BadgeGlyph({ id, className }: { id: string; className?: string }) {
  const Icon = BADGE_ICONS[id as BadgeId] ?? Medal;
  return <Icon className={className} />;
}
