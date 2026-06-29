import { z } from 'zod';

const VariantInterpretationSchema = z.object({
  variant_summary: z.string(),
  clinical_significance: z.enum([
    'Pathogenic',
    'Likely Pathogenic',
    'VUS',
    'Likely Benign',
    'Benign',
  ]),
  disease: z.string().nullable(),
  confidence: z.number().int().min(0).max(100),
  evidence_list: z.array(
    z.object({
      accession: z.string(),
      significance: z.string(),
      review_status: z.string(),
      condition: z.string().nullable(),
      submitters: z.number().int(),
      last_evaluated: z.string().nullable(),
    })
  ),
  warnings: z.array(z.string()),
});

export type VariantInterpretation = z.infer<typeof VariantInterpretationSchema>;

export function validateAndFillResponse(data: unknown): VariantInterpretation {
  try {
    const parsed = VariantInterpretationSchema.parse(data);
    return parsed;
  } catch (error) {
    console.error('[Validation Error]:', error);

    const fallback: VariantInterpretation = {
      variant_summary: 'Unable to parse LLM response.',
      clinical_significance: 'VUS',
      disease: null,
      confidence: 0,
      evidence_list: [],
      warnings: ['LLM response validation failed'],
    };

    return fallback;
  }
}
