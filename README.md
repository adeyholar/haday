# HaDay · Hebraic Mentor

Biblical Hebrew vocabulary trainer for first-year students (BIBL 630).

- Game, study, and listen modes
- Tanakh follow-along: all 39 books, recorded Hebrew
- Each classmate creates an account; progress stays with that account

Class site today: [https://haday.vercel.app](https://haday.vercel.app)

Custom class URL (in progress): [https://hadayhebbraimentor.jcdisn.com](https://hadayhebbraimentor.jcdisn.com)

## Custom domain (CNAME → Azure)

Point a hostname you own at the Azure app. You cannot shorten `*.azurewebsites.net` itself.

### DNS at jcdisn.com

| Type | Host | Value |
|---|---|---|
| CNAME | `HadayHebbraimentor` | `haday-bud9cwczfeakh8ce.azurewebsites.net` |
| TXT | `asuid.HadayHebbraimentor` | (copy from Azure → Custom domains) |

Wait 5–30 minutes. Keep the record DNS-only (not proxied) until Azure validates it.

### Azure

1. Web App → **Custom domains** → Add `hadayhebbraimentor.jcdisn.com`
2. **TLS/SSL** → Create **App Service managed certificate** (free) and bind it
3. Application settings: set `BETTER_AUTH_URL` to `https://hadayhebbraimentor.jcdisn.com`
4. Save and restart

Until the certificate and `BETTER_AUTH_URL` are set, the pretty URL can load the site but sign-in will fail. Keep the long Azure URL working during the switch — both origins are already allowed.

## Always ship to `main`

Finished work goes on **`main`**. A push to `main` builds the container and deploys Azure Web App **haday**. Do not leave class features only in a preview sandbox.

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
| `HADAY_ADMIN_EMAILS` | Owner emails, comma-separated (Class roster). Also hardcoded for Crown. |

Optional — password reset emails (first match wins). With a mailer set, Forgot password and **Email reset** on the roster send the hour-long link to the classmate. Copy is only a backup if the inbox is empty.

| Name | Value |
|---|---|
| `RESEND_API_KEY` | Resend API key (preferred) |
| `SENDGRID_API_KEY` | SendGrid API key |
| `SMTP_USER` + `SMTP_PASS` | Gmail / Yahoo / Outlook app password |
| `SMTP_HOST` | Only if the host is not guessed from the user (Gmail/Yahoo/Outlook) |
| `MAIL_FROM` | `HaDay <noreply@your-domain>` (verified sender) |

Save and restart.

## Auto-deploy (Vercel)

Hobby is enough if you instead link [adeyholar/haday](https://github.com/adeyholar/haday) to the existing **haday** project.

| Name | Value |
|---|---|
| `DATABASE_URL` | Neon or Azure Postgres URL |
| `BETTER_AUTH_URL` | `https://haday.vercel.app` |
| `BETTER_AUTH_SECRET` | existing secret |
