/**
 * Owner pre-merge check. Counts account rows whose providerId is
 * grok-google or grok-x.
 *
 * Reads DATABASE_URL from the environment. Does not print the URL.
 * Prints emails only with --emails (for the Chairman, not for a PR body).
 *
 * Exit 0 when the count was read (including zero). Exit 2 when there is no
 * database to ask. Does not change Azure settings.
 */
import pg from "pg";

const showEmails = process.argv.includes("--emails");
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.log("count: unknown");
  console.log("reason: DATABASE_URL is not set. Azure was not queried.");
  process.exit(2);
}

const pool = new pg.Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
try {
  const result = await pool.query(
    `select a."providerId" as provider_id, a."userId" as user_id, u.name, u.email
     from account a
     join "user" u on u.id = a."userId"
     where a."providerId" in ('grok-google', 'grok-x')
     order by a."providerId", u."createdAt"`,
  );
  console.log(`count: ${result.rowCount ?? result.rows.length}`);
  for (const row of result.rows) {
    const who = showEmails ? `${row.name} <${row.email}>` : row.name;
    console.log(`${row.provider_id}\t${row.user_id}\t${who}`);
  }
} finally {
  await pool.end();
}
