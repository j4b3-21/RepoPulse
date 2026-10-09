# RepoPulse

Self-hostable **GitHub Repository Health Analyzer**. Paste a public repository URL, retrieve observable GitHub metadata, compute a transparent health score, and get prioritized engineering recommendations.

RepoPulse is designed for local and self-hosted deployments with Docker Compose. Public repository analysis works **without** a GitHub token.

> **Do not commit populated `.env` files.** Copy `.env.example` to `.env` instead.

## Screenshots

_Add screenshots here after running the UI locally or via Docker:_

1. Search hero with repository URL input
2. Health report with score ring, category breakdown, and recommendations

## Features

- Public GitHub repository analysis via official REST API
- Deterministic scoring engine (Documentation, Testing, Maintenance, Issue management)
- Evidence labeled as **fact** or **heuristic**, with unavailable categories excluded
- Prioritized recommendations generated only from observations
- Versioned HTTP API (`/api/v1`)
- In-memory response cache with a replaceable cache interface
- Production Docker Compose stack (Nginx + Node API)
- Automated tests and GitHub Actions CI

## Architecture

```
Browser → Nginx (:8080)
            ├─ static SPA (apps/web)
            └─ /api/* → Express API (apps/api, internal)
                           ├─ cache (in-memory)
                           ├─ GitHub REST client
                           └─ @repopulse/shared scoring engine
```

Monorepo layout:

| Path | Role |
|---|---|
| `apps/web` | React + Vite + Tailwind dashboard |
| `apps/api` | Express TypeScript API |
| `packages/shared` | Zod schemas, URL parsing, scoring |
| `infra/nginx` | Reverse proxy / static hosting |

## Requirements

- Docker + Docker Compose **or**
- Node.js 20+ and npm 10+ for local development

## Deployment

RepoPulse is a **full-stack** app (Nginx + Express API). The recommended production path is **Docker Compose**. GitHub Pages alone cannot host this project because Pages serves static files only and cannot run the Node API that talks to GitHub.

### Deploy with Docker Compose (recommended)

Works on a laptop, VPS, or any host with Docker Engine + Compose v2.

```bash
git clone https://github.com/j4b3-21/RepoPulse.git
cd RepoPulse
cp .env.example .env
# Optional: edit .env (CORS_ORIGIN, GITHUB_TOKEN, rate limits, cache)
docker compose up -d --build
```

