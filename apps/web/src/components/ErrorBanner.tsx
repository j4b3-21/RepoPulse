import type { ApiClientError } from '../api/client';

type Props = {
  error: ApiClientError;
  onRetry: () => void;
};

export function ErrorBanner({ error, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-rp-danger/40 bg-rp-danger/10 px-4 py-4 rp-fade-in"
    >
      <p className="text-sm font-semibold text-rp-danger">Analysis failed</p>
      <p className="mt-1 text-sm text-rp-text">{error.message}</p>
      <p className="mt-1 font-mono text-xs text-rp-muted">
        {error.code}
        {error.status ? ` · HTTP ${error.status}` : ''}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded border border-rp-border bg-rp-panel px-3 py-1.5 text-sm text-rp-text hover:border-rp-accent/50"
      >
        Retry
      </button>
    </div>
  );
}
