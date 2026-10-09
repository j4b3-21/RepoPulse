import type { CategoryScore, EvidenceItem } from '../schemas.js';
import { CATEGORY_WEIGHTS } from './weights.js';
import type { ScoringInput } from './types.js';

const TEST_DIRS = new Set(['test', 'tests', '__tests__', 'spec', 'specs']);
const TEST_FILE_RE =
  /^(vitest\.config|jest\.config|karma\.conf|pytest\.ini|phpunit\.xml|tox\.ini|conftest\.py|\.github)$/i;
const TEST_FILE_EXT_RE =
  /\.(test|spec)\.(js|jsx|ts|tsx|mjs|cjs)$/i;

export function scoreTesting(input: ScoringInput): CategoryScore {
  const limitations = [
    'Testing signals are inferred from root-level paths and config filenames only — source files are not executed or deeply scanned.',
  ];

  if (!input.rootContents.available) {
    return {
      id: 'testing',
      label: 'Testing signals',
      weight: CATEGORY_WEIGHTS.testing,
      status: 'unavailable',
      evidence: [
        {
          kind: 'fact',
          label: 'Contents unavailable',
          detail: 'Repository root contents could not be retrieved.',
        },
      ],
      explanation: 'Testing infrastructure cannot be assessed without repository contents metadata.',
      limitations,
    };
  }

  const evidence: EvidenceItem[] = [];
  const signals: string[] = [];

  for (const entry of input.rootContents.entries) {
    const name = entry.name;
    const lower = name.toLowerCase();

    if (entry.type === 'dir' && TEST_DIRS.has(lower)) {
      signals.push(`directory:${name}`);
      evidence.push({
        kind: 'fact',
        label: `Test directory: ${name}`,
        detail: 'Observed in repository root listing.',
      });
    }

    if (TEST_FILE_RE.test(name) || TEST_FILE_EXT_RE.test(name)) {
      signals.push(`file:${name}`);
      evidence.push({
        kind: 'fact',
        label: `Test-related path: ${name}`,
        detail: 'Observed in repository root listing.',
      });
    }

    if (lower === 'package.json') {
      evidence.push({
        kind: 'heuristic',
        label: 'package.json present',
        detail:
          'A Node manifest was observed at the root. Presence alone is not treated as proof of tests.',
      });
    }

    if (lower === 'makefile') {
      signals.push('file:Makefile');
      evidence.push({
        kind: 'heuristic',
        label: 'Makefile present',
        detail: 'May contain test targets; contents were not inspected in depth.',
      });
    }
  }

  // .github as dir often holds workflows — count as a weak CI signal
  const hasGithubDir = input.rootContents.entries.some(
    (e) => e.type === 'dir' && e.name.toLowerCase() === '.github',
  );
  if (hasGithubDir && !signals.some((s) => s.includes('.github'))) {
    signals.push('dir:.github');
    evidence.push({
      kind: 'heuristic',
      label: '.github directory',
      detail: 'May contain CI workflows; workflow YAML was not fully enumerated in this MVP.',
    });
  }

  if (signals.length === 0) {
    evidence.push({
      kind: 'fact',
      label: 'No testing infrastructure detected',
      detail: 'No common test directories or config files were observed at the repository root.',
    });
    return {
      id: 'testing',
      label: 'Testing signals',
      weight: CATEGORY_WEIGHTS.testing,
      status: 'scored',
      score: 15,
      evidence,
      explanation:
        'Absence of root-level testing signals is a weak negative indicator, not proof that tests do not exist deeper in the tree.',
      limitations,
    };
  }

  const unique = new Set(signals);
  const score = Math.min(100, 35 + unique.size * 20);

  return {
    id: 'testing',
    label: 'Testing signals',
    weight: CATEGORY_WEIGHTS.testing,
    status: 'scored',
    score,
    evidence,
    explanation: `Observed ${unique.size} distinct testing-related signal(s) in root metadata.`,
    limitations,
  };
}
