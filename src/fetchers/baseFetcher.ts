import { NormalizedVariant } from '../normalizer/variantNormalizer.js';

export interface ClinVarEvidence {
  accession: string;
  significance: string;
  reviewStatus: string;
  condition: string | null;
  chromosome: string | null;
  start: number | null;
  stop: number | null;
  referenceAllele: string | null;
  alternateAllele: string | null;
  submitters: number;
  lastEvaluated: string | null;
  citations: string[];
}

export abstract class BaseFetcher {
  abstract fetch(variant: NormalizedVariant): Promise<ClinVarEvidence[]>;
}
