# Insomnia services and deployment

Local mode is functional without paid providers. It does not impersonate an external service: SQL uses a synthetic SQLite sandbox, company research uses fictional profiles, email goes to private outbox files, and SSO uses a loopback development identity provider. The assistant can run an actual local Ollama model.

## Run locally

1. Install Node.js 24.11+ and run `npm ci`.
2. Copy `.env.example` to `.env`. The current machine already has a local `.env`; preserve it.
3. Install [Ollama](https://docs.ollama.com/quickstart), run `ollama pull qwen2.5:1.5b`, and keep Ollama running. Set `OLLAMA_MODEL=qwen2.5:1.5b`. Removing that setting selects local evidence retrieval, which is explicitly not a language model.
4. Run `npm run dev` and open the printed URL, normally `http://127.0.0.1:5181/portal/#auth`.
5. Open **Integrations** to execute SQL, inspect company profiles, or ask the assistant. Results and provenance persist in the selected workspace. The small default model is for local experimentation; its generated statements need review against the displayed sources.

Synthetic SQL tables:

| Table | Columns | Data |
| --- | --- | --- |
| `sales` | `id`, `region`, `revenue`, `order_date` | Four fictional sales totaling 4,000; North 1,800, South 800, West 1,400 |
| `customers` | `id`, `name`, `region` | Two fictional customers |

Example: `SELECT region, SUM(revenue) AS revenue FROM sales GROUP BY region`.

The SQL sandbox executes in an isolated worker with an SQLite authorizer, a two-second deadline and a 100-row result limit. SQL cannot access the account database. Sandbox timing is never presented as IOMETE performance or automatically imported as benchmark evidence.

Fictional company profiles are in `server/integrations.mjs`: Northstar Bank, Meridian Manufacturing, Harbor Analytics, and Cedar Insurance. Unknown companies remain unknown. These are practice scenarios, not facts about real organizations.

## Password recovery and mail

Use **Forgot password?** on sign-in. Local development writes the message to `.data/mail/*.json`; open the newest matching message locally and follow its link. Messages are excluded from Git and cannot be fetched through the web server. This is local delivery, not Internet email. Do not share the mail directory.

Reset links expire after 30 minutes, are stored as hashes, work once, and revoke all existing sessions when used. Public responses do not disclose whether an account exists. An SMTP submission failure does not reveal account existence; check the configured SMTP service if no message arrives. There is no background delivery retry queue.

For real email, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. Production requires TLS. Provision the sender domain and its delivery records with the chosen SMTP provider. Examples of providers include an organization's SMTP relay and services offering SMTP submission; no provider account is created automatically. SMTP integration is tested against a local SMTP server; external mailbox delivery needs actual credentials and domain configuration.

## Shared workspaces

Every account retains a personal workspace. In **Team**, the owner can invite an email as an editor or viewer. Invitation links expire in 48 hours and must be accepted by the matching signed-in email account. Local invitation messages are in the same private outbox. The token can also be pasted into **Accept an invitation**.

| Access | Permissions |
| --- | --- |
| Owner | Read/write workspace, run integrations, invite members, change access, revoke invitations, remove members |
| Editor | Read/write evaluation data and run integrations; cannot manage access |
| Viewer | Read/export workspace and saved integration results; cannot mutate data or run integrations |

Switch workspaces in **Team**. Permissions are checked by the server on every request. Removing a member immediately removes shared access from their active sessions. Concurrent evaluation edits retain revision conflict protection; this is shared data with periodic refresh, not simultaneous collaborative text editing. The perspective selector remains a display preference.

## SSO

Development starts **Local development SSO** on loopback port 5182. Its generated demo credentials and client secret are in `.data/local-sso.json`, never in Git. It uses a real authorization code exchange, PKCE S256, state, nonce, expiring single-use authorization codes, JWKS and signed ID tokens. It is a test provider, not an enterprise identity system. Disable it with `INSOMNIA_LOCAL_SSO=false`.

For an enterprise provider such as [Keycloak](https://www.keycloak.org/securing-apps/oidc-layers), configure `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and optionally `OIDC_LABEL`. Register the exact callback `${INSOMNIA_ORIGIN}/api/auth/sso/callback` with scopes `openid email profile` and GET/query response mode. The provider must return a verified email in its ID token. The current client uses `client_secret_post`.

Existing password accounts must sign in and choose **Link organization SSO** in Settings before their provider identity is linked. An email match alone cannot take over an existing account. Sessions and selected-workspace permissions remain enforced after SSO.

## Live IOMETE SQL

The [official IOMETE SQLAlchemy driver](https://iomete.com/resources/user-guide/driver/iomete-sqlalchemy) uses Arrow Flight SQL. Install `requirements-iomete.txt` in a dedicated Python environment, point `INSOMNIA_PYTHON` to that interpreter, and set the secret `IOMETE_SQLALCHEMY_URL` using connection details from your compute:

```text
iomete://USER:ENCODED_TOKEN@HOST:443/spark_catalog/default?cluster=COMPUTE&data_plane=PLANE
```

URL-encode credentials. Use a SELECT-only service principal with appropriate data permissions. SQL screening is conservative validation, not a replacement for upstream authorization. Queries have a 20-second local process deadline and at most 100 returned rows. Terminating the client is not proof of remote query cancellation; check the cluster if a query times out. Recorded duration includes round-trip transport and does not establish result correctness. Raw results persist only in the selected workspace. No live IOMETE cluster is available on this machine, so end-to-end cluster execution is not claimed as verified.

## Live research and local AI

Configure `TAVILY_API_KEY` to use the [Tavily Search API](https://docs.tavily.com/documentation/api-reference/endpoint/search). Insomnia sends the entered company name and retains up to five source URLs and excerpts. Review them before transferring conclusions to an evaluation. Local fixtures are used only when local mode is enabled and no key is configured.

Ollama's [chat endpoint](https://docs.ollama.com/api/chat) receives the question, selected evaluation context, and retrieved documentation. `OLLAMA_URL` defaults to loopback. Changing it to another host sends that context there; use an approved deployment. Generation is bounded to 160 tokens; answers are short drafts and may be incomplete or wrong. The model has no tools and cannot execute SQL or change evaluation data. Provider errors never become fabricated answers or successful runs.

## Production preparation and verification

Run:

```text
npm run build
npm test
npm run check:screens
npm run check:production
npm run backup
```

The production smoke check starts an isolated server and database, checks frontend assets and PDF serving, session protection, private-path denial, restart persistence, and a real SQLite backup/restore. It does not touch the user's normal database. `npm run backup` makes an integrity-checked backup of the configured real database; retain these backups securely and copy them to a separate durable location.

`Dockerfile`, `compose.yaml`, and CI checks are included. Docker is not installed on this machine, so the image has not been built here. On the intended host, set `INSOMNIA_ORIGIN=https://your-domain`, `INSOMNIA_SECURE_COOKIE=true`, `INSOMNIA_LOCAL_SERVICES=false`, `INSOMNIA_LOCAL_SSO=false`, configure real providers and run `docker compose up --build -d`. Compose binds only to loopback; put an HTTPS reverse proxy in front of it. The container uses `/data` for persistent SQLite storage. Use a single application replica for this deployment design.

After deployment, run `npm run check:production -- https://your-domain.example` for read-only public HTTP checks. Then verify real mailbox delivery, enterprise SSO, cluster permissions, monitoring, backup restore, load capacity and operator ownership. No public host/domain was supplied, and no public deployment or external service signup has been performed. Provider accounts, network connectivity and external verification cannot be replaced by local fixture data.
