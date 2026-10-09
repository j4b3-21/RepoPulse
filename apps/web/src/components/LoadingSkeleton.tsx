export function LoadingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <p className="text-sm text-rp-muted">Fetching repository metadata and computing health…</p>
      <div className="h-20 rounded-lg rp-skeleton" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg rp-skeleton" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="h-56 rounded-lg rp-skeleton" />
        <div className="space-y-3">
          <div className="h-28 rounded-lg rp-skeleton" />
          <div className="h-28 rounded-lg rp-skeleton" />
        </div>
      </div>
    </div>
  );
}
