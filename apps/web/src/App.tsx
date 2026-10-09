import { SearchHero } from './components/SearchHero';
import { EmptyState } from './components/EmptyState';
import { ErrorBanner } from './components/ErrorBanner';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { ReportDashboard } from './components/ReportDashboard';
import { useRepoAnalysis } from './hooks/useRepoAnalysis';

export default function App() {
  const { state, analyze } = useRepoAnalysis();

  return (
    <div className="min-h-screen">
      <SearchHero
        loading={state.status === 'loading'}
        initialUrl={state.status === 'idle' ? '' : state.url}
        onSubmit={analyze}
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {state.status === 'idle' ? <EmptyState /> : null}
        {state.status === 'loading' ? <LoadingSkeleton /> : null}
        {state.status === 'error' ? (
          <ErrorBanner error={state.error} onRetry={() => analyze(state.url)} />
        ) : null}
        {state.status === 'success' ? <ReportDashboard report={state.report} /> : null}
      </main>

      <footer className="border-t border-rp-border/80 px-4 py-6 text-center text-xs text-rp-muted">
        RepoPulse analyzes public GitHub metadata only. Self-hostable · MIT License
      </footer>
    </div>
  );
}
