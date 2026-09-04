/**
 * Postgres URL for Neon, Azure Flexible Server, or any other host.
 *
 * Azure's Web App + Database wizard may inject:
 * - DATABASE_URL
 * - AZURE_POSTGRESQL_HOST + USER + PASSWORD + DATABASE
 * - AZURE_POSTGRESQL_CONNECTIONSTRING (ADO.NET)
 * - POSTGRESQLCONNSTR_* (App Service connection-string slot)
 */
function firstEnvByPrefix(prefix: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith(prefix)) continue;
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

function env(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  const value = process.env[name]?.trim();
  return value || undefined;
}

function fromAzureSplit(): string | undefined {
  const host = env("AZURE_POSTGRESQL_HOST");
  if (!host) return undefined;
  const user = env("AZURE_POSTGRESQL_USER") ?? "postgres";
  const password = process.env.AZURE_POSTGRESQL_PASSWORD ?? "";
  const database = env("AZURE_POSTGRESQL_DATABASE") || "postgres";
  const port = env("AZURE_POSTGRESQL_PORT") || "5432";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
}

function fromAdoNet(raw: string): string | undefined {
  const parts: Record<string, string> = {};
  for (const chunk of raw.split(";")) {
    const idx = chunk.indexOf("=");
    if (idx <= 0) continue;
    const key = chunk.slice(0, idx).trim().toLowerCase();
    const value = chunk.slice(idx + 1).trim();
    if (key) parts[key] = value;
  }
  const host = parts.server || parts.host || parts["data source"];
  if (!host) return undefined;
  const user = parts["user id"] || parts.userid || parts.user || parts.username || "postgres";
  const password = parts.password || parts.pwd || "";
  const database = parts.database || parts["initial catalog"] || "postgres";
  const port = parts.port || "5432";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
}

function withSsl(url: string): string {
  if (/sslmode=/i.test(url)) return url;
  return url.includes("?") ? `${url}&sslmode=require` : `${url}?sslmode=require`;
}

export function resolveDatabaseUrl(): string | undefined {
  const direct = env("DATABASE_URL");
  if (direct) return withSsl(direct);

  const conn =
    env("AZURE_POSTGRESQL_CONNECTIONSTRING") ||
    firstEnvByPrefix("POSTGRESQLCONNSTR_") ||
    firstEnvByPrefix("CUSTOMCONNSTR_");
  if (conn) {
    if (/^postgres(ql)?:\/\//i.test(conn)) return withSsl(conn);
    const ado = fromAdoNet(conn);
    if (ado) return ado;
  }

  return fromAzureSplit();
}

export function pgPoolOptions(connectionString: string): {
  connectionString: string;
  ssl: { rejectUnauthorized: false };
  max: number;
  connectionTimeoutMillis: number;
} {
  return {
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 8000,
  };
}