Open [http://localhost:8080](http://localhost:8080) on the host (or `http://<server-ip>:8080` on a VPS).

What Compose starts:

| Service | Role | Published ports |
|---|---|---|
| `web` | Nginx: static UI + reverse proxy for `/api/` | `8080` → container `8080` |
| `api` | Express API (GitHub client + scoring) | none (internal Docker network only) |

Verify after deploy:

```bash
docker compose ps
curl -s http://localhost:8080/healthz
curl -s http://localhost:8080/api/v1/health/live
curl -s http://localhost:8080/api/v1/health/ready
```

Useful Compose commands:

```bash
docker compose logs -f          # follow logs
docker compose logs api --tail 100
docker compose restart
docker compose down             # stop
docker compose down -v          # stop (no named volumes in MVP)
```

Update an existing deploy:

```bash
git pull
docker compose up -d --build
```

### Production deploy behind HTTPS

Do **not** expose the API container port publicly. Keep only Nginx on `:8080` (or bind it to localhost) and terminate TLS at the edge.

1. Deploy Compose on the server as above.
2. Point your DNS `A`/`AAAA` record at the server.
3. Put Caddy, Traefik, nginx, or a cloud load balancer in front.
4. Proxy `https://repopulse.example.com` → `http://127.0.0.1:8080`.
5. Set in `.env`:
   - `CORS_ORIGIN=https://repopulse.example.com`
   - Optional `GITHUB_TOKEN=...` for higher GitHub API quota
6. Restart: `docker compose up -d`.

Example Caddyfile fragment:

```caddy
repopulse.example.com {
  reverse_proxy 127.0.0.1:8080
}
```

Example nginx edge fragment:

```nginx
server {
  listen 443 ssl http2;
  server_name repopulse.example.com;
  # ssl_certificate /path/fullchain.pem;
  # ssl_certificate_key /path/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Security checklist for production:

- Keep `.env` off git and readable only by the deploy user.
- Never put `GITHUB_TOKEN` in the frontend or image layers.
- Prefer binding host port `8080` to `127.0.0.1:8080` if only the edge proxy should reach it (edit `ports` in `docker-compose.yml` to `"127.0.0.1:8080:8080"`).
- Review [SECURITY.md](SECURITY.md).

### Deploy on a cloud VM (DigitalOcean, Vultr, AWS EC2, etc.)

1. Create a small Linux VM (1 vCPU / 1 GB RAM is enough for light demo traffic).
2. Install Docker Engine and the Compose plugin.
3. Clone the repo, copy `.env.example` → `.env`, set `CORS_ORIGIN` to your public URL.
4. Run `docker compose up -d --build`.
5. Open firewall for `80`/`443` (edge proxy) or `8080` for a quick demo.
6. Add HTTPS as in the previous section before sharing publicly.

### Why not GitHub Pages?

[GitHub Pages](https://pages.github.com/) hosts **static** sites. RepoPulse’s analyze flow requires the Express service under `/api/v1` (server-side GitHub calls, caching, rate limiting, optional token). Pages cannot run that process.

Use Docker Compose (or any Node + reverse-proxy host) for a working deployment. A future static-only demo mode is not part of the current MVP.

### Prebuilt container images (optional)

Workflow [`.github/workflows/publish-images.yml`](.github/workflows/publish-images.yml) can publish to GitHub Container Registry (`ghcr.io`) after you enable Packages permissions and run the workflow.

Until images are published and verified for your fork, deploy by building from source:

```bash
docker compose up -d --build
```

Do not advertise or rely on unpublished `docker pull` tags.

## Quick start (Docker)

Same as [Deploy with Docker Compose](#deploy-with-docker-compose-recommended):

```bash
git clone https://github.com/j4b3-21/RepoPulse.git
cd RepoPulse
cp .env.example .env
docker compose up -d --build
```

Open [http://localhost:8080](http://localhost:8080).

Verify health:

```bash
curl -s http://localhost:8080/healthz
curl -s http://localhost:8080/api/v1/health/live
curl -s http://localhost:8080/api/v1/health/ready
```

Stop:

```bash
docker compose down
```

## Local development

```bash
cp .env.example .env
npm install
npm run build -w @repopulse/shared
npm run dev
```

- Web: [http://localhost:5173](http://localhost:5173) (proxies `/api` → API)
- API: [http://localhost:3000](http://localhost:3000)

Useful scripts:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `production` (compose) | Runtime mode |
| `PORT` | `3000` | API listen port (internal) |
| `CORS_ORIGIN` | `http://localhost:8080` | Allowed browser origin(s), comma-separated |
| `GITHUB_TOKEN` | _(unset)_ | Optional server-side token for higher GitHub quota |
| `GITHUB_API_BASE_URL` | `https://api.github.com` | GitHub API base URL |
| `GITHUB_REQUEST_TIMEOUT_MS` | `8000` | Outbound request timeout |
| `CACHE_TTL_SECONDS` | `300` | Analyze response cache TTL |
| `CACHE_MAX_ENTRIES` | `100` | Max in-memory cache entries |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Analyze rate-limit window |
| `RATE_LIMIT_MAX` | `30` | Max analyze requests per window per IP |
| `LOG_LEVEL` | `info` | `debug` \| `info` \| `warn` \| `error` |

### Optional GitHub token

Unauthenticated GitHub REST access is limited (commonly **60 requests/hour** per IP). Each analysis uses several API calls.

To raise quota for a self-hosted deployment:

1. Create a fine-grained or classic personal access token with public repository read access.
2. Set `GITHUB_TOKEN` in `.env` on the **server/API** only.
3. Restart Compose: `docker compose up -d`.

Never expose the token to the frontend, commit it, or bake it into images.

## API documentation

Base path: `/api/v1`

### `POST /api/v1/analyze`

Request:

```json
{ "url": "https://github.com/facebook/react" }
```

Success (`200`): `HealthReport` JSON including `overview`, `overallScore`, `categories`, `recommendations`, `analyzedAt`.

Error (`4xx`/`5xx`):

```json
{ "error": { "code": "repository_not_found", "message": "..." } }
```

Common codes: `invalid_request`, `invalid_url`, `unsupported_host`, `invalid_path`, `repository_not_found`, `github_rate_limited`, `github_timeout`, `github_network_error`, `rate_limited`.

### `GET /api/v1/health/live`

Liveness probe. `{ "status": "ok" }`

### `GET /api/v1/health/ready`

Readiness probe. `{ "status": "ready", "checks": { ... } }`

## Scoring methodology

Initial weights (configurable product heuristics, **not** industry standards):

| Category | Weight | Signals |
|---|---|---|
| Documentation | 25% | README presence/length/setup keywords |
| Testing signals | 25% | Root test dirs/configs (metadata only) |
| Maintenance | 25% | Age of `pushed_at` |
| Issue management | 25% | Open issues sample excluding PRs, labels, staleness |

Rules:

- Categories that cannot be assessed are **unavailable**, not scored as zero.
- Overall score renormalizes weights across scored categories only.
- Evidence distinguishes observed **facts** from **heuristics**.
- Recommendations are emitted only from actual findings.

## Testing

```bash
npm test
```

Tests are deterministic and mock GitHub. They cover URL parsing, scoring edge cases, API validation/errors, health endpoints, and essential UI states.

## Troubleshooting

| Symptom | What to check |
|---|---|
| `repository_not_found` | Repo is private, renamed, or mistyped |
| `github_rate_limited` | Wait or set `GITHUB_TOKEN` |
| UI loads but analyze fails | `docker compose logs api` |
| CORS errors in local API calls | Align `CORS_ORIGIN` with the browser origin |
| Compose unhealthy | `docker compose ps` and service logs |
| Port 8080 already in use | Change the host mapping in `docker-compose.yml` or stop the other process |

## Rate-limit considerations

- Prefer caching (`CACHE_TTL_SECONDS`) for repeated analyses.
- Avoid hammering Analyze in demos without a token.
- Even conditional/`304` responses consume GitHub quota.
- See [Deployment](#deployment) for configuring an optional server-side `GITHUB_TOKEN`.

## Known limitations

- Public repositories only (no OAuth / private-repo support in MVP)
- Metadata and selected file heuristics — not full source analysis
- In-memory cache is per-container (not shared across replicas)
- Issue metrics use a bounded open-issue sample
- Unauthenticated GitHub quota is low for busy demos

## License

MIT — see [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
