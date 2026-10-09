import type { Recommendation } from '@repopulse/shared';

const priorityStyles = {
  High: 'border-rp-danger/40 text-rp-danger bg-rp-danger/10',
  Medium: 'border-rp-warn/40 text-rp-warn bg-rp-warn/10',
  Low: 'border-rp-accent/40 text-rp-accent bg-rp-accent/10',
} as const;

type Props = {
  recommendation: Recommendation;
};

export function RecommendationCard({ recommendation }: Props) {
  return (
    <article className="rounded-lg border border-rp-border bg-rp-panel p-4 rp-fade-in">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${priorityStyles[recommendation.priority]}`}
        >
          {recommendation.priority}
        </span>
        <h3 className="text-sm font-semibold text-rp-text">{recommendation.title}</h3>
      </div>
      <p className="mt-3 text-xs text-rp-muted">
        <span className="font-medium text-rp-text">Evidence: </span>
        {recommendation.evidence}
      </p>
      <p className="mt-2 text-sm text-rp-text">
        <span className="text-rp-muted">Next step: </span>
        {recommendation.nextStep}
      </p>
    </article>
  );
}
