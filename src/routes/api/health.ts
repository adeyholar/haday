import { createFileRoute } from "@tanstack/react-router";
import { dbSource, getSql } from "@/lib/db";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        let db = "down";
        try {
          const sql = await getSql();
          await sql`select 1 as ok`;
          db = "up";
        } catch (err) {
          const raw = err instanceof Error ? err.message : "error";
          db = raw.replace(/:\/\/[^@\s]+@/g, "://***@").slice(0, 160);
        }
        return Response.json({ ok: db === "up", db, source: dbSource });
      },
    },
  },
});
