import type { CategoryScore } from '@repopulse/shared';

type Props = {
  categories: CategoryScore[];
};

export function CategoryBreakdown({ categories }: Props) {
  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const width = category.status === 'scored' ? `${category.score ?? 0}%` : '0%';
        return (
          <article
            key={category.id}
            className="rounded-lg border border-rp-border bg-rp-panel p-4 rp-fade-in"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-rp-text">{category.label}</h3>
              <div className="font-mono text-sm text-rp-muted">
                {category.status === 'unavailable' ? (
                  <span className="text-rp-warn">Unavailable</span>
                ) : (
                  <span>{category.score}/100</span>
                )}
                <span className="ml-2 text-xs">weight {(category.weight * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded bg-rp-panel-2">
              <div
                className="h-full rounded bg-rp-accent transition-all duration-700"
                style={{ width: category.status === 'unavailable' ? '0%' : width }}
              />
            </div>
            <p className="mt-3 text-sm text-rp-muted">{category.explanation}</p>
            <ul className="mt-3 space-y-2">
              {category.evidence.map((item) => (
                <li
                  key={`${category.id}-${item.label}-${item.detail}`}
                  className="rounded border border-rp-border/70 bg-rp-panel-2 px-3 py-2 text-xs"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        item.kind === 'fact'
                          ? 'rounded bg-rp-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-rp-accent'
                          : 'rounded bg-rp-warn/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-rp-warn'
                      }
                    >
                      {item.kind}
                    </span>
                    <span className="font-medium text-rp-text">{item.label}</span>
                  </div>
                  <p className="mt-1 text-rp-muted">{item.detail}</p>
                </li>
              ))}
            </ul>
            {category.limitations.length > 0 ? (
              <p className="mt-3 text-xs italic text-rp-muted">{category.limitations[0]}</p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
