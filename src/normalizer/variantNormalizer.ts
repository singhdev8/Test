import axios from 'axios';
import { config } from '../config/index.js';
import { cacheManager } from '../cache/cacheManager.js';

export interface NormalizedVariant {
  gene: string | null;
  hgvsCoding: string | null;
  hgvsGenomic: string | null;
  chromosome: string | null;
  position: number | null;
  ref: string | null;
  alt: string | null;
  dbSnpId: string | null;
  originalInput: string;
}

export async function normalizeVariant(input: string): Promise<NormalizedVariant> {
  const cacheKey = input.toLowerCase();
  const cached = cacheManager.get<NormalizedVariant>('normalizer', cacheKey);
  if (cached) {
    console.log(`[Cache HIT] normalizer: ${input}`);
    return cached;
  }

  console.log(`[Cache MISS] normalizer: ${input}`);

  try {
    const response = await axios.get(`${config.myVariant.baseUrl}/query`, {
      params: {
        q: input,
        size: 1,
      },
    });

    if (!response.data.hits || response.data.hits.length === 0) {
      return {
        gene: null,
        hgvsCoding: null,
        hgvsGenomic: null,
        chromosome: null,
        position: null,
        ref: null,
        alt: null,
        dbSnpId: null,
        originalInput: input,
      };
    }

    const hit = response.data.hits[0];
    const result: NormalizedVariant = {
      gene: hit.symbol || null,
      hgvsCoding: hit.hgvs?.coding || null,
      hgvsGenomic: hit.hgvs?.genomic || null,
      chromosome: hit.chrom || null,
      position: hit.start || null,
      ref: hit.ref || null,
      alt: hit.alt || null,
      dbSnpId: hit.dbsnp?.rsid || null,
      originalInput: input,
    };

    cacheManager.set('normalizer', cacheKey, result);
    return result;
  } catch (error) {
    console.error(`[Normalizer Error] Failed to normalize "${input}":`, error);
    throw new Error(`Variant normalization failed for "${input}"`);
  }
}

export function generateHgvsVariations(normalized: NormalizedVariant): string[] {
  const variations: Set<string> = new Set();

  if (normalized.hgvsCoding) {
    variations.add(normalized.hgvsCoding);
    const coding = normalized.hgvsCoding;
    const withoutGene = coding.includes(':') ? coding.split(':')[1] : coding;
    variations.add(withoutGene);

    if (withoutGene.includes('del')) {
      const shortened = withoutGene.replace(/del[A-Z]+/i, 'del');
      variations.add(shortened);
    }
  }

  if (normalized.hgvsGenomic) {
    variations.add(normalized.hgvsGenomic);
  }

  if (normalized.dbSnpId) {
    variations.add(normalized.dbSnpId);
  }

  return Array.from(variations);
}
