import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": "/workspace/src" } });
const { areaOf, tallySavedPractice } = await jiti.import("/workspace/src/lib/use-report.ts");

test("pages land in the area a student would name", () => {
  assert.equal(areaOf("/game/week7")?.id, "week7");
  assert.equal(areaOf("/game/road")?.label, "Road exam");
  assert.equal(areaOf("/game/12/gloss")?.id, "game");
  assert.equal(areaOf("/listen/pet")?.id, "pet");
  assert.equal(areaOf("/admin") , null);
  assert.equal(areaOf("/admin/use"), null);
});

test("saved practice ranks what a student has done most", () => {
  const report = tallySavedPractice([
    {
      name: "Ava",
      sessions: 4,
      streak: 2,
      cards: {
        abraham: { hits: 3, misses: 1, reps: 2 },
        david: { hits: 1, misses: 0, reps: 1 },
      },
      game: {
        chapters: { "2": { stages: { recognize: { attempts: 2 } } } },
        lessons: { adj: { units: { "1": { attempts: 9 } } } },
        ultimateAttempts: 1,
      },
    },
    {
      name: "Ben",
      sessions: 1,
      streak: 0,
      cards: {},
      game: { syllables: { units: { "1": { attempts: 4 } } } },
    },
  ]);
  const adj = report.practice.find((row) => row.id === "track-adj");
  assert.ok(adj);
  assert.equal(adj.n, 9);
  assert.equal(adj.people, 1);
  assert.equal(report.practice[0].id, "track-adj");
  assert.equal(report.students[0].name, "Ava");
  assert.equal(report.students[0].answers, 5);
  assert.equal(report.students[0].words, 2);
  assert.equal(report.students[0].top, "Grammar · adjectives");
  assert.equal(report.students[1].top, "Syllables");
  const names = report.practice.find((row) => row.label.startsWith("Vocabulary · Names"));
  assert.equal(names?.n, 5);
  assert.equal(names?.people, 1);
});
