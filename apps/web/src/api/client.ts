import type { HealthReport } from '@repopulse/shared';

export type ApiClientError = {
  code: string;
  message: string;
  status: number;
};

export async function analyzeRepository(url: string): Promise<HealthReport> {
  const response = await fetch('/api/v1/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const err = data as { error?: { code?: string; message?: string } } | null;
    const error: ApiClientError = {
      status: response.status,
      code: err?.error?.code ?? 'request_failed',
      message: err?.error?.message ?? 'Request failed.',
    };
    throw error;
  }

  return data as HealthReport;
}
