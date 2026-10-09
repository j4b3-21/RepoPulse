import type { CategoryScore, EvidenceItem } from '../schemas.js';
import { CATEGORY_WEIGHTS } from './weights.js';
import type { ScoringInput } from './types.js';

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function scoreMaintenance(input: ScoringInput): CategoryScore {
  const limitations = [
    'Recent push activity indicates maintenance activity, not software quality or security posture.',
  ];

  const pushedAt = new Date(input.overview.pushedAt);
  if (Number.isNaN(pushedAt.getTime())) {
    return {
      id: 'maintenance',
      label: 'Maintenance',
      weight: CATEGORY_WEIGHTS.maintenance,
      status: 'unavailable',
      evidence: [
        {
          kind: 'fact',
          label: 'Invalid push timestamp',
          detail: 'Repository pushed_at could not be parsed.',
        },
      ],
      explanation: 'Maintenance could not be assessed without a valid last-push timestamp.',
      limitations,
    };
  }

  const now = input.now ?? new Date();
  const days = Math.max(0, daysBetween(pushedAt, now));
  const evidence: EvidenceItem[] = [
    {
      kind: 'fact',
      label: 'Last push',
      detail: `Repository pushed_at is ${pushedAt.toISOString()} (${days} day(s) ago).`,
    },
  ];

  let score: number;
  if (days <= 30) {
    score = 95;
    evidence.push({
      kind: 'heuristic',
      label: 'Recently active',
      detail: 'Pushed within the last 30 days.',
    });
  } else if (days <= 90) {
    score = 75;
    evidence.push({
      kind: 'heuristic',
      label: 'Moderately recent activity',
      detail: 'Pushed within the last 90 days.',
    });
  } else if (days <= 365) {
    score = 45;
    evidence.push({
      kind: 'heuristic',
      label: 'Aging activity',
      detail: 'Last push was between 90 days and one year ago.',
    });
  } else {
    score = 20;
    evidence.push({
      kind: 'heuristic',
      label: 'Stale activity signal',
      detail: 'No observed push in over a year.',
    });
  }

  return {
    id: 'maintenance',
    label: 'Maintenance',
    weight: CATEGORY_WEIGHTS.maintenance,
    status: 'scored',
    score,
    evidence,
    explanation:
      'Score buckets the age of the latest push. Activity alone does not establish code quality.',
    limitations,
  };
}
