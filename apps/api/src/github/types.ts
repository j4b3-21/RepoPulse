export type GitHubRepoResponse = {
  name: string;
  full_name: string;
  description: string | null;
  owner: { login: string };
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
  updated_at: string;
  default_branch: string;
  html_url: string;
  private: boolean;
  has_issues: boolean;
};

export type GitHubContentItem = {
  name: string;
  path: string;
  type: string;
};

export type GitHubReadmeResponse = {
  content?: string;
  encoding?: string;
  name?: string;
};

export type GitHubIssueResponse = {
  title: string;
  created_at: string;
  labels: Array<{ name: string } | string>;
  pull_request?: unknown;
};

export type GitHubFetchMeta = {
  rateLimitRemaining: number | null;
};
