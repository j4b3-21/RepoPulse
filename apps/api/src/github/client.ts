import type { AppConfig } from '../config.js';
import { AppError } from '../errors.js';
import type { Logger } from '../logger.js';
import type {
  GitHubContentItem,
  GitHubFetchMeta,
  GitHubIssueResponse,
  GitHubReadmeResponse,
  GitHubRepoResponse,
} from './types.js';

export type FetchLike = typeof fetch;

export class GitHubClient {
  private lastRateLimitRemaining: number | null = null;

  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  getRateLimitRemaining(): number | null {
    return this.lastRateLimitRemaining;
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepoResponse> {
    return this.requestJson<GitHubRepoResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  }

  async getRootContents(owner: string, repo: string): Promise<GitHubContentItem[] | null> {
    try {
      const data = await this.requestJson<GitHubContentItem[] | GitHubContentItem>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/`,
      );
      return Array.isArray(data) ? data : null;
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async getReadme(
    owner: string,
    repo: string,
  ): Promise<{ available: boolean; fetchFailed: boolean; content: string | null }> {
    try {
      const data = await this.requestJson<GitHubReadmeResponse>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
      );
      if (!data.content || data.encoding !== 'base64') {
        return { available: true, fetchFailed: true, content: null };
      }
      const content = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
      return { available: true, fetchFailed: false, content };
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 404) {
        return { available: false, fetchFailed: false, content: null };
      }
      this.logger.warn('readme_fetch_failed', { owner, repo });
      return { available: false, fetchFailed: true, content: null };
    }
  }

  async getOpenIssues(owner: string, repo: string): Promise<{
    available: boolean;
    fetchFailed: boolean;
    samples: GitHubIssueResponse[];
  }> {
    try {
      const data = await this.requestJson<GitHubIssueResponse[]>(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=open&per_page=30`,
      );
      return {
        available: true,
        fetchFailed: false,
        samples: Array.isArray(data) ? data : [],
      };
    } catch (error) {
      if (error instanceof AppError && error.statusCode === 404) {
        return { available: false, fetchFailed: true, samples: [] };
      }
      this.logger.warn('issues_fetch_failed', { owner, repo });
      return { available: false, fetchFailed: true, samples: [] };
    }
  }

  private async requestJson<T>(path: string): Promise<T> {
    const url = `${this.config.GITHUB_API_BASE_URL}${path}`;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'RepoPulse/1.0',
    };
    if (this.config.githubToken) {
      headers.Authorization = `Bearer ${this.config.githubToken}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.GITHUB_REQUEST_TIMEOUT_MS);

    try {
      const response = await this.fetchImpl(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining !== null) {
        const parsed = Number(remaining);
        this.lastRateLimitRemaining = Number.isFinite(parsed) ? parsed : this.lastRateLimitRemaining;
      }

      if (response.status === 404) {
        throw new AppError(404, 'repository_not_found', 'Repository not found or is private.');
      }

      if (response.status === 401) {
        throw new AppError(502, 'github_auth_failed', 'GitHub rejected the server credentials.');
      }

      if (response.status === 403 || response.status === 429) {
        const bodyText = await response.text().catch(() => '');
        const rateLimited =
          response.status === 429 ||
          /rate limit/i.test(bodyText) ||
          this.lastRateLimitRemaining === 0;
        if (rateLimited) {
          throw new AppError(
            429,
            'github_rate_limited',
            'GitHub API rate limit exceeded. Try again later or configure GITHUB_TOKEN on the server.',
          );
        }
        throw new AppError(502, 'github_forbidden', 'GitHub refused this request.');
      }

      if (!response.ok) {
        throw new AppError(502, 'github_upstream_error', 'GitHub API returned an unexpected error.');
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppError(504, 'github_timeout', 'Timed out while contacting GitHub.');
      }
      throw new AppError(502, 'github_network_error', 'Failed to reach GitHub.');
    } finally {
      clearTimeout(timeout);
    }
  }

  meta(): GitHubFetchMeta {
    return { rateLimitRemaining: this.lastRateLimitRemaining };
  }
}
