import type { CategoryScore, EvidenceItem } from '../schemas.js';
import { CATEGORY_WEIGHTS } from './weights.js';
import type { ScoringInput } from './types.js';

const SETUP_PATTERNS: { label: string; re: RegExp }[] = [
  { label: 'install / setup guidance', re: /\b(install|installation|getting started|quick ?start|setup)\b/i },
  { label: 'usage guidance', re: /\b(usage|how to use|example)\b/i },
  { label: 'contribute guidance', re: /\b(contribut(e|ing)|development)\b/i },
];

export function scoreDocumentation(input: ScoringInput): CategoryScore {
  const limitations = [
    'Documentation scoring inspects README text and root listing only — it does not evaluate docs sites or wiki quality.',
  ];

  if (input.readme.fetchFailed && !input.rootContents.available) {
    return {
      id: 'documentation',
      label: 'Documentation',
      weight: CATEGORY_WEIGHTS.documentation,
      status: 'unavailable',
      evidence: [
        {
          kind: 'fact',
          label: 'Evidence unavailable',
          detail: 'README and repository contents could not be retrieved.',
        },
      ],
      explanation: 'Documentation could not be assessed because upstream metadata was unavailable.',
      limitations,
    };
  }

  const evidence: EvidenceItem[] = [];
  let score = 0;

  const hasReadmeFile =
    input.readme.available ||
    input.rootContents.entries.some((e) => /^readme(\.|$)/i.test(e.name));

  if (!hasReadmeFile) {
    evidence.push({
      kind: 'fact',
      label: 'README missing',
      detail: 'No README was found via the GitHub README API or root listing.',
    });
    return {
      id: 'documentation',
      label: 'Documentation',
      weight: CATEGORY_WEIGHTS.documentation,
      status: 'scored',
      score: 10,
      evidence,
      explanation: 'A public README is the primary observable documentation signal for this MVP.',
      limitations,
    };
  }

  evidence.push({
    kind: 'fact',
    label: 'README present',
    detail: 'A README file was observed.',
  });
  score += 40;

  const content = input.readme.content ?? '';
  if (content.length >= 400) {
    score += 20;
    evidence.push({
      kind: 'fact',
      label: 'Non-trivial README length',
      detail: `README length is approximately ${content.length} characters.`,
    });
  } else if (content.length > 0) {
    evidence.push({
      kind: 'fact',
      label: 'Short README',
      detail: `README length is approximately ${content.length} characters.`,
    });
  } else if (input.readme.fetchFailed) {
    evidence.push({
      kind: 'fact',
      label: 'README body unavailable',
      detail: 'README exists in listing or API metadata but body content could not be decoded.',
    });
    // Partial credit only for presence
    return {
      id: 'documentation',
      label: 'Documentation',
      weight: CATEGORY_WEIGHTS.documentation,
      status: 'scored',
      score: Math.min(score, 50),
      evidence,
      explanation: 'README presence was confirmed, but content heuristics could not run.',
      limitations,
    };
  }

  let matched = 0;
  for (const pattern of SETUP_PATTERNS) {
    if (pattern.re.test(content)) {
      matched += 1;
      evidence.push({
        kind: 'heuristic',
        label: pattern.label,
        detail: 'Keyword/section heuristic matched in README text.',
      });
    }
  }
  score += matched * 10;

  if (matched === 0 && content.length > 0) {
    evidence.push({
      kind: 'heuristic',
      label: 'Limited setup keywords',
      detail: 'README did not match common install/usage/contribute section keywords.',
    });
  }

  return {
    id: 'documentation',
    label: 'Documentation',
    weight: CATEGORY_WEIGHTS.documentation,
    status: 'scored',
    score: Math.min(100, score),
    evidence,
    explanation:
      'Score reflects README presence, length, and simple keyword heuristics for setup guidance.',
    limitations,
  };
}
