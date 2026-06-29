import { ClinVarEvidence } from '../fetchers/baseFetcher.js';

function reviewStatusToScore(reviewStatus: string): number {
  const normalized = reviewStatus.toLowerCase();
  if (normalized.includes('expert panel')) return 95;
  if (normalized.includes('multiple submitters') && !normalized.includes('conflicts'))
    return 85;
  if (normalized.includes('multiple submitters') && normalized.includes('conflicts'))
    return 75;
  if (normalized.includes('single submitter')) return 70;
  if (normalized.includes('no assertion')) return 50;
  return 50;
}

export function calculateConfidence(
  topEvidence: ClinVarEvidence[]
): number {
  if (topEvidence.length === 0) return 0;

  const baseScore = reviewStatusToScore(topEvidence[0].reviewStatus);
  const boost = 1 + 0.2 * Math.max(0, topEvidence.length - 1);
  const confidence = Math.min(100, baseScore * boost);

  return Math.round(confidence);
}

export function significanceToColor(
  significance: string
): 'red' | 'yellow' | 'green' | 'gray' {
  const norm = significance.toLowerCase();
  if (norm.includes('pathogenic') && !norm.includes('benign')) return 'red';
  if (norm.includes('benign') && !norm.includes('pathogenic')) return 'green';
  if (norm.includes('vus') || norm.includes('uncertain')) return 'yellow';
  return 'gray';
}
