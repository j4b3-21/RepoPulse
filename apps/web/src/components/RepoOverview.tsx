import type { RepoOverview as Overview } from '@repopulse/shared';
import { ExternalLink } from 'lucide-react';
import { MetricCard } from './MetricCard';

type Props = {
  overview: Overview;
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function RepoOverview({ overview }: Props) {
  return (
    <section className="space-y-4 rp-fade-in">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-rp-text">{overview.fullName}</h2>
          <a
            href={overview.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-rp-accent hover:underline"
          >
            View on GitHub
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-rp-muted">
          {overview.description ?? 'No description provided.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Owner" value={overview.owner} />
        <MetricCard label="Language" value={overview.primaryLanguage ?? '—'} />
        <MetricCard label="Stars" value={overview.stars.toLocaleString()} />
        <MetricCard label="Forks" value={overview.forks.toLocaleString()} />
        <MetricCard
          label="Open issues"
          value={overview.openIssues === null ? '—' : overview.openIssues.toLocaleString()}
          hint={overview.openIssuesNote}
        />
        <MetricCard label="Default branch" value={overview.defaultBranch} />
      </div>
      <p className="text-xs text-rp-muted">Last updated {formatDate(overview.lastUpdated)}</p>
    </section>
  );
}
