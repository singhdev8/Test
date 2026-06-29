import axios from 'axios';
import { config } from '../config/index.js';
import { cacheManager } from '../cache/cacheManager.js';
import { NormalizedVariant, generateHgvsVariations } from '../normalizer/variantNormalizer.js';
import { BaseFetcher, ClinVarEvidence } from './baseFetcher.js';

interface ESearchResponse {
  esearchresult: {
    idlist: string[];
    count: string;
  };
}

interface EsummaryResult {
  uid: string;
  accession: string;
  clinical_significance?: string;
  review_status?: string;
  trait_set?: Array<{ trait: Array<{ name: string }> }>;
  chromosome?: string;
  start?: string;
  stop?: string;
  reference_allele?: string;
  alternate_allele?: string;
  last_evaluated?: string;
  submitter_count?: number;
  citation?: Array<{ id: string }>;
}

interface EsummaryResponse {
  result: {
    [key: string]: EsummaryResult;
  };
}

export class ClinVarFetcher extends BaseFetcher {
  async fetch(variant: NormalizedVariant): Promise<ClinVarEvidence[]> {
    if (!variant.gene) {
      console.log('[ClinVar] No gene found, returning empty results');
      return [];
    }

    const hgvsVariations = generateHgvsVariations(variant);
    const searchTerm = this.buildSearchTerm(variant.gene, hgvsVariations);
    const cacheKey = `${variant.gene}:${hgvsVariations.join('|')}`;

    const cached = cacheManager.get<ClinVarEvidence[]>('clinvar', cacheKey);
    if (cached) {
      console.log(`[Cache HIT] clinvar: ${variant.gene}`);
      return cached;
    }

    console.log(`[Cache MISS] clinvar: ${variant.gene}`);
    console.log(`[ClinVar] Search term: "${searchTerm}"`);

    try {
      const ids = await this.esearch(searchTerm);
      console.log(`[ClinVar] Found ${ids.length} records`);

      if (ids.length === 0) {
        cacheManager.set('clinvar', cacheKey, []);
        return [];
      }

      const summaries = await this.esummary(ids);
      console.log(`[ClinVar] Retrieved ${summaries.length} summaries`);

      const filtered = this.filterByExactMatch(variant, summaries);
      console.log(`[ClinVar] After filtering: ${filtered.length} valid records`);

      cacheManager.set('clinvar', cacheKey, filtered);
      return filtered;
    } catch (error) {
      console.error(`[ClinVar Error] Failed to fetch for ${variant.gene}:`, error);
      throw error;
    }
  }

  private buildSearchTerm(gene: string, hgvsVariations: string[]): string {
    const hgvsOR = hgvsVariations.map(v => `"${v}"`).join(' OR ');
    return `"${gene}"[gene] AND (${hgvsOR})`;
  }

  private async esearch(searchTerm: string): Promise<string[]> {
    try {
      const response = await axios.get<ESearchResponse>(
        `${config.ncbi.baseUrl}/esearch.fcgi`,
        {
          params: {
            db: 'clinvar',
            term: searchTerm,
            rettype: 'json',
            usehistory: 'y',
          },
        }
      );

      return response.data.esearchresult.idlist || [];
    } catch (error) {
      console.error('[ClinVar esearch Error]:', error);
      throw error;
    }
  }

  private async esummary(ids: string[]): Promise<EsummaryResult[]> {
    try {
      const response = await axios.get<EsummaryResponse>(
        `${config.ncbi.baseUrl}/esummary.fcgi`,
        {
          params: {
            db: 'clinvar',
            id: ids.join(','),
            rettype: 'json',
          },
        }
      );

      return Object.values(response.data.result).filter(
        (r) => r.accession && r.uid !== 'result'
      );
    } catch (error) {
      console.error('[ClinVar esummary Error]:', error);
      throw error;
    }
  }

  private filterByExactMatch(
    variant: NormalizedVariant,
    summaries: EsummaryResult[]
  ): ClinVarEvidence[] {
    return summaries
      .filter((summary) => {
        if (variant.chromosome && summary.chromosome !== variant.chromosome) {
          return false;
        }
        if (variant.position !== null && summary.start) {
          if (parseInt(summary.start, 10) !== variant.position) {
            return false;
          }
        }
        return true;
      })
      .map((summary) => ({
        accession: summary.accession,
        significance: summary.clinical_significance || 'Unknown',
        reviewStatus: summary.review_status || 'No assertion criteria provided',
        condition: this.extractCondition(summary),
        chromosome: summary.chromosome || null,
        start: summary.start ? parseInt(summary.start, 10) : null,
        stop: summary.stop ? parseInt(summary.stop, 10) : null,
        referenceAllele: summary.reference_allele || null,
        alternateAllele: summary.alternate_allele || null,
        submitters: summary.submitter_count || 1,
        lastEvaluated: summary.last_evaluated || null,
        citations: summary.citation?.map((c) => c.id) || [],
      }));
  }

  private extractCondition(summary: EsummaryResult): string | null {
    if (!summary.trait_set || summary.trait_set.length === 0) {
      return null;
    }
    const traitNames = summary.trait_set
      .flatMap((t) => t.trait || [])
      .map((t) => t.name)
      .filter(Boolean);
    return traitNames.length > 0 ? traitNames[0] : null;
  }
}
