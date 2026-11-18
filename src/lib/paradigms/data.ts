import levelsFile from "../../../data/paradigms/levels.json";
import placementFile from "../../../data/paradigms/placement-quiz.json";
import strongVerbFile from "../../../data/paradigms/strong-verb.json";
import type { LevelsFile, PlacementFile, StrongVerbFile } from "@/lib/paradigms/types";

/**
 * Bundled with the client chunk. The paradigms page reads these modules, so
 * the tables need no network after the page script has loaded.
 */
export const strongVerb = strongVerbFile as StrongVerbFile;
export const levelsFileData = levelsFile as LevelsFile;
export const placementFileData = placementFile as PlacementFile;
