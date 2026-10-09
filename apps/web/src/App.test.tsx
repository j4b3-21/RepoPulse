import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders empty state', () => {
    render(<App />);
    expect(screen.getByText(/Enter a public GitHub repository URL/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'RepoPulse' })).toBeInTheDocument();
  });

  it('shows error from API and allows retry', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { code: 'unsupported_host', message: 'Only github.com repository URLs are supported.' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    const input = screen.getByLabelText(/GitHub repository URL/i);
    await user.clear(input);
    await user.type(input, 'https://gitlab.com/foo/bar');
    await user.click(screen.getByRole('button', { name: /^Analyze$/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Only github.com/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it('renders success report from mocked API', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          overview: {
            name: 'demo',
            fullName: 'acme/demo',
            description: 'Demo repo',
            owner: 'acme',
            primaryLanguage: 'TypeScript',
            stars: 10,
            forks: 1,
            openIssues: 0,
            openIssuesNote: 'ok',
            lastUpdated: '2024-06-01T00:00:00.000Z',
            defaultBranch: 'main',
            htmlUrl: 'https://github.com/acme/demo',
            private: false,
            hasIssues: true,
          },
          overallScore: 80,
          overallScoreNote: 'All categories scored.',
          categories: [
            {
              id: 'documentation',
              label: 'Documentation',
              weight: 0.25,
              status: 'scored',
              score: 80,
              evidence: [{ kind: 'fact', label: 'README present', detail: 'Observed' }],
              explanation: 'ok',
              limitations: [],
            },
            {
              id: 'testing',
              label: 'Testing signals',
              weight: 0.25,
              status: 'scored',
              score: 80,
              evidence: [],
              explanation: 'ok',
              limitations: [],
            },
            {
              id: 'maintenance',
              label: 'Maintenance',
              weight: 0.25,
              status: 'scored',
              score: 80,
              evidence: [],
              explanation: 'ok',
              limitations: [],
            },
            {
              id: 'issues',
              label: 'Issue management',
              weight: 0.25,
              status: 'scored',
              score: 80,
              evidence: [],
              explanation: 'ok',
              limitations: [],
            },
          ],
          recommendations: [],
          analyzedAt: '2024-06-15T00:00:00.000Z',
        }),
      }),
    );

    render(<App />);
    const input = screen.getByLabelText(/GitHub repository URL/i);
    await user.clear(input);
    await user.type(input, 'https://github.com/acme/demo');
    await user.click(screen.getByRole('button', { name: /^Analyze$/i }));

    expect(await screen.findByText('acme/demo')).toBeInTheDocument();
    expect(screen.getByText('Overall health score')).toBeInTheDocument();
    expect(screen.getByText('Category breakdown')).toBeInTheDocument();
  });
});
