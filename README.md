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

## Quick start (Docker)

```bash
git clone <your-fork-or-remote-url>
cd web-app   # or your clone directory name
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

## Updating the deployment

```bash
git pull
docker compose up -d --build
```

## Troubleshooting

| Symptom | What to check |
|---|---|
| `repository_not_found` | Repo is private, renamed, or mistyped |
| `github_rate_limited` | Wait or set `GITHUB_TOKEN` |
| UI loads but analyze fails | `docker compose logs api` |
| CORS errors in local API calls | Align `CORS_ORIGIN` with the browser origin |
| Compose unhealthy | `docker compose ps` and service logs |

## Rate-limit considerations

- Prefer caching (`CACHE_TTL_SECONDS`) for repeated analyses.
- Avoid hammering Analyze in demos without a token.
- Even conditional/`304` responses consume GitHub quota.

## Production deployment and HTTPS

Recommended pattern:

1. Run Compose on a private host/network.
2. Terminate TLS at an edge reverse proxy (Caddy, Traefik, cloud LB, etc.).
3. Proxy `https://repopulse.example.com` → `http://127.0.0.1:8080`.
4. Set `CORS_ORIGIN=https://repopulse.example.com`.
5. Keep `GITHUB_TOKEN` in a secret store / host env, not in git.

Baseline security does not replace patching, access control, or threat modeling for your environment. See [SECURITY.md](SECURITY.md).

## Prebuilt container images

A GitHub Actions workflow (`.github/workflows/publish-images.yml`) can publish versioned images to GitHub Container Registry after repository permissions are configured.

**Do not use unpublished image pull commands.** Prefer building from source with `docker compose up -d --build` until you have published and verified images for your fork.

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
