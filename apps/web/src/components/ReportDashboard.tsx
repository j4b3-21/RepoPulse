import type { HealthReport } from '@repopulse/shared';
import { CategoryBreakdown } from './CategoryBreakdown';
import { HealthScoreRing } from './HealthScoreRing';
import { MethodologyPanel } from './MethodologyPanel';
import { RecommendationCard } from './RecommendationCard';
import { RepoOverview } from './RepoOverview';

type Props = {
  report: HealthReport;
};

export function ReportDashboard({ report }: Props) {
  return (
    <div className="space-y-8">
      <RepoOverview overview={report.overview} />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <HealthScoreRing score={report.overallScore} note={report.overallScoreNote} />
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-rp-muted">
            Category breakdown
          </h2>
          <CategoryBreakdown categories={report.categories} />
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-rp-muted">
          Recommendations
        </h2>
        {report.recommendations.length === 0 ? (
          <p className="rounded-lg border border-rp-border bg-rp-panel px-4 py-3 text-sm text-rp-muted">
            No prioritized recommendations were generated from the observed evidence.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {report.recommendations.map((rec) => (
              <RecommendationCard key={`${rec.priority}-${rec.title}`} recommendation={rec} />
            ))}
          </div>
        )}
      </section>

      <MethodologyPanel />

      <p className="font-mono text-xs text-rp-muted">
        Analyzed at {new Date(report.analyzedAt).toLocaleString()}
        {typeof report.rateLimitRemaining === 'number'
          ? ` · GitHub rate limit remaining: ${report.rateLimitRemaining}`
          : ''}
        {report.cached ? ' · cached result' : ''}
      </p>
    </div>
  );
}
