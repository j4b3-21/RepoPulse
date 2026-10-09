# Contributing to RepoPulse

Thanks for contributing. This project favors small, reviewable changes with tests.

## Development setup

Requirements:

- Node.js 20+ (22 recommended)
- npm 10+

```bash
cp .env.example .env
npm install
npm run build -w @repopulse/shared
npm run dev
```

- API: `http://localhost:3000`
- Web (Vite proxy): `http://localhost:5173`

## Checks before opening a PR

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

For Docker changes, also verify:

```bash
cp -n .env.example .env
docker compose up -d --build
curl -s http://localhost:8080/healthz
curl -s http://localhost:8080/api/v1/health/live
```

## Guidelines

- Keep the scoring engine pure and unit-tested in `@repopulse/shared`.
- Mock GitHub in tests; do not call the live API in CI.
- Do not add databases, Redis, AI providers, or generic URL proxies for the MVP scope.
- Do not log secrets or authorization headers.
- Prefer clear evidence labels (`fact` vs `heuristic`) over marketing language.

## Commit style

Use concise commit messages that explain why the change exists.
