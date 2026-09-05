#!/usr/bin/env node
/**
 * One-time copy of class data from a previous Postgres into this host.
 *
 * Set NEON_DATABASE_URL (or any source Postgres URL) on the Web App, restart,
 * then remove it after a successful boot.
 *
 * Session cookies stay on the old origin — classmates still click Sign in
 * once on this host, but the same account and progress are restored.
 */
import pg from "pg";

const neonUrl = process.env.NEON_DATABASE_URL?.trim();
const azureUrl =
  process.env.DATABASE_URL?.trim() ||
  (process.env.AZURE_POSTGRESQL_HOST
    ? `postgresql://${encodeURIComponent(process.env.AZURE_POSTGRESQL_USER || "postgres")}:${encodeURIComponent(process.env.AZURE_POSTGRESQL_PASSWORD || "")}@${process.env.AZURE_POSTGRESQL_HOST}:${process.env.AZURE_POSTGRESQL_PORT || "5432"}/${process.env.AZURE_POSTGRESQL_DATABASE || "postgres"}?sslmode=require`
    : undefined);

const TABLES = [
  '"user"',
  '"session"',
  '"account"',
  '"verification"',
  "study_progress",
  "site_visitors",
  "hand_style",
  "feature_ideas",
  "_migrations",
];

function pool(url) {
  return new pg.Pool({
    connectionString: url,
    max: 1,
    ssl: { rejectUnauthorized: false },
  });
}

async function copyTable(from, to, table) {
  const { rows } = await from.query(`SELECT * FROM ${table}`);
  if (rows.length === 0) {
    console.log(`[copy-neon] ${table}: 0 rows`);
    return 0;
  }
  const cols = Object.keys(rows[0]);
  const quoted = cols.map((c) => `"${c.replaceAll('"', "")}"`).join(", ");
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  const sql = `INSERT INTO ${table} (${quoted}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
  let inserted = 0;
  for (const row of rows) {
    const result = await to.query(
      sql,
      cols.map((c) => row[c]),
    );
    inserted += result.rowCount ?? 0;
  }
  console.log(`[copy-neon] ${table}: ${rows.length} read, ${inserted} inserted`);
  return inserted;
}

async function main() {
  if (!neonUrl) {
    console.log("[copy-neon] NEON_DATABASE_URL not set — skip.");
    return;
  }
  if (!azureUrl) {
    console.log("[copy-neon] Azure Postgres not configured — skip.");
    return;
  }
  if (neonUrl === azureUrl) {
    console.log("[copy-neon] source and target are the same — skip.");
    return;
  }

  const from = pool(neonUrl);
  const to = pool(azureUrl);
  const fromClient = await from.connect();
  const toClient = await to.connect();
  try {
    await toClient.query(`
      CREATE TABLE IF NOT EXISTS _data_copied_from_neon (
        id boolean PRIMARY KEY DEFAULT true,
        copied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const done = await toClient.query("SELECT 1 FROM _data_copied_from_neon LIMIT 1");
    if (done.rowCount) {
      console.log("[copy-neon] already copied — skip.");
      return;
    }

    for (const table of TABLES) {
      try {
        await copyTable(fromClient, toClient, table);
      } catch (err) {
        console.error(`[copy-neon] ${table} failed:`, err instanceof Error ? err.message : err);
      }
    }

    await toClient.query("INSERT INTO _data_copied_from_neon (id) VALUES (true) ON CONFLICT DO NOTHING");
    console.log("[copy-neon] done. Remove NEON_DATABASE_URL from the Web App.");
  } finally {
    fromClient.release();
    toClient.release();
    await from.end();
    await to.end();
  }
}

main().catch((err) => {
  console.error("[copy-neon] failed:", err instanceof Error ? err.message : err);
  process.exit(0);
});
