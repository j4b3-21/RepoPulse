import { describe, expect, it } from 'vitest';
import { parseGitHubRepoUrl } from './parseRepoUrl.js';

describe('parseGitHubRepoUrl', () => {
  it('parses https github URLs', () => {
    const result = parseGitHubRepoUrl('https://github.com/facebook/react');
    expect(result).toEqual({ ok: true, value: { owner: 'facebook', repo: 'react' } });
  });

  it('strips .git suffix and www', () => {
    const result = parseGitHubRepoUrl('https://www.github.com/vercel/next.js.git');
    expect(result).toEqual({ ok: true, value: { owner: 'vercel', repo: 'next.js' } });
  });

  it('accepts owner/repo shorthand', () => {
    const result = parseGitHubRepoUrl('facebook/react');
    expect(result).toEqual({ ok: true, value: { owner: 'facebook', repo: 'react' } });
  });

  it('rejects unsupported hosts', () => {
    const result = parseGitHubRepoUrl('https://gitlab.com/foo/bar');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('unsupported_host');
  });

  it('rejects incomplete paths', () => {
    const result = parseGitHubRepoUrl('https://github.com/facebook');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('invalid_path');
  });

  it('rejects empty input', () => {
    const result = parseGitHubRepoUrl('   ');
    expect(result.ok).toBe(false);
  });
});
