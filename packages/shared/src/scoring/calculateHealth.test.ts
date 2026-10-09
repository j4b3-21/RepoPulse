import { describe, expect, it } from 'vitest';
import { calculateHealth, calculateOverallScore } from './calculateHealth.js';
import type { ScoringInput } from './types.js';

const baseOverview: ScoringInput['overview'] = {
  name: 'demo',
  fullName: 'acme/demo',
  description: 'A demo repo',
  owner: 'acme',
  primaryLanguage: 'TypeScript',
  stars: 10,
  forks: 2,
  openIssues: 1,
  lastUpdated: '2024-01-01T00:00:00.000Z',
  defaultBranch: 'main',
  htmlUrl: 'https://github.com/acme/demo',
  private: false,
  hasIssues: true,
  pushedAt: '2024-06-01T00:00:00.000Z',
};

const now = new Date('2024-06-15T00:00:00.000Z');

function makeInput(partial: Partial<ScoringInput> = {}): ScoringInput {
  return {
    overview: baseOverview,
    readme: {
      available: true,
      fetchFailed: false,
      content: '# Demo\n\n## Install\n\nnpm i\n\n## Usage\n\nrun it\n\n## Contributing\n\nPRs welcome\n',
    },
    rootContents: {
      available: true,
      entries: [
        { name: 'README.md', type: 'file' },
        { name: 'tests', type: 'dir' },
        { name: 'vitest.config.ts', type: 'file' },
      ],
    },
    issues: {
      available: true,
      fetchFailed: false,
      samples: [
        {
          title: 'Bug',
          createdAt: '2024-06-01T00:00:00.000Z',
          labels: ['bug'],
          isPullRequest: false,
        },
      ],
    },
    now,
    ...partial,
  };
}

describe('calculateOverallScore', () => {
  it('renormalizes when a category is unavailable', () => {
    const result = calculateOverallScore([
      { status: 'scored', score: 100, weight: 0.25 },
      { status: 'unavailable', weight: 0.25 },
      { status: 'scored', score: 0, weight: 0.25 },
      { status: 'scored', score: 50, weight: 0.25 },
    ]);
    expect(result.score).toBe(50);
    expect(result.note).toMatch(/renormalized/i);
  });

  it('returns null when nothing is scored', () => {
    const result = calculateOverallScore([{ status: 'unavailable', weight: 0.25 }]);
    expect(result.score).toBeNull();
  });
});

describe('calculateHealth', () => {
  it('scores a healthy repository with recommendations empty or low priority', () => {
    const report = calculateHealth(makeInput());
    expect(report.overallScore).toBeGreaterThan(70);
    expect(report.categories).toHaveLength(4);
    expect(report.categories.every((c) => c.status === 'scored')).toBe(true);
    expect(report.recommendations.every((r) => r.priority !== 'High')).toBe(true);
  });

  it('marks issues unavailable when disabled', () => {
    const report = calculateHealth(
      makeInput({
        overview: { ...baseOverview, hasIssues: false, openIssues: null },
        issues: { available: false, fetchFailed: false, samples: [] },
      }),
    );
    const issues = report.categories.find((c) => c.id === 'issues');
    expect(issues?.status).toBe('unavailable');
    expect(report.overallScore).not.toBeNull();
  });

  it('does not treat missing contents as a testing failure score of zero silently', () => {
    const report = calculateHealth(
      makeInput({
        rootContents: { available: false, entries: [] },
      }),
    );
    const testing = report.categories.find((c) => c.id === 'testing');
    expect(testing?.status).toBe('unavailable');
    expect(testing?.score).toBeUndefined();
  });

  it('recommends README when missing', () => {
    const report = calculateHealth(
      makeInput({
        readme: { available: false, fetchFailed: false, content: null },
        rootContents: { available: true, entries: [{ name: 'src', type: 'dir' }] },
      }),
    );
    expect(report.recommendations.some((r) => /README/i.test(r.title))).toBe(true);
  });

  it('excludes pull requests from issue evidence counts', () => {
    const report = calculateHealth(
      makeInput({
        issues: {
          available: true,
          fetchFailed: false,
          samples: [
            {
              title: 'PR',
              createdAt: '2024-01-01T00:00:00.000Z',
              labels: [],
              isPullRequest: true,
            },
            {
              title: 'Issue',
              createdAt: '2024-06-01T00:00:00.000Z',
              labels: ['bug'],
              isPullRequest: false,
            },
          ],
        },
      }),
    );
    const issues = report.categories.find((c) => c.id === 'issues');
    expect(issues?.evidence.some((e) => e.detail.includes('1 open issue'))).toBe(true);
  });

  it('handles contradictory docs signals: listing has README but body fetch failed', () => {
    const report = calculateHealth(
      makeInput({
        readme: { available: false, fetchFailed: true, content: null },
        rootContents: {
          available: true,
          entries: [{ name: 'README.md', type: 'file' }],
        },
      }),
    );
    const docs = report.categories.find((c) => c.id === 'documentation');
    expect(docs?.status).toBe('scored');
    expect(docs?.score).toBeLessThanOrEqual(50);
  });
});
