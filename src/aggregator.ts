import { NormalizedVariant } from './normalizer/variantNormalizer.js';
import { ClinVarFetcher } from './fetchers/clinvarFetcher.js';
import { ClinVarEvidence } from './fetchers/baseFetcher.js';

export interface AggregatedEvidence {
  variant: NormalizedVariant;
  evidence: ClinVarEvidence[];
}

export async function aggregateEvidence(
  variant: NormalizedVariant
): Promise<AggregatedEvidence> {
  const clinvarFetcher = new ClinVarFetcher();

  const [clinvarEvidence] = await Promise.all([
    clinvarFetcher.fetch(variant).catch((err) => {
      console.error('[Aggregator] ClinVar fetch failed:', err);
      return [];
    }),
  ]);

  return {
    variant,
    evidence: clinvarEvidence,
  };
}
