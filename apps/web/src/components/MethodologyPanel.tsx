export function MethodologyPanel() {
  return (
    <details className="rounded-lg border border-rp-border bg-rp-panel p-4">
      <summary className="cursor-pointer text-sm font-semibold text-rp-text">
        Scoring methodology
      </summary>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-rp-muted">
        <p>
          Scores are deterministic product heuristics: Documentation, Testing signals, Maintenance,
          and Issue management each start at 25% weight. Unavailable categories are excluded and
          remaining weights are renormalized.
        </p>
        <p>
          Evidence is labeled as <strong className="text-rp-text">fact</strong> (directly observed)
          or <strong className="text-rp-text">heuristic</strong> (interpreted signal). Missing data
          is never silently converted into a failing score.
        </p>
        <p>
          This tool inspects GitHub REST metadata and selected files (for example README content). It
          does not execute tests, run static analysis, or claim to have scanned the full source tree.
        </p>
      </div>
    </details>
  );
}
