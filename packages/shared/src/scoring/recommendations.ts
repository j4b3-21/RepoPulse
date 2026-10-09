import type { CategoryScore, Recommendation } from '../schemas.js';

function hasEvidence(category: CategoryScore, labelIncludes: string): boolean {
  return category.evidence.some((e) => e.label.toLowerCase().includes(labelIncludes.toLowerCase()));
}

export function buildRecommendations(categories: CategoryScore[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const byId = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<
    string,
    CategoryScore | undefined
  >;

  const docs = byId.documentation;
  if (docs?.status === 'scored') {
    if (hasEvidence(docs, 'README missing')) {
      recs.push({
        title: 'Add a README with setup instructions',
        priority: 'High',
        evidence: 'No README was observed for this repository.',
        nextStep:
          'Create a README covering what the project does, how to install it, and a minimal usage example.',
      });
    } else if (hasEvidence(docs, 'Limited setup keywords') || hasEvidence(docs, 'Short README')) {
      recs.push({
        title: 'Strengthen README setup guidance',
        priority: 'Medium',
        evidence: 'README content appears short or lacks common install/usage section keywords.',
        nextStep: 'Add clear Install, Usage, and Contributing sections with copy-pasteable commands.',
      });
    }
  }

  const testing = byId.testing;
  if (testing?.status === 'scored' && hasEvidence(testing, 'No testing infrastructure')) {
    recs.push({
      title: 'Introduce visible testing infrastructure',
      priority: 'High',
      evidence: 'No common test directories or config files were observed at the repository root.',
      nextStep:
        'Add a test runner config and a top-level test directory (or document where tests live).',
    });
  }

  const maintenance = byId.maintenance;
  if (maintenance?.status === 'scored') {
    if (hasEvidence(maintenance, 'Stale activity')) {
      recs.push({
        title: 'Clarify maintenance status',
        priority: 'Medium',
        evidence: 'No repository push was observed in over a year.',
        nextStep:
          'If the project is maintained, push a status update or release note; otherwise document archival status in the README.',
      });
    } else if (hasEvidence(maintenance, 'Aging activity')) {
      recs.push({
        title: 'Signal ongoing maintenance',
        priority: 'Low',
        evidence: 'Last observed push was between 90 days and one year ago.',
        nextStep: 'Publish a brief maintenance note or dependency bump if the project is still active.',
      });
    }
  }

  const issues = byId.issues;
  if (issues?.status === 'scored') {
    const stale = issues.evidence.find((e) => e.label === 'Stale open issues');
    const labeled = issues.evidence.find((e) => e.label === 'Labeled issues');
    if (stale && /[1-9]\d* of/.test(stale.detail) && !stale.detail.startsWith('0 of')) {
      const staleCount = Number(stale.detail.split(' ')[0]);
      if (staleCount > 0 && (issues.score ?? 100) < 70) {
        recs.push({
          title: 'Triage long-open issues',
          priority: 'Medium',
          evidence: stale.detail,
          nextStep: 'Close, defer, or re-label issues older than 90 days to keep the backlog actionable.',
        });
      }
    }
    if (labeled && issues.evidence.some((e) => e.label === 'Open issues sampled')) {
      const match = labeled.detail.match(/^(\d+) of (\d+)/);
      if (match) {
        const labeledCount = Number(match[1]);
        const total = Number(match[2]);
        if (total > 0 && labeledCount / total < 0.4) {
          recs.push({
            title: 'Improve issue labeling',
            priority: 'Low',
            evidence: labeled.detail,
            nextStep: 'Apply type/priority labels so contributors can filter actionable work.',
          });
        }
      }
    }
  }

  const priorityOrder = { High: 0, Medium: 1, Low: 2 } as const;
  return recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
