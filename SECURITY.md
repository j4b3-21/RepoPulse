# Security Policy

## Supported versions

Security fixes are accepted against the latest `main` branch of RepoPulse.

## Reporting a vulnerability

Please report security issues privately to the repository maintainers (GitHub Security Advisories preferred when available). Do not open a public issue that includes exploit details or secrets.

Include:

- Affected version or commit
- Impact description
- Reproduction steps when possible

## Baseline protections

RepoPulse includes sensible defaults for a self-hosted MVP:

- Strict URL validation (GitHub hosts only; not a generic proxy)
- Request size limits and analyze-endpoint rate limiting
- Outbound GitHub request timeouts
- Safe client error responses (no stack traces or tokens)
- Security headers via Helmet (API) and Nginx (web)
- Restricted CORS
- Content Security Policy on the web tier
- Optional `GITHUB_TOKEN` kept server-side only
- Non-root containers where supported
- API not published on the host by default

These controls reduce common risks; they do **not** eliminate all vulnerabilities. Deploy behind HTTPS at the edge for production.

## Secrets

- Never commit `.env` files containing tokens.
- Never bake `GITHUB_TOKEN` into Docker images.
- Rotate tokens if they may have been exposed.
