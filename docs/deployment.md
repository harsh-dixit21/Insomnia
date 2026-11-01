# Hosting Insomnia on Vercel with a persistent backend

## Current Vercel-native authentication

The production project now connects to Neon PostgreSQL on its Free plan. When `DATABASE_URL` is present and `INSOMNIA_BACKEND_URL` is absent, the gateway uses `server/cloud.mjs` directly on Vercel. Signup, scrypt password verification, hashed server sessions, logout, workspace loading, workspace edits, optimistic concurrency, and dashboard insights use the cloud database. Cookies are Secure and HttpOnly; mutations require origin, application, and CSRF checks. Login attempts are limited in the database.

Local SQLite accounts are not automatically copied to this database. Register a cloud account separately. The remaining tool, team, recovery, export, and external integration routes have not been migrated to this cloud handler and return an explicit unsupported-feature error. The existing SQLite backend still supports those routes locally. The separate backend configuration below is optional and is not used by the current production authentication deployment.

The Vercel site serves the landing page, portal, and updated 14-page PDF at `/docs/insomnia-documentation.pdf`. Its `/api/*` gateway forwards requests to a separate Node backend. Accounts, sessions, team membership, and evaluations stay in that backend's persistent SQLite database. The gateway preserves cookies, CSRF headers, workspace scope, downloads, and SSO redirects.

## Backend setup

The repository includes `render.yaml` for a Docker web service with a 1 GB persistent disk mounted at `/data`. **This uses paid Render compute and disk storage.** Review Render's displayed charges before creating it. No Render service is purchased by committing this file.

1. Open https://dashboard.render.com/select-repo?type=blueprint and connect `harsh-dixit21/Insomnia`.
2. Select the blueprint and review its plan. Set `INSOMNIA_ORIGIN` to the exact production Vercel origin, without a trailing slash (not the Render URL).
3. Deploy and wait for `/api/health` on the Render URL to return JSON with `status: "ok"`. The container listens on port 5181. Keep one instance; SQLite is on its attached disk.
4. In the Vercel project's environment settings, add `INSOMNIA_BACKEND_URL=https://YOUR-SERVICE.onrender.com` for Production, then redeploy. It must be an HTTPS origin with no path, credentials, query, or fragment. Do not expose this through a `VITE_` variable.
5. Test signup, logout, login, workspace edits, exports, and persistence after a backend restart. Test from the production domain: preview domains are deliberately rejected by the backend's origin check.

An existing VPS can instead run the supplied Docker image with `/data` mounted on a durable volume and a TLS reverse proxy. Set the same production origin and secure cookie variables. Keep database backups separately and test restoring them.

## Provider setup

The core evaluation tools and workspace backend do not require paid AI APIs. Production disables loopback-only demo services. To enable each external integration, configure it **on the backend**, never in frontend code:

| Integration | Backend variables | Verification |
| --- | --- | --- |
| Ollama | `OLLAMA_URL`, `OLLAMA_MODEL` | Use a private, reachable Ollama server with the model installed; your desktop's `localhost:11434` is not reachable from Render. Run an evidence-grounded draft. Do not expose unauthenticated Ollama publicly. |
| Live IOMETE SQL | `IOMETE_SQLALCHEMY_URL` | Run a read-only query against the actual cluster. The Docker image includes the Python driver. |
| Company research | `TAVILY_API_KEY` | Run research and inspect the returned source URLs. |
| Password reset and invitations | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Deliver a real email and follow its one-time link. |
| Organization SSO | `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_LABEL` | Register `https://YOUR-VERCEL-DOMAIN/api/auth/sso/callback`; verify login with your organization. |

Missing providers stay explicitly unavailable or use the labeled evidence fallback where supported. They are not evidence of a tested live integration. A configured model name alone is not proof that its endpoint is reachable.

## Release checks

Run `npm test`, `npm run build`, `npm run check:screens`, and `npm run check:production` locally. Run `node --test tests/gateway.test.mjs` for gateway behavior. After deployment check `/`, `/portal/`, the PDF, and `/api/health`. Verify the public PDF's bytes match `public/docs/insomnia-documentation.pdf`.

Without `INSOMNIA_BACKEND_URL`, the public gateway returns a clear JSON 503 error instead of HTML or a simulated successful login. Deploying the frontend alone does not complete the backend release.
