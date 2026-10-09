import { useEffect, useState, type FormEvent } from 'react';
import { Activity, Search } from 'lucide-react';

const EXAMPLES = [
  'https://github.com/facebook/react',
  'https://github.com/vercel/next.js',
  'https://github.com/expressjs/express',
];

type Props = {
  loading: boolean;
  initialUrl?: string;
  onSubmit: (url: string) => void;
};

export function SearchHero({ loading, initialUrl = '', onSubmit }: Props) {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!url.trim() || loading) return;
    onSubmit(url.trim());
  }

  return (
    <section className="border-b border-rp-border/80 px-4 pb-10 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-rp-border bg-rp-panel text-rp-accent">
            <Activity className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="font-mono text-2xl font-semibold tracking-tight text-rp-text sm:text-3xl">
              RepoPulse
            </h1>
            <p className="text-sm text-rp-muted">GitHub repository health analyzer</p>
          </div>
        </div>

        <p className="mb-6 max-w-2xl text-base leading-relaxed text-rp-muted">
          Paste a public GitHub repository URL to retrieve observable metadata, a transparent
          health score, and prioritized engineering recommendations.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="repo-url">
            GitHub repository URL
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rp-muted"
              aria-hidden
            />
            <input
              id="repo-url"
              name="url"
              type="text"
              inputMode="url"
              autoComplete="url"
              placeholder="https://github.com/owner/repository"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-rp-border bg-rp-panel py-3 pl-10 pr-3 font-mono text-sm text-rp-text placeholder:text-rp-muted/70 disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="rounded-lg bg-rp-accent px-5 py-3 text-sm font-semibold text-rp-bg transition hover:bg-rp-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-xs text-rp-muted">Try:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={loading}
              onClick={() => {
                setUrl(example);
                onSubmit(example);
              }}
              className="rounded border border-rp-border bg-rp-panel-2 px-2 py-1 font-mono text-xs text-rp-muted transition hover:border-rp-accent/50 hover:text-rp-text disabled:opacity-50"
            >
              {example.replace('https://github.com/', '')}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
