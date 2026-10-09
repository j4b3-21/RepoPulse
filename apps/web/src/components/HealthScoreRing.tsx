type Props = {
  score: number | null;
  note: string;
};

export function HealthScoreRing({ score, note }: Props) {
  const size = 148;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = score ?? 0;
  const offset = circumference - (value / 100) * circumference;
  const color =
    score === null
      ? '#9aa7b8'
      : score >= 75
        ? '#6bcf8e'
        : score >= 50
          ? '#d4a24c'
          : '#e07470';

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-rp-border bg-rp-panel p-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`Health score ${score ?? 'unavailable'}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2a3341"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={score === null ? circumference : offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-semibold" style={{ color }}>
            {score === null ? '—' : score}
          </span>
          <span className="text-xs text-rp-muted">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-rp-text">Overall health score</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-rp-muted">{note}</p>
      </div>
    </div>
  );
}
