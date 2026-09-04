/**
 * Postgres URL for Neon, Azure Flexible Server, or any other host.
 *
 * Azure's Web App + Database wizard injects AZURE_POSTGRESQL_* instead of
 * DATABASE_URL. Build a URL the `pg` driver accepts in that case.
 */
export function resolveDatabaseUrl(): string | undefined {
  const direct =
    typeof process !== "undefined" ? process.env.DATABASE_URL?.trim() : undefined;
  if (direct) return direct;

  const host =
    typeof process !== "undefined"
      ? process.env.AZURE_POSTGRESQL_HOST?.trim()
      : undefined;
  if (!host) return undefined;

  const user = process.env.AZURE_POSTGRESQL_USER?.trim() ?? "postgres";
  const password = process.env.AZURE_POSTGRESQL_PASSWORD ?? "";
  const database = process.env.AZURE_POSTGRESQL_DATABASE?.trim() || "postgres";
  const port = process.env.AZURE_POSTGRESQL_PORT?.trim() || "5432";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
}
