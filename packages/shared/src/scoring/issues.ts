import type { CategoryScore, EvidenceItem } from '../schemas.js';
import { CATEGORY_WEIGHTS } from './weights.js';
import type { ScoringInput } from './types.js';

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function scoreIssues(input: ScoringInput): CategoryScore {
  const limitations = [
    'Issue management uses a sample of open issues (excluding pull requests). It does not evaluate triage quality comprehensively.',
  ];

  if (!input.overview.hasIssues) {
    return {
      id: 'issues',
      label: 'Issue management',
      weight: CATEGORY_WEIGHTS.issues,
      status: 'unavailable',
      evidence: [
        {
          kind: 'fact',
          label: 'Issues disabled',
          detail: 'The repository has GitHub Issues disabled.',
        },
      ],
      explanation:
        'Issue management is marked unavailable rather than failed when issues are disabled.',
      limitations,
    };
  }

  if (input.issues.fetchFailed || !input.issues.available) {
    return {
      id: 'issues',
      label: 'Issue management',
      weight: CATEGORY_WEIGHTS.issues,
      status: 'unavailable',
      evidence: [
        {
          kind: 'fact',
          label: 'Issues metadata unavailable',
          detail: 'Open issues could not be retrieved from GitHub.',
        },
      ],
      explanation: 'Issue management could not be assessed without issue metadata.',
      limitations,
    };
  }

  const issuesOnly = input.issues.samples.filter((i) => !i.isPullRequest);
  const now = input.now ?? new Date();
  const evidence: EvidenceItem[] = [
    {
      kind: 'fact',
      label: 'Open issues sampled',
      detail: `${issuesOnly.length} open issue(s) in sample (pull requests excluded).`,
    },
  ];

  if (issuesOnly.length === 0) {
    evidence.push({
      kind: 'fact',
      label: 'No open issues in sample',
      detail: 'No open non-PR issues were returned in the sample window.',
    });
    return {
      id: 'issues',
      label: 'Issue management',
      weight: CATEGORY_WEIGHTS.issues,
      status: 'scored',
      score: 90,
      evidence,
      explanation: 'An empty open-issue sample is treated as a positive hygiene signal for this MVP.',
      limitations,
    };
  }

  const labeled = issuesOnly.filter((i) => i.labels.length > 0).length;
  const labeledRatio = labeled / issuesOnly.length;
  const stale = issuesOnly.filter((i) => {
    const created = new Date(i.createdAt);
    if (Number.isNaN(created.getTime())) return false;
    return daysBetween(created, now) > 90;
  }).length;
  const staleRatio = stale / issuesOnly.length;

  evidence.push({
    kind: 'fact',
    label: 'Labeled issues',
    detail: `${labeled} of ${issuesOnly.length} sampled issues have at least one label.`,
  });
  evidence.push({
    kind: 'fact',
    label: 'Stale open issues',
    detail: `${stale} of ${issuesOnly.length} sampled issues are older than 90 days.`,
  });

  let score = 40;
  score += Math.round(labeledRatio * 35);
  score += Math.round((1 - staleRatio) * 25);
  score = Math.max(0, Math.min(100, score));

  evidence.push({
    kind: 'heuristic',
    label: 'Label and staleness heuristic',
    detail: 'Higher label coverage and fewer long-open issues increase the score.',
  });

  return {
    id: 'issues',
    label: 'Issue management',
    weight: CATEGORY_WEIGHTS.issues,
    status: 'scored',
    score,
    evidence,
    explanation:
      'Score combines label coverage and age of open issues from an observed sample, excluding pull requests.',
    limitations,
  };
}
