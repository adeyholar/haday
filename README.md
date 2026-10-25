# HaDay HebRabbAi Mentor

Biblical Hebrew vocabulary trainer for first-year students (BIBL 630).

Two study doors. The **Grammar Path** builds the language chapter by chapter. The **Scripture Path** teaches by reading the Tanakh, Levels A to E. A student chooses one. The stored ids stay `bbh` and `iibs`, and the addresses stay `/bbh` and `/iibs`.

- Study, game, and listen
- Tanakh follow-along: all 39 books, recorded Hebrew
- Each classmate creates an account; progress stays with that account

**Class site:** [https://hebrewmentor.haday.app](https://hebrewmentor.haday.app)

The previous address ([https://hadayhebbraimentor.jcdisn.com](https://hadayhebbraimentor.jcdisn.com)) redirects here. Keep that name and its certificate for at least a year.

The old Vercel URL ([https://haday.vercel.app](https://haday.vercel.app)) is shut down. It only shows a signpost page that links to the class site.

Azure is the host behind that name. A browser that opens the Azure address is sent to the class site. The health check at `/api/health` stays on the Azure host.

**Documentation (source of truth):** [Change Log](https://app.notion.com/p/3f6058f607b18180a6eeebbcc2180697) and [Developer Handbook](https://app.notion.com/p/3f6058f607b18144a482f8173456df2a) on Notion.  
**Code that runs:** this GitHub repo, branch **`main`**. A push to `main` builds the Docker image and deploys Azure Web App **haday**.

Older class notes remain in [CHANGELOG.md](CHANGELOG.md) as an archive. Do not add new entries there.

The same day a change merges, write it in every place a reader would trust:

1. The [Change Log](https://app.notion.com/p/3f6058f607b18180a6eeebbcc2180697) — what changed, why, the pull request, and what must not be reversed.
2. The [Developer Handbook](https://app.notion.com/p/3f6058f607b18144a482f8173456df2a) — the section that would now be false.
3. [docs/ASBUILT.md](docs/ASBUILT.md) — the section that describes that running behavior, when it has one.
4. The in-app Guide, only if a student would follow the old words.


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
| `BETTER_AUTH_URL` | `https://hebrewmentor.haday.app` |
| `PUBLIC_APP_URL` | Same as `BETTER_AUTH_URL` |
| `BETTER_AUTH_SECRET` | Long random string |
| `VITE_AUTH_ENABLED` | `true` |
| `GOOGLE_CLIENT_ID` | Google OAuth client id. Both this and the secret must be set or the Google button stays off. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret. Names only here — put the values in Azure application settings, never in git. |
| `WEBSITES_PORT` | `8080` |
| `HADAY_ADMIN_EMAILS` | Owner emails, comma-separated (Class roster). Also hardcoded for Crown. |
| `ANTHROPIC_API_KEY` | Claude API key for Ask HaDay. Stays on the server. About $140 a month; the app stops near the end of that credit. |
| `ANTHROPIC_WORKSPACE_ID` | Required when the key is not locked to one workspace. Copy the `wrkspc_…` id from Claude Console → Settings → Workspaces. |
| `ANTHROPIC_MODEL` | Optional. Default `claude-haiku-5-5`. Set `claude-sonnet-5-5` if answers need to be stronger. |

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
3. Application settings: set `BETTER_AUTH_URL` and `PUBLIC_APP_URL` to `https://hebrewmentor.haday.app`
4. Save and restart

Until the certificate and `BETTER_AUTH_URL` are set, the pretty URL can load the site but sign-in will fail.

## What is in this repo

Full class app: study, game, listen, Tanakh, roster, rewards, Azure Docker, and GitHub Actions (`.github/workflows/main_haday.yml`).
