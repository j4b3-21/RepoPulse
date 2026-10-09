import { useCallback, useState } from 'react';
import type { HealthReport } from '@repopulse/shared';
import { analyzeRepository, type ApiClientError } from '../api/client';

export type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading'; url: string }
  | { status: 'success'; url: string; report: HealthReport }
  | { status: 'error'; url: string; error: ApiClientError };

export function useRepoAnalysis() {
  const [state, setState] = useState<AnalysisState>({ status: 'idle' });

  const analyze = useCallback(async (url: string) => {
    const trimmed = url.trim();
    setState({ status: 'loading', url: trimmed });
    try {
      const report = await analyzeRepository(trimmed);
      setState({ status: 'success', url: trimmed, report });
    } catch (error) {
      const apiError = error as ApiClientError;
      setState({
        status: 'error',
        url: trimmed,
        error: {
          status: apiError.status ?? 0,
          code: apiError.code ?? 'network_error',
          message: apiError.message ?? 'Network request failed.',
        },
      });
    }
  }, []);

  const reset = useCallback(() => setState({ status: 'idle' }), []);

  return { state, analyze, reset };
}
