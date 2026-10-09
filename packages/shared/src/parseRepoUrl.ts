export type ParsedRepo = {
  owner: string;
  repo: string;
};

export type ParseRepoUrlResult =
  | { ok: true; value: ParsedRepo }
  | { ok: false; code: 'invalid_url' | 'unsupported_host' | 'invalid_path'; message: string };

const OWNER_REPO = /^[A-Za-z0-9_.-]+$/;

function stripGitSuffix(name: string): string {
  return name.endsWith('.git') ? name.slice(0, -4) : name;
}

/**
 * Accepts https://github.com/owner/repo, http://github.com/owner/repo,
 * www.github.com variants, and owner/repo shorthand.
 */
export function parseGitHubRepoUrl(input: string): ParseRepoUrlResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, code: 'invalid_url', message: 'Repository URL is required.' };
  }

  // Shorthand: owner/repo
  if (!trimmed.includes('://') && !trimmed.startsWith('github.com') && !trimmed.startsWith('www.')) {
    const parts = trimmed.split('/').filter(Boolean);
    if (parts.length === 2 && OWNER_REPO.test(parts[0]) && OWNER_REPO.test(stripGitSuffix(parts[1]))) {
      return {
        ok: true,
        value: { owner: parts[0], repo: stripGitSuffix(parts[1]) },
      };
    }
  }

  let url: URL;
  try {
    const withProtocol =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
    url = new URL(withProtocol);
  } catch {
    return { ok: false, code: 'invalid_url', message: 'Enter a valid GitHub repository URL.' };
  }

  const host = url.hostname.toLowerCase();
  if (host !== 'github.com' && host !== 'www.github.com') {
    return {
      ok: false,
      code: 'unsupported_host',
      message: 'Only github.com repository URLs are supported.',
    };
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length < 2) {
    return {
      ok: false,
      code: 'invalid_path',
      message: 'URL must include both owner and repository name.',
    };
  }

  const owner = segments[0];
  const repo = stripGitSuffix(segments[1]);

  if (!OWNER_REPO.test(owner) || !OWNER_REPO.test(repo) || repo.length === 0) {
    return {
      ok: false,
      code: 'invalid_path',
      message: 'Owner or repository name is invalid.',
    };
  }

  return { ok: true, value: { owner, repo } };
}
