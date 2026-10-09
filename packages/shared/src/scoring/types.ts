import type { CategoryScore, EvidenceItem, Recommendation, RepoOverview } from '../schemas.js';
import type { CategoryId } from './weights.js';

export type ContentEntry = {
  name: string;
  type: 'file' | 'dir' | string;
  path?: string;
};

export type IssueSample = {
  title: string;
  createdAt: string;
  labels: string[];
  isPullRequest: boolean;
};

export type ScoringInput = {
  overview: Omit<RepoOverview, 'openIssues' | 'openIssuesNote'> & {
    openIssues: number | null;
    pushedAt: string;
  };
  readme: {
    available: boolean;
    fetchFailed: boolean;
    content: string | null;
  };
  rootContents: {
    available: boolean;
    entries: ContentEntry[];
  };
  issues: {
    available: boolean;
    fetchFailed: boolean;
    samples: IssueSample[];
  };
  now?: Date;
};

export type { CategoryScore, EvidenceItem, Recommendation, CategoryId };
