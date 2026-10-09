import {
  calculateHealth,
  parseGitHubRepoUrl,
  type HealthReport,
  type ScoringInput,
} from '@repopulse/shared';
import type { CacheStore } from '../cache/types.js';
import type { AppConfig } from '../config.js';
import { AppError } from '../errors.js';
import type { GitHubClient } from '../github/client.js';
import type { Logger } from '../logger.js';

export class AnalyzeService {
  constructor(
    private readonly github: GitHubClient,
    private readonly cache: CacheStore<HealthReport>,
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {}

  async analyze(url: string): Promise<HealthReport> {
    const parsed = parseGitHubRepoUrl(url);
    if (!parsed.ok) {
      throw new AppError(400, parsed.code, parsed.message);
    }

    const { owner, repo } = parsed.value;
    const cacheKey = `${owner.toLowerCase()}/${repo.toLowerCase()}`;

    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug('cache_hit', { cacheKey });
      return { ...cached, cached: true };
    }

    const repoData = await this.github.getRepo(owner, repo);
    if (repoData.private) {
      throw new AppError(404, 'repository_not_found', 'Repository not found or is private.');
    }

    const [rootContents, readme, issues] = await Promise.all([
      this.github.getRootContents(owner, repo),
      this.github.getReadme(owner, repo),
      repoData.has_issues
        ? this.github.getOpenIssues(owner, repo)
        : Promise.resolve({ available: false, fetchFailed: false, samples: [] }),
    ]);

    const issueSamples = issues.samples.map((issue) => ({
      title: issue.title,
      createdAt: issue.created_at,
      labels: (issue.labels ?? []).map((l) => (typeof l === 'string' ? l : l.name)),
      isPullRequest: issue.pull_request !== undefined,
    }));

    const openIssuesOnly = issueSamples.filter((i) => !i.isPullRequest).length;
    const openIssues =
      issues.available && !issues.fetchFailed
        ? openIssuesOnly
        : null;

    const scoringInput: ScoringInput = {
      overview: {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        owner: repoData.owner.login,
        primaryLanguage: repoData.language,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues,
        lastUpdated: repoData.updated_at,
        defaultBranch: repoData.default_branch,
        htmlUrl: repoData.html_url,
        private: repoData.private,
        hasIssues: repoData.has_issues,
        pushedAt: repoData.pushed_at,
      },
      readme,
      rootContents: {
        available: rootContents !== null,
        entries: (rootContents ?? []).map((e) => ({
          name: e.name,
          type: e.type,
          path: e.path,
        })),
      },
      issues: {
        available: issues.available,
        fetchFailed: issues.fetchFailed,
        samples: issueSamples,
      },
    };

    const report = calculateHealth(scoringInput);
    report.rateLimitRemaining = this.github.getRateLimitRemaining();
    report.cached = false;

    await this.cache.set(cacheKey, report, this.config.CACHE_TTL_SECONDS);
    this.logger.info('analyze_complete', { owner, repo, overallScore: report.overallScore });
    return report;
  }
}
