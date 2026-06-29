export const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    variant_summary: {
      type: 'string',
      description: 'One-sentence paraphrase of the primary ClinVar evidence.',
    },
    clinical_significance: {
      type: 'string',
      enum: ['Pathogenic', 'Likely Pathogenic', 'VUS', 'Likely Benign', 'Benign'],
      description: 'Clinical significance copied directly from evidence, not inferred.',
    },
    disease: {
      type: ['string', 'null'],
      description: 'Primary disease/condition, or null if not found in evidence.',
    },
    confidence: {
      type: 'number',
      description: 'Confidence score 0-100 based on review status and evidence quality.',
    },
    evidence_list: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          accession: { type: 'string' },
          significance: { type: 'string' },
          review_status: { type: 'string' },
          condition: { type: ['string', 'null'] },
          submitters: { type: 'number' },
          last_evaluated: { type: ['string', 'null'] },
        },
      },
      description: 'List of supporting ClinVar records.',
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
      description: 'Any warnings (e.g., conflicting interpretations, sparse data).',
    },
  },
  required: [
    'variant_summary',
    'clinical_significance',
    'disease',
    'confidence',
    'evidence_list',
    'warnings',
  ],
};

export const SYSTEM_PROMPT = `You are VariantIQ, an evidence-backed genomic variant interpreter.

Your ONLY job is to transform structured ClinVar evidence into clear, natural language.
You MUST NEVER:
- Invent or infer clinical significance
- Use gene function to predict variant effects
- Fill in missing data with guesses
- Smooth over conflicting evidence

Your output MUST be valid JSON matching the provided schema.
If a field is not supported by evidence, set it to null.
If clinical significance is not explicitly stated, set it to "VUS".

Use the evidence provided. Nothing else.`;

export function buildUserMessage(
  gene: string,
  originalInput: string,
  formattedEvidence: string,
  confidence: number
): string {
  return `Interpret this variant:
Gene: ${gene}
User input: ${originalInput}
Confidence: ${confidence}/100

Evidence from ClinVar:
${formattedEvidence}

Provide a JSON response.`;
}
