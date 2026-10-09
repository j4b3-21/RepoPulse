type Props = {
  label: string;
  value: string;
  hint?: string;
};

export function MetricCard({ label, value, hint }: Props) {
  return (
    <div className="rounded-lg border border-rp-border bg-rp-panel px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-rp-muted">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-rp-text">{value}</p>
      {hint ? <p className="mt-1 text-xs text-rp-muted">{hint}</p> : null}
    </div>
  );
}
