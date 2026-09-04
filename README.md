# HaDay · Hebraic Mentor

Biblical Hebrew vocabulary trainer for first-year students (BIBL 630).

- Game, study, and listen modes
- Tanakh follow-along: all 39 books, recorded Hebrew
- Each classmate creates an account; progress stays with that account

Class site today: [https://haday.vercel.app](https://haday.vercel.app)

## Publish on Azure

### 1. Web App (container)

On **Create Web App**:

| Field | Value |
|---|---|
| Name | `haday` (URL becomes `haday.azurewebsites.net`) |
| Publish | **Container** (not Code) |
| OS | Linux |
| Region | Same region as your existing compute / plan |
| Plan | Existing plan, or cheapest Linux B1 / F1 |
| Zone redundancy | Disabled |
| Managed Instance | Off |

Then **Next : Database**.

### 2. Database (Azure PostgreSQL)

Do not keep using Neon if you want everything on Azure.

| Field | Value |
|---|---|
| Engine | **Azure Database for PostgreSQL – Flexible Server** |
| Server name | `haday-pg` |
| PostgreSQL version | 16 |
| Compute | Burstable (B1ms / smallest) |
| Authentication | PostgreSQL admin login + password (save the password) |
| Connectivity | Public access + **Allow Azure services** |

Skip creating a second database engine (no MySQL / Cosmos). After the server exists, create a database named `haday` on it (or use the default `postgres` database).

App setting `DATABASE_URL` (one line, password URL-encoded if it has special characters):

```
postgresql://ADMIN:PASSWORD@haday-pg.postgres.database.azure.com:5432/haday?sslmode=require
```

The container applies the class schema on first boot. Existing Neon accounts do **not** copy over — classmates sign up again on the Azure URL unless you later dump Neon into this server.

### 3. After Create

Deployment Center → GitHub → **adeyholar/haday** → `main`.

| Name | Value |
|---|---|
| `DATABASE_URL` | Azure Postgres URL above |
| `BETTER_AUTH_URL` | `https://haday.azurewebsites.net` |
| `BETTER_AUTH_SECRET` | Long random string |
| `VITE_AUTH_ENABLED` | `true` |
| `WEBSITES_PORT` | `8080` |

Save and restart.

## Auto-deploy (Vercel)

Hobby is enough if you instead link [adeyholar/haday](https://github.com/adeyholar/haday) to the existing **haday** project.

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon or Azure Postgres URL |
| `BETTER_AUTH_URL` | `https://haday.vercel.app` |
| `BETTER_AUTH_SECRET` | existing secret |
