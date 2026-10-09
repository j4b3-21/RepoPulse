import type { HealthReport, RepoOverview } from '../schemas.js';
import { scoreDocumentation } from './documentation.js';
import { scoreTesting } from './testing.js';
import { scoreMaintenance } from './maintenance.js';
import { scoreIssues } from './issues.js';
import { buildRecommendations } from './recommendations.js';
import type { ScoringInput } from './types.js';

export function calculateOverallScore(
  categories: { status: 'scored' | 'unavailable'; score?: number; weight: number }[],
): { score: number | null; note: string } {
  const scored = categories.filter((c) => c.status === 'scored' && typeof c.score === 'number');
  if (scored.length === 0) {
    return {
      score: null,
      note: 'Overall score unavailable because no categories could be assessed.',
    };
  }

  const totalWeight = scored.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight <= 0) {
    return { score: null, note: 'Overall score unavailable due to invalid weights.' };
  }

  const weighted = scored.reduce((sum, c) => sum + (c.score as number) * c.weight, 0);
  const score = Math.round(weighted / totalWeight);
  const unavailable = categories.length - scored.length;

  return {
    score,
    note:
      unavailable > 0
        ? `Overall score uses ${scored.length} of ${categories.length} categories; unavailable categories are excluded (weights renormalized).`
        : 'Overall score is the weighted average of all four categories.',
  };
}

export function calculateHealth(input: ScoringInput): HealthReport {
  const categories = [
    scoreDocumentation(input),
    scoreTesting(input),
    scoreMaintenance(input),
    scoreIssues(input),
  ];

  const { score, note } = calculateOverallScore(categories);
  const recommendations = buildRecommendations(categories);

  const overview: RepoOverview = {
    name: input.overview.name,
    fullName: input.overview.fullName,
    description: input.overview.description,
    owner: input.overview.owner,
    primaryLanguage: input.overview.primaryLanguage,
    stars: input.overview.stars,
    forks: input.overview.forks,
    openIssues: input.overview.openIssues,
    openIssuesNote: input.overview.hasIssues
      ? input.overview.openIssues === null
        ? 'Open issue count excluding pull requests was unavailable.'
        : 'Open issue count excludes pull requests when derived from the issues sample/search.'
      : 'Issues are disabled for this repository.',
    lastUpdated: input.overview.lastUpdated,
    defaultBranch: input.overview.defaultBranch,
    htmlUrl: input.overview.htmlUrl,
    private: input.overview.private,
    hasIssues: input.overview.hasIssues,
  };

  return {
    overview,
    overallScore: score,
    overallScoreNote: note,
    categories,
    recommendations,
    analyzedAt: (input.now ?? new Date()).toISOString(),
  };
}
