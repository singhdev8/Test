import { ClinVarEvidence } from '../fetchers/baseFetcher.js';

interface ScoredEvidence extends ClinVarEvidence {
  score: number;
}

const REVIEW_STATUS_SCORES: Record<string, number> = {
  'reviewed by expert panel': 5,
  'criteria provided, multiple submitters, no conflicts': 4,
  'criteria provided, multiple submitters, conflicts': 3.5,
  'criteria provided, single submitter': 3,
  'no assertion criteria provided': 1,
  unknown: 1,
};

function getReviewStatusScore(reviewStatus: string): number {
  const normalized = reviewStatus.toLowerCase();
  for (const [key, score] of Object.entries(REVIEW_STATUS_SCORES)) {
    if (normalized.includes(key)) {
      return score;
    }
  }
  return REVIEW_STATUS_SCORES.unknown;
}

function groupByAccession(
  evidence: ClinVarEvidence[]
): Map<string, ClinVarEvidence[]> {
  const grouped = new Map<string, ClinVarEvidence[]>();
  for (const record of evidence) {
    if (!grouped.has(record.accession)) {
      grouped.set(record.accession, []);
    }
    grouped.get(record.accession)!.push(record);
  }
  return grouped;
}

function scoreRecord(record: ClinVarEvidence): number {
  let score = getReviewStatusScore(record.reviewStatus);

  if (record.submitters > 1) {
    score += 0.5;
  }

  if (record.lastEvaluated) {
    const evaluatedDate = new Date(record.lastEvaluated);
    const daysSinceEvaluation = (Date.now() - evaluatedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceEvaluation < 730) {
      score += 0.5;
    }
  }

  if (record.condition) {
    score += 0.25;
  }

  return score;
}

export function rankEvidence(
  evidence: ClinVarEvidence[],
  topK: number = 3
): ClinVarEvidence[] {
  if (evidence.length === 0) return [];

  const grouped = groupByAccession(evidence);
  const scored: ScoredEvidence[] = [];

  for (const [accession, records] of grouped.entries()) {
    const bestRecord = records.reduce((best, current) =>
      scoreRecord(current) > scoreRecord(best) ? current : best
    );
    scored.push({
      ...bestRecord,
      score: scoreRecord(bestRecord),
    });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}
