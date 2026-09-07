# HaDay · Hebraic Mentor

Biblical Hebrew vocabulary trainer for first-year students (BIBL 630).

- Study, game, and listen
- Tanakh follow-along: all 39 books, recorded Hebrew
- Each classmate creates an account; progress stays with that account

**Class site:** [https://hadayhebbraimentor.jcdisn.com](https://hadayhebbraimentor.jcdisn.com)

The old Vercel URL ([https://haday.vercel.app](https://haday.vercel.app)) is shut down. It only shows a signpost page that links to the class site.

Azure fallback: [https://haday-bud9cwczfeakh8ce.westus3-01.azurewebsites.net](https://haday-bud9cwczfeakh8ce.westus3-01.azurewebsites.net)

**As-built (what runs today):** [docs/ASBUILT.md](docs/ASBUILT.md)  
**Each upgrade:** [CHANGELOG.md](CHANGELOG.md)

Source of truth is this GitHub repo, branch **`main`**. A push to `main` builds the Docker image and deploys Azure Web App **haday**. The same Docker image (or `npm run build` + `npm start`) runs on any Node 22 host.


## Always ship to `main`

Finished work goes on **`main`**. Do not leave class features only in a preview sandbox.

## Run anywhere (Docker)

```bash
cp .env.example .env   # fill DATABASE_URL, BETTER_AUTH_URL, BETTER_AUTH_SECRET
docker compose up --build
```

Without Docker:

```bash
cp .env.example .env
npm ci
npm run build          # Node server in .output/
npm start              # HOST=0.0.0.0 PORT=8080
```

`BETTER_AUTH_URL` must be the public URL classmates actually open.

## Publish on Azure

### 1. Web App (container)

On **Create Web App**:

| Field | Value |
|---|---|
| Name | `haday` |
| Publish | **Container** (not Code) |
| OS | Linux |
| Region | Same region as the plan |
| Plan | Existing plan, or cheapest Linux B1 / F1 |
| Zone redundancy | Disabled |
| Managed Instance | Off |

Then **Next : Database**.

### 2. Database (Azure PostgreSQL)

| Field | Value |
|---|---|
| Engine | **Azure Database for PostgreSQL – Flexible Server** |
| Server name | `haday-pg` |
| PostgreSQL version | 16 |
| Compute | Burstable (B1ms / smallest) |
| Authentication | PostgreSQL admin login + password (save the password) |
| Connectivity | Public access + **Allow Azure services** |

After the server exists, create a database named `haday`. App setting `DATABASE_URL` (password URL-encoded if it has special characters):

```
postgresql://ADMIN:PASSWORD@haday-pg.postgres.database.azure.com:5432/haday?sslmode=require
```

The container applies the class schema on first boot.

### 3. Application settings

Deployment Center → GitHub → **adeyholar/haday** → `main`.

| Name | Value |
|---|---|
| `DATABASE_URL` | Azure Postgres URL above |
| `BETTER_AUTH_URL` | `https://hadayhebbraimentor.jcdisn.com` (or the Azure URL until DNS is live) |
| `PUBLIC_APP_URL` | Same as `BETTER_AUTH_URL` |
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

## Custom domain (CNAME → Azure)

Point a hostname you own at the Azure app.

### DNS at jcdisn.com

| Type | Host | Value |
|---|---|---|
| CNAME | `HadayHebbraimentor` | `haday-bud9cwczfeakh8ce.westus3-01.azurewebsites.net` |
| TXT | `asuid.HadayHebbraimentor` | (copy from Azure → Custom domains) |

Wait 5–30 minutes. Keep the record DNS-only (not proxied) until Azure validates it.

### Azure

1. Web App → **Custom domains** → Add `hadayhebbraimentor.jcdisn.com`
2. **TLS/SSL** → Create **App Service managed certificate** (free) and bind it
3. Application settings: set `BETTER_AUTH_URL` and `PUBLIC_APP_URL` to `https://hadayhebbraimentor.jcdisn.com`
4. Save and restart

Until the certificate and `BETTER_AUTH_URL` are set, the pretty URL can load the site but sign-in will fail.

## What is in this repo

Full class app: study, game, listen, Tanakh, roster, rewards, Azure Docker, and GitHub Actions (`.github/workflows/main_haday.yml`).
