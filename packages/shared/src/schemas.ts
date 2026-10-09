import { z } from 'zod';

export const AnalyzeRequestSchema = z.object({
  url: z.string().min(1).max(500),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const EvidenceKindSchema = z.enum(['fact', 'heuristic']);

export const EvidenceItemSchema = z.object({
  kind: EvidenceKindSchema,
  label: z.string(),
  detail: z.string(),
});

export const CategoryStatusSchema = z.enum(['scored', 'unavailable']);

export const CategoryScoreSchema = z.object({
  id: z.enum(['documentation', 'testing', 'maintenance', 'issues']),
  label: z.string(),
  weight: z.number(),
  status: CategoryStatusSchema,
  score: z.number().min(0).max(100).optional(),
  evidence: z.array(EvidenceItemSchema),
  explanation: z.string(),
  limitations: z.array(z.string()),
});

export const RecommendationPrioritySchema = z.enum(['High', 'Medium', 'Low']);

export const RecommendationSchema = z.object({
  title: z.string(),
  priority: RecommendationPrioritySchema,
  evidence: z.string(),
  nextStep: z.string(),
});

export const RepoOverviewSchema = z.object({
  name: z.string(),
  fullName: z.string(),
  description: z.string().nullable(),
  owner: z.string(),
  primaryLanguage: z.string().nullable(),
  stars: z.number(),
  forks: z.number(),
  openIssues: z.number().nullable(),
  openIssuesNote: z.string().optional(),
  lastUpdated: z.string(),
  defaultBranch: z.string(),
  htmlUrl: z.string(),
  private: z.boolean(),
  hasIssues: z.boolean(),
});

export const HealthReportSchema = z.object({
  overview: RepoOverviewSchema,
  overallScore: z.number().min(0).max(100).nullable(),
  overallScoreNote: z.string(),
  categories: z.array(CategoryScoreSchema),
  recommendations: z.array(RecommendationSchema),
  analyzedAt: z.string(),
  rateLimitRemaining: z.number().nullable().optional(),
  cached: z.boolean().optional(),
});

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type CategoryScore = z.infer<typeof CategoryScoreSchema>;
export type Recommendation = z.infer<typeof RecommendationSchema>;
export type RepoOverview = z.infer<typeof RepoOverviewSchema>;
export type HealthReport = z.infer<typeof HealthReportSchema>;

export const HealthLiveResponseSchema = z.object({
  status: z.literal('ok'),
});

export const HealthReadyResponseSchema = z.object({
  status: z.enum(['ready', 'not_ready']),
  checks: z.record(z.boolean()),
});

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
